const db = require('./db/oracleConnection');
const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('🔐 Testing Login Functionality...\n');
  
  try {
    // Test with the existing user
    const testEmail = 'sanjayk919@gmail.com';
    
    console.log(`Testing login for: ${testEmail}\n`);
    
    // Step 1: Find the user
    console.log('Step 1: Finding user in database...');
    const result = await db.execute(
      `SELECT user_id, username, email, password_hash, role, full_name FROM users WHERE email = :email`,
      { email: testEmail },
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:', {
      id: user.USER_ID,
      email: user.EMAIL,
      role: user.ROLE,
      passwordHash: user.PASSWORD_HASH.substring(0, 20) + '...'
    });
    
    // Step 2: Test password verification with more variations
    console.log('\nStep 2: Testing password verification...');
    
    // Common password variations to try
    const passwordVariations = [
      'password123',
      'Password123',
      'PASSWORD123',
      'password',
      'Password',
      '123456',
      'admin',
      'test',
      'sanjayk',
      'SANJAYK',
      'Sanjayk',
      'sanjayk123',
      'SANJAYK123',
      'Sanjayk123',
      'sanjayk*1', // From your db config
      'SANJAYK*1',
      'Sanjayk*1'
    ];
    
    let foundPassword = null;
    
    for (const password of passwordVariations) {
      const isValid = await bcrypt.compare(password, user.PASSWORD_HASH);
      if (isValid) {
        foundPassword = password;
        console.log(`✅ Found working password: "${password}"`);
        break;
      }
    }
    
    if (!foundPassword) {
      console.log('❌ None of the tested passwords worked');
      console.log('Let me check what was actually saved during registration...');
      
      // Let's also check if there are any other users to compare
      console.log('\nChecking other users for comparison...');
      const otherUsers = await db.execute(`
        SELECT email, password_hash FROM users 
        WHERE email != :email 
        AND ROWNUM <= 3
      `, { email: testEmail });
      
      if (otherUsers.rows.length > 0) {
        console.log('Other users in system:');
        otherUsers.rows.forEach((otherUser, index) => {
          console.log(`User ${index + 1}: ${otherUser.EMAIL} - Hash: ${otherUser.PASSWORD_HASH.substring(0, 20)}...`);
        });
      }
    }
    
  } catch (err) {
    console.error('❌ Error during login test:', err.message);
  }
}

testLogin();
