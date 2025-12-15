const { pool } = require('./src/db');

async function fixSellerDataIssues() {
  console.log('🔧 Fixing Seller Data Issues...\n');
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    console.log('1. Checking for orphan products (products without valid sellers)...');
    
    // Find products with invalid seller references
    const [orphanProducts] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.penjual_id
      FROM produk p 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      WHERE u.user_id IS NULL OR u.role != 'penjual'
    `);
    
    if (orphanProducts.length > 0) {
      console.log(`❌ Found ${orphanProducts.length} orphan products:`);
      console.table(orphanProducts);
      
      // Delete orphan products and their related data
      for (const product of orphanProducts) {
        // Delete from cart items first
        await conn.query('DELETE FROM keranjang_item WHERE produk_id = ?', [product.produk_id]);
        
        // Delete the product
        await conn.query('DELETE FROM produk WHERE produk_id = ?', [product.produk_id]);
        
        console.log(`   ✅ Deleted orphan product: ${product.nama_produk} (ID: ${product.produk_id})`);
      }
    } else {
      console.log('✅ No orphan products found');
    }
    
    console.log('\n2. Checking for users who own products but have wrong role...');
    
    // Find users who own products but don't have penjual role
    const [wrongRoleUsers] = await conn.query(`
      SELECT DISTINCT u.user_id, u.nama, u.email, u.role, COUNT(p.produk_id) as product_count
      FROM user u 
      JOIN produk p ON p.penjual_id = u.user_id 
      WHERE u.role != 'penjual'
      GROUP BY u.user_id
    `);
    
    if (wrongRoleUsers.length > 0) {
      console.log(`❌ Found ${wrongRoleUsers.length} users with wrong roles:`);
      console.table(wrongRoleUsers);
      
      // Fix their roles
      for (const user of wrongRoleUsers) {
        await conn.query('UPDATE user SET role = ? WHERE user_id = ?', ['penjual', user.user_id]);
        console.log(`   ✅ Fixed role for ${user.nama} (${user.email}): ${user.role} -> penjual`);
      }
    } else {
      console.log('✅ All product owners have correct penjual role');
    }
    
    console.log('\n3. Checking for products with NULL/empty names...');
    
    // Find products with missing names
    const [invalidProducts] = await conn.query(`
      SELECT produk_id, nama_produk, penjual_id
      FROM produk 
      WHERE nama_produk IS NULL OR nama_produk = '' OR TRIM(nama_produk) = ''
    `);
    
    if (invalidProducts.length > 0) {
      console.log(`❌ Found ${invalidProducts.length} products with invalid names:`);
      console.table(invalidProducts);
      
      // Delete invalid products
      for (const product of invalidProducts) {
        await conn.query('DELETE FROM keranjang_item WHERE produk_id = ?', [product.produk_id]);
        await conn.query('DELETE FROM produk WHERE produk_id = ?', [product.produk_id]);
        console.log(`   ✅ Deleted invalid product (ID: ${product.produk_id})`);
      }
    } else {
      console.log('✅ All products have valid names');
    }
    
    console.log('\n4. Cleaning up empty cart items...');
    
    // Remove cart items with invalid product references
    const [deletedCartItems] = await conn.query(`
      DELETE ki FROM keranjang_item ki 
      LEFT JOIN produk p ON p.produk_id = ki.produk_id 
      WHERE p.produk_id IS NULL
    `);
    
    console.log(`✅ Cleaned up ${deletedCartItems.affectedRows} invalid cart items`);
    
    console.log('\n5. Verifying fixes...');
    
    // Verify the cart query works correctly now
    const [testCartItems] = await conn.query(`
      SELECT i.item_id, i.jumlah, p.produk_id, p.nama_produk, p.harga, p.stok, 
             p.penjual_id, COALESCE(u.nama, "Penjual Tidak Dikenal") AS penjual_nama, 
             (i.jumlah*p.harga) AS subtotal 
      FROM keranjang_item i 
      JOIN produk p ON p.produk_id = i.produk_id 
      LEFT JOIN user u ON u.user_id = p.penjual_id AND u.role = "penjual" 
      LIMIT 5
    `);
    
    console.log('Sample cart items after fix:');
    console.table(testCartItems);
    
    await conn.commit();
    console.log('\n✅ All seller data issues have been fixed!');
    
    console.log('\n📋 Summary of changes:');
    console.log(`   - Deleted ${orphanProducts.length} orphan products`);
    console.log(`   - Fixed roles for ${wrongRoleUsers.length} users`);
    console.log(`   - Deleted ${invalidProducts.length} invalid products`);
    console.log(`   - Cleaned up ${deletedCartItems.affectedRows} invalid cart items`);
    
  } catch (error) {
    await conn.rollback();
    console.error('❌ Error fixing seller data:', error);
    throw error;
  } finally {
    conn.release();
  }
}

async function testProductDeletion() {
  console.log('\n🧪 Testing Product Deletion for Inactive Products...\n');
  
  const conn = await pool.getConnection();
  try {
    // Find inactive products
    const [inactiveProducts] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.status, u.nama as penjual_nama
      FROM produk p 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      WHERE p.status = 'nonaktif'
      LIMIT 3
    `);
    
    if (inactiveProducts.length === 0) {
      console.log('ℹ️ No inactive products found to test deletion');
      return;
    }
    
    console.log('Found inactive products that should be deletable:');
    console.table(inactiveProducts);
    
    for (const product of inactiveProducts) {
      // Check if it has pending orders (should not block deletion for inactive products)
      const [pendingOrders] = await conn.query(`
        SELECT COUNT(*) as count FROM pesanan_item pi 
        JOIN pesanan p ON p.pesanan_id = pi.pesanan_id 
        WHERE pi.produk_id = ? AND p.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim')
      `, [product.produk_id]);
      
      console.log(`\nProduct ${product.produk_id} (${product.nama_produk}):`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Pending orders: ${pendingOrders[0].count}`);
      console.log(`   Should be deletable: ${product.status === 'nonaktif' ? 'YES' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing product deletion:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  console.log('🚀 Starting Seller Data Fix Process...\n');
  
  try {
    await fixSellerDataIssues();
    await testProductDeletion();
    
    console.log('\n🎉 Process completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the checkout page - seller names should now display correctly');
    console.log('   2. Test deleting inactive products - should work without errors');
    console.log('   3. Restart your backend server to ensure changes take effect');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}