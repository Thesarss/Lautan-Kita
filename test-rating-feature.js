// Test rating feature
const API_BASE = 'http://localhost:4000';

async function testRatingFeature() {
    console.log('🚀 Testing rating feature...');
    
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
        
        // Step 2: Get rateable orders
        console.log('🔄 Step 2: Get rateable orders...');
        const rateableResp = await fetch(API_BASE + '/ratings/rateable-orders', {
            headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!rateableResp.ok) {
            console.error('❌ Rateable orders failed:', rateableResp.status);
            return;
        }
        
        const rateableOrders = await rateableResp.json();
        console.log(`✅ Found ${rateableOrders.length} rateable orders`);
        
        if (rateableOrders.length > 0) {
            const order = rateableOrders.find(o => !o.already_rated);
            if (order) {
                console.log(`📋 Testing with order #${order.pesanan_id} for seller ${order.penjual_nama}`);
                
                // Step 3: Submit rating
                console.log('🔄 Step 3: Submit rating...');
                const ratingResp = await fetch(API_BASE + '/ratings/seller', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${loginData.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pesanan_id: order.pesanan_id,
                        penjual_id: order.penjual_id,
                        rating: 5,
                        komentar: 'Penjual sangat baik dan responsif!'
                    })
                });
                
                console.log(`📡 Rating response: ${ratingResp.status}`);
                
                if (ratingResp.ok) {
                    const ratingData = await ratingResp.json();
                    console.log('✅ Rating submitted successfully!');
                    console.log('📋 Rating ID:', ratingData.rating_id);
                    
                    // Step 4: Verify rating appears in rateable orders
                    console.log('🔄 Step 4: Verify rating...');
                    const verifyResp = await fetch(API_BASE + '/ratings/rateable-orders', {
                        headers: {
                            'Authorization': `Bearer ${loginData.token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (verifyResp.ok) {
                        const updatedOrders = await verifyResp.json();
                        const ratedOrder = updatedOrders.find(o => o.pesanan_id === order.pesanan_id);
                        if (ratedOrder && ratedOrder.already_rated) {
                            console.log('✅ Rating verified - order now shows as rated!');
                        } else {
                            console.log('⚠️ Rating not reflected in rateable orders');
                        }
                    }
                    
                    // Step 5: Check seller's ratings
                    console.log('🔄 Step 5: Check seller ratings...');
                    const sellerRatingsResp = await fetch(API_BASE + `/ratings/seller/${order.penjual_id}`);
                    
                    if (sellerRatingsResp.ok) {
                        const sellerRatings = await sellerRatingsResp.json();
                        console.log('✅ Seller ratings loaded:');
                        console.log('   Average rating:', sellerRatings.seller.avg_rating);
                        console.log('   Total ratings:', sellerRatings.seller.total_ratings);
                        console.log('   Recent ratings:', sellerRatings.ratings.length);
                    }
                    
                } else {
                    const errorText = await ratingResp.text();
                    console.error('❌ Rating submission failed:', errorText);
                }
            } else {
                console.log('⚠️ All orders already rated');
            }
        } else {
            console.log('⚠️ No rateable orders found');
        }
        
        console.log('✅ Rating feature test completed!');
        
    } catch (e) {
        console.error('❌ Test failed:', e);
    }
}

testRatingFeature();