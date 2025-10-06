const db = require('./db/oracleConnection');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  console.log('🔐 Password Reset Script...\n');
  
  try {
    const userEmail = 'sanjayk919@gmail.com';
    const newPassword = 'password123'; // You can change this to whatever you want
    
    console.log(`Resetting password for: ${userEmail}`);
    console.log(`New password will be: ${newPassword}\n`);
    
    // Step 1: Check if user exists
    const userResult = await db.execute(
      `SELECT user_id, email FROM users WHERE email = :email`,
      { email: userEmail },
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ User found with ID: ${user.USER_ID}`);
    
    // Step 2: Hash the new password
    console.log('\nStep 2: Hashing new password...');
    const newHash = await bcrypt.hash(newPassword, 10);
    console.log(`New password hash: ${newHash.substring(0, 20)}...`);
    
    // Step 3: Update the password in database
    console.log('\nStep 3: Updating password in database...');
    await db.execute(
      `UPDATE users SET password_hash = :hash WHERE email = :email`,
      { hash: newHash, email: userEmail }
    );
    
    console.log('✅ Password updated successfully!');
    
    // Step 4: Test the new password
    console.log('\nStep 4: Testing new password...');
    const testResult = await db.execute(
      `SELECT password_hash FROM users WHERE email = :email`,
      { email: userEmail },
      { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
    );
    
    if (testResult.rows.length > 0) {
      const storedHash = testResult.rows[0].PASSWORD_HASH;
      const isValid = await bcrypt.compare(newPassword, storedHash);
      
      if (isValid) {
        console.log(' Password reset successful! You can now login with:');
        console.log(`   Email: ${userEmail}`);
        console.log(`   Password: ${newPassword}`);
      } else {
        console.log(' Password verification failed after update');
      }
    }
    
  } catch (err) {
    console.error(' Error during password reset:', err.message);
  }
}

resetPassword();
