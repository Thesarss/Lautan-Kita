const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

// Route Pengiriman: membuat record pengiriman, melihat, dan update status.

const router = express.Router();

router.post('/shipments/:orderId/create', requireAuth, requireRole(['admin','penjual']), [
  param('orderId').isInt({ min: 1 }),
  body('kurir_id').optional().isInt({ min: 1 }),
  body('no_resi').optional().isString().isLength({ min: 3, max: 100 }).trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { kurir_id, no_resi } = req.body;
  const conn = await pool.getConnection();
  try {
    const [o] = await conn.query('SELECT pesanan_id FROM pesanan WHERE pesanan_id=?', [req.params.orderId]);
    if (!o.length) return res.status(404).json({ error: 'order_not_found' });
    const [existing] = await conn.query('SELECT peneriman_id FROM pengiriman WHERE pesanan_id=? LIMIT 1', [req.params.orderId]);
    if (existing.length) return res.status(200).json({ peneriman_id: existing[0].peneriman_id });
    const [ins] = await conn.query('INSERT INTO pengiriman (pesanan_id,kurir_id,no_resi,status_kirim) VALUES (?,?,?,?)', [req.params.orderId, kurir_id || null, no_resi || null, 'diproses']);
    res.status(201).json({ peneriman_id: ins.insertId });
  } finally {
    conn.release();
  }
});

router.get('/shipments/:orderId', requireAuth, [param('orderId').isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    const [o] = await conn.query('SELECT pembeli_id FROM pesanan WHERE pesanan_id=?', [req.params.orderId]);
    if (!o.length) return res.status(404).json({ error: 'order_not_found' });
    if (o[0].pembeli_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const [rows] = await conn.query('SELECT g.peneriman_id,g.pesanan_id,g.kurir_id,u.nama AS kurir_nama,g.no_resi,g.status_kirim,g.updated_at FROM pengiriman g LEFT JOIN user u ON u.user_id=g.kurir_id WHERE g.pesanan_id=?', [req.params.orderId]);
    res.json(rows[0] || null);
  } finally {
    conn.release();
  }
});

router.get('/kurir/shipments', requireAuth, requireRole(['kurir']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT peneriman_id,pesanan_id,no_resi,status_kirim,updated_at FROM pengiriman WHERE kurir_id=? ORDER BY updated_at DESC', [req.user.id]);
    res.json(rows);
  } finally { conn.release(); }
});

router.patch('/shipments/:id/status', requireAuth, requireRole(['admin','penjual','kurir']), [
  param('id').isInt({ min: 1 }),
  body('status_kirim').isIn(['diproses','dikirim','diterima']),
  body('no_resi').optional().isString().isLength({ min: 3, max: 100 }).trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { status_kirim, no_resi } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [s] = await conn.query('SELECT peneriman_id,pesanan_id,status_kirim FROM pengiriman WHERE peneriman_id=? FOR UPDATE', [req.params.id]);
    if (!s.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'not_found' });
    }
    await conn.query('UPDATE pengiriman SET status_kirim=?, no_resi=COALESCE(?, no_resi) WHERE peneriman_id=?', [status_kirim, no_resi || null, req.params.id]);
    if (status_kirim === 'diterima') {
      await conn.query('UPDATE pesanan SET status_pesanan="selesai" WHERE pesanan_id=? AND status_pesanan<>"selesai"', [s[0].pesanan_id]);
    }
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
