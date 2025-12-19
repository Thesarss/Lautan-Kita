/**
 * Script untuk generate data dummy transaksi
 * Membuat pesanan, pembayaran, dan ulasan untuk testing laporan keuangan
 * 
 * Jalankan: node seed-transactions.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toko_online'
};

// Data dummy
const namaDepan = ['Budi', 'Siti', 'Ahmad', 'Dewi', 'Eko', 'Fitri', 'Gunawan', 'Hana', 'Irfan', 'Joko', 'Kartini', 'Lukman', 'Maya', 'Nanda', 'Oki'];
const namaBelakang = ['Santoso', 'Wijaya', 'Pratama', 'Kusuma', 'Hidayat', 'Saputra', 'Lestari', 'Wibowo', 'Nugroho', 'Setiawan'];
const alamatKota = ['Jakarta', 'Surabaya', 'Bandung', 'Semarang', 'Makassar', 'Medan', 'Palembang', 'Tangerang', 'Depok', 'Bekasi'];
const metodePembayaran = ['transfer_bank', 'e_wallet', 'cod', 'qris', 'virtual_account'];
const statusPesanan = ['menunggu', 'diproses', 'dikirim', 'selesai', 'dibatalkan'];
const statusPembayaran = ['belum_dibayar', 'sudah_dibayar', 'gagal'];

// Produk ikan laut
const produkIkan = [
  { nama: 'Ikan Tongkol Segar', harga: 35000, kategori: 'ikan' },
  { nama: 'Ikan Kakap Merah', harga: 85000, kategori: 'ikan' },
  { nama: 'Ikan Kembung', harga: 28000, kategori: 'ikan' },
  { nama: 'Ikan Tenggiri', harga: 75000, kategori: 'ikan' },
  { nama: 'Ikan Bandeng', harga: 32000, kategori: 'ikan' },
  { nama: 'Udang Vaname', harga: 95000, kategori: 'udang' },
  { nama: 'Udang Windu', harga: 120000, kategori: 'udang' },
  { nama: 'Cumi-cumi Segar', harga: 65000, kategori: 'cumi' },
  { nama: 'Kerang Hijau', harga: 25000, kategori: 'kerang' },
  { nama: 'Kepiting Rajungan', harga: 150000, kategori: 'kerang' },
  { nama: 'Ikan Salmon Fillet', harga: 180000, kategori: 'ikan' },
  { nama: 'Ikan Tuna Steak', harga: 95000, kategori: 'ikan' },
  { nama: 'Lobster Laut', harga: 350000, kategori: 'kerang' },
  { nama: 'Ikan Gurame', harga: 55000, kategori: 'ikan' },
  { nama: 'Ikan Nila', harga: 30000, kategori: 'ikan' }
];

const komentarUlasan = [
  'Ikan sangat segar, pengiriman cepat!',
  'Kualitas bagus, sesuai deskripsi',
  'Packing rapi, ikan masih fresh',
  'Recommended seller!',
  'Harga terjangkau, kualitas oke',
  'Pengiriman agak lama tapi ikan masih bagus',
  'Ukuran sesuai, rasanya enak',
  'Akan order lagi, terima kasih',
  'Pelayanan ramah dan cepat',
  'Produk berkualitas, puas belanja di sini'
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return new Date(start + Math.random() * (end - start));
}

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function seedTransactions() {
  const conn = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🚀 Memulai seeding data transaksi...\n');

    // 1. Cek dan buat user pembeli jika belum ada
    console.log('📝 Membuat user pembeli...');
    const pembeliIds = [];
    for (let i = 0; i < 10; i++) {
      const nama = `${randomItem(namaDepan)} ${randomItem(namaBelakang)}`;
      const email = `pembeli${i + 1}@test.com`;
      
      const [existing] = await conn.query('SELECT user_id FROM user WHERE email = ?', [email]);
      if (existing.length > 0) {
        pembeliIds.push(existing[0].user_id);
      } else {
        const [result] = await conn.query(
          'INSERT INTO user (nama, email, password_hash, role, verified, alamat, no_tlp) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [nama, email, '$2b$10$dummy.hash.for.testing', 'pembeli', 1, `Jl. Test No. ${i + 1}, ${randomItem(alamatKota)}`, `08${randomInt(1000000000, 9999999999)}`]
        );
        pembeliIds.push(result.insertId);
      }
    }
    console.log(`   ✅ ${pembeliIds.length} pembeli siap\n`);

    // 2. Cek dan buat user penjual jika belum ada
    console.log('📝 Membuat user penjual...');
    const penjualIds = [];
    const namaToko = ['Toko Ikan Segar', 'Seafood Berkah', 'Laut Makmur', 'Ikan Jaya', 'Nelayan Sejahtera'];
    for (let i = 0; i < 5; i++) {
      const email = `penjual${i + 1}@test.com`;
      
      const [existing] = await conn.query('SELECT user_id FROM user WHERE email = ?', [email]);
      if (existing.length > 0) {
        penjualIds.push(existing[0].user_id);
      } else {
        const [result] = await conn.query(
          'INSERT INTO user (nama, email, password_hash, role, verified, alamat, no_tlp) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [namaToko[i], email, '$2b$10$dummy.hash.for.testing', 'penjual', 1, `Pasar Ikan ${randomItem(alamatKota)}`, `08${randomInt(1000000000, 9999999999)}`]
        );
        penjualIds.push(result.insertId);
      }
    }
    console.log(`   ✅ ${penjualIds.length} penjual siap\n`);

    // 3. Buat produk untuk setiap penjual
    console.log('📝 Membuat produk...');
    const produkIds = [];
    for (const penjualId of penjualIds) {
      // Setiap penjual punya 3 produk
      const produkSample = [...produkIkan].sort(() => Math.random() - 0.5).slice(0, 3);
      for (const produk of produkSample) {
        const [existing] = await conn.query(
          'SELECT produk_id FROM produk WHERE penjual_id = ? AND nama_produk = ?',
          [penjualId, produk.nama]
        );
        
        if (existing.length > 0) {
          produkIds.push({ id: existing[0].produk_id, harga: produk.harga, penjualId });
        } else {
          const [result] = await conn.query(
            'INSERT INTO produk (penjual_id, nama_produk, deskripsi, harga, stok, status, kategori) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [penjualId, produk.nama, `${produk.nama} berkualitas tinggi, segar dari laut`, produk.harga, randomInt(50, 200), 'aktif', produk.kategori]
          );
          produkIds.push({ id: result.insertId, harga: produk.harga, penjualId });
        }
      }
    }
    console.log(`   ✅ ${produkIds.length} produk siap\n`);

    // 4. Generate transaksi untuk 12 bulan terakhir
    console.log('📝 Membuat transaksi (12 bulan terakhir)...');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    
    let totalPesanan = 0;
    let totalPembayaran = 0;
    let totalUlasan = 0;

    // Generate 100-150 transaksi
    const jumlahTransaksi = randomInt(100, 150);
    
    for (let i = 0; i < jumlahTransaksi; i++) {
      const pembeliId = randomItem(pembeliIds);
      const tanggalPesanan = randomDate(startDate, endDate);
      
      // Pilih 1-3 produk random
      const jumlahItem = randomInt(1, 3);
      const selectedProduk = [...produkIds].sort(() => Math.random() - 0.5).slice(0, jumlahItem);
      
      let totalHarga = 0;
      const items = selectedProduk.map(p => {
        const jumlah = randomInt(1, 5);
        const subtotal = p.harga * jumlah;
        totalHarga += subtotal;
        return { produkId: p.id, harga: p.harga, jumlah, subtotal };
      });

      // Tentukan status berdasarkan tanggal
      const daysSinceOrder = Math.floor((endDate - tanggalPesanan) / (1000 * 60 * 60 * 24));
      let statusPesananVal, statusPembayaranVal;
      
      if (daysSinceOrder > 30) {
        // Pesanan lama - kebanyakan selesai
        statusPesananVal = Math.random() < 0.85 ? 'selesai' : (Math.random() < 0.5 ? 'dibatalkan' : 'dikirim');
        statusPembayaranVal = statusPesananVal === 'dibatalkan' ? 'gagal' : 'sudah_dibayar';
      } else if (daysSinceOrder > 7) {
        // Pesanan minggu lalu
        statusPesananVal = randomItem(['diproses', 'dikirim', 'selesai']);
        statusPembayaranVal = Math.random() < 0.9 ? 'sudah_dibayar' : 'belum_dibayar';
      } else {
        // Pesanan baru
        statusPesananVal = randomItem(['menunggu', 'diproses', 'dikirim']);
        statusPembayaranVal = randomItem(['belum_dibayar', 'sudah_dibayar']);
      }

      // Insert pesanan
      const [pesananResult] = await conn.query(
        `INSERT INTO pesanan (pembeli_id, alamat_kirim, total_harga, status_pesanan, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [pembeliId, `Jl. Pengiriman No. ${randomInt(1, 100)}, ${randomItem(alamatKota)}`, totalHarga, statusPesananVal, formatDate(tanggalPesanan)]
      );
      const pesananId = pesananResult.insertId;
      totalPesanan++;

      // Insert pesanan items
      for (const item of items) {
        await conn.query(
          'INSERT INTO pesanan_item (pesanan_id, produk_id, harga_saat_beli, jumlah, subtotal) VALUES (?, ?, ?, ?, ?)',
          [pesananId, item.produkId, item.harga, item.jumlah, item.subtotal]
        );
      }

      // Insert pembayaran
      const tanggalBayar = statusPembayaranVal === 'sudah_dibayar' 
        ? new Date(tanggalPesanan.getTime() + randomInt(1, 24) * 60 * 60 * 1000)
        : null;
      
      await conn.query(
        `INSERT INTO pembayaran (pesanan_id, metode, status_pembayaran, paid_at, reference_gateway) 
         VALUES (?, ?, ?, ?, ?)`,
        [pesananId, randomItem(metodePembayaran), statusPembayaranVal, tanggalBayar ? formatDate(tanggalBayar) : null, tanggalBayar ? `REF${Date.now()}${randomInt(1000, 9999)}` : null]
      );
      totalPembayaran++;

      // Tambah ulasan untuk pesanan selesai (70% chance)
      if (statusPesananVal === 'selesai' && Math.random() < 0.7) {
        for (const item of items) {
          if (Math.random() < 0.6) { // 60% produk diulas
            const rating = randomInt(3, 5); // Rating 3-5
            await conn.query(
              `INSERT INTO ulasan (produk_id, pembeli_id, rating, komentar, status, dibuat_pada) 
               VALUES (?, ?, ?, ?, 'aktif', ?)`,
              [item.produkId, pembeliId, rating, randomItem(komentarUlasan), formatDate(new Date(tanggalPesanan.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000))]
            );
            totalUlasan++;
          }
        }
      }

      // Progress indicator
      if ((i + 1) % 20 === 0) {
        console.log(`   ... ${i + 1}/${jumlahTransaksi} transaksi dibuat`);
      }
    }

    console.log(`\n✅ Seeding selesai!`);
    console.log(`   📦 ${totalPesanan} pesanan`);
    console.log(`   💳 ${totalPembayaran} pembayaran`);
    console.log(`   ⭐ ${totalUlasan} ulasan`);

    // Tampilkan ringkasan
    console.log('\n📊 Ringkasan Data:');
    
    const [pesananStats] = await conn.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status_pesanan = 'selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status_pesanan = 'menunggu' THEN 1 ELSE 0 END) as menunggu,
        SUM(CASE WHEN status_pesanan = 'diproses' THEN 1 ELSE 0 END) as diproses,
        SUM(CASE WHEN status_pesanan = 'dikirim' THEN 1 ELSE 0 END) as dikirim,
        SUM(CASE WHEN status_pesanan = 'dibatalkan' THEN 1 ELSE 0 END) as dibatalkan
      FROM pesanan
    `);
    console.log('   Pesanan:', pesananStats[0]);

    const [pembayaranStats] = await conn.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status_pembayaran = 'sudah_dibayar' THEN 1 ELSE 0 END) as sudah_dibayar,
        SUM(CASE WHEN status_pembayaran = 'belum_dibayar' THEN 1 ELSE 0 END) as belum_dibayar,
        SUM(CASE WHEN status_pembayaran = 'gagal' THEN 1 ELSE 0 END) as gagal
      FROM pembayaran
    `);
    console.log('   Pembayaran:', pembayaranStats[0]);

    const [pendapatanStats] = await conn.query(`
      SELECT 
        SUM(CASE WHEN pb.status_pembayaran = 'sudah_dibayar' THEN ps.total_harga ELSE 0 END) as total_pendapatan
      FROM pesanan ps
      JOIN pembayaran pb ON pb.pesanan_id = ps.pesanan_id
    `);
    console.log(`   Total Pendapatan: Rp ${Number(pendapatanStats[0].total_pendapatan || 0).toLocaleString('id-ID')}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

// Run
seedTransactions()
  .then(() => {
    console.log('\n🎉 Script selesai!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script gagal:', err);
    process.exit(1);
  });
