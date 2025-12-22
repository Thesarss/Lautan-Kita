require('dotenv').config();
const mysql = require('mysql2/promise');

async function debug() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'toko_online'
    });

    console.log('=== DEBUG LAPORAN PENJUALAN ===\n');

    // 1. Cek penjual
    const [penjuals] = await conn.query("SELECT user_id, email FROM user WHERE role = 'penjual'");
    console.log('Penjual:');
    penjuals.forEach(p => console.log(`  ID: ${p.user_id}, Email: ${p.email}`));

    // 2. Cek produk per penjual
    console.log('\nProduk per penjual:');
    for (const penjual of penjuals) {
        const [products] = await conn.query('SELECT produk_id, nama_produk FROM produk WHERE penjual_id = ?', [penjual.user_id]);
        console.log(`  ${penjual.email}: ${products.length} produk`);
    }

    // 3. Cek pesanan selesai
    const [orders] = await conn.query(`
        SELECT p.pesanan_id, p.status_pesanan, p.total_harga, 
               pi.produk_id, pr.nama_produk, pr.penjual_id, pi.subtotal
        FROM pesanan p 
        JOIN pesanan_item pi ON pi.pesanan_id = p.pesanan_id 
        JOIN produk pr ON pr.produk_id = pi.produk_id 
        WHERE p.status_pesanan = 'selesai'
    `);
    console.log('\nPesanan selesai dengan detail:');
    orders.forEach(o => console.log(`  Order #${o.pesanan_id}: ${o.nama_produk} (penjual_id: ${o.penjual_id}) - Rp ${o.subtotal}`));

    // 4. Cek total per penjual
    console.log('\nTotal pendapatan per penjual (pesanan selesai):');
    for (const penjual of penjuals) {
        const [result] = await conn.query(`
            SELECT COALESCE(SUM(pi.subtotal), 0) as total
            FROM pesanan_item pi
            JOIN pesanan ps ON ps.pesanan_id = pi.pesanan_id
            JOIN produk p ON p.produk_id = pi.produk_id
            WHERE p.penjual_id = ? AND ps.status_pesanan = 'selesai'
        `, [penjual.user_id]);
        console.log(`  ${penjual.email}: Rp ${result[0].total}`);
    }

    await conn.end();
}

debug();
