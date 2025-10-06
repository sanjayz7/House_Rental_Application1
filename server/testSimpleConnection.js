const oracledb = require('oracledb');
const dbConfig = require('./config/dbConfig');

async function testConnection() {
  console.log('Testing Oracle connection step by step...');
  
  try {
    // Step 1: Initialize Oracle Client
    console.log('Step 1: Initializing Oracle Client...');
    if (dbConfig.instantClientDir) {
      oracledb.initOracleClient({ libDir: dbConfig.instantClientDir });
      console.log('✅ Oracle Instant Client initialized successfully');
    }
    
    // Step 2: Test direct connection
    console.log('Step 2: Testing direct connection...');
    const connection = await oracledb.getConnection({
      user: dbConfig.user,
      password: dbConfig.password,
      connectString: dbConfig.connectString
    });
    
    console.log('✅ Direct connection successful!');
    
    // Step 3: Test simple query
    console.log('Step 3: Testing simple query...');
    const result = await connection.execute('SELECT 1 as test FROM dual');
    console.log('✅ Query successful:', result.rows);
    
    // Step 4: Check if USERS table exists
    console.log('Step 4: Checking if USERS table exists...');
    const tableCheck = await connection.execute(`
      SELECT table_name FROM user_tables WHERE table_name = 'USERS'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ USERS table exists');
    } else {
      console.log('❌ USERS table does not exist');
    }
    
    await connection.close();
    console.log('✅ Connection closed successfully');
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Error details:', err);
  }
}

testConnection();
