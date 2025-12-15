// Test script to verify dashboard API is working
const API_BASE = 'http://localhost:4000';

async function testLogin() {
    console.log('🔄 Testing login...');
    try {
        const resp = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: 'pembeli@test.com', 
                password: 'password123' 
            })
        });
        
        if (!resp.ok) {
            console.error('❌ Login failed:', resp.status, await resp.text());
            return null;
        }
        
        const data = await resp.json();
        console.log('✅ Login successful:', data);
        return data.token;
    } catch (e) {
        console.error('❌ Login error:', e);
        return null;
    }
}

async function testOrders(token) {
    console.log('🔄 Testing orders API...');
    try {
        const resp = await fetch(API_BASE + '/orders/my-orders', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!resp.ok) {
            console.error('❌ Orders API failed:', resp.status, await resp.text());
            return;
        }
        
        const orders = await resp.json();
        console.log('✅ Orders API successful:', orders.length, 'orders found');
        console.log('📊 First few orders:', orders.slice(0, 3));
        return orders;
    } catch (e) {
        console.error('❌ Orders API error:', e);
    }
}

async function testUserInfo(token) {
    console.log('🔄 Testing user info API...');
    try {
        const resp = await fetch(API_BASE + '/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!resp.ok) {
            console.error('❌ User info API failed:', resp.status, await resp.text());
            return;
        }
        
        const user = await resp.json();
        console.log('✅ User info API successful:', user);
        return user;
    } catch (e) {
        console.error('❌ User info API error:', e);
    }
}

async function runTests() {
    console.log('🚀 Starting API tests...\n');
    
    const token = await testLogin();
    if (!token) {
        console.log('❌ Cannot continue without token');
        return;
    }
    
    console.log('\n');
    await testUserInfo(token);
    
    console.log('\n');
    const orders = await testOrders(token);
    
    console.log('\n🏁 Tests completed');
}

runTests();