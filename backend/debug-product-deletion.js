const { pool } = require('./src/db');

async function debugProductDeletion() {
  console.log('🔍 Debugging Product Deletion Issue...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. Check all products and their statuses
    console.log('1. All products in database:');
    const [allProducts] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.status, p.penjual_id, u.nama as penjual_nama
      FROM produk p 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      ORDER BY p.produk_id DESC
      LIMIT 10
    `);
    console.table(allProducts);
    
    // 2. Focus on inactive products
    console.log('\n2. Inactive products that should be deletable:');
    const [inactiveProducts] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.status, p.penjual_id, u.nama as penjual_nama
      FROM produk p 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      WHERE p.status = 'nonaktif'
    `);
    
    if (inactiveProducts.length === 0) {
      console.log('❌ No inactive products found. Let\'s create one for testing...');
      
      // Create a test inactive product
      const [testProduct] = await conn.query(`
        INSERT INTO produk (penjual_id, nama_produk, harga, stok, status) 
        VALUES (1, 'Test Produk Nonaktif', 10000, 0, 'nonaktif')
      `);
      
      console.log(`✅ Created test inactive product with ID: ${testProduct.insertId}`);
      
      // Get the created product
      const [newProduct] = await conn.query(`
        SELECT p.produk_id, p.nama_produk, p.status, p.penjual_id, u.nama as penjual_nama
        FROM produk p 
        LEFT JOIN user u ON u.user_id = p.penjual_id 
        WHERE p.produk_id = ?
      `, [testProduct.insertId]);
      
      console.table(newProduct);
    } else {
      console.table(inactiveProducts);
    }
    
    // 3. Check for any orders related to inactive products
    console.log('\n3. Checking orders for inactive products:');
    const [inactiveWithOrders] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.status, 
             COUNT(pi.pesanan_id) as total_orders,
             SUM(CASE WHEN pe.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim') THEN 1 ELSE 0 END) as pending_orders
      FROM produk p 
      LEFT JOIN pesanan_item pi ON pi.produk_id = p.produk_id
      LEFT JOIN pesanan pe ON pe.pesanan_id = pi.pesanan_id
      WHERE p.status = 'nonaktif'
      GROUP BY p.produk_id
      HAVING total_orders > 0
    `);
    
    if (inactiveWithOrders.length > 0) {
      console.table(inactiveWithOrders);
    } else {
      console.log('✅ No inactive products have orders');
    }
    
    // 4. Test the actual deletion logic
    console.log('\n4. Testing deletion logic for inactive products:');
    const [testInactive] = await conn.query(`
      SELECT produk_id, nama_produk, status, penjual_id 
      FROM produk 
      WHERE status = 'nonaktif' 
      LIMIT 1
    `);
    
    if (testInactive.length > 0) {
      const productId = testInactive[0].produk_id;
      const penjualId = testInactive[0].penjual_id;
      
      console.log(`Testing deletion for product ${productId} (${testInactive[0].nama_produk})`);
      
      // Simulate the deletion check
      const [own] = await conn.query('SELECT produk_id, photo_url, status FROM produk WHERE produk_id=? AND penjual_id=? LIMIT 1', [productId, penjualId]);
      
      if (own.length > 0) {
        console.log(`   ✅ Product found: ${own[0].produk_id}, Status: ${own[0].status}`);
        
        const productStatus = own[0].status;
        
        if (productStatus === 'aktif') {
          console.log('   ⚠️ Product is active, checking pending orders...');
          
          const [pendingOrders] = await conn.query(`
            SELECT COUNT(*) as count FROM pesanan_item pi 
            JOIN pesanan p ON p.pesanan_id = pi.pesanan_id 
            WHERE pi.produk_id = ? AND p.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim')
          `, [productId]);
          
          console.log(`   Pending orders: ${pendingOrders[0].count}`);
          
          if (pendingOrders[0].count > 0) {
            console.log('   ❌ Cannot delete: has pending orders');
          } else {
            console.log('   ✅ Can delete: no pending orders');
          }
        } else {
          console.log('   ✅ Product is inactive, can be deleted without checking orders');
        }
      } else {
        console.log('   ❌ Product not found or doesn\'t belong to seller');
      }
    }
    
    // 5. Check database constraints
    console.log('\n5. Checking database constraints:');
    const [constraints] = await conn.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_NAME = 'produk' 
      AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (constraints.length > 0) {
      console.log('Foreign key constraints on produk table:');
      console.table(constraints);
    } else {
      console.log('✅ No foreign key constraints found');
    }
    
    // 6. Check for any triggers
    console.log('\n6. Checking for triggers on produk table:');
    const [triggers] = await conn.query(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING
      FROM information_schema.TRIGGERS 
      WHERE EVENT_OBJECT_TABLE = 'produk' 
      AND EVENT_OBJECT_SCHEMA = DATABASE()
    `);
    
    if (triggers.length > 0) {
      console.table(triggers);
    } else {
      console.log('✅ No triggers found on produk table');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    conn.release();
  }
}

