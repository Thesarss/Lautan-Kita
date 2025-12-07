require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRouter = require('./routes/auth');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const cartsRouter = require('./routes/carts');
const paymentsRouter = require('./routes/payments');
const shipmentsRouter = require('./routes/shipments');
const adminRouter = require('./routes/admin');
const { pool } = require('./db');

const app = express();
app.use(cors({ origin: true }));
app.options('*', cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
// Static uploads (avatars, etc.)
const uploadsDir = path.join(__dirname, '..', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const productsDir = path.join(uploadsDir, 'products');
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir); } catch {}
try { if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir); } catch {}
try { if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir); } catch {}
app.use('/uploads', express.static(uploadsDir));

app.use('/auth', authRouter);
app.use('/', productsRouter);
app.use('/', ordersRouter);
app.use('/', cartsRouter);
app.use('/', paymentsRouter);
app.use('/', shipmentsRouter);
app.use('/', adminRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'not_found' });
});

process.on('unhandledRejection', (err) => {
  console.error('UnhandledRejection', err && err.message);
});
process.on('uncaughtException', (err) => {
  console.error('UncaughtException', err && err.message);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('Server listening on', port);
});

(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    console.log('Database connected');
    // Ensure avatar_url column exists
    const conn2 = await pool.getConnection();
    try {
      const [cols] = await conn2.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "user" AND COLUMN_NAME = "avatar_url"');
      if (!cols.length) {
        await conn2.query('ALTER TABLE user ADD COLUMN avatar_url VARCHAR(255) NULL');
        console.log('Added user.avatar_url column');
      }
      const [pcols] = await conn2.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "produk" AND COLUMN_NAME = "photo_url"');
      if (!pcols.length) {
        await conn2.query('ALTER TABLE produk ADD COLUMN photo_url VARCHAR(255) NULL');
        console.log('Added produk.photo_url column');
      }
    } finally { conn2.release(); }
  } catch (e) {
    console.error('Database connection failed:', e && e.code || e && e.message);
    console.error('Ensure XAMPP MySQL is running and .env matches credentials');
  }
})();
