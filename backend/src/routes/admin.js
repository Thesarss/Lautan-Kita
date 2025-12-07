const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { query, body, param, validationResult } = require('express-validator');

// Route Admin: manajemen pengguna, moderasi produk/ulasan, laporan penjualan/payout.
const router = express.Router();

router.get('/admin/users', requireAuth, requireRole(['admin']), [
  query('role').optional().isIn(['pembeli','penjual','admin']),
  query('q').optional().isString().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { role, q } = req.query;
  const conn = await pool.getConnection();
  try {
    let sql = 'SELECT user_id,nama,email,no_tlp,alamat,role,verified,created_at FROM user';
    const params = [];
    const conds = [];
    if (role) { conds.push('role=?'); params.push(role); }
    if (q) { conds.push('(nama LIKE ? OR email LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    const [rows] = await conn.query(sql, params);
    res.json(rows);
  } finally {
    conn.release();
  }
});

router.patch('/admin/users/:id/verify', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 }),
  body('verified').isInt({ min: 0, max: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { verified } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [u] = await conn.query('SELECT user_id FROM user WHERE user_id=? FOR UPDATE', [req.params.id]);
    if (!u.length) { await conn.rollback(); return res.status(404).json({ error: 'not_found' }); }
    await conn.query('UPDATE user SET verified=? WHERE user_id=?', [verified, req.params.id]);
    await conn.query('INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?)', [req.user.id, 'user_verify_update', 'user', req.params.id, JSON.stringify({ verified })]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.patch('/admin/users/:id/role', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 }),
  body('role').isIn(['pembeli','penjual','admin'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { role } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [u] = await conn.query('SELECT user_id FROM user WHERE user_id=? FOR UPDATE', [req.params.id]);
    if (!u.length) { await conn.rollback(); return res.status(404).json({ error: 'not_found' }); }
    await conn.query('UPDATE user SET role=? WHERE user_id=?', [role, req.params.id]);
    await conn.query('INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?)', [req.user.id, 'user_role_update', 'user', req.params.id, JSON.stringify({ role })]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.patch('/admin/products/:id/status', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['aktif','nonaktif'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { status } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [p] = await conn.query('SELECT produk_id FROM produk WHERE produk_id=? FOR UPDATE', [req.params.id]);
    if (!p.length) { await conn.rollback(); return res.status(404).json({ error: 'not_found' }); }
    await conn.query('UPDATE produk SET status=? WHERE produk_id=?', [status, req.params.id]);
    await conn.query('INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?)', [req.user.id, 'product_status_update', 'produk', req.params.id, JSON.stringify({ status })]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.patch('/admin/reviews/:id/status', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['aktif','disembunyikan'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { status } = req.body;
  const conn = await pool.getConnection();
  try {
    const [r] = await conn.query('SELECT ulasan_id FROM ulasan WHERE ulasan_id=?', [req.params.id]);
    if (!r.length) return res.status(404).json({ error: 'not_found' });
    await conn.query('UPDATE ulasan SET status=? WHERE ulasan_id=?', [status, req.params.id]);
    await conn.query('INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?)', [req.user.id, 'review_status_update', 'ulasan', req.params.id, JSON.stringify({ status })]);
    res.json({ ok: true });
  } finally {
    conn.release();
  }
});

router.get('/admin/reports/sales', requireAuth, requireRole(['admin']), [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { from, to } = req.query;
  const conn = await pool.getConnection();
  try {
    let sql = 'SELECT DATE(created_at) AS tgl, COUNT(*) AS orders, SUM(total_harga) AS total FROM pesanan WHERE status_pesanan IN ("selesai","dikirim","diproses")';
    const params = [];
    if (from) { sql += ' AND created_at >= ?'; params.push(from); }
    if (to) { sql += ' AND created_at <= ?'; params.push(to); }
    sql += ' GROUP BY DATE(created_at) ORDER BY tgl DESC';
    const [rows] = await conn.query(sql, params);
    res.json(rows);
  } finally {
    conn.release();
  }
});

router.get('/admin/reports/payouts', requireAuth, requireRole(['admin']), [
  query('status').optional().isIn(['queued','processing','settled','failed'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { status } = req.query;
  const conn = await pool.getConnection();
  try {
    let sql = 'SELECT p.payout_id,p.penjual_id,u.nama AS penjual_nama,p.pesanan_id,p.amount,p.status,p.scheduled_at,p.settled_at FROM payout p JOIN user u ON u.user_id=p.penjual_id';
    const params = [];
    if (status) { sql += ' WHERE p.status=?'; params.push(status); }
    sql += ' ORDER BY p.payout_id DESC';
    const [rows] = await conn.query(sql, params);
    res.json(rows);
  } finally {
    conn.release();
  }
});

module.exports = router;
