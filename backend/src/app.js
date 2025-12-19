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
const ratingsRouter = require('./routes/ratings');
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
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir); } catch { }
try { if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir); } catch { }
try { if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir); } catch { }
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/', productsRouter);
app.use('/', ordersRouter);
app.use('/', cartsRouter);
app.use('/', paymentsRouter);
app.use('/', shipmentsRouter);
app.use('/', adminRouter);
app.use('/', ratingsRouter);

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
      // Ensure kategori column exists
      const [kcols] = await conn2.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "produk" AND COLUMN_NAME = "kategori"');
      if (!kcols.length) {
        await conn2.query('ALTER TABLE produk ADD COLUMN kategori VARCHAR(50) NULL AFTER kategori_id');
        console.log('Added produk.kategori column');
      }
      // Ensure satuan column exists
      const [scols] = await conn2.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "produk" AND COLUMN_NAME = "satuan"');
      if (!scols.length) {
        await conn2.query('ALTER TABLE produk ADD COLUMN satuan VARCHAR(20) DEFAULT "kg" AFTER harga');
        console.log('Added produk.satuan column');
      }
      // Ensure deleted_at column exists for soft delete
      const [deletedAtCol] = await conn2.query('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "produk" AND COLUMN_NAME = "deleted_at"');
      if (!deletedAtCol.length) {
        await conn2.query('ALTER TABLE produk ADD COLUMN deleted_at DATETIME NULL');
        console.log('Added produk.deleted_at column');
      }
      // Ensure role enum includes 'kurir'
      const [roleEnum] = await conn2.query("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'role'");
      if (roleEnum.length && !roleEnum[0].COLUMN_TYPE.includes('kurir')) {
        await conn2.query("ALTER TABLE user MODIFY COLUMN role ENUM('pembeli','penjual','admin','kurir') DEFAULT 'pembeli'");
        console.log('Updated user.role enum to include kurir');
      }
      // Ensure tracking columns exist in pesanan table
      const [trackCols] = await conn2.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pesanan' AND COLUMN_NAME IN ('tanggal_dikemas','tanggal_dikirim','tanggal_selesai','kurir_id','ongkir','lokasi_terakhir','catatan_kurir')");
      const existingCols = trackCols.map(c => c.COLUMN_NAME);
      if (!existingCols.includes('tanggal_dikemas')) {
        await conn2.query("ALTER TABLE pesanan ADD COLUMN tanggal_dikemas DATETIME NULL AFTER status_pesanan");
        console.log('Added pesanan.tanggal_dikemas column');
      }
      if (!existingCols.includes('tanggal_dikirim')) {
        await conn2.query("ALTER TABLE pesanan ADD COLUMN tanggal_dikirim DATETIME NULL AFTER tanggal_dikemas");
        console.log('Added pesanan.tanggal_dikirim column');
      }
      if (!existingCols.includes('tanggal_selesai')) {
        await conn2.query("ALTER TABLE pesanan ADD COLUMN tanggal_selesai DATETIME NULL AFTER tanggal_dikirim");
        console.log('Added pesanan.tanggal_selesai column');
      }
      if (!existingCols.includes('kurir_id')) {
        await conn2.query("ALTER TABLE pesanan ADD COLUMN kurir_id INT NULL AFTER tanggal_selesai");
        console.log('Added pesanan.kurir_id column');
      }
      if (!existingCols.includes('ongkir')) {
        await conn2.query("ALTER TABLE pesanan ADD COLUMN ongkir DECIMAL(10,2) DEFAULT 0 AFTER kurir_id");
        console.log('Added pesanan.ongkir column');
      }
      if (!existingCols.includes('lokasi_terakhir')) {
        await conn2.query("ALTER TABLE pesanan ADD COLUMN lokasi_terakhir VARCHAR(255) NULL AFTER ongkir");
        console.log('Added pesanan.lokasi_terakhir column');
      }
      if (!existingCols.includes('catatan_kurir')) {
        await conn2.query("ALTER TABLE pesanan ADD COLUMN catatan_kurir TEXT NULL AFTER lokasi_terakhir");
        console.log('Added pesanan.catatan_kurir column');
      }
      // Update status_pesanan enum
      const [statusEnum] = await conn2.query("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pesanan' AND COLUMN_NAME = 'status_pesanan'");
      if (statusEnum.length && !statusEnum[0].COLUMN_TYPE.includes('dikemas')) {
        await conn2.query("ALTER TABLE pesanan MODIFY COLUMN status_pesanan ENUM('pending','dikemas','dikirim','selesai','dibatalkan') DEFAULT 'pending'");
        console.log('Updated pesanan.status_pesanan enum');
      }

      // Ensure seller rating table exists
      const [ratingTable] = await conn2.query("SHOW TABLES LIKE 'rating_penjual'");
      if (!ratingTable.length) {
        await conn2.query(`
          CREATE TABLE rating_penjual (
            rating_id int(11) NOT NULL AUTO_INCREMENT,
            penjual_id int(11) NOT NULL,
            pembeli_id int(11) NOT NULL,
            pesanan_id int(11) NOT NULL,
            rating int(11) NOT NULL CHECK (rating between 1 and 5),
            komentar text DEFAULT NULL,
            status enum('aktif','disembunyikan') DEFAULT 'aktif',
            dibuat_pada datetime DEFAULT current_timestamp(),
            PRIMARY KEY (rating_id),
            UNIQUE KEY unique_rating_per_order (pembeli_id, pesanan_id, penjual_id),
            KEY fk_rating_penjual (penjual_id),
            KEY fk_rating_pembeli (pembeli_id),
            KEY fk_rating_pesanan (pesanan_id),
            KEY idx_rating_penjual_status (penjual_id, status),
            KEY idx_rating_created (dibuat_pada),
            CONSTRAINT fk_rating_penjual FOREIGN KEY (penjual_id) REFERENCES user (user_id) ON DELETE CASCADE,
            CONSTRAINT fk_rating_pembeli FOREIGN KEY (pembeli_id) REFERENCES user (user_id) ON DELETE CASCADE,
            CONSTRAINT fk_rating_pesanan FOREIGN KEY (pesanan_id) REFERENCES pesanan (pesanan_id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('Created rating_penjual table');
      }

      // Ensure avg_rating and total_ratings columns exist in user table
      const [ratingCols] = await conn2.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME IN ('avg_rating','total_ratings')");
      const existingRatingCols = ratingCols.map(c => c.COLUMN_NAME);
      if (!existingRatingCols.includes('avg_rating')) {
        await conn2.query("ALTER TABLE user ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT NULL");
        console.log('Added user.avg_rating column');
      }
      if (!existingRatingCols.includes('total_ratings')) {
        await conn2.query("ALTER TABLE user ADD COLUMN total_ratings INT(11) DEFAULT 0");
        console.log('Added user.total_ratings column');
      }

      // Ensure balasan_admin columns exist in ulasan table
      const [ulasanCols] = await conn2.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ulasan' AND COLUMN_NAME IN ('balasan_admin','tanggal_balasan','admin_id')");
      const existingUlasanCols = ulasanCols.map(c => c.COLUMN_NAME);
      if (!existingUlasanCols.includes('balasan_admin')) {
        await conn2.query("ALTER TABLE ulasan ADD COLUMN balasan_admin TEXT NULL");
        console.log('Added ulasan.balasan_admin column');
      }
      if (!existingUlasanCols.includes('tanggal_balasan')) {
        await conn2.query("ALTER TABLE ulasan ADD COLUMN tanggal_balasan DATETIME NULL");
        console.log('Added ulasan.tanggal_balasan column');
      }
      if (!existingUlasanCols.includes('admin_id')) {
        await conn2.query("ALTER TABLE ulasan ADD COLUMN admin_id INT NULL");
        console.log('Added ulasan.admin_id column');
      }

    } finally { conn2.release(); }
  } catch (e) {
    console.error('Database connection failed:', e && e.code || e && e.message);
    console.error('Ensure XAMPP MySQL is running and .env matches credentials');
  }
})();
