const { pool } = require('./src/db');

async function debugBuyerDashboard() {
  console.log('🔍 Debugging Buyer Dashboard - Orders Not Showing...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. Check if there are any orders in the database
    console.log('1. Checking orders in database:');
    const [allOrders] = await conn.query(`
      SELECT p.pesanan_id, p.pembeli_id, p.status_pesanan, p.total_harga, p.created_at,
             u.nama as pembeli_nama, u.email as pembeli_email
      FROM pesanan p 
      LEFT JOIN user u ON u.user_id = p.pembeli_id 
      ORDER BY p.created_at DESC 
      LIMIT 10
    `);
    
    if (allOrders.length === 0) {
      console.log('❌ No orders found in database');
      console.log('Creating test order...');
      await createTestOrder(conn);
    } else {
      console.log(`✅ Found ${allOrders.length} orders:`);
      console.table(allOrders);
    }
    
    // 2. Check buyers in the system
    console.log('\n2. Buyers in the system:');
    const [buyers] = await conn.query(`
      SELECT user_id, nama, email, role 
      FROM user 
      WHERE role = 'pembeli' 
      LIMIT 5
    `);
    console.table(buyers);
    
    // 3. Test the exact API endpoint query
    console.log('\n3. Testing my-orders API query:');
    
    if (buyers.length > 0) {
      const testBuyerId = buyers[0].user_id;
      console.log(`Testing with buyer ID: ${testBuyerId}`);
      
      const [myOrdersResult] = await conn.query(`
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
      `, [testBuyerId]);
      
      console.log(`Found ${myOrdersResult.length} orders for buyer ${testBuyerId}:`);
      if (myOrdersResult.length > 0) {
        console.table(myOrdersResult);
        
        // Get items for first order
        const firstOrderId = myOrdersResult[0].pesanan_id;
        const [items] = await conn.query(`
          SELECT 
            i.produk_id, i.jumlah, i.harga_saat_beli as harga,
            pr.nama_produk, pr.photo_url
          FROM pesanan_item i
          JOIN produk pr ON pr.produk_id = i.produk_id
          WHERE i.pesanan_id = ?
        `, [firstOrderId]);
        
        console.log(`\nItems for order ${firstOrderId}:`);
        console.table(items);
      } else {
        console.log('❌ No orders found for this buyer');
      }
    }
    
    // 4. Check for missing columns or schema issues
    console.log('\n4. Checking pesanan table structure:');
    const [pesananStructure] = await conn.query('DESCRIBE pesanan');
    console.table(pesananStructure);
    
    // 5. Check for missing foreign key relationships
    console.log('\n5. Checking pesanan_item relationships:');
    const [itemsWithoutProducts] = await conn.query(`
      SELECT pi.pesanan_item_id, pi.pesanan_id, pi.produk_id
      FROM pesanan_item pi
      LEFT JOIN produk p ON p.produk_id = pi.produk_id
      WHERE p.produk_id IS NULL
    `);
    
    if (itemsWithoutProducts.length > 0) {
      console.log('❌ Found order items with missing products:');
      console.table(itemsWithoutProducts);
    } else {
      console.log('✅ All order items have valid products');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    conn.release();
  }
}

async function createTestOrder(conn) {
  try {
    await conn.beginTransaction();
    
    // Get a buyer and a product
    const [buyers] = await conn.query('SELECT user_id FROM user WHERE role = "pembeli" LIMIT 1');
    const [products] = await conn.query('SELECT produk_id, harga FROM produk WHERE stok > 0 LIMIT 1');
    
    if (buyers.length === 0 || products.length === 0) {
      console.log('❌ Cannot create test order: missing buyer or product');
      await conn.rollback();
      return;
    }
    
    const buyerId = buyers[0].user_id;
    const productId = products[0].produk_id;
    const price = products[0].harga;
    const quantity = 1;
    const total = price * quantity;
    
    // Create order
    const [orderResult] = await conn.query(`
      INSERT INTO pesanan (pembeli_id, alamat_kirim, total_harga, status_pesanan, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `, [buyerId, 'Test Address', total, 'menunggu']);
    
    const orderId = orderResult.insertId;
    
    // Create order item
    await conn.query(`
      INSERT INTO pesanan_item (pesanan_id, produk_id, harga_saat_beli, jumlah, subtotal) 
      VALUES (?, ?, ?, ?, ?)
    `, [orderId, productId, price, quantity, total]);
    
    await conn.commit();
    console.log(`✅ Created test order with ID: ${orderId}`);
    
  } catch (error) {
    await conn.rollback();
    console.error('❌ Error creating test order:', error);
  }
}

async function fixForeignKeyConstraints() {
  console.log('\n🔧 Fixing Foreign Key Constraints for Product Deletion...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. Check current foreign key constraints
    console.log('1. Current foreign key constraints:');
    const [constraints] = await conn.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME,
        DELETE_RULE,
        UPDATE_RULE
      FROM information_schema.REFERENTIAL_CONSTRAINTS rc
      JOIN information_schema.KEY_COLUMN_USAGE kcu ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE kcu.REFERENCED_TABLE_NAME = 'produk' 
      AND kcu.TABLE_SCHEMA = DATABASE()
    `);
    
    console.table(constraints);
    
    // 2. Check for orphaned records
    console.log('\n2. Checking for orphaned records:');
    
    // Check pesanan_item without valid products
    const [orphanedItems] = await conn.query(`
      SELECT pi.pesanan_item_id, pi.pesanan_id, pi.produk_id
      FROM pesanan_item pi
      LEFT JOIN produk p ON p.produk_id = pi.produk_id
      WHERE p.produk_id IS NULL
    `);
    
    if (orphanedItems.length > 0) {
      console.log(`❌ Found ${orphanedItems.length} orphaned order items:`);
      console.table(orphanedItems);
    } else {
      console.log('✅ No orphaned order items found');
    }
    
    // Check keranjang_item without valid products
    const [orphanedCartItems] = await conn.query(`
      SELECT ki.item_id, ki.keranjang_id, ki.produk_id
      FROM keranjang_item ki
      LEFT JOIN produk p ON p.produk_id = ki.produk_id
      WHERE p.produk_id IS NULL
    `);
    
    if (orphanedCartItems.length > 0) {
      console.log(`❌ Found ${orphanedCartItems.length} orphaned cart items:`);
      console.table(orphanedCartItems);
      
      // Clean up orphaned cart items
      console.log('Cleaning up orphaned cart items...');
      const [deleteResult] = await conn.query(`
        DELETE ki FROM keranjang_item ki
        LEFT JOIN produk p ON p.produk_id = ki.produk_id
        WHERE p.produk_id IS NULL
      `);
      console.log(`✅ Deleted ${deleteResult.affectedRows} orphaned cart items`);
    } else {
      console.log('✅ No orphaned cart items found');
    }
    
    // 3. Create a strategy for handling product deletion with related data
    console.log('\n3. Strategy for product deletion with related data:');
    console.log('   Option 1: Soft delete (change status to "deleted")');
    console.log('   Option 2: Archive related data before deletion');
    console.log('   Option 3: Prevent deletion if has order history');
    
    // Check products that have order history
    const [productsWithOrders] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.status, COUNT(pi.pesanan_item_id) as order_count
      FROM produk p
      LEFT JOIN pesanan_item pi ON pi.produk_id = p.produk_id
      GROUP BY p.produk_id
      HAVING order_count > 0
      ORDER BY order_count DESC
      LIMIT 10
    `);
    
    console.log('\nProducts with order history:');
    console.table(productsWithOrders);
    
  } catch (error) {
    console.error('❌ Error fixing foreign key constraints:', error);
  } finally {
    conn.release();
  }
}

