const { pool } = require('./src/db');

async function debugSellerNameIssue() {
  console.log('🔍 Debugging Seller Name Issue in Checkout...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. Check user table structure
    console.log('1. Checking user table structure:');
    const [userColumns] = await conn.query('DESCRIBE user');
    console.log('User table columns:', userColumns.map(col => col.Field));
    
    // 2. Check sample users
    console.log('\n2. Sample users in database:');
    const [users] = await conn.query('SELECT user_id, nama, email, role FROM user LIMIT 5');
    console.table(users);
    
    // 3. Check products with seller info
    console.log('\n3. Products with seller information:');
    const [products] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.penjual_id, u.nama as penjual_nama, p.status
      FROM produk p 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      LIMIT 5
    `);
    console.table(products);
    
    // 4. Check cart items with seller info (the actual query used in checkout)
    console.log('\n4. Cart items query (same as checkout):');
    const [cartItems] = await conn.query(`
      SELECT i.item_id, i.jumlah, p.produk_id, p.nama_produk, p.harga, p.stok, 
             p.penjual_id, u.nama AS penjual_nama, (i.jumlah*p.harga) AS subtotal 
      FROM keranjang_item i 
      JOIN produk p ON p.produk_id = i.produk_id 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      LIMIT 5
    `);
    console.table(cartItems);
    
    // 5. Check for NULL or mismatched seller names
    console.log('\n5. Checking for NULL seller names:');
    const [nullSellers] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.penjual_id, u.nama as penjual_nama
      FROM produk p 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      WHERE u.nama IS NULL OR u.nama = ''
    `);
    
    if (nullSellers.length > 0) {
      console.log('❌ Found products with NULL/empty seller names:');
      console.table(nullSellers);
    } else {
      console.log('✅ No products with NULL seller names found');
    }
    
    // 6. Check for role mismatches
    console.log('\n6. Checking seller role consistency:');
    const [roleMismatch] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.penjual_id, u.nama, u.role
      FROM produk p 
      JOIN user u ON u.user_id = p.penjual_id 
      WHERE u.role != 'penjual'
    `);
    
    if (roleMismatch.length > 0) {
      console.log('❌ Found products with non-seller users:');
      console.table(roleMismatch);
    } else {
      console.log('✅ All product owners have penjual role');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    conn.release();
  }
}

async function debugProductDeletionIssue() {
  console.log('\n🗑️ Debugging Product Deletion Issue...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. Check inactive products
    console.log('1. Inactive products in database:');
    const [inactiveProducts] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.status, p.penjual_id, u.nama as penjual_nama
      FROM produk p 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      WHERE p.status = 'nonaktif'
    `);
    console.table(inactiveProducts);
    
    // 2. Check if inactive products have pending orders
    for (const product of inactiveProducts) {
      console.log(`\n2. Checking pending orders for product ${product.produk_id} (${product.nama_produk}):`);
      
      const [pendingOrders] = await conn.query(`
        SELECT COUNT(*) as count FROM pesanan_item pi 
        JOIN pesanan p ON p.pesanan_id = pi.pesanan_id 
        WHERE pi.produk_id = ? AND p.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim')
      `, [product.produk_id]);
      
      console.log(`   Pending orders: ${pendingOrders[0].count}`);
      
      if (pendingOrders[0].count > 0) {
        // Show the actual pending orders
        const [orders] = await conn.query(`
          SELECT p.pesanan_id, p.status_pesanan, p.created_at, pi.jumlah
          FROM pesanan_item pi 
          JOIN pesanan p ON p.pesanan_id = pi.pesanan_id 
          WHERE pi.produk_id = ? AND p.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim')
        `, [product.produk_id]);
        
        console.log('   Pending orders details:');
        console.table(orders);
      }
    }
    
    // 3. Check all order statuses
    console.log('\n3. All order statuses in database:');
    const [orderStatuses] = await conn.query(`
      SELECT status_pesanan, COUNT(*) as count 
      FROM pesanan 
      GROUP BY status_pesanan
    `);
    console.table(orderStatuses);
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    conn.release();
  }
}

async function fixSellerNameIssue() {
  console.log('\n🔧 Attempting to fix seller name issues...\n');
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // 1. Find products with missing seller info
    const [orphanProducts] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.penjual_id
      FROM produk p 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      WHERE u.user_id IS NULL
    `);
    
    if (orphanProducts.length > 0) {
      console.log('❌ Found orphan products (no matching seller):');
      console.table(orphanProducts);
      
      // Option 1: Delete orphan products
      console.log('Deleting orphan products...');
      for (const product of orphanProducts) {
        await conn.query('DELETE FROM produk WHERE produk_id = ?', [product.produk_id]);
        console.log(`   Deleted product ${product.produk_id}: ${product.nama_produk}`);
      }
    }
    
    // 2. Find users with wrong roles who own products
    const [wrongRoleUsers] = await conn.query(`
      SELECT DISTINCT u.user_id, u.nama, u.role, COUNT(p.produk_id) as product_count
      FROM user u 
      JOIN produk p ON p.penjual_id = u.user_id 
      WHERE u.role != 'penjual'
      GROUP BY u.user_id
    `);
    
    if (wrongRoleUsers.length > 0) {
      console.log('❌ Found users with wrong roles who own products:');
      console.table(wrongRoleUsers);
      
      // Fix their roles
      console.log('Fixing user roles...');
      for (const user of wrongRoleUsers) {
        await conn.query('UPDATE user SET role = ? WHERE user_id = ?', ['penjual', user.user_id]);
        console.log(`   Fixed role for user ${user.user_id}: ${user.nama} -> penjual`);
      }
    }
    
    await conn.commit();
    console.log('✅ Seller name issues fixed!');
    
  } catch (error) {
    await conn.rollback();
    console.error('❌ Error fixing seller names:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  console.log('🚀 Starting Checkout & Product Deletion Debug...\n');
  
  try {
    await debugSellerNameIssue();
    await debugProductDeletionIssue();
    
    // Ask if user wants to fix issues
    console.log('\n❓ Do you want to attempt automatic fixes? (This will modify data)');
    console.log('   Run with --fix flag to apply fixes: node debug-checkout-seller-name.js --fix');
    
    if (process.argv.includes('--fix')) {
      await fixSellerNameIssue();
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}