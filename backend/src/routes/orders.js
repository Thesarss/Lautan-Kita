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
    try { await conn.rollback(); } catch {}
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

router.get('/orders/:id', requireAuth, [param('id').isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    const [o] = await conn.query('SELECT pesanan_id,pembeli_id,alamat_kirim,total_harga,status_pesanan,created_at FROM pesanan WHERE pesanan_id=? LIMIT 1', [req.params.id]);
    if (!o.length) return res.status(404).json({ error: 'not_found' });
    const order = o[0];
    if (order.pembeli_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const [items] = await conn.query('SELECT i.pesanan_item_id,i.produk_id,p.nama_produk,i.harga_saat_beli,i.jumlah,i.subtotal FROM pesanan_item i JOIN produk p ON p.produk_id=i.produk_id WHERE i.pesanan_id=?', [req.params.id]);
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
    try { await conn.rollback(); } catch {}
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
  body('status_pesanan').isIn(['menunggu','diproses','dikirim','selesai','dibatalkan'])
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
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
