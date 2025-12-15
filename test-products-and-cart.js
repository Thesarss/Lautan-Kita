// Test products and cart functionality
const API_BASE = 'http://localhost:4000';

async function testProductsAndCart() {
    console.log('🚀 Testing products and cart...');
    
    try {
        // Step 1: Login
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
        
        // Step 2: Check available products
        console.log('🔄 Checking available products...');
        const productsResp = await fetch(API_BASE + '/products');
        const products = await productsResp.json();
        console.log(`✅ Found ${products.length} products`);
        
        if (products.length > 0) {
            const firstProduct = products[0];
            console.log(`📦 First product: ID=${firstProduct.produk_id}, Name="${firstProduct.nama_produk}", Stock=${firstProduct.stok}`);
            
            // Step 3: Try to add to cart
            console.log('🔄 Adding to cart...');
            const addResp = await fetch(API_BASE + '/carts/items', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    produk_id: firstProduct.produk_id,
                    jumlah: 1
                })
            });
            
            console.log(`📡 Add to cart response: ${addResp.status}`);
            
            if (!addResp.ok) {
                const errorText = await addResp.text();
                console.error('❌ Add to cart failed:', errorText);
            } else {
                console.log('✅ Added to cart successfully');
                
                // Step 4: Check cart
                console.log('🔄 Checking cart...');
                const cartResp = await fetch(API_BASE + '/carts', {
                    headers: {
                        'Authorization': `Bearer ${loginData.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (cartResp.ok) {
                    const cartData = await cartResp.json();
                    console.log('🛒 Cart items:', cartData.items?.length || 0);
                    
                    if (cartData.items && cartData.items.length > 0) {
                        // Step 5: Try checkout
                        console.log('🔄 Attempting checkout...');
                        const checkoutResp = await fetch(API_BASE + '/orders/checkout', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${loginData.token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                alamat_kirim: 'Test Address for Checkout'
                            })
                        });
                        
                        console.log(`📡 Checkout response: ${checkoutResp.status}`);
                        
                        if (checkoutResp.ok) {
                            const checkoutData = await checkoutResp.json();
                            console.log('✅ Checkout successful!');
                            console.log('📋 New order ID:', checkoutData.pesanan_id);
                            console.log('💰 Total:', checkoutData.total);
                            
                            // Step 6: Verify new order appears in dashboard
                            console.log('🔄 Checking if order appears in dashboard...');
                            const ordersResp = await fetch(API_BASE + '/orders/my-orders', {
                                headers: {
                                    'Authorization': `Bearer ${loginData.token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            
                            if (ordersResp.ok) {
                                const orders = await ordersResp.json();
                                const newOrder = orders.find(o => o.pesanan_id === checkoutData.pesanan_id);
                                if (newOrder) {
                                    console.log('✅ New order found in dashboard!');
                                    console.log('📋 Order details:');
                                    console.log('   Status:', newOrder.status || newOrder.status_pesanan);
                                    console.log('   Items:', newOrder.items?.length || 0);
                                } else {
                                    console.log('⚠️ New order not found in dashboard');
                                }
                            }
                        } else {
                            const errorText = await checkoutResp.text();
                            console.error('❌ Checkout failed:', errorText);
                        }
                    }
                }
            }
        } else {
            console.log('⚠️ No products available for testing');
        }
        
    } catch (e) {
        console.error('❌ Test failed:', e);
    }
}

testProductsAndCart();