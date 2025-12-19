const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

// Route Order: checkout, list, detail, cancel, list untuk penjual, update status admin.

const router = express.Router();

router.post('/orders/checkout', requireAuth, requireRole(['pembeli']), [
  body('alamat_kirim').optional().isString().isLength({ min: 5 }).trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { alamat_kirim } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [cartRow] = await conn.query('SELECT keranjang_id FROM keranjang WHERE pembeli_id=? LIMIT 1', [req.user.id]);
    if (!cartRow.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'cart_empty' });
    }
    const cartId = cartRow[0].keranjang_id;
    const [items] = await conn.query('SELECT item_id,produk_id,jumlah FROM keranjang_item WHERE keranjang_id=?', [cartId]);
    if (!items.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'cart_empty' });
    }
    let total = 0;
    const priced = [];
    for (const it of items) {
      const [prow] = await conn.query('SELECT harga,stok FROM produk WHERE produk_id=? FOR UPDATE', [it.produk_id]);
      if (!prow.length) {
        await conn.rollback();
        return res.status(400).json({ error: 'product_missing' });
      }
      const harga = Number(prow[0].harga);
      const stok = Number(prow[0].stok);
      if (stok < it.jumlah) {
        await conn.rollback();
        return res.status(409).json({ error: 'insufficient_stock', produk_id: it.produk_id });
      }
      total += harga * it.jumlah;
      priced.push({ produk_id: it.produk_id, jumlah: it.jumlah, harga });
    }
    const [orderRes] = await conn.query('INSERT INTO pesanan (pembeli_id,alamat_kirim,total_harga,status_pesanan) VALUES (?,?,?,?)', [req.user.id, alamat_kirim || null, total, 'menunggu']);
    const orderId = orderRes.insertId;
    for (const it of priced) {
      const subtotal = it.harga * it.jumlah;
      await conn.query('INSERT INTO pesanan_item (pesanan_id,produk_id,harga_saat_beli,jumlah,subtotal) VALUES (?,?,?,?,?)', [orderId, it.produk_id, it.harga, it.jumlah, subtotal]);
      await conn.query('UPDATE produk SET stok=stok-? WHERE produk_id=?', [it.jumlah, it.produk_id]);
    }
    await conn.query('DELETE FROM keranjang_item WHERE keranjang_id=?', [cartId]);
    await conn.commit();
    res.status(201).json({ pesanan_id: orderId, total });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.get('/orders', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT pesanan_id,total_harga,status_pesanan,created_at FROM pesanan WHERE pembeli_id=? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } finally {
    conn.release();
  }
});

