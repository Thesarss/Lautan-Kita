const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { query, body, param, validationResult } = require('express-validator');

// Route Admin: manajemen pengguna, moderasi produk/ulasan, laporan penjualan/payout.
const router = express.Router();

router.get('/admin/users', requireAuth, requireRole(['admin']), [
  query('role').optional().isIn(['pembeli', 'penjual', 'admin']),
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
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.patch('/admin/users/:id/role', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 }),
  body('role').isIn(['pembeli', 'penjual', 'admin'])
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
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.patch('/admin/products/:id/status', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['aktif', 'nonaktif'])
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
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.patch('/admin/users/:id', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 }),
  body('nama').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['pembeli', 'penjual', 'admin', 'kurir']),
  body('verified').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { nama, email, role, verified } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [u] = await conn.query('SELECT user_id FROM user WHERE user_id=? FOR UPDATE', [req.params.id]);
    if (!u.length) { await conn.rollback(); return res.status(404).json({ error: 'not_found' }); }

    // Check email uniqueness if email is being changed
    if (email) {
      const [existing] = await conn.query('SELECT user_id FROM user WHERE email=? AND user_id!=?', [email, req.params.id]);
      if (existing.length) { await conn.rollback(); return res.status(409).json({ error: 'email_exists' }); }
    }

    await conn.query(
      'UPDATE user SET nama=COALESCE(?,nama), email=COALESCE(?,email), role=COALESCE(?,role), verified=COALESCE(?,verified) WHERE user_id=?',
      [nama || null, email || null, role || null, verified !== undefined ? (verified ? 1 : 0) : null, req.params.id]
    );
    await conn.query('INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,?,?,?)', [req.user.id, 'user_update', 'user', req.params.id, JSON.stringify({ nama, email, role, verified })]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch { }
    res.status(500).json({ error: 'internal_error' });
  } finally {
    conn.release();
  }
});

