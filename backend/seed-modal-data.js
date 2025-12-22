/**
 * Script untuk menambahkan data harga modal (HPP) ke produk
 * Jalankan: node seed-modal-data.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toko_online'
};

async function seedModalData() {
    const conn = await mysql.createConnection(dbConfig);
    console.log('Connected to database\n');

    try {
        // 1. Pastikan kolom harga_modal ada
        console.log('--- Checking harga_modal column ---');
        const [cols] = await conn.query(`
            SELECT COLUMN_NAME FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'produk' AND COLUMN_NAME = 'harga_modal'
        `);

        if (!cols.length) {
            await conn.query('ALTER TABLE produk ADD COLUMN harga_modal DECIMAL(10,2) DEFAULT NULL AFTER harga');
            console.log('  Created harga_modal column');
        } else {
            console.log('  harga_modal column exists');
        }

        // 2. Update harga modal untuk semua produk (60-80% dari harga jual)
        console.log('\n--- Updating harga modal ---');
        const [products] = await conn.query('SELECT produk_id, nama_produk, harga FROM produk');

        for (const prod of products) {
            // Harga modal = 60-80% dari harga jual (random)
            const marginPercent = 0.6 + (Math.random() * 0.2); // 60-80%
            const hargaModal = Math.round(prod.harga * marginPercent / 1000) * 1000; // Round to nearest 1000

            await conn.query('UPDATE produk SET harga_modal = ? WHERE produk_id = ?', [hargaModal, prod.produk_id]);

            const margin = prod.harga - hargaModal;
            const marginPersen = ((margin / prod.harga) * 100).toFixed(1);
            console.log(`  ${prod.nama_produk}: Jual Rp ${prod.harga.toLocaleString()} | Modal Rp ${hargaModal.toLocaleString()} | Margin ${marginPersen}%`);
        }

        // 3. Tampilkan ringkasan laporan keuangan untuk penjual 1
        console.log('\n--- Ringkasan Laporan Keuangan (Penjual ID 1) ---');

        const [report] = await conn.query(`
            SELECT 
                p.nama_produk,
                p.harga as harga_jual,
                p.harga_modal,
                COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN pi.jumlah ELSE 0 END), 0) as qty_terjual,
                COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN pi.subtotal ELSE 0 END), 0) as total_pendapatan,
                COALESCE(SUM(CASE WHEN ps.status_pesanan = 'selesai' THEN (p.harga_modal * pi.jumlah) ELSE 0 END), 0) as total_modal
            FROM produk p
            LEFT JOIN pesanan_item pi ON pi.produk_id = p.produk_id
            LEFT JOIN pesanan ps ON ps.pesanan_id = pi.pesanan_id
            WHERE p.penjual_id = 1
            GROUP BY p.produk_id
            HAVING qty_terjual > 0
            ORDER BY total_pendapatan DESC
        `);

        console.log('\nProduk Terjual:');
        console.log('─'.repeat(90));
        console.log('Produk'.padEnd(25) + 'Qty'.padStart(8) + 'Pendapatan'.padStart(15) + 'Modal'.padStart(15) + 'Laba'.padStart(15) + 'Margin'.padStart(10));
        console.log('─'.repeat(90));

        let totalPendapatan = 0;
        let totalModal = 0;

        for (const r of report) {
            const laba = r.total_pendapatan - r.total_modal;
            const margin = r.total_pendapatan > 0 ? ((laba / r.total_pendapatan) * 100).toFixed(1) : 0;

            totalPendapatan += Number(r.total_pendapatan);
            totalModal += Number(r.total_modal);

            console.log(
                r.nama_produk.substring(0, 24).padEnd(25) +
                String(r.qty_terjual).padStart(8) +
                `Rp ${Number(r.total_pendapatan).toLocaleString()}`.padStart(15) +
                `Rp ${Number(r.total_modal).toLocaleString()}`.padStart(15) +
                `Rp ${laba.toLocaleString()}`.padStart(15) +
                `${margin}%`.padStart(10)
            );
        }

        console.log('─'.repeat(90));
        const totalLaba = totalPendapatan - totalModal;
        const totalMargin = totalPendapatan > 0 ? ((totalLaba / totalPendapatan) * 100).toFixed(1) : 0;

        console.log(
            'TOTAL'.padEnd(25) +
            ''.padStart(8) +
            `Rp ${totalPendapatan.toLocaleString()}`.padStart(15) +
            `Rp ${totalModal.toLocaleString()}`.padStart(15) +
            `Rp ${totalLaba.toLocaleString()}`.padStart(15) +
            `${totalMargin}%`.padStart(10)
        );

        console.log('\n========================================');
        console.log('LAPORAN LABA RUGI');
        console.log('========================================');
        console.log(`Total Pendapatan  : Rp ${totalPendapatan.toLocaleString()}`);
        console.log(`Total Modal (HPP) : Rp ${totalModal.toLocaleString()}`);
        console.log(`Laba Kotor        : Rp ${totalLaba.toLocaleString()}`);
        console.log(`Margin            : ${totalMargin}%`);
        console.log('========================================');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await conn.end();
        console.log('\nDatabase connection closed');
    }
}

seedModalData();