async function testActualDeletion() {
  console.log('\n🧪 Testing Actual Product Deletion...\n');
  
  const conn = await pool.getConnection();
  try {
    // Find an inactive product to test
    const [inactiveProduct] = await conn.query(`
      SELECT produk_id, nama_produk, status, penjual_id 
      FROM produk 
      WHERE status = 'nonaktif' 
      LIMIT 1
    `);
    
    if (inactiveProduct.length === 0) {
      console.log('❌ No inactive products found for testing');
      return;
    }
    
    const productId = inactiveProduct[0].produk_id;
    const penjualId = inactiveProduct[0].penjual_id;
    
    console.log(`Testing deletion of product ${productId}: ${inactiveProduct[0].nama_produk}`);
    
    await conn.beginTransaction();
    
    try {
      // Check if product exists and belongs to seller
      const [own] = await conn.query('SELECT produk_id, photo_url, status FROM produk WHERE produk_id=? AND penjual_id=? LIMIT 1', [productId, penjualId]);
      
      if (!own.length) {
        console.log('❌ Product not found or doesn\'t belong to seller');
        await conn.rollback();
        return;
      }
      
      const productStatus = own[0].status;
      console.log(`   Product status: ${productStatus}`);
      
      // Only check pending orders for active products
      if (productStatus === 'aktif') {
        console.log('   Checking pending orders for active product...');
        const [pendingOrders] = await conn.query(`
          SELECT COUNT(*) as count FROM pesanan_item pi 
          JOIN pesanan p ON p.pesanan_id = pi.pesanan_id 
          WHERE pi.produk_id = ? AND p.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim')
        `, [productId]);
        
        if (pendingOrders[0].count > 0) {
          console.log(`   ❌ Cannot delete: ${pendingOrders[0].count} pending orders`);
          await conn.rollback();
          return;
        }
      } else {
        console.log('   ✅ Product is inactive, skipping pending orders check');
      }
      
      // Delete related cart items first
      const [deletedCartItems] = await conn.query('DELETE FROM keranjang_item WHERE produk_id = ?', [productId]);
      console.log(`   Deleted ${deletedCartItems.affectedRows} cart items`);
      
      // Delete the product
      const [deleteResult] = await conn.query('DELETE FROM produk WHERE produk_id=? AND penjual_id=?', [productId, penjualId]);
      
      if (deleteResult.affectedRows > 0) {
        await conn.commit();
        console.log('   ✅ Product deleted successfully!');
      } else {
        await conn.rollback();
        console.log('   ❌ No rows affected - deletion failed');
      }
      
    } catch (deleteError) {
      await conn.rollback();
      console.error('   ❌ Error during deletion:', deleteError.message);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  console.log('🚀 Starting Product Deletion Debug...\n');
  
  try {
    await debugProductDeletion();
    
    console.log('\n' + '='.repeat(50));
    console.log('Do you want to test actual deletion? (This will delete a product!)');
    console.log('Run with --test-delete flag to proceed: node debug-product-deletion.js --test-delete');
    
    if (process.argv.includes('--test-delete')) {
      await testActualDeletion();
    }
    
    console.log('\n📝 Summary:');
    console.log('1. Check if you have inactive products in your database');
    console.log('2. Make sure you\'re logged in as the correct seller');
    console.log('3. Check browser console for any JavaScript errors');
    console.log('4. Check server logs for detailed error messages');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}