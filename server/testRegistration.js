const db = require('./db/oracleConnection');
const bcrypt = require('bcryptjs');

async function testRegistration() {
  console.log('🔐 Testing Registration Process...\n');
  
  try {
    // Test registration with a known password
    const testUser = {
      name: 'Test Debug User',
      email: 'debug@test.com',
      password: 'testpassword123',
      role: 'user'
    };
    
    console.log('Testing registration with:', testUser);
    
    // Step 1: Check if user already exists
    const existingUser = await db.execute(
      `SELECT user_id FROM users WHERE email = :email`,
      { email: testUser.email },
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    
    if (existingUser.rows.length > 0) {
      console.log('User already exists, deleting for fresh test...');
      await db.execute(`DELETE FROM users WHERE email = :email`, { email: testUser.email });
      console.log('User deleted successfully');
    }
    
    // Step 2: Hash password the same way as registration
    console.log('\nStep 2: Hashing password...');
    const hash = await bcrypt.hash(testUser.password, 10);
    console.log(`Original password: ${testUser.password}`);
    console.log(`Hashed password: ${hash.substring(0, 20)}...`);
    
    // Step 3: Insert user (simulating registration)
    console.log('\nStep 3: Inserting user into database...');
    const result = await db.execute(
      `INSERT INTO users (username, email, password_hash, full_name, role, created_at) 
       VALUES (:username, :email, :hash, :fullName, :role, SYSDATE)
       RETURNING user_id INTO :id`,
      { 
        username: testUser.email.split('@')[0],
        email: testUser.email, 
        hash, 
        fullName: testUser.name,
        role: testUser.role, 
        id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER } 
      }
    );
    
    const userId = result.outBinds.id[0];
    console.log(`✅ User created with ID: ${userId}`);
    
    // Step 4: Test login with the same password
    console.log('\nStep 4: Testing login with created user...');
    const loginResult = await db.execute(
      `SELECT user_id, username, email, password_hash, role, full_name FROM users WHERE email = :email`,
      { email: testUser.email },
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    
    if (loginResult.rows.length > 0) {
      const user = loginResult.rows[0];
      console.log('User found for login test:', {
        id: user.USER_ID,
        email: user.EMAIL,
        passwordHash: user.PASSWORD_HASH.substring(0, 20) + '...'
      });
      
      // Test password verification
      const isValidPassword = await bcrypt.compare(testUser.password, user.PASSWORD_HASH);
      console.log(`Password verification result: ${isValidPassword}`);
      
      if (isValidPassword) {
        console.log('✅ Registration and login test PASSED!');
        console.log('The issue might be with the existing user data.');
      } else {
        console.log('❌ Registration and login test FAILED!');
        console.log('There is a problem with the password hashing/verification process.');
      }
    }
    
    // Step 5: Clean up test user
    console.log('\nStep 5: Cleaning up test user...');
    await db.execute(`DELETE FROM users WHERE email = :email`, { email: testUser.email });
    console.log('Test user cleaned up successfully');
    
  } catch (err) {
    console.error('❌ Error during registration test:', err.message);
  }
}

testRegistration();
