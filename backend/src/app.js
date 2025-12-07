require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
app.use(express.json());

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
  } catch (e) {
    console.error('Database connection failed:', e && e.code || e && e.message);
    console.error('Ensure XAMPP MySQL is running and .env matches credentials');
  }
})();
