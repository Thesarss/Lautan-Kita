const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

// Route Pembayaran: membuat, konfirmasi, dan melihat pembayaran.

const router = express.Router();

router.post('/payments', requireAuth, requireRole(['pembeli']), [
  body('pesanan_id').isInt({ min: 1 }),
  body('metode').isIn(['BNI','BCA','Mandiri','COD'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { pesanan_id, metode } = req.body;
  const conn = await pool.getConnection();
  try {
    const [o] = await conn.query('SELECT pesanan_id,pembeli_id,status_pesanan,total_harga FROM pesanan WHERE pesanan_id=?', [pesanan_id]);
    if (!o.length) return res.status(404).json({ error: 'order_not_found' });
    if (o[0].pembeli_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });
    const [existing] = await conn.query('SELECT pembayaran_id,status_pembayaran FROM pembayaran WHERE pesanan_id=? LIMIT 1', [pesanan_id]);
    if (existing.length) return res.status(200).json({ pembayaran_id: existing[0].pembayaran_id, status_pembayaran: existing[0].status_pembayaran });
    const [ins] = await conn.query('INSERT INTO pembayaran (pesanan_id,metode,status_pembayaran) VALUES (?,?,?)', [pesanan_id, metode, 'belum_dibayar']);
    res.status(201).json({ pembayaran_id: ins.insertId, status_pembayaran: 'belum_dibayar' });
  } finally {
    conn.release();
  }
});

router.post('/payments/:id/confirm', requireAuth, requireRole(['pembeli','admin']), [param('id').isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [p] = await conn.query('SELECT pembayaran_id,pesanan_id,status_pembayaran FROM pembayaran WHERE pembayaran_id=? FOR UPDATE', [req.params.id]);
    if (!p.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'not_found' });
    }
    if (p[0].status_pembayaran === 'sudah_dibayar') {
      await conn.rollback();
      return res.status(200).json({ pembayaran_id: p[0].pembayaran_id, status_pembayaran: 'sudah_dibayar' });
    }
    await conn.query('UPDATE pembayaran SET status_pembayaran="sudah_dibayar", paid_at=NOW() WHERE pembayaran_id=?', [req.params.id]);
    await conn.query('UPDATE pesanan SET status_pesanan="diproses" WHERE pesanan_id=? AND status_pesanan="menunggu"', [p[0].pesanan_id]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.get('/payments/:id', requireAuth, [param('id').isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    const [p] = await conn.query('SELECT pembayaran_id,pesanan_id,metode,status_pembayaran,paid_at,reference_gateway FROM pembayaran WHERE pembayaran_id=?', [req.params.id]);
    if (!p.length) return res.status(404).json({ error: 'not_found' });
    const [o] = await conn.query('SELECT pembeli_id FROM pesanan WHERE pesanan_id=?', [p[0].pesanan_id]);
    const owner = o.length ? o[0].pembeli_id : null;
    if (owner !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    res.json(p[0]);
  } finally {
    conn.release();
  }
});

router.get('/orders/:orderId/payments', requireAuth, [param('orderId').isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    const [o] = await conn.query('SELECT pembeli_id FROM pesanan WHERE pesanan_id=?', [req.params.orderId]);
    if (!o.length) return res.status(404).json({ error: 'order_not_found' });
    if (o[0].pembeli_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const [rows] = await conn.query('SELECT pembayaran_id,metode,status_pembayaran,paid_at FROM pembayaran WHERE pesanan_id=?', [req.params.orderId]);
    res.json(rows);
  } finally {
    conn.release();
  }
});

module.exports = router;
