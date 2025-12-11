// Test Admin Endpoints
require('dotenv').config();
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000';
let adminToken = '';

async function login() {
    console.log('🔐 Login sebagai admin...\n');

    const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@lautankita.com',
            password: 'Admin123456'
        })
    });

    if (!resp.ok) {
        console.error('❌ Login gagal:', await resp.text());
        process.exit(1);
    }

    const data = await resp.json();
    adminToken = data.token;
    console.log('✅ Login berhasil');
    console.log('Token:', adminToken.substring(0, 20) + '...\n');
}

async function testGetUsers() {
    console.log('📋 Test GET /admin/users...');

    const resp = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!resp.ok) {
        console.error('❌ Gagal:', resp.status, await resp.text());
        return;
    }

    const users = await resp.json();
    console.log(`✅ Berhasil: ${users.length} users`);
    console.log('Sample:', users[0]);
    console.log('');
}

async function testEditUser() {
    console.log('✏️  Test PATCH /admin/users/:id...');

    const resp = await fetch(`${API_BASE}/admin/users/2`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nama: 'Test User Updated',
            verified: true
        })
    });

    if (!resp.ok) {
        console.error('❌ Gagal:', resp.status, await resp.text());
        return;
    }

    const result = await resp.json();
    console.log('✅ Berhasil:', result);
    console.log('');
}

async function testGetTransactions() {
    console.log('💰 Test GET /admin/transactions...');

    const resp = await fetch(`${API_BASE}/admin/transactions`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!resp.ok) {
        console.error('❌ Gagal:', resp.status, await resp.text());
        return;
    }

    const transactions = await resp.json();
    console.log(`✅ Berhasil: ${transactions.length} transactions`);
    if (transactions.length > 0) {
        console.log('Sample:', transactions[0]);
    }
    console.log('');
}

async function testGetReviews() {
    console.log('⭐ Test GET /admin/reviews...');

    const resp = await fetch(`${API_BASE}/admin/reviews`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!resp.ok) {
        console.error('❌ Gagal:', resp.status, await resp.text());
        return;
    }

    const reviews = await resp.json();
    console.log(`✅ Berhasil: ${reviews.length} reviews`);
    if (reviews.length > 0) {
        console.log('Sample:', reviews[0]);
    }
    console.log('');
}

async function testUpdateReviewStatus() {
    console.log('🔄 Test PATCH /admin/reviews/:id/status...');

    // First get a review
    const getResp = await fetch(`${API_BASE}/admin/reviews`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!getResp.ok) {
        console.error('❌ Tidak ada review untuk ditest');
        return;
    }

    const reviews = await getResp.json();
    if (reviews.length === 0) {
        console.log('⚠️  Tidak ada review di database');
        return;
    }

    const reviewId = reviews[0].ulasan_id;
    const newStatus = reviews[0].status === 'aktif' ? 'disembunyikan' : 'aktif';

    const resp = await fetch(`${API_BASE}/admin/reviews/${reviewId}/status`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
    });

    if (!resp.ok) {
        console.error('❌ Gagal:', resp.status, await resp.text());
        return;
    }

    const result = await resp.json();
    console.log(`✅ Berhasil: Review #${reviewId} status → ${newStatus}`);
    console.log('');
}

async function runTests() {
    try {
        await login();
        await testGetUsers();
        await testEditUser();
        await testGetTransactions();
        await testGetReviews();
        await testUpdateReviewStatus();

        console.log('✅ Semua test selesai!\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

runTests();
