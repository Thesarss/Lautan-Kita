// Test payment feature
const API_BASE = 'http://localhost:4000';

async function testPaymentFeature() {
    console.log('🚀 Testing payment feature...');
    
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
        
        const loginData = await loginResp.json();
        console.log('✅ Login successful');
        
        // Step 2: Get orders with menunggu status
        console.log('🔄 Step 2: Get orders...');
        const ordersResp = await fetch(API_BASE + '/orders/my-orders', {
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const orders = await ordersResp.json();
        const menungguOrders = orders.filter(o => {
            const status = o.status || o.status_pesanan || '';
            return status === 'menunggu' || status === '';
        });
        
        console.log(`✅ Found ${menungguOrders.length} orders waiting for payment`);
        
        if (menungguOrders.length > 0) {
            const order = menungguOrders[0];
            console.log(`📋 Testing with order #${order.pesanan_id}`);
            
            // Step 3: Check payment status
            console.log('🔄 Step 3: Check payment status...');
            const paymentResp = await fetch(API_BASE + `/orders/${order.pesanan_id}/payments`, {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`📡 Payment check response: ${paymentResp.status}`);
            
            if (paymentResp.ok) {
                const payments = await paymentResp.json();
                console.log(`✅ Found ${payments.length} payment records`);
                
                if (payments.length > 0) {
                    const payment = payments[0];
                    console.log('💳 Payment details:');
                    console.log('   ID:', payment.pembayaran_id);
                    console.log('   Method:', payment.metode);
                    console.log('   Status:', payment.status_pembayaran);
                    
                    if (payment.status_pembayaran === 'belum_dibayar') {
                        console.log('🔄 Step 4: Test payment confirmation...');
                        
                        // Simulate payment confirmation
                        const confirmResp = await fetch(API_BASE + `/payments/${payment.pembayaran_id}/confirm`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${loginData.token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        console.log(`📡 Payment confirmation response: ${confirmResp.status}`);
                        
                        if (confirmResp.ok) {
                            console.log('✅ Payment confirmed successfully!');
                            
                            // Step 5: Verify order status updated
                            console.log('🔄 Step 5: Verify order status...');
                            const updatedOrdersResp = await fetch(API_BASE + '/orders/my-orders', {
                                headers: {
                                    'Authorization': `Bearer ${loginData.token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            if (updatedOrdersResp.ok) {
                                const updatedOrders = await updatedOrdersResp.json();
                                const updatedOrder = updatedOrders.find(o => o.pesanan_id === order.pesanan_id);
                                if (updatedOrder) {
                                    const newStatus = updatedOrder.status || updatedOrder.status_pesanan || '';
                                    console.log('✅ Order status updated to:', newStatus);
                                    
                                    if (newStatus === 'pending') {
                                        console.log('🎉 Payment flow completed successfully!');
                                    } else {
                                        console.log('⚠️ Order status not updated to pending');
                                    }
                                }
                            }
                        } else {
                            const errorText = await confirmResp.text();
                            console.error('❌ Payment confirmation failed:', errorText);
                        }
                    } else {
                        console.log('ℹ️ Payment already confirmed');
                    }
                } else {
                    console.log('⚠️ No payment records found for this order');
                    
                    // Create payment record
                    console.log('🔄 Creating payment record...');
                    const createPaymentResp = await fetch(API_BASE + '/payments', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${loginData.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            pesanan_id: order.pesanan_id,
                            metode: 'BCA'
                        })
                    });
                    
                    if (createPaymentResp.ok) {
                        const paymentData = await createPaymentResp.json();
                        console.log('✅ Payment record created:', paymentData.pembayaran_id);
                    } else {
                        console.error('❌ Failed to create payment record');
                    }
                }
            } else {
                console.error('❌ Failed to check payment status');
            }
        } else {
            console.log('⚠️ No orders waiting for payment found');
        }
        
        console.log('✅ Payment feature test completed!');
        
    } catch (e) {
        console.error('❌ Test failed:', e);
    }
}

testPaymentFeature();