// Get my orders with full tracking info
router.get('/orders/my-orders', requireAuth, requireRole(['pembeli']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [orders] = await conn.query(`
      SELECT 
        p.pesanan_id, p.total_harga, p.status_pesanan as status, 
        p.alamat_kirim, p.created_at as tanggal_pesanan,
        p.tanggal_dikemas, p.tanggal_dikirim, p.tanggal_selesai,
        p.kurir_id, k.nama as kurir_nama, k.no_tlp as kurir_phone, k.avatar_url as kurir_avatar,
        p.ongkir, p.lokasi_terakhir, p.catatan_kurir
      FROM pesanan p
      LEFT JOIN user k ON k.user_id = p.kurir_id
      WHERE p.pembeli_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    // Get items for each order
    for (const order of orders) {
      const [items] = await conn.query(`
        SELECT 
          i.produk_id, i.jumlah, i.harga_saat_beli as harga,
          pr.nama_produk, pr.photo_url
        FROM pesanan_item i
        JOIN produk pr ON pr.produk_id = i.produk_id
        WHERE i.pesanan_id = ?
      `, [order.pesanan_id]);
      order.items = items;

      // Ensure backward compatibility
      order.status_pesanan = order.status;
      order.created_at = order.tanggal_pesanan;
    }

    res.json(orders);
  } finally {
    conn.release();
  }
});

router.get('/orders/:id', requireAuth, [param('id').isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    const [o] = await conn.query('SELECT pesanan_id,pembeli_id,alamat_kirim,total_harga,status_pesanan,created_at FROM pesanan WHERE pesanan_id=? LIMIT 1', [req.params.id]);
    if (!o.length) return res.status(404).json({ error: 'not_found' });
    const order = o[0];
    if (order.pembeli_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const [items] = await conn.query('SELECT i.pesanan_item_id,i.produk_id,p.nama_produk,i.harga_saat_beli,i.jumlah,i.subtotal,p.penjual_id,u.nama AS penjual_nama FROM pesanan_item i JOIN produk p ON p.produk_id=i.produk_id LEFT JOIN user u ON u.user_id=p.penjual_id WHERE i.pesanan_id=?', [req.params.id]);
    res.json({ order, items });
  } finally {
    conn.release();
  }
});

router.post('/orders/:id/cancel', requireAuth, requireRole(['pembeli']), [param('id').isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [o] = await conn.query('SELECT pesanan_id,pembeli_id,status_pesanan FROM pesanan WHERE pesanan_id=? FOR UPDATE', [req.params.id]);
    if (!o.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'not_found' });
    }
    const order = o[0];
    if (order.pembeli_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ error: 'forbidden' });
    }
    if (order.status_pesanan !== 'menunggu') {
      await conn.rollback();
      return res.status(409).json({ error: 'cannot_cancel' });
    }
    const [its] = await conn.query('SELECT produk_id,jumlah FROM pesanan_item WHERE pesanan_id=?', [req.params.id]);
    for (const it of its) {
      await conn.query('UPDATE produk SET stok=stok+? WHERE produk_id=?', [it.jumlah, it.produk_id]);
    }
    await conn.query('UPDATE pesanan SET status_pesanan="dibatalkan" WHERE pesanan_id=?', [req.params.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.get('/penjual/orders', requireAuth, requireRole(['penjual']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT o.pesanan_id,o.pembeli_id,o.status_pesanan,o.created_at,i.produk_id,p.nama_produk,i.jumlah,i.subtotal FROM pesanan o JOIN pesanan_item i ON i.pesanan_id=o.pesanan_id JOIN produk p ON p.produk_id=i.produk_id WHERE p.penjual_id=? ORDER BY o.created_at DESC', [req.user.id]);
    res.json(rows);
  } finally {
    conn.release();
  }
});

router.patch('/admin/orders/:id/status', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 }),
  body('status_pesanan').isIn(['menunggu', 'diproses', 'dikirim', 'selesai', 'dibatalkan'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { status_pesanan } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [o] = await conn.query('SELECT pesanan_id,status_pesanan FROM pesanan WHERE pesanan_id=? FOR UPDATE', [req.params.id]);
    if (!o.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'not_found' });
    }
    const cur = o[0].status_pesanan;
    if (status_pesanan === 'dibatalkan' && cur !== 'dibatalkan') {
      const [its] = await conn.query('SELECT produk_id,jumlah FROM pesanan_item WHERE pesanan_id=?', [req.params.id]);
      for (const it of its) {
        await conn.query('UPDATE produk SET stok=stok+? WHERE produk_id=?', [it.jumlah, it.produk_id]);
      }
    }
    await conn.query('UPDATE pesanan SET status_pesanan=? WHERE pesanan_id=?', [status_pesanan, req.params.id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Penjual: Update order to "dikemas"
router.patch('/orders/:id/pack', requireAuth, requireRole(['penjual']), [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Check if order contains seller's products
    const [check] = await conn.query(`
      SELECT COUNT(*) as cnt FROM pesanan_item i
      JOIN produk p ON p.produk_id = i.produk_id
      WHERE i.pesanan_id = ? AND p.penjual_id = ?
    `, [req.params.id, req.user.id]);

    if (!check[0].cnt) {
      await conn.rollback();
      return res.status(403).json({ error: 'forbidden' });
    }

    // Check current status - allow packing for 'menunggu', 'pending', or empty status
    const [orderCheck] = await conn.query('SELECT status_pesanan FROM pesanan WHERE pesanan_id = ?', [req.params.id]);
    const currentStatus = orderCheck[0]?.status_pesanan || '';
    if (!orderCheck.length || !['menunggu', 'pending', ''].includes(currentStatus)) {
      await conn.rollback();
      return res.status(409).json({ error: 'invalid_status', message: 'Pesanan tidak dalam status yang bisa dikemas' });
    }

    // Update to dikemas without assigning kurir yet (kurir will self-assign when picking up)
    await conn.query(`
      UPDATE pesanan 
      SET status_pesanan = 'dikemas', tanggal_dikemas = NOW()
      WHERE pesanan_id = ?
    `, [req.params.id]);

    await conn.commit();
    res.json({ ok: true, message: 'Pesanan berhasil dikemas dan siap untuk diambil kurir' });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Kurir: Assign self to order and update to "dikirim"
router.patch('/orders/:id/ship', requireAuth, requireRole(['kurir']), [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if order is available for pickup
    const [orderCheck] = await conn.query(`
      SELECT pesanan_id, kurir_id, status_pesanan 
      FROM pesanan 
      WHERE pesanan_id = ? AND status_pesanan = 'dikemas'
    `, [req.params.id]);

    if (!orderCheck.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'order_not_found_or_invalid_status' });
    }

    const order = orderCheck[0];

    // If already assigned to another kurir, reject
    if (order.kurir_id && order.kurir_id !== req.user.id) {
      await conn.rollback();
      return res.status(409).json({ error: 'already_assigned_to_another_kurir' });
    }

    // Assign kurir and update status
    await conn.query(`
      UPDATE pesanan 
      SET status_pesanan = 'dikirim', kurir_id = ?, tanggal_dikirim = NOW() 
      WHERE pesanan_id = ?
    `, [req.user.id, req.params.id]);

    await conn.commit();
    res.json({ ok: true, message: 'Pesanan berhasil diambil dan sedang dikirim' });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Pembeli: Confirm order received
router.patch('/orders/:id/complete', requireAuth, requireRole(['pembeli']), [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [o] = await conn.query('SELECT pembeli_id FROM pesanan WHERE pesanan_id = ? FOR UPDATE', [req.params.id]);
    if (!o.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'not_found' });
    }
    if (o[0].pembeli_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ error: 'forbidden' });
    }

    await conn.query(`
      UPDATE pesanan 
      SET status_pesanan = 'selesai', tanggal_selesai = NOW() 
      WHERE pesanan_id = ? AND status_pesanan = 'dikirim'
    `, [req.params.id]);

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Pembeli: Cancel order
router.patch('/orders/:id/cancel', requireAuth, requireRole(['pembeli']), [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [o] = await conn.query('SELECT pembeli_id, status_pesanan FROM pesanan WHERE pesanan_id = ? FOR UPDATE', [req.params.id]);
    if (!o.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'not_found' });
    }
    if (o[0].pembeli_id !== req.user.id) {
      await conn.rollback();
      return res.status(403).json({ error: 'forbidden' });
    }
    if (o[0].status_pesanan !== 'pending') {
      await conn.rollback();
      return res.status(409).json({ error: 'cannot_cancel' });
    }

    // Return stock
    const [its] = await conn.query('SELECT produk_id, jumlah FROM pesanan_item WHERE pesanan_id = ?', [req.params.id]);
    for (const it of its) {
      await conn.query('UPDATE produk SET stok = stok + ? WHERE produk_id = ?', [it.jumlah, it.produk_id]);
    }

    await conn.query(`UPDATE pesanan SET status_pesanan = 'dibatalkan' WHERE pesanan_id = ?`, [req.params.id]);

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});


// Kurir: Get available deliveries
router.get('/kurir/deliveries', requireAuth, requireRole(['kurir']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT 
        p.pesanan_id, p.status_pesanan as status, p.total_harga, p.alamat_kirim,
        p.tanggal_dikemas, p.tanggal_dikirim, p.tanggal_selesai, p.kurir_id,
        p.lokasi_terakhir, p.catatan_kurir,
        u.nama as pembeli_nama, u.no_tlp as pembeli_phone,
        GROUP_CONCAT(CONCAT(pr.nama_produk, ' (', pi.jumlah, 'x)') SEPARATOR ', ') as items_summary
      FROM pesanan p
      JOIN user u ON u.user_id = p.pembeli_id
      LEFT JOIN pesanan_item pi ON pi.pesanan_id = p.pesanan_id
      LEFT JOIN produk pr ON pr.produk_id = pi.produk_id
      WHERE p.status_pesanan IN ('dikemas', 'dikirim', 'selesai')
        AND (p.kurir_id = ? OR (p.status_pesanan = 'dikemas' AND p.kurir_id IS NULL))
      GROUP BY p.pesanan_id
      ORDER BY 
        CASE p.status_pesanan
          WHEN 'dikemas' THEN 1
          WHEN 'dikirim' THEN 2
          WHEN 'selesai' THEN 3
        END,
        p.created_at DESC
    `, [req.user.id]);

    res.json(rows);
  } finally {
    conn.release();
  }
});

