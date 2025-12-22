/**
 * Script untuk memasukkan data dummy ke database
 * Menggunakan user yang sudah ada (1 per role)
 * Jalankan: node seed-dummy-data.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toko_online'
};

async function seedData() {
    const conn = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    try {
        // =====================
        // 1. GET EXISTING USERS (1 per role)
        // =====================
        console.log('\n--- Getting Existing Users ---');

        const [admins] = await conn.query("SELECT user_id, nama, email FROM user WHERE role = 'admin' LIMIT 1");
        const [penjuals] = await conn.query("SELECT user_id, nama, email FROM user WHERE role = 'penjual' LIMIT 1");
        const [pembelis] = await conn.query("SELECT user_id, nama, email FROM user WHERE role = 'pembeli' LIMIT 1");
        const [kurirs] = await conn.query("SELECT user_id, nama, email FROM user WHERE role = 'kurir' LIMIT 1");

        if (!penjuals.length) {
            console.log('ERROR: Tidak ada user penjual. Buat akun penjual dulu.');
            return;
        }
        if (!pembelis.length) {
            console.log('ERROR: Tidak ada user pembeli. Buat akun pembeli dulu.');
            return;
        }

        const admin = admins[0] || null;
        const penjual = penjuals[0];
        const pembeli = pembelis[0];
        const kurir = kurirs[0] || null;

        console.log(`  Admin: ${admin ? admin.email : 'Tidak ada'}`);
        console.log(`  Penjual: ${penjual.email}`);
        console.log(`  Pembeli: ${pembeli.email}`);
        console.log(`  Kurir: ${kurir ? kurir.email : 'Tidak ada'}`);

        // =====================
        // 2. SEED PRODUCTS (untuk penjual yang ada)
        // =====================
        console.log('\n--- Seeding Products ---');

        const products = [
            { nama: 'Ikan Tongkol Segar', harga: 45000, stok: 50, deskripsi: 'Ikan tongkol segar hasil tangkapan pagi hari. Cocok untuk gulai, balado, atau digoreng.', kategori: 'ikan' },
            { nama: 'Ikan Kakap Merah', harga: 85000, stok: 30, deskripsi: 'Ikan kakap merah premium, daging tebal dan segar. Ideal untuk steam atau bakar.', kategori: 'ikan' },
            { nama: 'Udang Galah', harga: 120000, stok: 25, deskripsi: 'Udang galah ukuran jumbo, segar dari tambak. Cocok untuk sate udang atau udang bakar.', kategori: 'udang' },
            { nama: 'Cumi-cumi Segar', harga: 65000, stok: 40, deskripsi: 'Cumi-cumi segar ukuran sedang, sudah dibersihkan. Siap masak untuk cumi goreng tepung.', kategori: 'cumi' },
            { nama: 'Kepiting Bakau', harga: 150000, stok: 15, deskripsi: 'Kepiting bakau hidup, ukuran besar. Cocok untuk kepiting saus padang atau lada hitam.', kategori: 'kerang' },
            { nama: 'Ikan Tenggiri', harga: 75000, stok: 35, deskripsi: 'Ikan tenggiri segar, cocok untuk otak-otak, pempek, atau digoreng.', kategori: 'ikan' },
            { nama: 'Kerang Hijau', harga: 35000, stok: 60, deskripsi: 'Kerang hijau segar, sudah dicuci bersih. Cocok untuk kerang saus padang.', kategori: 'kerang' },
        ];

        const [existingProducts] = await conn.query('SELECT nama_produk FROM produk WHERE penjual_id = ?', [penjual.user_id]);
        const existingProductNames = existingProducts.map(p => p.nama_produk);

        for (const prod of products) {
            if (!existingProductNames.includes(prod.nama)) {
                await conn.query(
                    'INSERT INTO produk (penjual_id, nama_produk, harga, stok, deskripsi, kategori, status) VALUES (?, ?, ?, ?, ?, ?, "aktif")',
                    [penjual.user_id, prod.nama, prod.harga, prod.stok, prod.deskripsi, prod.kategori]
                );
                console.log(`  Created: ${prod.nama} - Rp ${prod.harga.toLocaleString()}`);
            } else {
                console.log(`  Exists: ${prod.nama}`);
            }
        }

        // Get all products from this seller
        const [allProducts] = await conn.query(
            'SELECT produk_id, nama_produk, harga FROM produk WHERE penjual_id = ? AND status = "aktif"',
            [penjual.user_id]
        );

        if (allProducts.length === 0) {
            console.log('ERROR: Tidak ada produk. Seed produk gagal.');
            return;
        }

        // =====================
        // 3. SEED ORDERS
        // =====================
        console.log('\n--- Seeding Orders ---');

        const orderConfigs = [
            { status: 'selesai', productIndices: [0, 1], quantities: [2, 1] },
            { status: 'selesai', productIndices: [2], quantities: [1] },
            { status: 'selesai', productIndices: [3, 4], quantities: [2, 1] },
            { status: 'dikirim', productIndices: [5], quantities: [2] },
            { status: 'dikemas', productIndices: [6], quantities: [3] },
            { status: 'pending', productIndices: [0, 2], quantities: [1, 1] },
        ];

        const createdOrders = [];
        for (const config of orderConfigs) {
            let total = 0;
            const items = [];

            for (let i = 0; i < config.productIndices.length; i++) {
                const prodIdx = config.productIndices[i];
                if (prodIdx < allProducts.length) {
                    const prod = allProducts[prodIdx];
                    const qty = config.quantities[i];
                    const subtotal = prod.harga * qty;
                    total += subtotal;
                    items.push({ produk_id: prod.produk_id, harga: prod.harga, jumlah: qty, subtotal });
                }
            }

            if (items.length === 0) continue;

            // Create order
            const [orderResult] = await conn.query(
                `INSERT INTO pesanan (pembeli_id, alamat_kirim, total_harga, status_pesanan, kurir_id, 
                 tanggal_dikemas, tanggal_dikirim, tanggal_selesai) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    pembeli.user_id,
                    'Alamat pengiriman pembeli',
                    total,
                    config.status,
                    (config.status === 'dikirim' && kurir) ? kurir.user_id : null,
                    ['dikemas', 'dikirim', 'selesai'].includes(config.status) ? new Date() : null,
                    ['dikirim', 'selesai'].includes(config.status) ? new Date() : null,
                    config.status === 'selesai' ? new Date() : null
                ]
            );
            const orderId = orderResult.insertId;

            // Create order items
            for (const item of items) {
                await conn.query(
                    'INSERT INTO pesanan_item (pesanan_id, produk_id, harga_saat_beli, jumlah, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [orderId, item.produk_id, item.harga, item.jumlah, item.subtotal]
                );
            }

            // Create payment for processed orders
            if (['selesai', 'dikirim', 'dikemas'].includes(config.status)) {
                await conn.query(
                    'INSERT INTO pembayaran (pesanan_id, metode, status_pembayaran, paid_at) VALUES (?, ?, ?, NOW())',
                    [orderId, ['BCA', 'BNI', 'Mandiri'][Math.floor(Math.random() * 3)], 'sudah_dibayar']
                );
            }

            createdOrders.push({ orderId, status: config.status, items });
            console.log(`  Created order #${orderId}: ${config.status} - Rp ${total.toLocaleString()}`);
        }

        // =====================
        // 4. SEED REVIEWS (untuk pesanan selesai)
        // =====================
        console.log('\n--- Seeding Reviews ---');

        const reviews = [
            { rating: 5, komentar: 'Ikan sangat segar! Pengiriman cepat dan packaging rapi. Recommended seller!' },
            { rating: 4, komentar: 'Kualitas bagus, harga terjangkau. Akan order lagi.' },
            { rating: 5, komentar: 'Produk sesuai deskripsi, puas dengan pelayanannya.' },
            { rating: 4, komentar: 'Segar dan enak, pengiriman tepat waktu.' },
            { rating: 5, komentar: 'Langganan di sini, selalu fresh dan harga bersaing.' },
        ];

        // Get pesanan_item for completed orders
        const [completedItems] = await conn.query(`
            SELECT pi.pesanan_item_id, pi.produk_id, p.pembeli_id
            FROM pesanan_item pi
            JOIN pesanan p ON p.pesanan_id = pi.pesanan_id
            WHERE p.status_pesanan = 'selesai' AND p.pembeli_id = ?
        `, [pembeli.user_id]);

        let reviewIdx = 0;
        for (const item of completedItems) {
            if (reviewIdx >= reviews.length) break;

            // Check if review already exists
            const [existingReview] = await conn.query(
                'SELECT ulasan_id FROM ulasan WHERE pesanan_item_id = ?',
                [item.pesanan_item_id]
            );

            if (!existingReview.length) {
                const review = reviews[reviewIdx];
                await conn.query(
                    'INSERT INTO ulasan (produk_id, pembeli_id, pesanan_item_id, rating, komentar, status) VALUES (?, ?, ?, ?, ?, "aktif")',
                    [item.produk_id, item.pembeli_id, item.pesanan_item_id, review.rating, review.komentar]
                );
                console.log(`  Created review: ${review.rating} stars`);
                reviewIdx++;
            }
        }

        // =====================
        // 5. SUMMARY
        // =====================
        console.log('\n========================================');
        console.log('SEED DATA COMPLETED!');
        console.log('========================================');

        const [productCount] = await conn.query('SELECT COUNT(*) as count FROM produk WHERE penjual_id = ?', [penjual.user_id]);
        const [orderCount] = await conn.query('SELECT COUNT(*) as count FROM pesanan WHERE pembeli_id = ?', [pembeli.user_id]);
        const [reviewCount] = await conn.query('SELECT COUNT(*) as count FROM ulasan WHERE pembeli_id = ?', [pembeli.user_id]);

        console.log(`\nPenjual (${penjual.email}):`);
        console.log(`  - Products: ${productCount[0].count}`);

        console.log(`\nPembeli (${pembeli.email}):`);
        console.log(`  - Orders: ${orderCount[0].count}`);
        console.log(`  - Reviews: ${reviewCount[0].count}`);

        if (kurir) {
            const [deliveryCount] = await conn.query('SELECT COUNT(*) as count FROM pesanan WHERE kurir_id = ?', [kurir.user_id]);
            console.log(`\nKurir (${kurir.email}):`);
            console.log(`  - Deliveries: ${deliveryCount[0].count}`);
        }

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await conn.end();
        console.log('\nDatabase connection closed');
    }
}

seedData();
