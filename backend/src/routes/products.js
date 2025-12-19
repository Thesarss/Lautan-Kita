const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { query, body, validationResult, param } = require('express-validator');

// Route Produk: list publik dan pembuatan produk oleh penjual.

const router = express.Router();

router.get('/products', [
  query('q').optional().isString().trim(),
  query('min_price').optional().isFloat({ min: 0 }),
  query('max_price').optional().isFloat({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      'SELECT p.produk_id,p.nama_produk,p.deskripsi,p.harga,p.stok,p.status,p.tanggal_upload,p.photo_url,u.nama AS penjual_nama FROM produk p LEFT JOIN user u ON u.user_id=p.penjual_id WHERE p.status="aktif" AND p.deleted_at IS NULL'
    );
    res.json(rows);
  } finally {
    conn.release();
  }
});

router.post('/penjual/produk', requireAuth, requireRole(['penjual']), [
  body('nama_produk').isString().isLength({ min: 2 }).trim().withMessage('Nama produk minimal 2 karakter'),
  body('kategori').optional({ nullable: true }).isString().trim(),
  body('deskripsi').optional({ nullable: true }).isString().isLength({ max: 2000 }).trim(),
  body('harga').isFloat({ gt: 0 }).withMessage('Harga harus lebih dari 0'),
  body('satuan').optional({ nullable: true }).isString().trim(),
  body('stok').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Stok tidak boleh negatif'),
  body('status').optional({ nullable: true }).isIn(['aktif', 'nonaktif']),
  body('kategori_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('image').optional({ nullable: true }).isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(422).json({ error: 'validation_error', details: errors.array() });
  }
  console.log('Adding product, body:', { ...req.body, image: req.body.image ? '[BASE64_IMAGE]' : null });
  const { nama_produk, kategori, deskripsi, harga, satuan, stok, status, kategori_id, image } = req.body;
  const conn = await pool.getConnection();
  try {
    console.log('Inserting product for user:', req.user.id);
    const [ins] = await conn.query(
      'INSERT INTO produk (penjual_id,kategori_id,nama_produk,kategori,deskripsi,harga,satuan,stok,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.user.id, kategori_id || null, nama_produk, kategori || null, deskripsi || null, harga, satuan || 'kg', stok || 0, status || 'aktif']
    );
    const produkId = ins.insertId;
    console.log('Product inserted with ID:', produkId);
    let photoUrl = null;
    if (image && typeof image === 'string' && image.length > 30) {
      let m = (image.match(/^data:(image\/([a-z0-9.+-]+));base64,(.+)$/i) || []);
      if (!m.length) {
        const idx = image.indexOf('base64,');
        if (idx > -1) {
          const b64 = image.slice(idx + 7);
          m = ['data', 'image/png', 'png', b64];
        }
      }
      if (m.length) {
        const rawExt = (m[2] || '').toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : (rawExt || 'png');
        const b64 = m[3];
        const buf = Buffer.from(b64, 'base64');
        const path = require('path');
        const fs = require('fs');
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        const productsDir = path.join(uploadsDir, 'products');
        try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch { }
        try { if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true }); } catch { }
        const fileRel = `/uploads/products/${produkId}.${ext}`;
        const fileAbs = path.join(productsDir, `${produkId}.${ext}`);
        try { fs.writeFileSync(fileAbs, buf); photoUrl = fileRel; } catch { }
      }
    }
    if (photoUrl) {
      await conn.query('UPDATE produk SET photo_url=? WHERE produk_id=?', [photoUrl, produkId]);
    }
    console.log('Product created successfully:', produkId);
    res.status(201).json({ produk_id: produkId, photo_url: photoUrl });
  } catch (e) {
    console.error('Error creating product:', e);
    res.status(500).json({ error: 'internal_error', message: e.message });
  } finally {
    conn.release();
  }
});