// Kurir: Update lokasi terakhir
router.patch('/kurir/orders/:id/location', requireAuth, requireRole(['kurir']), [
  param('id').isInt({ min: 1 }),
  body('lokasi_terakhir').isString().trim().isLength({ min: 5, max: 255 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify kurir owns this delivery
    const [check] = await conn.query(
      'SELECT pesanan_id FROM pesanan WHERE pesanan_id = ? AND kurir_id = ? AND status_pesanan = "dikirim"',
      [req.params.id, req.user.id]
    );

    if (!check.length) {
      await conn.rollback();
      return res.status(403).json({ error: 'forbidden' });
    }

    await conn.query(
      'UPDATE pesanan SET lokasi_terakhir = ? WHERE pesanan_id = ?',
      [req.body.lokasi_terakhir, req.params.id]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Pembeli: Submit rating/review for a product
router.post('/orders/:orderId/review', requireAuth, requireRole(['pembeli']), [
  param('orderId').isInt({ min: 1 }),
  body('produk_id').isInt({ min: 1 }),
  body('rating').isInt({ min: 1, max: 5 }),
  body('komentar').optional().isString().trim().isLength({ max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });

  const { produk_id, rating, komentar } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify order belongs to user and is completed
    const [orderCheck] = await conn.query(`
      SELECT p.pesanan_id, p.status_pesanan, pi.pesanan_item_id
      FROM pesanan p
      JOIN pesanan_item pi ON pi.pesanan_id = p.pesanan_id
      WHERE p.pesanan_id = ? AND p.pembeli_id = ? AND pi.produk_id = ?
    `, [req.params.orderId, req.user.id, produk_id]);

    if (!orderCheck.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'order_not_found' });
    }

    if (orderCheck[0].status_pesanan !== 'selesai') {
      await conn.rollback();
      return res.status(409).json({ error: 'order_not_completed', message: 'Hanya bisa memberi rating untuk pesanan yang sudah selesai' });
    }

    // Check if already reviewed
    const [existingReview] = await conn.query(
      'SELECT ulasan_id FROM ulasan WHERE pesanan_item_id = ? AND pembeli_id = ?',
      [orderCheck[0].pesanan_item_id, req.user.id]
    );

    if (existingReview.length) {
      await conn.rollback();
      return res.status(409).json({ error: 'already_reviewed', message: 'Anda sudah memberikan ulasan untuk produk ini' });
    }

    // Insert review
    const [result] = await conn.query(
      'INSERT INTO ulasan (produk_id, pembeli_id, pesanan_item_id, rating, komentar) VALUES (?, ?, ?, ?, ?)',
      [produk_id, req.user.id, orderCheck[0].pesanan_item_id, rating, komentar || null]
    );

    await conn.commit();
    res.status(201).json({ ok: true, ulasan_id: result.insertId });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    console.error('Error submitting review:', e);
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

// Pembeli: Get reviews for an order
router.get('/orders/:orderId/reviews', requireAuth, requireRole(['pembeli']), [
  param('orderId').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });

  const conn = await pool.getConnection();
  try {
    // Verify order belongs to user
    const [orderCheck] = await conn.query(
      'SELECT pesanan_id FROM pesanan WHERE pesanan_id = ? AND pembeli_id = ?',
      [req.params.orderId, req.user.id]
    );

    if (!orderCheck.length) {
      return res.status(404).json({ error: 'order_not_found' });
    }

    // Get items with review status
    const [items] = await conn.query(`
      SELECT 
        pi.pesanan_item_id, pi.produk_id, pi.jumlah, pi.harga_saat_beli,
        p.nama_produk, p.photo_url,
        u.ulasan_id, u.rating, u.komentar, u.dibuat_pada as review_date
      FROM pesanan_item pi
      JOIN produk p ON p.produk_id = pi.produk_id
      LEFT JOIN ulasan u ON u.pesanan_item_id = pi.pesanan_item_id AND u.pembeli_id = ?
      WHERE pi.pesanan_id = ?
    `, [req.user.id, req.params.orderId]);

    res.json(items);
  } finally {
    conn.release();
  }
});

// Kurir: Verifikasi pesanan sudah sampai
router.patch('/kurir/orders/:id/delivered', requireAuth, requireRole(['kurir']), [
  param('id').isInt({ min: 1 }),
  body('catatan_kurir').optional().isString().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify kurir owns this delivery
    const [check] = await conn.query(
      'SELECT pesanan_id FROM pesanan WHERE pesanan_id = ? AND kurir_id = ? AND status_pesanan = "dikirim"',
      [req.params.id, req.user.id]
    );

    if (!check.length) {
      await conn.rollback();
      return res.status(403).json({ error: 'forbidden' });
    }

    // Update status to selesai
    await conn.query(
      'UPDATE pesanan SET status_pesanan = "selesai", tanggal_selesai = NOW(), catatan_kurir = ? WHERE pesanan_id = ?',
      [req.body.catatan_kurir || null, req.params.id]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});


module.exports = router;
