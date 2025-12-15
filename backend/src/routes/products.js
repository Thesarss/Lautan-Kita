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
  body('nama_produk').isString().isLength({ min: 2 }).trim(),
  body('kategori').optional().isString().trim(),
  body('deskripsi').optional().isString().isLength({ max: 2000 }).trim(),
  body('harga').isFloat({ gt: 0 }),
  body('satuan').optional().isString().trim(),
  body('stok').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['aktif', 'nonaktif']),
  body('kategori_id').optional({ nullable: true }).isInt({ min: 1 }),
  body('image').optional().isString().isLength({ min: 30 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'validation_error', details: errors.array() });
  const { nama_produk, kategori, deskripsi, harga, satuan, stok, status, kategori_id, image } = req.body;
  const conn = await pool.getConnection();
  try {
    const [ins] = await conn.query(
      'INSERT INTO produk (penjual_id,kategori_id,nama_produk,kategori,deskripsi,harga,satuan,stok,status) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.user.id, kategori_id || null, nama_produk, kategori || null, deskripsi || null, harga, satuan || 'kg', stok || 0, status || 'aktif']
    );
    const produkId = ins.insertId;
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
    res.status(201).json({ produk_id: produkId, photo_url: photoUrl });
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

module.exports = router;
