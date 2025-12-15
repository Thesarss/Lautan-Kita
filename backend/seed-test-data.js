require('dotenv').config();
const { pool } = require('./src/db');
const bcrypt = require('bcrypt');

async function seedTestData() {
  try {
    console.log('Seeding test data...');
    const conn = await pool.getConnection();
    
    try {
      // Hash password untuk test users
      const testPassword = await bcrypt.hash('password123', 10);
      
      // Insert test users
      console.log('Creating test users...');
      
      // Admin user
      await conn.query(`
        INSERT IGNORE INTO user (nama, email, password_hash, role, verified) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Admin Lautan Kita', 'admin@lautankita.com', testPassword, 'admin', 1]);
      
      // Pembeli user
      await conn.query(`
        INSERT IGNORE INTO user (nama, email, password_hash, role, verified) 
        VALUES (?, ?, ?, ?, ?)
      `, ['John Pembeli', 'pembeli@test.com', testPassword, 'pembeli', 1]);
      
      // Penjual user
      await conn.query(`
        INSERT IGNORE INTO user (nama, email, password_hash, role, verified) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Jane Penjual', 'penjual@test.com', testPassword, 'penjual', 1]);
      
      // Kurir user
      await conn.query(`
        INSERT IGNORE INTO user (nama, email, password_hash, role, verified) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Bob Kurir', 'kurir@test.com', testPassword, 'kurir', 1]);
      
      // Insert test categories
      console.log('Creating test categories...');
      await conn.query(`
        INSERT IGNORE INTO kategori (nama) VALUES 
        ('Ikan Segar'), 
        ('Udang'), 
        ('Kepiting'), 
        ('Cumi-cumi'), 
        ('Kerang')
      `);
      
      // Get user IDs for products
      const [penjualUser] = await conn.query('SELECT user_id FROM user WHERE email = ?', ['penjual@test.com']);
      const [kategoriIkan] = await conn.query('SELECT kategori_id FROM kategori WHERE nama = ?', ['Ikan Segar']);
      
      if (penjualUser.length && kategoriIkan.length) {
        // Insert test products
        console.log('Creating test products...');
        await conn.query(`
          INSERT IGNORE INTO produk (penjual_id, kategori_id, nama_produk, deskripsi, harga, stok, status) 
          VALUES 
          (?, ?, 'Ikan Tuna Segar', 'Ikan tuna segar hasil tangkapan nelayan lokal', 85000.00, 50, 'aktif'),
          (?, ?, 'Ikan Salmon', 'Ikan salmon import berkualitas tinggi', 120000.00, 30, 'aktif'),
          (?, ?, 'Ikan Kakap Merah', 'Ikan kakap merah segar dari laut dalam', 95000.00, 25, 'aktif')
        `, [
          penjualUser[0].user_id, kategoriIkan[0].kategori_id,
          penjualUser[0].user_id, kategoriIkan[0].kategori_id,
          penjualUser[0].user_id, kategoriIkan[0].kategori_id
        ]);
      }
      
      // Check created users
      const [users] = await conn.query('SELECT user_id, nama, email, role FROM user');
      console.log('\nCreated users:');
      users.forEach(user => {
        console.log(`- ${user.nama} (${user.email}) - Role: ${user.role}`);
      });
      
      console.log('\n✓ Test data seeded successfully!');
      console.log('\nTest login credentials:');
      console.log('Admin: admin@lautankita.com / password123');
      console.log('Pembeli: pembeli@test.com / password123');
      console.log('Penjual: penjual@test.com / password123');
      console.log('Kurir: kurir@test.com / password123');
      
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
}

seedTestData();