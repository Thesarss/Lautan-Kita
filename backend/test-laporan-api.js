require('dotenv').config();
const mysql = require('mysql2/promise');

async function testLaporan() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'toko_online'
    });

    // Simulate the exact query from the endpoint for penjual ID 1
    const penjualId = 1; // seller.test@example.com

    console.log(`Testing laporan for penjual_id: ${penjualId}\n`);

    const [productSales] = await conn.query(`
      SELECT 
        p.produk_id, p.nama_produk, p.harga, p.stok,
        COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN pi.jumlah ELSE 0 END), 0) as total_terjual,
        COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN pi.subtotal ELSE 0 END), 0) as total_pendapatan,
        COUNT(DISTINCT CASE WHEN ps.status_pesanan = 'selesai' THEN ps.pesanan_id END) as jumlah_transaksi
      FROM produk p
      LEFT JOIN pesanan_item pi ON pi.produk_id = p.produk_id
      LEFT JOIN pesanan ps ON ps.pesanan_id = pi.pesanan_id
      WHERE p.penjual_id = ? AND p.deleted_at IS NULL
      GROUP BY p.produk_id
      ORDER BY total_pendapatan DESC
    `, [penjualId]);

    console.log('Product Sales:');
    productSales.forEach(p => {
        console.log(`  ${p.nama_produk}: Terjual ${p.total_terjual}, Pendapatan Rp ${p.total_pendapatan}`);
    });

    // Calculate totals
    const totalPendapatan = productSales.reduce((sum, p) => sum + Number(p.total_pendapatan || 0), 0);
    const totalTerjual = productSales.reduce((sum, p) => sum + Number(p.total_terjual || 0), 0);
    const totalTransaksi = productSales.reduce((sum, p) => sum + Number(p.jumlah_transaksi || 0), 0);

    console.log('\n=== TOTALS ===');
    console.log(`Total Pendapatan: Rp ${totalPendapatan.toLocaleString()}`);
    console.log(`Total Terjual: ${totalTerjual} unit`);
    console.log(`Total Transaksi: ${totalTransaksi}`);

    await conn.end();
}

testLaporan();
