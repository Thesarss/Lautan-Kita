/**
 * Script untuk membuat/update admin user dengan password yang diketahui
 * Password: admin123
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toko_online'
  });

  try {
    const email = 'admin@lautankita.com';
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin exists
    const [existing] = await conn.query("SELECT user_id FROM user WHERE email = ?", [email]);
    
    if (existing.length > 0) {
      // Update password
      await conn.query("UPDATE user SET password_hash = ?, verified = 1 WHERE email = ?", [passwordHash, email]);
      console.log('✅ Admin password updated!');
    } else {
      // Create new admin
      await conn.query(
        "INSERT INTO user (nama, email, password_hash, role, verified) VALUES (?, ?, ?, 'admin', 1)",
        ['Admin Lautan Kita', email, passwordHash]
      );
      console.log('✅ Admin user created!');
    }

    console.log('\n📧 Email: admin@lautankita.com');
    console.log('🔑 Password: admin123');
    console.log('\nSilakan login di halaman admin dengan kredensial di atas.');

  } finally {
    await conn.end();
  }
}

createAdmin().catch(console.error);
