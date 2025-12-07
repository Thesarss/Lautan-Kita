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
      'SELECT produk_id,nama_produk,deskripsi,harga,stok,status,tanggal_upload,photo_url FROM produk WHERE status="aktif"'
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
  body('kategori_id').optional().isInt({ min: 1 }),
  body('image').optional().isString().isLength({ min: 30 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { nama_produk, deskripsi, harga, stok, kategori_id, image } = req.body;
  const conn = await pool.getConnection();
  try {
    const [ins] = await conn.query(
      'INSERT INTO produk (penjual_id,kategori_id,nama_produk,deskripsi,harga,stok,status) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, kategori_id || null, nama_produk, deskripsi || null, harga, stok || 0, 'aktif']
    );
    const produkId = ins.insertId;
    let photoUrl = null;
    if (image && typeof image === 'string' && image.length > 30) {
      let m = (image.match(/^data:(image\/([a-z0-9.+-]+));base64,(.+)$/i) || []);
      if (!m.length) {
        const idx = image.indexOf('base64,');
        if (idx > -1) {
          const b64 = image.slice(idx + 7);
          m = ['data', 'image/png', 'png', b64];
        }
      }
      if (m.length) {
        const rawExt = (m[2] || '').toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : (rawExt || 'png');
        const b64 = m[3];
        const buf = Buffer.from(b64, 'base64');
        const path = require('path');
        const fs = require('fs');
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        const productsDir = path.join(uploadsDir, 'products');
        try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
        try { if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true }); } catch {}
        const fileRel = `/uploads/products/${produkId}.${ext}`;
        const fileAbs = path.join(productsDir, `${produkId}.${ext}`);
        try { fs.writeFileSync(fileAbs, buf); photoUrl = fileRel; } catch {}
      }
    }
    if (photoUrl) {
      await conn.query('UPDATE produk SET photo_url=? WHERE produk_id=?', [photoUrl, produkId]);
    }
    res.status(201).json({ produk_id: produkId, photo_url: photoUrl });
  } finally {
    conn.release();
  }
});

module.exports = router;
