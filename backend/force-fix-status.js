const { pool } = require('./src/db');

async function forceFixStatus() {
  console.log('🔧 Force Fixing Order Status...\n');
  
  const conn = await pool.getConnection();
  try {
    // Get all orders with empty status
    const [emptyOrders] = await conn.query(`
      SELECT pesanan_id, status_pesanan 
      FROM pesanan 
      WHERE status_pesanan = '' OR status_pesanan IS NULL
    `);
    
    console.log(`Found ${emptyOrders.length} orders with empty status`);
    
    // Update each order individually
    for (const order of emptyOrders) {
      console.log(`Updating order ${order.pesanan_id}...`);
      
      const [updateResult] = await conn.query(`
        UPDATE pesanan 
        SET status_pesanan = ? 
        WHERE pesanan_id = ?
      `, ['menunggu', order.pesanan_id]);
      
      console.log(`  Updated ${updateResult.affectedRows} rows`);
    }
    
    // Verify the fix
    console.log('\nVerifying fix...');
    const [verifyResult] = await conn.query(`
      SELECT pesanan_id, status_pesanan 
      FROM pesanan 
      WHERE pesanan_id IN (1, 10, 11, 15)
      ORDER BY pesanan_id
    `);
    
    console.table(verifyResult);
    
    // Final status distribution
    console.log('\nFinal status distribution:');
    const [finalDist] = await conn.query(`
      SELECT status_pesanan, COUNT(*) as count
      FROM pesanan 
      GROUP BY status_pesanan
      ORDER BY count DESC
    `);
    
    console.table(finalDist);
    
  } catch (error) {
    console.error('❌ Error force fixing status:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  try {
    await forceFixStatus();
    console.log('\n✅ Force fix completed!');
  } catch (error) {
    console.error('❌ Force fix failed:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}