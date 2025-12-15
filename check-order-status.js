const API_BASE = 'http://localhost:4000';

async function checkOrderStatus() {
  try {
    const loginResp = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'pembeli@test.com', password: 'password123' })
    });
    const loginData = await loginResp.json();
    
    const ordersResp = await fetch(API_BASE + '/orders/my-orders', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    const orders = await ordersResp.json();
    const latestOrder = orders[0];
    console.log('Latest order:');
    console.log('  ID:', latestOrder.pesanan_id);
    console.log('  status field:', JSON.stringify(latestOrder.status));
    console.log('  status_pesanan field:', JSON.stringify(latestOrder.status_pesanan));
    console.log('  created_at:', latestOrder.created_at);
    console.log('  tanggal_pesanan:', latestOrder.tanggal_pesanan);
  } catch (e) {
    console.error('Error:', e);
  }
}

checkOrderStatus();