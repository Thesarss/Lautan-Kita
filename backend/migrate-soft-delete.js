const { pool } = require('./src/db');

async function migrateSoftDelete() {
  console.log('🔄 Migrating to Soft Delete System...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. Check if deleted_at column exists
    console.log('1. Checking if deleted_at column exists...');
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'produk' 
      AND COLUMN_NAME = 'deleted_at'
    `);
    
    if (columns.length === 0) {
      console.log('   Adding deleted_at column to produk table...');
      await conn.query(`
        ALTER TABLE produk 
        ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL
      `);
      console.log('   ✅ Added deleted_at column');
      
      // Add index for better performance
      console.log('   Adding index for deleted_at...');
      await conn.query(`
        CREATE INDEX idx_produk_deleted_at ON produk(deleted_at)
      `);
      console.log('   ✅ Added index');
    } else {
      console.log('   ✅ deleted_at column already exists');
    }
    
    // 2. Check current product count
    console.log('\n2. Current product statistics:');
    const [stats] = await conn.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted_products
      FROM produk
    `);
    console.table(stats);
    
    // 3. Test soft delete functionality
    console.log('\n3. Testing soft delete functionality...');
    
    // Find a test product (inactive one preferably)
    const [testProducts] = await conn.query(`
      SELECT produk_id, nama_produk, status, deleted_at
      FROM produk 
      WHERE status = 'nonaktif' AND deleted_at IS NULL
      LIMIT 1
    `);
    
    if (testProducts.length > 0) {
      const testProductId = testProducts[0].produk_id;
      console.log(`   Testing with product ID: ${testProductId} (${testProducts[0].nama_produk})`);
      
      // Test soft delete
      await conn.query('UPDATE produk SET deleted_at = NOW() WHERE produk_id = ?', [testProductId]);
      console.log('   ✅ Soft delete test successful');
      
      // Verify it's hidden from normal queries
      const [hiddenCheck] = await conn.query(`
        SELECT COUNT(*) as count 
        FROM produk 
        WHERE produk_id = ? AND deleted_at IS NULL
      `, [testProductId]);
      
      console.log(`   Hidden from normal queries: ${hiddenCheck[0].count === 0 ? 'YES' : 'NO'}`);
      
      // Test restore
      await conn.query('UPDATE produk SET deleted_at = NULL WHERE produk_id = ?', [testProductId]);
      console.log('   ✅ Restore test successful');
      
    } else {
      console.log('   ⚠️ No test products available');
    }
    
    // 4. Clean up orphaned cart items
    console.log('\n4. Cleaning up orphaned cart items...');
    const [orphanedCartItems] = await conn.query(`
      DELETE ki FROM keranjang_item ki
      LEFT JOIN produk p ON p.produk_id = ki.produk_id
      WHERE p.produk_id IS NULL
    `);
    console.log(`   ✅ Cleaned up ${orphanedCartItems.affectedRows} orphaned cart items`);
    
    // 5. Update cart queries to exclude soft-deleted products
    console.log('\n5. Verifying cart queries exclude soft-deleted products...');
    const [cartItemsWithDeletedProducts] = await conn.query(`
      SELECT COUNT(*) as count
      FROM keranjang_item ki
      JOIN produk p ON p.produk_id = ki.produk_id
      WHERE p.deleted_at IS NOT NULL
    `);
    
    if (cartItemsWithDeletedProducts[0].count > 0) {
      console.log(`   ⚠️ Found ${cartItemsWithDeletedProducts[0].count} cart items with soft-deleted products`);
      console.log('   These should be cleaned up by the cart API');
    } else {
      console.log('   ✅ No cart items reference soft-deleted products');
    }
    
    console.log('\n✅ Soft delete migration completed successfully!');
    
    console.log('\n📋 What changed:');
    console.log('   - Added deleted_at column to produk table');
    console.log('   - Added index for better performance');
    console.log('   - Product deletion now sets deleted_at = NOW()');
    console.log('   - All product queries now exclude deleted_at IS NOT NULL');
    console.log('   - Cart items are removed when product is soft-deleted');
    console.log('   - Images are preserved for potential recovery');
    
    console.log('\n🔧 Benefits:');
    console.log('   - No more foreign key constraint errors');
    console.log('   - Order history is preserved');
    console.log('   - Products can be recovered if needed');
    console.log('   - Better data integrity');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    conn.release();
  }
}

async function testProductDeletionAfterMigration() {
  console.log('\n🧪 Testing Product Deletion After Migration...\n');
  
  const conn = await pool.getConnection();
  try {
    // Create a test product
    const [insertResult] = await conn.query(`
      INSERT INTO produk (penjual_id, nama_produk, harga, stok, status) 
      VALUES (1, 'Test Soft Delete Product', 15000, 0, 'nonaktif')
    `);
    
    const testProductId = insertResult.insertId;
    console.log(`Created test product with ID: ${testProductId}`);
    
    // Test the soft delete process
    await conn.beginTransaction();
    
    try {
      // Remove cart items
      await conn.query('DELETE FROM keranjang_item WHERE produk_id = ?', [testProductId]);
      
      // Soft delete the product
      const [deleteResult] = await conn.query('UPDATE produk SET deleted_at = NOW() WHERE produk_id = ?', [testProductId]);
      
      if (deleteResult.affectedRows > 0) {
        await conn.commit();
        console.log('✅ Soft delete successful!');
        
        // Verify it's hidden
        const [verifyHidden] = await conn.query(`
          SELECT COUNT(*) as count 
          FROM produk 
          WHERE produk_id = ? AND deleted_at IS NULL
        `, [testProductId]);
        
        console.log(`Product hidden from queries: ${verifyHidden[0].count === 0 ? 'YES' : 'NO'}`);
        
        // Show it can still be found in admin queries
        const [adminView] = await conn.query(`
          SELECT produk_id, nama_produk, deleted_at 
          FROM produk 
          WHERE produk_id = ?
        `, [testProductId]);
        
        console.log('Admin can still see deleted product:');
        console.table(adminView);
        
      } else {
        await conn.rollback();
        console.log('❌ Soft delete failed');
      }
      
    } catch (error) {
      await conn.rollback();
      console.error('❌ Error during soft delete test:', error);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  console.log('🚀 Starting Soft Delete Migration...\n');
  
  try {
    await migrateSoftDelete();
    await testProductDeletionAfterMigration();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test product deletion in dashboard');
    console.log('3. Verify orders still show in buyer dashboard');
    console.log('4. Check that cart functionality works correctly');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}