const { pool } = require('./src/db');

async function fixEmptyStatus() {
  console.log('🔧 Fixing Empty Status Orders...\n');
  
  const conn = await pool.getConnection();
  try {
    // First, let's see what the actual values are
    console.log('1. Checking actual status values...');
    const [allStatuses] = await conn.query(`
      SELECT pesanan_id, status_pesanan, LENGTH(status_pesanan) as length, ASCII(status_pesanan) as ascii_code
      FROM pesanan 
      ORDER BY pesanan_id DESC
      LIMIT 10
    `);
    
    console.table(allStatuses);
    
    // Update orders with empty string status
    console.log('\n2. Updating empty string status...');
    const [updateEmpty] = await conn.query(`
      UPDATE pesanan 
      SET status_pesanan = 'menunggu' 
      WHERE status_pesanan = ''
    `);
    console.log(`Updated ${updateEmpty.affectedRows} orders with empty string status`);
    
    // Update orders with NULL status
    console.log('\n3. Updating NULL status...');
    const [updateNull] = await conn.query(`
      UPDATE pesanan 
      SET status_pesanan = 'menunggu' 
      WHERE status_pesanan IS NULL
    `);
    console.log(`Updated ${updateNull.affectedRows} orders with NULL status`);
    
    // Update orders with whitespace-only status
    console.log('\n4. Updating whitespace-only status...');
    const [updateWhitespace] = await conn.query(`
      UPDATE pesanan 
      SET status_pesanan = 'menunggu' 
      WHERE TRIM(status_pesanan) = ''
    `);
    console.log(`Updated ${updateWhitespace.affectedRows} orders with whitespace-only status`);
    
    // Check final status distribution
    console.log('\n5. Final status distribution:');
    const [finalDist] = await conn.query(`
      SELECT status_pesanan, COUNT(*) as count
      FROM pesanan 
      GROUP BY status_pesanan
      ORDER BY count DESC
    `);
    
    console.table(finalDist);
    
    // Verify no empty statuses remain
    console.log('\n6. Verifying no empty statuses remain...');
    const [emptyCheck] = await conn.query(`
      SELECT COUNT(*) as count
      FROM pesanan 
      WHERE status_pesanan = '' OR status_pesanan IS NULL OR TRIM(status_pesanan) = ''
    `);
    
    if (emptyCheck[0].count === 0) {
      console.log('✅ All orders now have valid status');
    } else {
      console.log(`❌ Still ${emptyCheck[0].count} orders with empty/invalid status`);
      
      // Show the problematic orders
      const [problemOrders] = await conn.query(`
        SELECT pesanan_id, status_pesanan, LENGTH(status_pesanan) as length
        FROM pesanan 
        WHERE status_pesanan = '' OR status_pesanan IS NULL OR TRIM(status_pesanan) = ''
      `);
      console.table(problemOrders);
    }
    
  } catch (error) {
    console.error('❌ Error fixing empty status:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  try {
    await fixEmptyStatus();
    console.log('\n✅ Empty status fix completed!');
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}