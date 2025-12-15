const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Route Rating Penjual: pembeli bisa rating penjual setelah pesanan selesai

const router = express.Router();

// Pembeli: Submit rating untuk penjual
router.post('/ratings/seller', requireAuth, requireRole(['pembeli']), [
  body('pesanan_id').isInt({ min: 1 }),
  body('penjual_id').isInt({ min: 1 }),
  body('rating').isInt({ min: 1, max: 5 }),
  body('komentar').optional().isString().isLength({ max: 1000 }).trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  
  const { pesanan_id, penjual_id, rating, komentar } = req.body;
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // Verify order exists, belongs to buyer, and is completed
    const [orderCheck] = await conn.query(`
      SELECT p.pesanan_id, p.status_pesanan 
      FROM pesanan p 
      WHERE p.pesanan_id = ? AND p.pembeli_id = ? AND p.status_pesanan = 'selesai'
    `, [pesanan_id, req.user.id]);
    
    if (!orderCheck.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'order_not_found_or_not_completed' });
    }
    
    // Verify seller was involved in this order
    const [sellerCheck] = await conn.query(`
      SELECT COUNT(*) as count FROM pesanan_item pi
      JOIN produk pr ON pr.produk_id = pi.produk_id
      WHERE pi.pesanan_id = ? AND pr.penjual_id = ?
    `, [pesanan_id, penjual_id]);
    
    if (!sellerCheck[0].count) {
      await conn.rollback();
      return res.status(400).json({ error: 'seller_not_in_order' });
    }
    
    // Check if rating already exists
    const [existingRating] = await conn.query(`
      SELECT rating_id FROM rating_penjual 
      WHERE pembeli_id = ? AND pesanan_id = ? AND penjual_id = ?
    `, [req.user.id, pesanan_id, penjual_id]);
    
    if (existingRating.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'rating_already_exists' });
    }
    
    // Insert rating
    const [insertResult] = await conn.query(`
      INSERT INTO rating_penjual (penjual_id, pembeli_id, pesanan_id, rating, komentar, status)
      VALUES (?, ?, ?, ?, ?, 'aktif')
    `, [penjual_id, req.user.id, pesanan_id, rating, komentar || null]);
    
    // Update seller's average rating
    await updateSellerRating(conn, penjual_id);
    
    await conn.commit();
    res.status(201).json({ 
      rating_id: insertResult.insertId,
      message: 'Rating berhasil diberikan'
    });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    console.error('Error submitting rating:', e);
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Get ratings for a seller (public)
router.get('/ratings/seller/:id', [
  param('id').isInt({ min: 1 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  const conn = await pool.getConnection();
  try {
    // Get seller info with average rating
    const [sellerInfo] = await conn.query(`
      SELECT u.user_id, u.nama, u.avg_rating, u.total_ratings
      FROM user u 
      WHERE u.user_id = ? AND u.role = 'penjual'
    `, [req.params.id]);
    
    if (!sellerInfo.length) {
      return res.status(404).json({ error: 'seller_not_found' });
    }
    
    // Get ratings with pagination
    const [ratings] = await conn.query(`
      SELECT 
        r.rating_id, r.rating, r.komentar, r.dibuat_pada,
        u.nama as pembeli_nama
      FROM rating_penjual r
      JOIN user u ON u.user_id = r.pembeli_id
      WHERE r.penjual_id = ? AND r.status = 'aktif'
      ORDER BY r.dibuat_pada DESC
      LIMIT ? OFFSET ?
    `, [req.params.id, limit, offset]);
    
    // Get total count for pagination
    const [countResult] = await conn.query(`
      SELECT COUNT(*) as total FROM rating_penjual 
      WHERE penjual_id = ? AND status = 'aktif'
    `, [req.params.id]);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      seller: sellerInfo[0],
      ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } finally {
    conn.release();
  }
});

// Pembeli: Get orders that can be rated
router.get('/ratings/rateable-orders', requireAuth, requireRole(['pembeli']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [orders] = await conn.query(`
      SELECT DISTINCT
        p.pesanan_id, p.created_at, p.total_harga,
        pr.penjual_id, u.nama as penjual_nama,
        CASE WHEN r.rating_id IS NOT NULL THEN 1 ELSE 0 END as already_rated
      FROM pesanan p
      JOIN pesanan_item pi ON pi.pesanan_id = p.pesanan_id
      JOIN produk pr ON pr.produk_id = pi.produk_id
      JOIN user u ON u.user_id = pr.penjual_id
      LEFT JOIN rating_penjual r ON r.pesanan_id = p.pesanan_id 
        AND r.pembeli_id = ? AND r.penjual_id = pr.penjual_id
      WHERE p.pembeli_id = ? AND p.status_pesanan = 'selesai'
      ORDER BY p.created_at DESC
    `, [req.user.id, req.user.id]);
    
    res.json(orders);
  } finally {
    conn.release();
  }
});

// Pembeli: Update existing rating
router.patch('/ratings/seller/:ratingId', requireAuth, requireRole(['pembeli']), [
  param('ratingId').isInt({ min: 1 }),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('komentar').optional().isString().isLength({ max: 1000 }).trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  
  const { rating, komentar } = req.body;
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // Check if rating exists and belongs to user
    const [existingRating] = await conn.query(`
      SELECT rating_id, penjual_id FROM rating_penjual 
      WHERE rating_id = ? AND pembeli_id = ?
    `, [req.params.ratingId, req.user.id]);
    
    if (!existingRating.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'rating_not_found' });
    }
    
    const penjualId = existingRating[0].penjual_id;
    
    // Update rating
    await conn.query(`
      UPDATE rating_penjual 
      SET rating = COALESCE(?, rating), komentar = COALESCE(?, komentar)
      WHERE rating_id = ?
    `, [rating || null, komentar || null, req.params.ratingId]);
    
    // Update seller's average rating
    await updateSellerRating(conn, penjualId);
    
    await conn.commit();
    res.json({ ok: true, message: 'Rating berhasil diperbarui' });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    console.error('Error updating rating:', e);
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Admin: Hide/show rating
router.patch('/admin/ratings/:ratingId/status', requireAuth, requireRole(['admin']), [
  param('ratingId').isInt({ min: 1 }),
  body('status').isIn(['aktif', 'disembunyikan'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  
  const { status } = req.body;
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // Get rating info
    const [ratingInfo] = await conn.query(`
      SELECT penjual_id FROM rating_penjual WHERE rating_id = ?
    `, [req.params.ratingId]);
    
    if (!ratingInfo.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'rating_not_found' });
    }
    
    const penjualId = ratingInfo[0].penjual_id;
    
    // Update status
    await conn.query(`
      UPDATE rating_penjual SET status = ? WHERE rating_id = ?
    `, [status, req.params.ratingId]);
    
    // Update seller's average rating
    await updateSellerRating(conn, penjualId);
    
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    console.error('Error updating rating status:', e);
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Helper function to update seller's average rating
async function updateSellerRating(conn, penjualId) {
  const [stats] = await conn.query(`
    SELECT 
      AVG(rating) as avg_rating,
      COUNT(*) as total_ratings
    FROM rating_penjual 
    WHERE penjual_id = ? AND status = 'aktif'
  `, [penjualId]);
  
  const avgRating = stats[0].avg_rating ? parseFloat(stats[0].avg_rating).toFixed(2) : null;
  const totalRatings = stats[0].total_ratings || 0;
  
  await conn.query(`
    UPDATE user 
    SET avg_rating = ?, total_ratings = ?
    WHERE user_id = ?
  `, [avgRating, totalRatings, penjualId]);
}

module.exports = router;