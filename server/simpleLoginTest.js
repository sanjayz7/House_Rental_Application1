const db = require('./db/oracleConnection');
const bcrypt = require('bcryptjs');

async function simpleLoginTest() {
  console.log('🔐 Simple Login Test...\n');
  
  try {
    // Test 1: Check if we can connect to database
    console.log('Step 1: Testing database connection...');
    const testQuery = await db.execute('SELECT 1 as test FROM dual');
    console.log('✅ Database connection working:', testQuery.rows[0]);
    
    // Test 2: Check if the user exists and can be found
    console.log('\nStep 2: Finding user for login test...');
    const userResult = await db.execute(
      `SELECT user_id, username, email, password_hash, role, full_name FROM users WHERE email = :email`,
      { email: 'sanjayk919@gmail.com' },
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found:', {
      id: user.USER_ID,
      email: user.EMAIL,
      role: user.ROLE,
      passwordHash: user.PASSWORD_HASH.substring(0, 20) + '...'
    });
    
    // Test 3: Test password verification
    console.log('\nStep 3: Testing password verification...');
    const testPassword = 'password123';
    const isValidPassword = await bcrypt.compare(testPassword, user.PASSWORD_HASH);
    console.log(`Password verification result: ${isValidPassword}`);
    
    if (isValidPassword) {
      console.log('✅ Password is correct! Login should work.');
      
      // Test 4: Simulate the exact login query from authController
      console.log('\nStep 4: Simulating exact login query from authController...');
      const loginQuery = await db.execute(
        `SELECT user_id, username, email, password_hash, role, full_name FROM users WHERE email = :email`,
        { email: 'sanjayk919@gmail.com' },
        { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
      );
      
      if (loginQuery.rows.length > 0) {
        const loginUser = loginQuery.rows[0];
        console.log('✅ Login query successful');
        console.log('User data from login query:', {
          userId: loginUser.USER_ID,
          username: loginUser.USERNAME,
          email: loginUser.EMAIL,
          role: loginUser.ROLE,
          fullName: loginUser.FULL_NAME
        });
        
        // Test 5: Final password verification
        const finalPasswordCheck = await bcrypt.compare(testPassword, loginUser.PASSWORD_HASH);
        console.log(`Final password check: ${finalPasswordCheck}`);
        
        if (finalPasswordCheck) {
          console.log('🎉 All tests passed! Login should work perfectly.');
          console.log('\nYour login credentials:');
          console.log(`Email: ${loginUser.EMAIL}`);
          console.log(`Password: ${testPassword}`);
        } else {
          console.log('❌ Final password check failed!');
        }
      }
      
    } else {
      console.log('❌ Password is incorrect!');
      console.log('This means the password reset didn\'t work properly.');
    }
    
  } catch (err) {
    console.error('❌ Error during login test:', err.message);
  }
}

simpleLoginTest();
