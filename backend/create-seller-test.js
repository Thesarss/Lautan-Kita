/**
 * Script untuk membuat/update penjual user dengan password yang diketahui
 * Password: penjual123
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createSeller() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toko_online'
  });

  try {
    const email = 'penjual1@test.com';
    const password = 'penjual123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if seller exists
    const [existing] = await conn.query("SELECT user_id, nama FROM user WHERE email = ?", [email]);
    
    if (existing.length > 0) {
      // Update password
      await conn.query("UPDATE user SET password_hash = ?, verified = 1 WHERE email = ?", [passwordHash, email]);
      console.log(`✅ Password penjual "${existing[0].nama}" updated!`);
    } else {
      // Create new seller
      await conn.query(
        "INSERT INTO user (nama, email, password_hash, role, verified) VALUES (?, ?, ?, 'penjual', 1)",
        ['Toko Ikan Segar', email, passwordHash]
      );
      console.log('✅ Penjual user created!');
    }

    // Show seller's products and sales
    const [seller] = await conn.query("SELECT user_id FROM user WHERE email = ?", [email]);
    const sellerId = seller[0].user_id;

    const [products] = await conn.query("SELECT produk_id, nama_produk, harga, stok FROM produk WHERE penjual_id = ?", [sellerId]);
    console.log(`\n📦 Produk penjual (${products.length} produk):`);
    products.forEach(p => console.log(`   - ${p.nama_produk} (Rp ${Number(p.harga).toLocaleString('id-ID')}) - Stok: ${p.stok}`));

    // Check sales data
    const [sales] = await conn.query(`
      SELECT 
        COUNT(DISTINCT ps.pesanan_id) as total_transaksi,
        COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN pi.subtotal ELSE 0 END), 0) as total_pendapatan,
        COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN pi.jumlah ELSE 0 END), 0) as total_terjual
      FROM produk p
      LEFT JOIN pesanan_item pi ON pi.produk_id = p.produk_id
      LEFT JOIN pesanan ps ON ps.pesanan_id = pi.pesanan_id
      WHERE p.penjual_id = ?
    `, [sellerId]);
    
    console.log(`\n📊 Ringkasan Penjualan:`);
    console.log(`   Total Transaksi: ${sales[0].total_transaksi}`);
    console.log(`   Total Terjual: ${sales[0].total_terjual} unit`);
    console.log(`   Total Pendapatan: Rp ${Number(sales[0].total_pendapatan).toLocaleString('id-ID')}`);

    console.log('\n========================================');
    console.log('📧 Email: penjual1@test.com');
    console.log('🔑 Password: penjual123');
    console.log('========================================');
    console.log('\nSilakan login di halaman login, lalu buka Dashboard Penjual');
    console.log('dan klik tab "Laporan Penjualan" untuk melihat laporan.');

  } finally {
    await conn.end();
  }
}

createSeller().catch(console.error);
