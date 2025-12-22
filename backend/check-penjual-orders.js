require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    const c = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'toko_online'
    });

    // Check which seller is logged in (ID 1)
    const [seller] = await c.query('SELECT user_id, email FROM user WHERE user_id = 1');
    console.log('Penjual ID 1:', seller[0]?.email);

    // Check completed orders for seller 1
    const [orders] = await c.query(`
        SELECT ps.pesanan_id, ps.status_pesanan, pr.penjual_id, pi.subtotal, pr.nama_produk
        FROM pesanan ps 
        JOIN pesanan_item pi ON pi.pesanan_id = ps.pesanan_id 
        JOIN produk pr ON pr.produk_id = pi.produk_id
        WHERE pr.penjual_id = 1 AND ps.status_pesanan = 'selesai'
    `);

    console.log('\nPesanan selesai untuk penjual 1:');
    if (orders.length === 0) {
        console.log('  TIDAK ADA!');
    } else {
        orders.forEach(o => console.log(`  Order #${o.pesanan_id}: ${o.nama_produk} - Rp ${o.subtotal}`));
    }

    // Check all orders for seller 1 products
    const [allOrders] = await c.query(`
        SELECT ps.pesanan_id, ps.status_pesanan, pi.subtotal, pr.nama_produk
        FROM pesanan ps 
        JOIN pesanan_item pi ON pi.pesanan_id = ps.pesanan_id 
        JOIN produk pr ON pr.produk_id = pi.produk_id
        WHERE pr.penjual_id = 1
    `);

    console.log('\nSemua pesanan untuk produk penjual 1:');
    allOrders.forEach(o => console.log(`  Order #${o.pesanan_id} [${o.status_pesanan || 'KOSONG'}]: ${o.nama_produk} - Rp ${o.subtotal}`));

    await c.end();
})();
