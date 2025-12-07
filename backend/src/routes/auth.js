const express = require('express');
const { pool } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');

// Route Auth: registrasi dan login menggunakan bcrypt untuk hashing dan JWT untuk sesi.

const router = express.Router();

router.post(
  '/register',
  [
    body('nama').isString().isLength({ min: 2 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8 }),
    body('role').isIn(['pembeli', 'penjual', 'admin'])
  ],
  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { nama, email, password, role } = req.body;
  try {
    const conn = await pool.getConnection();
    try {
      const [u] = await conn.query('SELECT user_id FROM user WHERE email=? LIMIT 1', [email]);
      if (u.length) return res.status(409).json({ error: 'email_exists' });
      const hash = await bcrypt.hash(password, 10);
      await conn.query('INSERT INTO user (nama,email,password_hash,role,verified) VALUES (?,?,?,?,?)', [nama, email, hash, role, 0]);
      const [rows] = await conn.query('SELECT user_id, role FROM user WHERE email=? LIMIT 1', [email]);
      const user = rows[0];
      const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
      res.json({ token });
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'db_unavailable' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { email, password } = req.body;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT user_id,password_hash,role,verified FROM user WHERE email=? LIMIT 1', [email]);
      if (!rows.length) return res.status(401).json({ error: 'invalid_credentials' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
      const token = jwt.sign({ id: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });
      res.json({ token });
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'db_unavailable' });
  }
});

module.exports = router;
router.get('/me', requireAuth, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query('SELECT user_id,nama,email,role,verified FROM user WHERE user_id=? LIMIT 1', [req.user.id]);
      if (!rows.length) return res.status(404).json({ error: 'not_found' });
      res.json({ id: rows[0].user_id, nama: rows[0].nama, email: rows[0].email, role: rows[0].role, verified: rows[0].verified });
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'db_unavailable' });
  }
});
