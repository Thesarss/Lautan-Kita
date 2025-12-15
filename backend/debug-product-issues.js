// Debug script for product deletion and editing issues
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toko_online',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function debugProductIssues() {
  console.log('🔍 Debugging Product Issues...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. Check all order statuses in database
    console.log('1. Checking order statuses in database:');
    const [statuses] = await conn.query('SELECT DISTINCT status_pesanan FROM pesanan ORDER BY status_pesanan');
    console.log('   Found statuses:', statuses.map(s => s.status_pesanan));
    
    // 2. Check products with pending orders
    console.log('\n2. Checking products with pending orders:');
    const [productsWithOrders] = await conn.query(`
      SELECT 
        p.produk_id, 
        p.nama_produk,
        COUNT(DISTINCT pi.pesanan_id) as total_orders,
        COUNT(DISTINCT CASE WHEN pe.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim') THEN pi.pesanan_id END) as pending_orders
      FROM produk p
      LEFT JOIN pesanan_item pi ON pi.produk_id = p.produk_id
      LEFT JOIN pesanan pe ON pe.pesanan_id = pi.pesanan_id
      GROUP BY p.produk_id, p.nama_produk
      HAVING total_orders > 0
      ORDER BY pending_orders DESC, total_orders DESC
      LIMIT 10
    `);
    
    if (productsWithOrders.length === 0) {
      console.log('   No products found with orders');
    } else {
      console.log('   Products with orders:');
      productsWithOrders.forEach(product => {
        console.log(`   - ${product.nama_produk} (ID: ${product.produk_id}): ${product.total_orders} total, ${product.pending_orders} pending`);
      });
    }
    
    // 3. Check recent orders
    console.log('\n3. Recent orders:');
    const [recentOrders] = await conn.query(`
      SELECT pesanan_id, status_pesanan, created_at 
      FROM pesanan 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (recentOrders.length === 0) {
      console.log('   No orders found');
    } else {
      recentOrders.forEach(order => {
        console.log(`   - Order #${order.pesanan_id}: ${order.status_pesanan} (${order.created_at})`);
      });
    }
    
    // 4. Check products without orders (can be deleted)
    console.log('\n4. Products that can be deleted (no pending orders):');
    const [deletableProducts] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.penjual_id
      FROM produk p
      WHERE p.produk_id NOT IN (
        SELECT DISTINCT pi.produk_id 
        FROM pesanan_item pi 
        JOIN pesanan pe ON pe.pesanan_id = pi.pesanan_id 
        WHERE pe.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim')
      )
      LIMIT 5
    `);
    
    if (deletableProducts.length === 0) {
      console.log('   All products have pending orders');
    } else {
      deletableProducts.forEach(product => {
        console.log(`   - ${product.nama_produk} (ID: ${product.produk_id}, Seller: ${product.penjual_id})`);
      });
    }
    
  } finally {
    conn.release();
  }
  
  console.log('\n✅ Debug complete!');
  console.log('\nTips:');
  console.log('- If no products can be deleted, create a test order and mark it as "selesai"');
  console.log('- Check that order statuses match what the deletion query expects');
  console.log('- For editing issues, check browser console for validation errors');
  
  process.exit(0);
}

debugProductIssues().catch(console.error);