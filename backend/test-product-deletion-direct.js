const { pool } = require('./src/db');
const jwt = require('jsonwebtoken');

// Simulate the exact deletion process
async function testProductDeletionDirect() {
  console.log('🧪 Testing Product Deletion Directly...\n');
  
  const conn = await pool.getConnection();
  try {
    // 1. First, let's see what products exist
    console.log('1. Current products in database:');
    const [allProducts] = await conn.query(`
      SELECT p.produk_id, p.nama_produk, p.status, p.penjual_id, u.nama as penjual_nama
      FROM produk p 
      LEFT JOIN user u ON u.user_id = p.penjual_id 
      ORDER BY p.produk_id DESC
      LIMIT 5
    `);
    console.table(allProducts);
    
    // 2. Create a test inactive product if none exists
    let testProductId = null;
    let testPenjualId = null;
    
    const [inactiveProducts] = await conn.query(`
      SELECT produk_id, penjual_id FROM produk WHERE status = 'nonaktif' LIMIT 1
    `);
    
    if (inactiveProducts.length === 0) {
      console.log('\n2. Creating test inactive product...');
      
      // Get a seller ID
      const [sellers] = await conn.query(`SELECT user_id FROM user WHERE role = 'penjual' LIMIT 1`);
      if (sellers.length === 0) {
        console.log('❌ No sellers found in database');
        return;
      }
      
      testPenjualId = sellers[0].user_id;
      
      const [insertResult] = await conn.query(`
        INSERT INTO produk (penjual_id, nama_produk, harga, stok, status, tanggal_upload) 
        VALUES (?, 'Test Produk Nonaktif untuk Hapus', 15000, 0, 'nonaktif', NOW())
      `, [testPenjualId]);
      
      testProductId = insertResult.insertId;
      console.log(`✅ Created test product with ID: ${testProductId}`);
    } else {
      testProductId = inactiveProducts[0].produk_id;
      testPenjualId = inactiveProducts[0].penjual_id;
      console.log(`\n2. Using existing inactive product ID: ${testProductId}`);
    }
    
    // 3. Simulate the exact deletion logic from the API
    console.log(`\n3. Testing deletion logic for product ${testProductId}...`);
    
    await conn.beginTransaction();
    
    try {
      // Step 1: Check if product exists and belongs to seller
      console.log('   Step 1: Checking product ownership...');
      const [own] = await conn.query('SELECT produk_id, photo_url, status FROM produk WHERE produk_id=? AND penjual_id=? LIMIT 1', [testProductId, testPenjualId]);
      
      if (!own.length) {
        console.log('   ❌ Product not found or doesn\'t belong to seller');
        await conn.rollback();
        return;
      }
      
      console.log(`   ✅ Product found: ID=${own[0].produk_id}, Status=${own[0].status}`);
      
      // Step 2: Check status and pending orders
      const productStatus = own[0].status;
      console.log(`   Step 2: Product status is '${productStatus}'`);
      
      if (productStatus === 'aktif') {
        console.log('   Checking pending orders for active product...');
        const [pendingOrders] = await conn.query(`
          SELECT COUNT(*) as count FROM pesanan_item pi 
          JOIN pesanan p ON p.pesanan_id = pi.pesanan_id 
          WHERE pi.produk_id = ? AND p.status_pesanan IN ('pending', 'menunggu', 'diproses', 'dikemas', 'dikirim')
        `, [testProductId]);
        
        console.log(`   Pending orders: ${pendingOrders[0].count}`);
        
        if (pendingOrders[0].count > 0) {
          console.log('   ❌ Cannot delete: has pending orders');
          await conn.rollback();
          return;
        }
      } else {
        console.log('   ✅ Product is inactive, skipping pending orders check');
      }
      
      // Step 3: Delete related records first
      console.log('   Step 3: Deleting related records...');
      
      // Delete cart items
      const [deletedCartItems] = await conn.query('DELETE FROM keranjang_item WHERE produk_id = ?', [testProductId]);
      console.log(`   Deleted ${deletedCartItems.affectedRows} cart items`);
      
      // Delete image file if exists
      const photoUrl = own[0].photo_url;
      if (photoUrl) {
        console.log(`   Found image: ${photoUrl}`);
        const path = require('path');
        const fs = require('fs');
        const fileAbs = path.join(__dirname, '..', photoUrl);
        try {
          if (fs.existsSync(fileAbs)) {
            fs.unlinkSync(fileAbs);
            console.log('   ✅ Image file deleted');
          } else {
            console.log('   ⚠️ Image file not found on disk');
          }
        } catch (e) {
          console.log(`   ⚠️ Failed to delete image: ${e.message}`);
        }
      }
      
      // Step 4: Delete the product
      console.log('   Step 4: Deleting product...');
      const [deleteResult] = await conn.query('DELETE FROM produk WHERE produk_id=? AND penjual_id=?', [testProductId, testPenjualId]);
      
      if (deleteResult.affectedRows > 0) {
        console.log(`   ✅ Product deleted successfully! (${deleteResult.affectedRows} rows affected)`);
        await conn.commit();
        
        // Verify deletion
        const [verifyDelete] = await conn.query('SELECT COUNT(*) as count FROM produk WHERE produk_id = ?', [testProductId]);
        console.log(`   Verification: ${verifyDelete[0].count} products remain with this ID`);
        
      } else {
        console.log('   ❌ No rows affected - deletion failed');
        await conn.rollback();
      }
      
    } catch (deleteError) {
      await conn.rollback();
      console.error('   ❌ Error during deletion process:', deleteError);
      
      // Check if it's a foreign key constraint error
      if (deleteError.code === 'ER_ROW_IS_REFERENCED_2') {
        console.log('   🔍 Foreign key constraint violation detected');
        
        // Find which tables reference this product
        const [references] = await conn.query(`
          SELECT TABLE_NAME, COLUMN_NAME 
          FROM information_schema.KEY_COLUMN_USAGE 
          WHERE REFERENCED_TABLE_NAME = 'produk' 
          AND REFERENCED_COLUMN_NAME = 'produk_id'
          AND TABLE_SCHEMA = DATABASE()
        `);
        
        console.log('   Tables that reference produk:');
        console.table(references);
        
        // Check actual references
        for (const ref of references) {
          const [refCount] = await conn.query(`SELECT COUNT(*) as count FROM ${ref.TABLE_NAME} WHERE ${ref.COLUMN_NAME} = ?`, [testProductId]);
          console.log(`   ${ref.TABLE_NAME}.${ref.COLUMN_NAME}: ${refCount[0].count} references`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    conn.release();
  }
}

async function checkDatabaseConstraints() {
  console.log('\n🔍 Checking Database Constraints...\n');
  
  const conn = await pool.getConnection();
  try {
    // Check foreign key constraints
    console.log('1. Foreign key constraints on produk table:');
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
    
    if (constraints.length > 0) {
      console.table(constraints);
    } else {
      console.log('✅ No foreign key constraints found');
    }
    
    // Check table structure
    console.log('\n2. Produk table structure:');
    const [structure] = await conn.query('DESCRIBE produk');
    console.table(structure);
    
  } catch (error) {
    console.error('❌ Error checking constraints:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  console.log('🚀 Starting Direct Product Deletion Test...\n');
  
  try {
    await checkDatabaseConstraints();
    await testProductDeletionDirect();
    
    console.log('\n📋 Test completed!');
    console.log('\nIf the test shows successful deletion but the frontend still fails:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Check network tab for API response details');
    console.log('3. Verify you\'re logged in as the correct seller');
    console.log('4. Make sure the backend server is running on port 4000');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}