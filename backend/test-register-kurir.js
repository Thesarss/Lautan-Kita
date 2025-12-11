/**
 * Script untuk test registrasi kurir
 * Jalankan dengan: node backend/test-register-kurir.js
 */

require('dotenv').config({ path: __dirname + '/.env' });

async function testRegisterKurir() {
    console.log('🧪 Testing registrasi kurir...\n');

    const API_BASE = 'http://localhost:4000';

    // Data kurir test
    const kurirData = {
        nama: 'Joko Kurir',
        email: 'kurir.test@lautankita.com',
        password: 'Kurir12345',
        role: 'kurir'
    };

    try {
        console.log('📤 Mengirim request registrasi...');
        console.log('Data:', JSON.stringify(kurirData, null, 2));

        const response = await fetch(API_BASE + '/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(kurirData)
        });

        console.log('\n📥 Response Status:', response.status);

        const data = await response.json();
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Registrasi BERHASIL!');
            console.log('Token:', data.token);

            // Test get user info
            console.log('\n🔍 Testing GET /auth/me...');
            const meResponse = await fetch(API_BASE + '/auth/me', {
                headers: {
                    'Authorization': 'Bearer ' + data.token
                }
            });

            const userData = await meResponse.json();
            console.log('User Data:', JSON.stringify(userData, null, 2));

            if (userData.role === 'kurir') {
                console.log('\n✅ Role kurir TERIDENTIFIKASI dengan benar!');
            } else {
                console.log('\n❌ Role SALAH! Expected: kurir, Got:', userData.role);
            }

        } else {
            console.log('\n❌ Registrasi GAGAL!');
            if (data.error === 'validation_error') {
                console.log('Validation Errors:', data.details);
            } else if (data.error === 'email_exists') {
                console.log('Email sudah terdaftar. Coba email lain atau hapus user ini dari database.');
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nPastikan:');
        console.error('1. Backend sudah running di http://localhost:4000');
        console.error('2. Database terhubung dengan benar');
        console.error('3. Jalankan: cd backend && npm start');
    }
}

// Jalankan test
testRegisterKurir();
