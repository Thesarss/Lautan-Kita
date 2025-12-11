/**
 * Script untuk membuat akun admin pertama
 * Jalankan dengan: node backend/create-admin.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createAdmin() {
    console.log('🔧 Membuat akun admin...\n');

    // Konfigurasi admin
    const adminData = {
        nama: 'Administrator',
        email: 'admin@lautankita.com',
        password: 'Admin123456', // Password default, HARUS diganti setelah login pertama!
        role: 'admin'
    };

    try {
        // Koneksi ke database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'toko_online'
        });

        console.log('✅ Terhubung ke database');

        // Cek apakah email sudah ada
        const [existing] = await connection.query(
            'SELECT user_id, email, role FROM user WHERE email = ?',
            [adminData.email]
        );

        if (existing.length > 0) {
            console.log('\n⚠️  Email sudah terdaftar!');
            console.log('Email:', existing[0].email);
            console.log('Role:', existing[0].role);
            console.log('\nJika ingin membuat admin baru, ubah email di file create-admin.js');
            await connection.end();
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(adminData.password, 10);

        // Insert admin
        const [result] = await connection.query(
            'INSERT INTO user (nama, email, password_hash, role, verified) VALUES (?, ?, ?, ?, ?)',
            [adminData.nama, adminData.email, passwordHash, adminData.role, 1]
        );

        console.log('\n✅ Akun admin berhasil dibuat!');
        console.log('\n📋 Detail Akun:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('User ID    :', result.insertId);
        console.log('Nama       :', adminData.nama);
        console.log('Email      :', adminData.email);
        console.log('Password   :', adminData.password);
        console.log('Role       :', adminData.role);
        console.log('Verified   : Ya');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  PENTING:');
        console.log('1. Simpan kredensial ini dengan aman');
        console.log('2. Segera ganti password setelah login pertama');
        console.log('3. Jangan share kredensial ini ke siapapun');
        console.log('\n🚀 Silakan login di: http://localhost:3000/login.html');

        await connection.end();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nPastikan:');
        console.error('1. MySQL/XAMPP sudah running');
        console.error('2. Database "toko_online" sudah dibuat');
        console.error('3. File .env sudah dikonfigurasi dengan benar');
        process.exit(1);
    }
}

// Jalankan script
createAdmin();
