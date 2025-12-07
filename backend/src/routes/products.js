const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { query, body, validationResult } = require('express-validator');

// Route Produk: list publik dan pembuatan produk oleh penjual.

const router = express.Router();

router.get('/products', [
  query('q').optional().isString().trim(),
  query('min_price').optional().isFloat({ min: 0 }),
  query('max_price').optional().isFloat({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      'SELECT produk_id,nama_produk,deskripsi,harga,stok,status,tanggal_upload FROM produk WHERE status="aktif"'
    );
    res.json(rows);
  } finally {
    conn.release();
  }
});

router.post('/penjual/produk', requireAuth, requireRole(['penjual']), [
  body('nama_produk').isString().isLength({ min: 2 }).trim(),
  body('deskripsi').optional().isString().isLength({ max: 2000 }).trim(),
  body('harga').isFloat({ gt: 0 }),
  body('stok').optional().isInt({ min: 0 }),
  body('kategori_id').optional().isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { nama_produk, deskripsi, harga, stok, kategori_id } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.query(
      'INSERT INTO produk (penjual_id,kategori_id,nama_produk,deskripsi,harga,stok,status) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, kategori_id || null, nama_produk, deskripsi || null, harga, stok || 0, 'aktif']
    );
    res.status(201).json({ ok: true });
  } finally {
    conn.release();
  }
});

module.exports = router;
