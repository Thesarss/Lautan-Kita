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
    body('role').isIn(['pembeli', 'penjual', 'admin', 'kurir'])
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
      const [rows] = await conn.query('SELECT user_id,nama,email,role,verified,avatar_url FROM user WHERE user_id=? LIMIT 1', [req.user.id]);
      if (!rows.length) return res.status(404).json({ error: 'not_found' });
      res.json({ id: rows[0].user_id, nama: rows[0].nama, email: rows[0].email, role: rows[0].role, verified: rows[0].verified, avatar_url: rows[0].avatar_url });
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'db_unavailable' });
  }
});
// Update profil: ubah nama dan/atau email
router.patch('/me', requireAuth, [
  body('nama').optional().isString().isLength({ min: 2 }).trim(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { nama, email } = req.body;
  try {
    const conn = await pool.getConnection();
    try {
      if (email) {
        const [u] = await conn.query('SELECT user_id FROM user WHERE email=? AND user_id<>? LIMIT 1', [email, req.user.id]);
        if (u.length) return res.status(409).json({ error: 'email_exists' });
      }
      await conn.query('UPDATE user SET nama=COALESCE(?, nama), email=COALESCE(?, email) WHERE user_id=?', [nama || null, email || null, req.user.id]);
      const [rows] = await conn.query('SELECT user_id,nama,email,role,verified,avatar_url FROM user WHERE user_id=? LIMIT 1', [req.user.id]);
      res.json({ id: rows[0].user_id, nama: rows[0].nama, email: rows[0].email, role: rows[0].role, verified: rows[0].verified, avatar_url: rows[0].avatar_url });
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ error: 'db_unavailable' });
  }
});

// Upload avatar (data URL base64)
router.post('/avatar', requireAuth, [
  body('image').isString().isLength({ min: 30 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { image } = req.body;
  try {
    let m = (image.match(/^data:(image\/([a-z0-9.+-]+));base64,(.+)$/i) || []);
    if (!m.length) {
      const idx = image.indexOf('base64,');
      if (idx > -1) {
        const b64 = image.slice(idx + 7);
        m = ['data', 'image/png', 'png', b64];
      } else {
        return res.status(400).json({ error: 'invalid_image' });
      }
    }
    const rawExt = (m[2] || '').toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : (rawExt || 'png');
    const b64 = m[3];
    const buf = Buffer.from(b64, 'base64');
    const path = require('path');
    const fs = require('fs');
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const avatarsDir = path.join(uploadsDir, 'avatars');
    try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
    try { if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true }); } catch {}
    const fileRel = `/uploads/avatars/${req.user.id}.${ext}`;
    const fileAbs = path.join(avatarsDir, `${req.user.id}.${ext}`);
    try {
      fs.writeFileSync(fileAbs, buf);
    } catch(e) {
      return res.status(500).json({ error: 'upload_failed', detail: e && e.message });
    }
    const conn = await pool.getConnection();
    try {
      await conn.query('UPDATE user SET avatar_url=? WHERE user_id=?', [fileRel, req.user.id]);
      res.json({ avatar_url: fileRel });
    } finally { conn.release(); }
  } catch (e) {
    res.status(500).json({ error: 'upload_failed' });
  }
});
