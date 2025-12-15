// Direct test of dashboard functionality
const API_BASE = 'http://localhost:4000';

async function testDashboardDirect() {
    console.log('🚀 Testing dashboard directly...');
    
    try {
        // Step 1: Login to get token
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
        
        // Step 2: Test orders API
        console.log('🔄 Step 2: Get orders...');
        const ordersResp = await fetch(API_BASE + '/orders/my-orders', {
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!ordersResp.ok) {
            console.error('❌ Orders failed:', ordersResp.status);
            return;
        }
        
        const orders = await ordersResp.json();
        console.log('✅ Orders loaded:', orders.length);
        
        // Step 3: Test stats calculation
        console.log('🔄 Step 3: Calculate stats...');
        const stats = {
            pending: 0,
            menunggu: 0,
            dikemas: 0,
            diproses: 0,
            dikirim: 0,
            selesai: 0,
            dibatalkan: 0,
            empty: 0
        };

        orders.forEach(order => {
            const status = order.status || order.status_pesanan || '';
            console.log(`   Order ${order.pesanan_id}: status="${status}"`);
            if (status === '') {
                stats.empty++;
                stats.menunggu++;
            } else if (stats.hasOwnProperty(status)) {
                stats[status]++;
            }
        });
        
        console.log('📊 Stats:', stats);
        console.log('📊 Display values:');
        console.log('   Menunggu:', stats.pending + stats.menunggu);
        console.log('   Diproses:', stats.dikemas + stats.diproses);
        console.log('   Dikirim:', stats.dikirim);
        console.log('   Selesai:', stats.selesai);
        
        // Step 4: Test rendering
        console.log('🔄 Step 4: Test rendering...');
        const sampleOrder = orders[0];
        if (sampleOrder) {
            const status = sampleOrder.status || sampleOrder.status_pesanan || '';
            const normalizedStatus = status === '' ? 'menunggu' : status;
            const itemsText = sampleOrder.items ? sampleOrder.items.map(item => `${item.nama_produk} (${item.jumlah}x)`).join(', ') : '';
            
            console.log('🎨 Sample order render data:');
            console.log('   ID:', sampleOrder.pesanan_id);
            console.log('   Status:', status, '->', normalizedStatus);
            console.log('   Items:', itemsText);
            console.log('   Total:', Number(sampleOrder.total_harga).toLocaleString('id-ID'));
        }
        
        console.log('✅ All tests completed successfully!');
        
    } catch (e) {
        console.error('❌ Test failed:', e);
    }
}

testDashboardDirect();