router.get('/penjual/produk', requireAuth, requireRole(['penjual']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT produk_id,nama_produk,kategori,deskripsi,harga,satuan,stok,status,photo_url,tanggal_upload FROM produk WHERE penjual_id=? AND deleted_at IS NULL ORDER BY produk_id DESC', [req.user.id]);
    res.json(rows);
  } finally {
    conn.release();
  }
});

// Debug endpoint to check product orders
router.get('/penjual/produk/:id/orders', requireAuth, requireRole(['penjual']), [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const conn = await pool.getConnection();
  try {
    // Check if product belongs to seller
    const [own] = await conn.query('SELECT produk_id FROM produk WHERE produk_id=? AND penjual_id=? LIMIT 1', [req.params.id, req.user.id]);
    if (!own.length) return res.status(404).json({ error: 'not_found' });

    // Get all orders containing this product
    const [orders] = await conn.query(`
      SELECT p.pesanan_id, p.status_pesanan, p.created_at, pi.jumlah
      FROM pesanan_item pi 
      JOIN pesanan p ON p.pesanan_id = pi.pesanan_id 
      WHERE pi.produk_id = ?
      ORDER BY p.created_at DESC
    `, [req.params.id]);

    // Count pending orders
    const [pendingCount] = await conn.query(`
      SELECT COUNT(*) as count FROM pesanan_item pi 
      JOIN pesanan p ON p.pesanan_id = pi.pesanan_id 
      WHERE pi.produk_id = ? AND p.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim')
    `, [req.params.id]);

    res.json({
      product_id: req.params.id,
      total_orders: orders.length,
      pending_orders: pendingCount[0].count,
      orders: orders
    });
  } finally {
    conn.release();
  }
});

