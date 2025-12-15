// Test checkout flow to see if new orders are created properly
const API_BASE = 'http://localhost:4000';

async function testCheckoutFlow() {
    console.log('🚀 Testing checkout flow...');
    
    try {
        // Step 1: Login
        console.log('🔄 Step 1: Login...');
        const loginResp = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: 'pembeli@test.com', 
                password: 'password123' 
            })
        });
        
        if (!loginResp.ok) {
            console.error('❌ Login failed:', loginResp.status);
            return;
        }
        
        const loginData = await loginResp.json();
        console.log('✅ Login successful');
        
        // Step 2: Check current orders count
        console.log('🔄 Step 2: Check current orders...');
        const ordersResp = await fetch(API_BASE + '/orders/my-orders', {
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!ordersResp.ok) {
            console.error('❌ Orders check failed:', ordersResp.status);
            return;
        }
        
        const currentOrders = await ordersResp.json();
        console.log(`✅ Current orders: ${currentOrders.length}`);
        
        // Step 3: Add item to cart
        console.log('🔄 Step 3: Add item to cart...');
        const addToCartResp = await fetch(API_BASE + '/carts/add', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                produk_id: 1,  // Assuming product ID 1 exists
                jumlah: 1
            })
        });
        
        if (!addToCartResp.ok) {
            const errorText = await addToCartResp.text();
            console.error('❌ Add to cart failed:', addToCartResp.status, errorText);
            return;
        }
        
        console.log('✅ Item added to cart');
        
        // Step 4: Checkout
        console.log('🔄 Step 4: Checkout...');
        const checkoutResp = await fetch(API_BASE + '/orders/checkout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                alamat_kirim: 'Test Address'
            })
        });
        
        if (!checkoutResp.ok) {
            const errorText = await checkoutResp.text();
            console.error('❌ Checkout failed:', checkoutResp.status, errorText);
            return;
        }
        
        const checkoutData = await checkoutResp.json();
        console.log('✅ Checkout successful, order ID:', checkoutData.pesanan_id);
        
        // Step 5: Check orders again
        console.log('🔄 Step 5: Check orders after checkout...');
        const newOrdersResp = await fetch(API_BASE + '/orders/my-orders', {
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!newOrdersResp.ok) {
            console.error('❌ New orders check failed:', newOrdersResp.status);
            return;
        }
        
        const newOrders = await newOrdersResp.json();
        console.log(`✅ Orders after checkout: ${newOrders.length}`);
        
        if (newOrders.length > currentOrders.length) {
            console.log('✅ New order successfully created!');
            const latestOrder = newOrders[0]; // Orders are sorted by created_at DESC
            console.log('📋 Latest order details:');
            console.log('   ID:', latestOrder.pesanan_id);
            console.log('   Status:', latestOrder.status || latestOrder.status_pesanan);
            console.log('   Total:', latestOrder.total_harga);
            console.log('   Items:', latestOrder.items?.length || 0);
        } else {
            console.log('⚠️ No new order found after checkout');
        }
        
        console.log('✅ Checkout flow test completed!');
        
    } catch (e) {
        console.error('❌ Test failed:', e);
    }
}

testCheckoutFlow();