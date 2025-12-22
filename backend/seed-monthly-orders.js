/**
 * Script untuk membuat pesanan tersebar di beberapa bulan
 * Jalankan: node seed-monthly-orders.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toko_online'
};

async function seedMonthlyOrders() {
    const conn = await mysql.createConnection(dbConfig);
    console.log('Connected to database\n');

    try {
        // Get penjual 1's products
        const [products] = await conn.query(`
            SELECT produk_id, nama_produk, harga, harga_modal 
            FROM produk WHERE penjual_id = 1 AND deleted_at IS NULL
            LIMIT 6
        `);
        console.log(`Found ${products.length} products for penjual 1\n`);

        // Get pembeli
        const [pembelis] = await conn.query("SELECT user_id FROM user WHERE role = 'pembeli' LIMIT 1");
        if (!pembelis.length) {
            console.log('No pembeli found!');
            return;
        }
        const pembeliId = pembelis[0].user_id;

        // Define months to create orders (last 6 months)
        const months = [
            { month: 7, year: 2024, label: 'Juli 2024' },
            { month: 8, year: 2024, label: 'Agustus 2024' },
            { month: 9, year: 2024, label: 'September 2024' },
            { month: 10, year: 2024, label: 'Oktober 2024' },
            { month: 11, year: 2024, label: 'November 2024' },
            { month: 12, year: 2024, label: 'Desember 2024' }
        ];

        console.log('Creating orders for each month...\n');

        for (const m of months) {
            // Create 2-4 orders per month
            const orderCount = 2 + Math.floor(Math.random() * 3);
            let monthTotal = 0;
            let monthModal = 0;

            for (let i = 0; i < orderCount; i++) {
                // Random day in the month
                const day = 1 + Math.floor(Math.random() * 28);
                const orderDate = `${m.year}-${String(m.month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${10 + Math.floor(Math.random() * 10)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`;

                // Pick 1-3 random products
                const itemCount = 1 + Math.floor(Math.random() * 3);
                const selectedProducts = [];
                const usedIds = new Set();

                for (let j = 0; j < itemCount && j < products.length; j++) {
                    let prod;
                    do {
                        prod = products[Math.floor(Math.random() * products.length)];
                    } while (usedIds.has(prod.produk_id) && usedIds.size < products.length);

                    if (!usedIds.has(prod.produk_id)) {
                        usedIds.add(prod.produk_id);
                        selectedProducts.push({
                            ...prod,
                            jumlah: 1 + Math.floor(Math.random() * 3)
                        });
                    }
                }

                // Calculate total
                let totalHarga = 0;
                let totalModal = 0;
                for (const p of selectedProducts) {
                    totalHarga += p.harga * p.jumlah;
                    totalModal += (p.harga_modal || p.harga * 0.7) * p.jumlah;
                }

                // Create order
                const [orderResult] = await conn.query(`
                    INSERT INTO pesanan (pembeli_id, total_harga, status_pesanan, created_at)
                    VALUES (?, ?, 'selesai', ?)
                `, [pembeliId, totalHarga, orderDate]);

                const pesananId = orderResult.insertId;

                // Create order items
                for (const p of selectedProducts) {
                    await conn.query(`
                        INSERT INTO pesanan_item (pesanan_id, produk_id, jumlah, harga_saat_beli, subtotal)
                        VALUES (?, ?, ?, ?, ?)
                    `, [pesananId, p.produk_id, p.jumlah, p.harga, p.harga * p.jumlah]);
                }

                monthTotal += totalHarga;
                monthModal += totalModal;
            }

            const laba = monthTotal - monthModal;
            console.log(`${m.label}: ${orderCount} pesanan | Pendapatan: Rp ${monthTotal.toLocaleString()} | Modal: Rp ${Math.round(monthModal).toLocaleString()} | Laba: Rp ${Math.round(laba).toLocaleString()}`);
        }

        // Show summary
        console.log('\n========================================');
        console.log('RINGKASAN LAPORAN PER BULAN');
        console.log('========================================\n');

        const [monthlySummary] = await conn.query(`
            SELECT 
                DATE_FORMAT(ps.created_at, '%Y-%m') as bulan,
                DATE_FORMAT(ps.created_at, '%M %Y') as bulan_label,
                COUNT(DISTINCT ps.pesanan_id) as jumlah_pesanan,
                SUM(pi.subtotal) as pendapatan,
                SUM(COALESCE(p.harga_modal, 0) * pi.jumlah) as modal
            FROM pesanan ps
            JOIN pesanan_item pi ON pi.pesanan_id = ps.pesanan_id
            JOIN produk p ON p.produk_id = pi.produk_id
            WHERE p.penjual_id = 1 AND ps.status_pesanan = 'selesai'
            GROUP BY DATE_FORMAT(ps.created_at, '%Y-%m')
            ORDER BY bulan
        `);

        let grandTotal = 0;
        let grandModal = 0;

        console.log('Bulan'.padEnd(20) + 'Pesanan'.padStart(10) + 'Pendapatan'.padStart(15) + 'Modal'.padStart(15) + 'Laba'.padStart(15));
        console.log('─'.repeat(75));

        for (const row of monthlySummary) {
            const pendapatan = Number(row.pendapatan);
            const modal = Number(row.modal);
            const laba = pendapatan - modal;
            grandTotal += pendapatan;
            grandModal += modal;

            console.log(
                row.bulan.padEnd(20) +
                String(row.jumlah_pesanan).padStart(10) +
                `Rp ${pendapatan.toLocaleString()}`.padStart(15) +
                `Rp ${modal.toLocaleString()}`.padStart(15) +
                `Rp ${laba.toLocaleString()}`.padStart(15)
            );
        }

        console.log('─'.repeat(75));
        console.log(
            'TOTAL'.padEnd(20) +
            ''.padStart(10) +
            `Rp ${grandTotal.toLocaleString()}`.padStart(15) +
            `Rp ${grandModal.toLocaleString()}`.padStart(15) +
            `Rp ${(grandTotal - grandModal).toLocaleString()}`.padStart(15)
        );

        console.log('\n✓ Data pesanan tersebar ke beberapa bulan');
        console.log('✓ Sekarang bisa filter laporan per bulan di dashboard penjual');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await conn.end();
        console.log('\nDatabase connection closed');
    }
}

seedMonthlyOrders();
