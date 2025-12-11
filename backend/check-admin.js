/**
 * Script untuk cek apakah admin sudah ada di database
 * Jalankan dengan: node backend/check-admin.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function checkAdmin() {
    console.log('🔍 Mengecek akun admin...\n');

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

        // Cek apakah ada admin
        const [admins] = await connection.query(
            'SELECT user_id, nama, email, role, verified, created_at FROM user WHERE role = "admin"'
        );

        if (admins.length === 0) {
            console.log('❌ TIDAK ADA ADMIN di database!\n');
            console.log('📝 Cara membuat admin:');
            console.log('1. Jalankan: node backend/create-admin.js');
            console.log('2. Atau buka: http://localhost:3000/registrasi-admin.html');
            console.log('3. Atau jalankan SQL manual di phpMyAdmin\n');
        } else {
            console.log(`✅ Ditemukan ${admins.length} admin:\n`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            admins.forEach((admin, index) => {
                console.log(`Admin #${index + 1}:`);
                console.log(`  User ID    : ${admin.user_id}`);
                console.log(`  Nama       : ${admin.nama}`);
                console.log(`  Email      : ${admin.email}`);
                console.log(`  Role       : ${admin.role}`);
                console.log(`  Verified   : ${admin.verified ? 'Ya' : 'Tidak'}`);
                console.log(`  Created    : ${admin.created_at}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            });

            // Test password untuk admin pertama
            console.log('\n🔐 Testing password untuk admin pertama...');
            const firstAdmin = admins[0];
            const [userWithPassword] = await connection.query(
                'SELECT password_hash FROM user WHERE user_id = ?',
                [firstAdmin.user_id]
            );

            if (userWithPassword.length > 0) {
                const passwordHash = userWithPassword[0].password_hash;
                console.log('Password Hash:', passwordHash.substring(0, 20) + '...');

                // Test beberapa password umum
                const testPasswords = ['Admin123456', 'admin123', 'Admin12345', 'password'];
                console.log('\n🧪 Testing password umum:');

                for (const testPass of testPasswords) {
                    try {
                        const match = await bcrypt.compare(testPass, passwordHash);
                        if (match) {
                            console.log(`✅ Password COCOK: "${testPass}"`);
                            console.log('\n📋 Kredensial Login:');
                            console.log(`Email    : ${firstAdmin.email}`);
                            console.log(`Password : ${testPass}`);
                            break;
                        } else {
                            console.log(`❌ Bukan: "${testPass}"`);
                        }
                    } catch (e) {
                        console.log(`⚠️  Error testing "${testPass}":`, e.message);
                    }
                }
            }
        }

        // Cek semua user
        console.log('\n\n📊 Semua User di Database:');
        const [allUsers] = await connection.query(
            'SELECT user_id, nama, email, role FROM user ORDER BY user_id'
        );
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        allUsers.forEach(user => {
            console.log(`ID: ${user.user_id} | ${user.nama.padEnd(20)} | ${user.email.padEnd(30)} | ${user.role}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
checkAdmin();