router.patch('/penjual/produk/:id', requireAuth, requireRole(['penjual']), [
  param('id').isInt({ min: 1 }),
  body('nama_produk').optional().isString().isLength({ min: 2 }).trim(),
  body('kategori').optional().isString().trim(),
  body('deskripsi').optional().isString().isLength({ max: 2000 }).trim(),
  body('harga').optional().isFloat({ gt: 0 }),
  body('satuan').optional().isString().trim(),
  body('stok').optional().isInt({ min: 0 }),
  body('kategori_id').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['aktif', 'nonaktif']),
  body('image').optional().custom((value) => {
    if (value && typeof value === 'string' && value.length < 30) {
      throw new Error('Image data too short');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { nama_produk, kategori, deskripsi, harga, satuan, stok, kategori_id, status, image } = req.body;
  const conn = await pool.getConnection();
  try {
    const [own] = await conn.query('SELECT produk_id FROM produk WHERE produk_id=? AND penjual_id=? LIMIT 1', [req.params.id, req.user.id]);
    if (!own.length) return res.status(404).json({ error: 'not_found' });

    // Handle image update if provided
    let photoUrl = null;
    if (image && typeof image === 'string' && image.length > 30) {
      let m = (image.match(/^data:(image\/([a-z0-9.+-]+));base64,(.+)$/i) || []);
      if (!m.length) {
        const idx = image.indexOf('base64,');
        if (idx > -1) {
          const b64 = image.slice(idx + 7);
          m = ['data', 'image/png', 'png', b64];
        }
      }
      if (m.length) {
        const rawExt = (m[2] || '').toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : (rawExt || 'png');
        const b64 = m[3];
        const buf = Buffer.from(b64, 'base64');
        const path = require('path');
        const fs = require('fs');
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
        const productsDir = path.join(uploadsDir, 'products');
        try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch { }
        try { if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true }); } catch { }
        const fileRel = `/uploads/products/${req.params.id}.${ext}`;
        const fileAbs = path.join(productsDir, `${req.params.id}.${ext}`);
        try { fs.writeFileSync(fileAbs, buf); photoUrl = fileRel; } catch { }
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    if (nama_produk !== undefined) {
      updateFields.push('nama_produk = ?');
      updateValues.push(nama_produk);
    }
    if (kategori !== undefined) {
      updateFields.push('kategori = ?');
      updateValues.push(kategori);
    }
    if (deskripsi !== undefined) {
      updateFields.push('deskripsi = ?');
      updateValues.push(deskripsi);
    }
    if (harga !== undefined) {
      updateFields.push('harga = ?');
      updateValues.push(harga);
    }
    if (satuan !== undefined) {
      updateFields.push('satuan = ?');
      updateValues.push(satuan);
    }
    if (stok !== undefined) {
      updateFields.push('stok = ?');
      updateValues.push(stok);
    }
    if (kategori_id !== undefined) {
      updateFields.push('kategori_id = ?');
      updateValues.push(kategori_id);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (photoUrl !== null) {
      updateFields.push('photo_url = ?');
      updateValues.push(photoUrl);
    }

    if (updateFields.length > 0) {
      updateValues.push(req.params.id, req.user.id);
      await conn.query(
        `UPDATE produk SET ${updateFields.join(', ')} WHERE produk_id = ? AND penjual_id = ?`,
        updateValues
      );
    }
    res.json({ ok: true, photo_url: photoUrl });
  } finally {
    conn.release();
  }
});

// Delete product endpoint
router.delete('/penjual/produk/:id', requireAuth, requireRole(['penjual']), [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation error in delete product:', errors.array());
    return res.status(422).json({ error: 'validation_error', details: errors.array() });
  }

  console.log(`Delete product request: productId=${req.params.id}, userId=${req.user.id}, userRole=${req.user.role}`);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if product exists and belongs to seller, get status and photo_url in one query
    const [own] = await conn.query('SELECT produk_id, photo_url, status FROM produk WHERE produk_id=? AND penjual_id=? AND deleted_at IS NULL LIMIT 1', [req.params.id, req.user.id]);
    console.log(`Product ownership check result:`, own);

    if (!own.length) {
      console.log(`Product not found or doesn't belong to seller: productId=${req.params.id}, sellerId=${req.user.id}`);
      await conn.rollback();
      return res.status(404).json({ error: 'not_found', message: 'Produk tidak ditemukan atau bukan milik Anda' });
    }

    const productStatus = own[0].status;
    console.log(`Product status: ${productStatus}`);

    // Only check pending orders for active products
    // Inactive products can be deleted regardless of order history
    if (productStatus === 'aktif') {
      console.log('Checking pending orders for active product...');
      const [pendingOrders] = await conn.query(`
        SELECT COUNT(*) as count FROM pesanan_item pi 
        JOIN pesanan p ON p.pesanan_id = pi.pesanan_id 
        WHERE pi.produk_id = ? AND p.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim')
      `, [req.params.id]);

      console.log(`Pending orders count: ${pendingOrders[0].count}`);

      if (pendingOrders[0].count > 0) {
        console.log(`Cannot delete active product with pending orders: ${pendingOrders[0].count}`);
        await conn.rollback();
        return res.status(409).json({
          error: 'product_in_pending_orders',
          message: `Tidak dapat menghapus produk aktif karena masih ada ${pendingOrders[0].count} pesanan aktif. Ubah status produk menjadi nonaktif terlebih dahulu atau tunggu hingga semua pesanan selesai.`,
          pending_count: pendingOrders[0].count
        });
      }
    } else {
      console.log('Product is inactive, skipping pending orders check');
    }

    // Remove related cart items (they reference the product)
    console.log('Removing related cart items...');
    const [deletedCartItems] = await conn.query('DELETE FROM keranjang_item WHERE produk_id = ?', [req.params.id]);
    console.log(`Removed ${deletedCartItems.affectedRows} cart items`);

    // Soft delete the product (set deleted_at timestamp)
    console.log('Soft deleting product...');
    const [deleteResult] = await conn.query('UPDATE produk SET deleted_at = NOW() WHERE produk_id=? AND penjual_id=? AND deleted_at IS NULL', [req.params.id, req.user.id]);
    console.log(`Soft delete result: ${deleteResult.affectedRows} rows affected`);

    if (deleteResult.affectedRows === 0) {
      console.log('No rows were updated - product may already be deleted');
      await conn.rollback();
      return res.status(500).json({ error: 'delete_failed', message: 'Gagal menghapus produk dari database' });
    }

    // Note: We keep the image file for potential recovery
    // Image cleanup can be done separately by admin if needed
    console.log('Product image preserved for potential recovery');

    await conn.commit();
    console.log(`Product ${req.params.id} deleted successfully`);
    res.json({ ok: true, message: 'Produk berhasil dihapus' });

  } catch (e) {
    try { await conn.rollback(); } catch { }
    console.error('Error deleting product:', e);

    // Provide more specific error messages
    let errorMessage = 'Terjadi kesalahan saat menghapus produk';
    if (e.code === 'ER_ROW_IS_REFERENCED_2') {
      errorMessage = 'Tidak dapat menghapus produk karena masih ada data terkait di sistem';
    } else if (e.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Tabel database tidak ditemukan';
    }

    res.status(500).json({
      error: 'internal_error',
      message: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  } finally {
    conn.release();
  }
});

// Penjual: Get sales report
router.get('/penjual/laporan', requireAuth, requireRole(['penjual']), async (req, res) => {
  const conn = await pool.getConnection();
  const { month, year, from, to } = req.query;
  
  try {
    // Build date condition
    let dateCondition = '';
    const dateParams = [];
    
    if (month && year) {
      dateCondition = 'AND MONTH(ps.created_at) = ? AND YEAR(ps.created_at) = ?';
      dateParams.push(parseInt(month), parseInt(year));
    } else if (year) {
      dateCondition = 'AND YEAR(ps.created_at) = ?';
      dateParams.push(parseInt(year));
    } else if (from && to) {
      dateCondition = 'AND DATE(ps.created_at) >= ? AND DATE(ps.created_at) <= ?';
      dateParams.push(from, to);
    } else if (from) {
      dateCondition = 'AND DATE(ps.created_at) >= ?';
      dateParams.push(from);
    } else if (to) {
      dateCondition = 'AND DATE(ps.created_at) <= ?';
      dateParams.push(to);
    }
    
    // Get sales summary per product with date filter (including HPP/modal)
    const [productSales] = await conn.query(`
      SELECT 
        p.produk_id, p.nama_produk, p.harga, p.harga_modal, p.stok, p.photo_url,
        COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN pi.jumlah ELSE 0 END), 0) as total_terjual,
        COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN pi.subtotal ELSE 0 END), 0) as total_pendapatan,
        COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN (COALESCE(p.harga_modal, 0) * pi.jumlah) ELSE 0 END), 0) as total_modal,
        COUNT(DISTINCT CASE WHEN ps.status_pesanan = 'selesai' THEN ps.pesanan_id END) as jumlah_transaksi,
        COALESCE(AVG(u.rating), 0) as avg_rating,
        COUNT(u.ulasan_id) as total_ulasan
      FROM produk p
      LEFT JOIN pesanan_item pi ON pi.produk_id = p.produk_id
      LEFT JOIN pesanan ps ON ps.pesanan_id = pi.pesanan_id
      LEFT JOIN ulasan u ON u.produk_id = p.produk_id AND u.status = 'aktif'
      WHERE p.penjual_id = ? AND p.deleted_at IS NULL ${dateCondition}
      GROUP BY p.produk_id
      ORDER BY total_pendapatan DESC
    `, [req.user.id, ...dateParams]);

    // Calculate overall stats with profit/loss
    const totalPendapatan = productSales.reduce((sum, p) => sum + Number(p.total_pendapatan || 0), 0);
    const totalModal = productSales.reduce((sum, p) => sum + Number(p.total_modal || 0), 0);
    const totalTerjual = productSales.reduce((sum, p) => sum + Number(p.total_terjual || 0), 0);
    const totalTransaksi = productSales.reduce((sum, p) => sum + Number(p.jumlah_transaksi || 0), 0);
    const labaKotor = totalPendapatan - totalModal;
    const marginPersen = totalPendapatan > 0 ? ((labaKotor / totalPendapatan) * 100).toFixed(1) : 0;

    const overallStats = {
      total_pendapatan: totalPendapatan,
      total_modal: totalModal,
      laba_kotor: labaKotor,
      margin_persen: marginPersen,
      total_terjual: totalTerjual,
      total_transaksi: totalTransaksi
    };

    // Get monthly sales with profit/loss
    let monthlyQuery = `
      SELECT 
        DATE_FORMAT(ps.created_at, '%Y-%m') as bulan,
        SUM(pi.subtotal) as pendapatan,
        SUM(COALESCE(p.harga_modal, 0) * pi.jumlah) as modal,
        SUM(pi.jumlah) as jumlah_terjual,
        COUNT(DISTINCT ps.pesanan_id) as jumlah_transaksi
      FROM pesanan_item pi
      JOIN pesanan ps ON ps.pesanan_id = pi.pesanan_id
      JOIN produk p ON p.produk_id = pi.produk_id
      WHERE p.penjual_id = ? 
        AND ps.status_pesanan = 'selesai'
    `;
    
    if (year && !month) {
      monthlyQuery += ' AND YEAR(ps.created_at) = ?';
    } else if (!dateCondition) {
      monthlyQuery += ' AND ps.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)';
    }
    
    monthlyQuery += `
      GROUP BY DATE_FORMAT(ps.created_at, '%Y-%m')
      ORDER BY bulan DESC
    `;
    
    const monthlyParams = year && !month ? [req.user.id, parseInt(year)] : [req.user.id];
    const [monthlySales] = await conn.query(monthlyQuery, monthlyParams);
    
    // Add laba calculation to monthly
    const monthlyWithProfit = monthlySales.map(m => ({
      ...m,
      laba: Number(m.pendapatan || 0) - Number(m.modal || 0)
    }));

    // Get average rating for seller
    const [sellerRating] = await conn.query(`
      SELECT 
        COALESCE(AVG(u.rating), 0) as avg_rating,
        COUNT(u.ulasan_id) as total_ulasan
      FROM ulasan u
      JOIN produk p ON p.produk_id = u.produk_id
      WHERE p.penjual_id = ? AND u.status = 'aktif'
    `, [req.user.id]);
    
    // Get daily sales with profit/loss
    const [dailySales] = await conn.query(`
      SELECT 
        DATE(ps.created_at) as tanggal,
        SUM(pi.subtotal) as pendapatan,
        SUM(COALESCE(p.harga_modal, 0) * pi.jumlah) as modal,
        SUM(pi.jumlah) as jumlah_terjual,
        COUNT(DISTINCT ps.pesanan_id) as jumlah_transaksi
      FROM pesanan_item pi
      JOIN pesanan ps ON ps.pesanan_id = pi.pesanan_id
      JOIN produk p ON p.produk_id = pi.produk_id
      WHERE p.penjual_id = ? 
        AND ps.status_pesanan = 'selesai'
        ${dateCondition}
      GROUP BY DATE(ps.created_at)
      ORDER BY tanggal DESC
      LIMIT 31
    `, [req.user.id, ...dateParams]);
    
    // Add laba calculation to daily
    const dailyWithProfit = dailySales.map(d => ({
      ...d,
      laba: Number(d.pendapatan || 0) - Number(d.modal || 0)
    }));
    
    // Get available years for filter
    const [availableYears] = await conn.query(`
      SELECT DISTINCT YEAR(ps.created_at) as tahun
      FROM pesanan ps
      JOIN pesanan_item pi ON pi.pesanan_id = ps.pesanan_id
      JOIN produk p ON p.produk_id = pi.produk_id
      WHERE p.penjual_id = ? AND ps.status_pesanan = 'selesai'
      ORDER BY tahun DESC
    `, [req.user.id]);
    
    // Add profit calculation to products
    const productsWithProfit = productSales.map(p => ({
      ...p,
      laba: Number(p.total_pendapatan || 0) - Number(p.total_modal || 0),
      margin_persen: Number(p.total_pendapatan) > 0 
        ? (((Number(p.total_pendapatan) - Number(p.total_modal)) / Number(p.total_pendapatan)) * 100).toFixed(1)
        : 0
    }));

    res.json({
      products: productsWithProfit,
      overall: overallStats,
      monthly: monthlyWithProfit,
      daily: dailyWithProfit,
      rating: sellerRating[0],
      availableYears: availableYears.map(y => y.tahun),
      period: { month, year, from, to }
    });
  } finally {
    conn.release();
  }
});

// Get product reviews for seller
router.get('/penjual/ulasan', requireAuth, requireRole(['penjual']), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [reviews] = await conn.query(`
      SELECT 
        u.ulasan_id, u.rating, u.komentar, u.dibuat_pada,
        p.produk_id, p.nama_produk, p.photo_url,
        usr.nama as pembeli_nama
      FROM ulasan u
      JOIN produk p ON p.produk_id = u.produk_id
      JOIN user usr ON usr.user_id = u.pembeli_id
      WHERE p.penjual_id = ? AND u.status = 'aktif'
      ORDER BY u.dibuat_pada DESC
    `, [req.user.id]);
    res.json(reviews);
  } finally {
    conn.release();
  }
});

// Public: Get reviews for a product
router.get('/products/:id/reviews', [
  param('id').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const conn = await pool.getConnection();
  try {
    // Check if balasan columns exist
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ulasan' 
      AND COLUMN_NAME IN ('balasan_admin', 'tanggal_balasan', 'admin_id')
    `);
    const existingCols = cols.map(c => c.COLUMN_NAME);
    const hasBalasan = existingCols.includes('balasan_admin');

    let reviews;
    if (hasBalasan) {
      [reviews] = await conn.query(`
        SELECT 
          u.ulasan_id, u.rating, u.komentar, u.dibuat_pada as tanggal,
          u.balasan_admin, u.tanggal_balasan,
          usr.nama as pembeli_nama, usr.avatar_url as pembeli_avatar,
          adm.nama as admin_nama
        FROM ulasan u
        JOIN user usr ON usr.user_id = u.pembeli_id
        LEFT JOIN user adm ON adm.user_id = u.admin_id
        WHERE u.produk_id = ? AND u.status = 'aktif'
        ORDER BY u.dibuat_pada DESC
      `, [req.params.id]);
    } else {
      [reviews] = await conn.query(`
        SELECT 
          u.ulasan_id, u.rating, u.komentar, u.dibuat_pada as tanggal,
          NULL as balasan_admin, NULL as tanggal_balasan,
          usr.nama as pembeli_nama, usr.avatar_url as pembeli_avatar,
          NULL as admin_nama
        FROM ulasan u
        JOIN user usr ON usr.user_id = u.pembeli_id
        WHERE u.produk_id = ? AND u.status = 'aktif'
        ORDER BY u.dibuat_pada DESC
      `, [req.params.id]);
    }

    // Get average rating
    const [avgRating] = await conn.query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
      FROM ulasan WHERE produk_id = ? AND status = 'aktif'
    `, [req.params.id]);

    res.json({
      reviews,
      avg_rating: avgRating[0].avg_rating || 0,
      total_reviews: avgRating[0].total_reviews || 0
    });
  } catch (e) {
    console.error('Error loading reviews:', e);
    res.status(500).json({ error: 'internal_error', message: e.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