async function implementSoftDelete() {
  console.log('\n🔧 Implementing Soft Delete for Products...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. Check if deleted_at column exists
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'produk' 
      AND COLUMN_NAME = 'deleted_at'
    `);
    
    if (columns.length === 0) {
      console.log('Adding deleted_at column to produk table...');
      await conn.query(`
        ALTER TABLE produk 
        ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL
      `);
      console.log('✅ Added deleted_at column');
    } else {
      console.log('✅ deleted_at column already exists');
    }
    
    // 2. Update product queries to exclude soft-deleted products
    console.log('\n2. Soft delete implementation ready');
    console.log('   - Products with deleted_at != NULL are considered deleted');
    console.log('   - All queries should add WHERE deleted_at IS NULL');
    console.log('   - Delete operation sets deleted_at = NOW()');
    
  } catch (error) {
    console.error('❌ Error implementing soft delete:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  console.log('🚀 Starting Buyer Dashboard & Product Deletion Debug...\n');
  
  try {
    await debugBuyerDashboard();
    await fixForeignKeyConstraints();
    
    console.log('\n❓ Do you want to implement soft delete for products?');
    console.log('   This will allow "deleting" products while preserving order history.');
    console.log('   Run with --soft-delete flag: node debug-buyer-dashboard.js --soft-delete');
    
    if (process.argv.includes('--soft-delete')) {
      await implementSoftDelete();
    }
    
    console.log('\n📋 Summary:');
    console.log('1. Check if orders exist in database');
    console.log('2. Verify buyer authentication');
    console.log('3. Test API endpoint directly');
    console.log('4. Check browser console for errors');
    console.log('5. Consider implementing soft delete for products');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}