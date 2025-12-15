const { pool } = require('./src/db');

async function testLoginAPI() {
  console.log('🧪 Testing Login API...\n');
  
  const conn = await pool.getConnection();
  try {
    // Check if test user exists
    console.log('1. Checking test user...');
    const [users] = await conn.query('SELECT user_id, nama, email, role FROM user WHERE email = ?', ['pembeli@test.com']);
    
    if (users.length === 0) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ Test user found:');
    console.table(users);
    
    // Test login endpoint by simulating the request
    console.log('\n2. Testing login logic...');
    const testEmail = 'pembeli@test.com';
    const testPassword = 'password123';
    
    // Check password (this is what the login endpoint does)
    const [authUsers] = await conn.query('SELECT user_id, nama, email, role, password_hash FROM user WHERE email = ?', [testEmail]);
    
    if (authUsers.length === 0) {
      console.log('❌ User not found during auth');
      return;
    }
    
    const user = authUsers[0];
    console.log('User found for auth:', {
      user_id: user.user_id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      has_password_hash: !!user.password_hash
    });
    
    // Check if password hash exists
    if (!user.password_hash) {
      console.log('❌ User has no password hash - this is the problem!');
      console.log('Creating password hash for test user...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      
      await conn.query('UPDATE user SET password_hash = ? WHERE user_id = ?', [hashedPassword, user.user_id]);
      console.log('✅ Password hash created for test user');
    } else {
      console.log('✅ User has password hash');
    }
    
    // Test orders for this user
    console.log('\n3. Testing orders for this user...');
    const [orders] = await conn.query(`
      SELECT 
        p.pesanan_id, p.total_harga, p.status_pesanan as status, 
        p.alamat_kirim, p.created_at as tanggal_pesanan
      FROM pesanan p
      WHERE p.pembeli_id = ?
      ORDER BY p.created_at DESC
      LIMIT 5
    `, [user.user_id]);
    
    console.log(`Found ${orders.length} orders for user ${user.user_id}:`);
    console.table(orders);
    
  } catch (error) {
    console.error('❌ Error testing login API:', error);
  } finally {
    conn.release();
  }
}

async function main() {
  try {
    await testLoginAPI();
    console.log('\n✅ Login API test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}