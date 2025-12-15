const { pool } = require('./src/db');

async function fixOrderStatus() {
  console.log('🔧 Fixing Order Status Issues...\n');
  
  const conn = await pool.getConnection();
  try {
    // Check orders with empty status
    console.log('1. Checking orders with empty status...');
    const [emptyStatus] = await conn.query(`
      SELECT pesanan_id, status_pesanan, created_at 
      FROM pesanan 
      WHERE status_pesanan = '' OR status_pesanan IS NULL
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${emptyStatus.length} orders with empty status:`);
    console.table(emptyStatus);
    
    if (emptyStatus.length > 0) {
      console.log('\n2. Fixing empty status orders...');
      
      // Update empty status to 'menunggu' (waiting for payment)
      const [updateResult] = await conn.query(`
        UPDATE pesanan 
        SET status_pesanan = 'menunggu' 
        WHERE status_pesanan = '' OR status_pesanan IS NULL
      `);
      
      console.log(`✅ Updated ${updateResult.affectedRows} orders to 'menunggu' status`);
    }
    
    // Check current status distribution
    console.log('\n3. Current status distribution:');
    const [statusDist] = await conn.query(`
      SELECT status_pesanan, COUNT(*) as count
      FROM pesanan 
      GROUP BY status_pesanan
      ORDER BY count DESC
    `);
    
    console.table(statusDist);
    
    // Verify the fix
    console.log('\n4. Verifying fix - checking for empty status again...');
    const [verifyEmpty] = await conn.query(`
      SELECT COUNT(*) as count
      FROM pesanan 
      WHERE status_pesanan = '' OR status_pesanan IS NULL
    `);
    
    if (verifyEmpty[0].count === 0) {
      console.log('✅ All orders now have valid status');
    } else {
      console.log(`❌ Still ${verifyEmpty[0].count} orders with empty status`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing order status:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  console.log('🚀 Starting Order Status Fix...\n');
  
  try {
    await fixOrderStatus();
    console.log('\n✅ Order status fix completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart backend server if needed');
    console.log('2. Test buyer dashboard again');
    console.log('3. All orders should now display properly');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}