router.get('/admin/transactions', requireAuth, requireRole(['admin']), [
  query('status').optional().isIn(['belum_dibayar', 'sudah_dibayar', 'gagal']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { status, from, to } = req.query;
  const conn = await pool.getConnection();
  try {
    let sql = `SELECT 
               pb.pembayaran_id, 
               pb.pesanan_id, 
               ps.total_harga as jumlah_bayar, 
               pb.metode, 
               pb.status_pembayaran, 
               pb.paid_at as tanggal_pembayaran, 
               pb.reference_gateway,
               u.nama AS pembeli_nama, 
               u.email AS pembeli_email,
               ps.created_at as tanggal_pesanan
               FROM pembayaran pb
               JOIN pesanan ps ON ps.pesanan_id = pb.pesanan_id
               JOIN user u ON u.user_id = ps.pembeli_id`;
    const params = [];
    const conds = [];
    if (status) { conds.push('pb.status_pembayaran=?'); params.push(status); }
    if (from) { conds.push('DATE(ps.created_at) >= ?'); params.push(from); }
    if (to) { conds.push('DATE(ps.created_at) <= ?'); params.push(to); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY ps.created_at DESC';
    const [rows] = await conn.query(sql, params);
    res.json(rows);
  } finally {
    conn.release();
  }
});

router.get('/admin/reviews', requireAuth, requireRole(['admin']), [
  query('status').optional().isIn(['aktif', 'disembunyikan']),
  query('rating').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { status, rating } = req.query;
  const conn = await pool.getConnection();
  try {
    let sql = `SELECT u.ulasan_id, u.produk_id, p.nama_produk, u.pembeli_id, 
               usr.nama AS pembeli_nama, u.rating, u.komentar, u.status, u.dibuat_pada AS tanggal_ulasan
               FROM ulasan u
               JOIN produk p ON p.produk_id = u.produk_id
               JOIN user usr ON usr.user_id = u.pembeli_id`;
    const params = [];
    const conds = [];
    if (status) { conds.push('u.status=?'); params.push(status); }
    if (rating) { conds.push('u.rating=?'); params.push(rating); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY u.dibuat_pada DESC';
    const [rows] = await conn.query(sql, params);
    res.json(rows);
  } finally {
    conn.release();
  }
});

router.patch('/admin/reviews/:id/status', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['aktif', 'disembunyikan'])
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

// Get all orders for admin
router.get('/admin/orders', requireAuth, requireRole(['admin']), [
  query('status').optional().isIn(['pending', 'dikemas', 'dikirim', 'selesai', 'dibatalkan']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { status, from, to } = req.query;
  const conn = await pool.getConnection();
  try {
    let sql = `SELECT 
               p.pesanan_id, 
               p.pembeli_id,
               u.nama AS pembeli_nama,
               u.email AS pembeli_email,
               p.total_harga,
               p.status_pesanan,
               p.alamat_kirim,
               p.created_at,
               p.kurir_id,
               k.nama AS kurir_nama,
               COUNT(pi.produk_id) as total_items
               FROM pesanan p
               JOIN user u ON u.user_id = p.pembeli_id
               LEFT JOIN user k ON k.user_id = p.kurir_id
               LEFT JOIN pesanan_item pi ON pi.pesanan_id = p.pesanan_id`;
    const params = [];
    const conds = [];
    if (status) { conds.push('p.status_pesanan=?'); params.push(status); }
    if (from) { conds.push('DATE(p.created_at) >= ?'); params.push(from); }
    if (to) { conds.push('DATE(p.created_at) <= ?'); params.push(to); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' GROUP BY p.pesanan_id ORDER BY p.created_at DESC';
    const [rows] = await conn.query(sql, params);
    res.json(rows);
  } finally {
    conn.release();
  }
});

// Note: Order status update endpoint is in orders.js as /admin/orders/:id/status

// Get dashboard stats - moved to top
router.get('/admin/stats', requireAuth, requireRole(['admin']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [userStats] = await conn.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'pembeli' THEN 1 ELSE 0 END) as total_pembeli,
        SUM(CASE WHEN role = 'penjual' THEN 1 ELSE 0 END) as total_penjual,
        SUM(CASE WHEN role = 'kurir' THEN 1 ELSE 0 END) as total_kurir,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified_users
      FROM user
    `);
    
    const [orderStats] = await conn.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status_pesanan = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status_pesanan = 'selesai' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status_pesanan = 'selesai' THEN total_harga ELSE 0 END) as total_revenue
      FROM pesanan
    `);
    
    const [productStats] = await conn.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as active_products
      FROM produk
    `);
    
    const [paymentStats] = await conn.query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status_pembayaran = 'sudah_dibayar' THEN 1 ELSE 0 END) as confirmed_payments
      FROM pembayaran
    `);
    
    res.json({
      users: userStats[0],
      orders: orderStats[0], 
      products: productStats[0],
      payments: paymentStats[0]
    });
  } finally {
    conn.release();
  }
});

router.get('/admin/reports/payouts', requireAuth, requireRole(['admin']), [
  query('status').optional().isIn(['queued', 'processing', 'settled', 'failed'])
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

router.get('/admin/reviews', requireAuth, requireRole(['admin']), [
  query('status').optional().isIn(['aktif', 'disembunyikan']),
  query('q').optional().isString().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { status, q } = req.query;
  const conn = await pool.getConnection();
  try {
    let sql = 'SELECT r.ulasan_id,r.produk_id,p.nama_produk,u.nama AS user_nama,r.rating,r.komentar,r.status,r.created_at FROM ulasan r JOIN produk p ON p.produk_id=r.produk_id JOIN user u ON u.user_id=r.user_id';
    const params = [];
    const conds = [];
    if (status) { conds.push('r.status=?'); params.push(status); }
    if (q) { conds.push('(r.komentar LIKE ? OR p.nama_produk LIKE ? OR u.nama LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY r.created_at DESC';
    const [rows] = await conn.query(sql, params);
    res.json(rows);
  } finally {
    conn.release();
  }
});

module.exports = router;
