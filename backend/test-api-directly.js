const express = require('express');
const { pool } = require('./src/db');

async function testAPIDirectly() {
  console.log('🧪 Testing API Endpoints Directly...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    const [dbTest] = await conn.query('SELECT 1 as test');
    console.log('✅ Database connection OK');
    
    // 2. Check if orders table exists and has data
    console.log('\n2. Checking orders table...');
    try {
      const [orderCount] = await conn.query('SELECT COUNT(*) as count FROM pesanan');
      console.log(`Total orders in database: ${orderCount[0].count}`);
      
      if (orderCount[0].count === 0) {
        console.log('❌ No orders found - this explains empty dashboard');
        console.log('Run: node create-test-orders.js to create test data');
        return;
      }
    } catch (error) {
      console.log('❌ Orders table might not exist:', error.message);
      return;
    }
    
    // 3. Check users
    console.log('\n3. Checking users...');
    const [buyers] = await conn.query('SELECT user_id, nama, email FROM user WHERE role = "pembeli"');
    console.log(`Found ${buyers.length} buyers:`);
    console.table(buyers);
    
    if (buyers.length === 0) {
      console.log('❌ No buyers found');
      return;
    }
    
    // 4. Test the my-orders endpoint query for each buyer
    console.log('\n4. Testing my-orders query for each buyer...');
    
    for (const buyer of buyers) {
      console.log(`\nTesting buyer: ${buyer.nama} (ID: ${buyer.user_id})`);
      
      const [orders] = await conn.query(`
        SELECT 
          p.pesanan_id, p.total_harga, p.status_pesanan as status, 
          p.alamat_kirim, p.created_at as tanggal_pesanan,
          p.tanggal_dikemas, p.tanggal_dikirim, p.tanggal_selesai,
          p.kurir_id, k.nama as kurir_nama, k.no_tlp as kurir_phone, k.avatar_url as kurir_avatar,
          p.ongkir, p.lokasi_terakhir, p.catatan_kurir
        FROM pesanan p
        LEFT JOIN user k ON k.user_id = p.kurir_id
        WHERE p.pembeli_id = ?
        ORDER BY p.created_at DESC
      `, [buyer.user_id]);
      
      console.log(`  Found ${orders.length} orders`);
      
      if (orders.length > 0) {
        console.log('  Sample order:');
        console.table([orders[0]]);
        
        // Get items for first order
        const [items] = await conn.query(`
          SELECT 
            i.produk_id, i.jumlah, i.harga_saat_beli as harga,
            pr.nama_produk, pr.photo_url
          FROM pesanan_item i
          JOIN produk pr ON pr.produk_id = i.produk_id
          WHERE i.pesanan_id = ?
        `, [orders[0].pesanan_id]);
        
        console.log(`  Order items: ${items.length}`);
        if (items.length > 0) {
          console.table(items);
        }
      }
    }
    
    // 5. Check if there are any issues with the query
    console.log('\n5. Checking for potential query issues...');
    
    // Check for orders with missing items
    const [ordersWithoutItems] = await conn.query(`
      SELECT p.pesanan_id, p.pembeli_id, p.status_pesanan
      FROM pesanan p
      LEFT JOIN pesanan_item pi ON pi.pesanan_id = p.pesanan_id
      WHERE pi.pesanan_id IS NULL
    `);
    
    if (ordersWithoutItems.length > 0) {
      console.log('⚠️ Found orders without items:');
      console.table(ordersWithoutItems);
    } else {
      console.log('✅ All orders have items');
    }
    
    // Check for items with missing products
    const [itemsWithoutProducts] = await conn.query(`
      SELECT pi.pesanan_item_id, pi.pesanan_id, pi.produk_id
      FROM pesanan_item pi
      LEFT JOIN produk pr ON pr.produk_id = pi.produk_id
      WHERE pr.produk_id IS NULL
    `);
    
    if (itemsWithoutProducts.length > 0) {
      console.log('⚠️ Found order items with missing products:');
      console.table(itemsWithoutProducts);
    } else {
      console.log('✅ All order items have valid products');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  } finally {
    conn.release();
  }
}

async function simulateAPICall() {
  console.log('\n🌐 Simulating Actual API Call...\n');
  
  // This simulates what happens when frontend calls /orders/my-orders
  const conn = await pool.getConnection();
  try {
    // Get first buyer
    const [buyers] = await conn.query('SELECT user_id FROM user WHERE role = "pembeli" LIMIT 1');
    
    if (buyers.length === 0) {
      console.log('❌ No buyers to test with');
      return;
    }
    
    const buyerId = buyers[0].user_id;
    console.log(`Simulating API call for buyer ID: ${buyerId}`);
    
    // Exact same query as in orders.js
    const [orders] = await conn.query(`
      SELECT 
        p.pesanan_id, p.total_harga, p.status_pesanan as status, 
        p.alamat_kirim, p.created_at as tanggal_pesanan,
        p.tanggal_dikemas, p.tanggal_dikirim, p.tanggal_selesai,
        p.kurir_id, k.nama as kurir_nama, k.no_tlp as kurir_phone, k.avatar_url as kurir_avatar,
        p.ongkir, p.lokasi_terakhir, p.catatan_kurir
      FROM pesanan p
      LEFT JOIN user k ON k.user_id = p.kurir_id
      WHERE p.pembeli_id = ?
      ORDER BY p.created_at DESC
    `, [buyerId]);

    console.log(`Query returned ${orders.length} orders`);

    // Process items for each order (exact same as API)
    for (const order of orders) {
      const [items] = await conn.query(`
        SELECT 
          i.produk_id, i.jumlah, i.harga_saat_beli as harga,
          pr.nama_produk, pr.photo_url
        FROM pesanan_item i
        JOIN produk pr ON pr.produk_id = i.produk_id
        WHERE i.pesanan_id = ?
      `, [order.pesanan_id]);
      
      order.items = items;
      
      // Ensure backward compatibility
      order.status_pesanan = order.status;
      order.created_at = order.tanggal_pesanan;
    }

    console.log('\nFinal API response would be:');
    console.log(JSON.stringify(orders, null, 2));
    
    if (orders.length === 0) {
      console.log('\n❌ API would return empty array - this is why dashboard is empty');
      console.log('Solutions:');
      console.log('1. Create test orders: node create-test-orders.js');
      console.log('2. Check if user is logged in as correct buyer');
      console.log('3. Check if orders exist for this specific buyer');
    } else {
      console.log('\n✅ API would return data - check frontend/authentication issues');
    }
    
  } catch (error) {
    console.error('❌ Error simulating API call:', error);
  } finally {
    conn.release();
  }
}

async function checkFrontendIssues() {
  console.log('\n🖥️ Checking Potential Frontend Issues...\n');
  
  console.log('Common frontend issues that cause empty dashboard:');
  console.log('');
  console.log('1. 🔐 Authentication Issues:');
  console.log('   - User not logged in');
  console.log('   - Invalid JWT token');
  console.log('   - Token expired');
  console.log('   - Wrong user role (not pembeli)');
  console.log('');
  console.log('2. 🌐 Network Issues:');
  console.log('   - Backend server not running');
  console.log('   - Wrong API base URL');
  console.log('   - CORS issues');
  console.log('   - Network timeout');
  console.log('');
  console.log('3. 🐛 JavaScript Errors:');
  console.log('   - Error in loadOrders() function');
  console.log('   - Error in API.authFetch()');
  console.log('   - Error parsing JSON response');
  console.log('   - Error in renderOrders() function');
  console.log('');
  console.log('4. 📱 Browser Issues:');
  console.log('   - Cached old JavaScript');
  console.log('   - LocalStorage issues');
  console.log('   - Browser console errors');
  console.log('');
  console.log('🔍 How to debug:');
  console.log('1. Open browser Developer Tools (F12)');
  console.log('2. Check Console tab for JavaScript errors');
  console.log('3. Check Network tab for API calls');
  console.log('4. Check Application tab for localStorage auth_token');
  console.log('5. Try hard refresh (Ctrl+F5)');
}

async function main() {
  console.log('🚀 Starting Direct API Testing...\n');
  
  try {
    await testAPIDirectly();
    await simulateAPICall();
    await checkFrontendIssues();
    
    console.log('\n📋 Summary:');
    console.log('If API returns data but dashboard is empty:');
    console.log('  → Frontend/authentication issue');
    console.log('If API returns empty array:');
    console.log('  → No orders in database for this user');
    console.log('If API throws error:');
    console.log('  → Database/backend issue');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}