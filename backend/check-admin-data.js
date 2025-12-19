require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toko_online'
  });

  try {
    // Check admin users
    const [admins] = await conn.query("SELECT user_id, nama, email, role FROM user WHERE role = 'admin'");
    console.log('Admin users:', admins);

    // Check transactions data
    const [transactions] = await conn.query(`
      SELECT 
        pb.pembayaran_id, 
        pb.pesanan_id, 
        ps.total_harga as jumlah_bayar, 
        pb.metode, 
        pb.status_pembayaran, 
        pb.paid_at as tanggal_pembayaran,
        u.nama AS pembeli_nama
      FROM pembayaran pb
      JOIN pesanan ps ON ps.pesanan_id = pb.pesanan_id
      JOIN user u ON u.user_id = ps.pembeli_id
      ORDER BY pb.pembayaran_id DESC
      LIMIT 10
    `);
    console.log('\nSample transactions:', transactions);

    // Check financial summary
    const [summary] = await conn.query(`
      SELECT 
        COUNT(DISTINCT ps.pesanan_id) as total_transaksi,
        COALESCE(SUM(CASE WHEN pb.status_pembayaran = 'sudah_dibayar' THEN ps.total_harga ELSE 0 END), 0) as total_pendapatan,
        COUNT(CASE WHEN pb.status_pembayaran = 'sudah_dibayar' THEN 1 END) as transaksi_berhasil,
        COUNT(CASE WHEN pb.status_pembayaran = 'belum_dibayar' THEN 1 END) as transaksi_pending,
        COUNT(CASE WHEN pb.status_pembayaran = 'gagal' THEN 1 END) as transaksi_gagal
      FROM pesanan ps
      LEFT JOIN pembayaran pb ON pb.pesanan_id = ps.pesanan_id
    `);
    console.log('\nFinancial Summary:', summary[0]);

  } finally {
    await conn.end();
  }
}

checkData().catch(console.error);
