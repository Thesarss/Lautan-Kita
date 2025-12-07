const jwt = require('jsonwebtoken');
// Middleware untuk autentikasi JWT dan otorisasi peran.

function requireAuth(req, res, next) {
  // Ekstrak token Bearer dari header Authorization dan verifikasi.
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = jwt.verify(t, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

function requireRole(roles) {
  // Memastikan pengguna memiliki salah satu peran yang diizinkan.
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

module.exports = { requireAuth, requireRole };
