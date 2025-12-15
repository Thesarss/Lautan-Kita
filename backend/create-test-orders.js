const { pool } = require('./src/db');

async function createTestData() {
  console.log('🏗️ Creating Test Data for Buyer Dashboard...\n');
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // 1. Check if we have users
    console.log('1. Checking users in database...');
    const [users] = await conn.query('SELECT user_id, nama, email, role FROM user ORDER BY user_id');
    console.table(users);
    
    if (users.length === 0) {
      console.log('Creating test users...');
      
      // Create test buyer
      await conn.query(`
        INSERT INTO user (nama, email, password, role) 
        VALUES ('Test Pembeli', 'pembeli@test.com', '$2b$10$hash', 'pembeli')
      `);
      
      // Create test seller
      await conn.query(`
        INSERT INTO user (nama, email, password, role) 
        VALUES ('Test Penjual', 'penjual@test.com', '$2b$10$hash', 'penjual')
      `);
      
      console.log('✅ Created test users');
    }
    
    // Get buyer and seller IDs
    const [buyers] = await conn.query('SELECT user_id FROM user WHERE role = "pembeli" LIMIT 1');
    const [sellers] = await conn.query('SELECT user_id FROM user WHERE role = "penjual" LIMIT 1');
    
    if (buyers.length === 0 || sellers.length === 0) {
      console.log('❌ No buyers or sellers found');
      await conn.rollback();
      return;
    }
    
    const buyerId = buyers[0].user_id;
    const sellerId = sellers[0].user_id;
    
    console.log(`Using buyer ID: ${buyerId}, seller ID: ${sellerId}`);
    
    // 2. Check if we have products
    console.log('\n2. Checking products in database...');
    const [products] = await conn.query('SELECT produk_id, nama_produk, harga, stok, penjual_id FROM produk WHERE deleted_at IS NULL LIMIT 5');
    console.table(products);
    
    if (products.length === 0) {
      console.log('Creating test products...');
      
      const testProducts = [
        ['Ikan Tuna Segar', 45000, 10],
        ['Udang Windu', 85000, 5],
        ['Cumi-cumi Segar', 35000, 8]
      ];
      
      for (const [nama, harga, stok] of testProducts) {
        await conn.query(`
          INSERT INTO produk (penjual_id, nama_produk, harga, stok, status, tanggal_upload) 
          VALUES (?, ?, ?, ?, 'aktif', NOW())
        `, [sellerId, nama, harga, stok]);
      }
      
      console.log('✅ Created test products');
    }
    
    // Get available products
    const [availableProducts] = await conn.query(`
      SELECT produk_id, nama_produk, harga, stok 
      FROM produk 
      WHERE deleted_at IS NULL AND stok > 0 
      LIMIT 3
    `);
    
    // 3. Check existing orders
    console.log('\n3. Checking existing orders...');
    const [existingOrders] = await conn.query(`
      SELECT p.pesanan_id, p.pembeli_id, p.status_pesanan, p.total_harga, p.created_at,
             u.nama as pembeli_nama
      FROM pesanan p 
      LEFT JOIN user u ON u.user_id = p.pembeli_id 
      WHERE p.pembeli_id = ?
      ORDER BY p.created_at DESC
    `, [buyerId]);
    
    console.table(existingOrders);
    
    if (existingOrders.length === 0) {
      console.log('Creating test orders...');
      
      // Create multiple test orders with different statuses
      const orderStatuses = ['menunggu', 'diproses', 'dikirim', 'selesai'];
      
      for (let i = 0; i < orderStatuses.length && i < availableProducts.length; i++) {
        const product = availableProducts[i];
        const status = orderStatuses[i];
        const quantity = 1;
        const total = product.harga * quantity;
        
        // Create order
        const [orderResult] = await conn.query(`
          INSERT INTO pesanan (pembeli_id, alamat_kirim, total_harga, status_pesanan, created_at) 
          VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))
        `, [buyerId, `Alamat Test ${i + 1}, Jakarta`, total, status, i]);
        
        const orderId = orderResult.insertId;
        
        // Create order item
        await conn.query(`
          INSERT INTO pesanan_item (pesanan_id, produk_id, harga_saat_beli, jumlah, subtotal) 
          VALUES (?, ?, ?, ?, ?)
        `, [orderId, product.produk_id, product.harga, quantity, total]);
        
        console.log(`✅ Created order ${orderId} with status: ${status}`);
      }
    } else {
      console.log(`✅ Found ${existingOrders.length} existing orders`);
    }
    
    // 4. Test the API query
    console.log('\n4. Testing API query...');
    const [apiResult] = await conn.query(`
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
    
    console.log(`API query returned ${apiResult.length} orders:`);
    console.table(apiResult);
    
    // Get items for each order
    for (const order of apiResult) {
      const [items] = await conn.query(`
        SELECT 
          i.produk_id, i.jumlah, i.harga_saat_beli as harga,
          pr.nama_produk, pr.photo_url
        FROM pesanan_item i
        JOIN produk pr ON pr.produk_id = i.produk_id
        WHERE i.pesanan_id = ?
      `, [order.pesanan_id]);
      
      console.log(`Order ${order.pesanan_id} items:`, items);
    }
    
    await conn.commit();
    console.log('\n✅ Test data creation completed!');
    
    // 5. Provide test login credentials
    console.log('\n📋 Test Login Credentials:');
    console.log('Pembeli: pembeli@test.com / password123');
    console.log('Penjual: penjual@test.com / password123');
    
  } catch (error) {
    await conn.rollback();
    console.error('❌ Error creating test data:', error);
  } finally {
    conn.release();
  }
}

async function debugAPIEndpoint() {
  console.log('\n🔍 Debugging API Endpoint...\n');
  
  const conn = await pool.getConnection();
  try {
    // Test the exact endpoint logic
    const [buyers] = await conn.query('SELECT user_id FROM user WHERE role = "pembeli" LIMIT 1');
    
    if (buyers.length === 0) {
      console.log('❌ No buyers found');
      return;
    }
    
    const buyerId = buyers[0].user_id;
    console.log(`Testing with buyer ID: ${buyerId}`);
    
    // Simulate the exact API call
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

    console.log(`Found ${orders.length} orders for buyer ${buyerId}`);
    
    if (orders.length > 0) {
      // Process like the API does
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
        order.status_pesanan = order.status;
        order.created_at = order.tanggal_pesanan;
      }
      
      console.log('Processed orders (like API):');
      console.log(JSON.stringify(orders, null, 2));
    } else {
      console.log('❌ No orders found - this is why dashboard is empty');
    }
    
  } catch (error) {
    console.error('❌ Error debugging API:', error);
  } finally {
    conn.release();
  }
}

async function checkAuthenticationIssues() {
  console.log('\n🔐 Checking Authentication Issues...\n');
  
  const conn = await pool.getConnection();
  try {
    // Check if JWT secret is configured
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    console.log(`JWT Secret configured: ${jwtSecret !== 'default-secret' ? 'YES' : 'NO (using default)'}`);
    
    // Check user table structure
    console.log('\nUser table structure:');
    const [userStructure] = await conn.query('DESCRIBE user');
    console.table(userStructure);
    
    // Check sample users
    console.log('\nSample users:');
    const [sampleUsers] = await conn.query('SELECT user_id, nama, email, role, created_at FROM user LIMIT 5');
    console.table(sampleUsers);
    
    // Check if passwords are hashed
    const [passwordCheck] = await conn.query('SELECT user_id, email, password FROM user LIMIT 1');
    if (passwordCheck.length > 0) {
      const password = passwordCheck[0].password;
      console.log(`\nPassword format check:`);
      console.log(`Length: ${password.length}`);
      console.log(`Starts with $2b$: ${password.startsWith('$2b$') ? 'YES (bcrypt)' : 'NO (plain text?)'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  console.log('🚀 Starting Buyer Dashboard Debug & Test Data Creation...\n');
  
  try {
    await checkAuthenticationIssues();
    await createTestData();
    await debugAPIEndpoint();
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Restart your backend server');
    console.log('2. Login as pembeli@test.com / password123');
    console.log('3. Check dashboard pembeli');
    console.log('4. If still empty, check browser console for errors');
    console.log('5. Check network tab for API response');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}