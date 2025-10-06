const db = require('./db/oracleConnection');

async function debugRegistration() {
  console.log('Debugging registration process...');
  
  try {
    // Test 1: Check if we can connect to database
    console.log('Test 1: Database connection...');
    const testResult = await db.execute('SELECT 1 as test FROM dual');
    console.log('✅ Database connection successful:', testResult.rows);
    
    // Test 2: Check USERS table structure
    console.log('Test 2: USERS table structure...');
    const tableStructure = await db.execute(`
      SELECT column_name, data_type, nullable 
      FROM user_tab_columns 
      WHERE table_name = 'USERS' 
      ORDER BY column_id
    `);
    console.log('✅ USERS table structure:', tableStructure.rows);
    
    // Test 3: Check if there are any existing users
    console.log('Test 3: Existing users...');
    const existingUsers = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log('✅ Existing users count:', existingUsers.rows[0].COUNT);
    
    // Test 4: Try to insert a test user
    console.log('Test 4: Insert test user...');
    const insertResult = await db.execute(
      `INSERT INTO users (name, email, password_hash, role, created_at) 
       VALUES (:name, :email, :hash, :role, SYSDATE)
       RETURNING user_id INTO :id`,
      { 
        name: 'Test User', 
        email: 'testdebug@example.com', 
        hash: 'test_hash_123', 
        role: 'user', 
        id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER } 
      }
    );
    
    const userId = insertResult.outBinds.id[0];
    console.log('✅ Test user inserted successfully with ID:', userId);
    
    // Test 5: Clean up test user
    console.log('Test 5: Clean up test user...');
    await db.execute('DELETE FROM users WHERE user_id = :id', { id: userId });
    console.log('✅ Test user cleaned up');
    
    console.log('🎉 All registration tests passed!');
    
  } catch (err) {
    console.error('❌ Registration test failed:', err.message);
    console.error('Error details:', err);
    
    // Check if it's a constraint violation
    if (err.code === 2290) {
      console.error('This appears to be a constraint violation. Check table constraints.');
    }
    
    // Check if it's a data type issue
    if (err.code === 12899) {
      console.error('This appears to be a data type issue. Check column sizes.');
    }
  }
}

debugRegistration();
