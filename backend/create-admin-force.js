/**
 * Script untuk membuat akun admin (FORCE - hapus admin lama jika ada)
 * Jalankan dengan: node backend/create-admin-force.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminForce() {
    console.log('🔧 Membuat akun admin (FORCE MODE)...\n');

    // Konfigurasi admin default
    let adminData = {
        nama: 'Administrator',
        email: 'admin@lautankita.com',
        password: 'Admin123456',
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

        console.log('✅ Terhubung ke database\n');

        // Tanya apakah ingin custom
        const useCustom = await question('Gunakan kredensial custom? (y/n, default: n): ');

        if (useCustom.toLowerCase() === 'y') {
            adminData.nama = await question('Nama (default: Administrator): ') || adminData.nama;
            adminData.email = await question('Email (default: admin@lautankita.com): ') || adminData.email;
            adminData.password = await question('Password (default: Admin123456): ') || adminData.password;
        }

        console.log('\n📋 Data Admin:');
        console.log('Nama    :', adminData.nama);
        console.log('Email   :', adminData.email);
        console.log('Password:', adminData.password);
        console.log('Role    :', adminData.role);

        const confirm = await question('\nLanjutkan? (y/n): ');
        if (confirm.toLowerCase() !== 'y') {
            console.log('❌ Dibatalkan');
            rl.close();
            await connection.end();
            return;
        }

        // Cek apakah email sudah ada
        const [existing] = await connection.query(
            'SELECT user_id, email, role FROM user WHERE email = ?',
            [adminData.email]
        );

        if (existing.length > 0) {
            console.log('\n⚠️  Email sudah terdaftar!');
            console.log('User ID:', existing[0].user_id);
            console.log('Email  :', existing[0].email);
            console.log('Role   :', existing[0].role);

            const deleteConfirm = await question('\nHapus user lama dan buat baru? (y/n): ');
            if (deleteConfirm.toLowerCase() === 'y') {
                await connection.query('DELETE FROM user WHERE email = ?', [adminData.email]);
                console.log('✅ User lama dihapus');
            } else {
                console.log('❌ Dibatalkan');
                rl.close();
                await connection.end();
                return;
            }
        }

        // Hash password
        console.log('\n🔐 Hashing password...');
        const passwordHash = await bcrypt.hash(adminData.password, 10);

        // Insert admin
        console.log('💾 Menyimpan ke database...');
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

        // Test login
        console.log('\n🧪 Testing login...');
        const testMatch = await bcrypt.compare(adminData.password, passwordHash);
        if (testMatch) {
            console.log('✅ Password hash valid - login akan berhasil!');
        } else {
            console.log('❌ Password hash tidak valid - ada masalah!');
        }

        rl.close();
        await connection.end();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nPastikan:');
        console.error('1. MySQL/XAMPP sudah running');
        console.error('2. Database "toko_online" sudah dibuat');
        console.error('3. File .env sudah dikonfigurasi dengan benar');
        rl.close();
        process.exit(1);
    }
}

// Jalankan script
createAdminForce();
