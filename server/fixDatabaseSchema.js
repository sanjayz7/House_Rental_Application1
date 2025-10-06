const db = require('./db/oracleConnection');

async function fixDatabaseSchema() {
  console.log('Fixing database schema...');
  
  try {
    // Check if ROLE column exists
    console.log('Step 1: Checking if ROLE column exists...');
    const roleColumnCheck = await db.execute(`
      SELECT column_name FROM user_tab_columns 
      WHERE table_name = 'USERS' AND column_name = 'ROLE'
    `);
    
    if (roleColumnCheck.rows.length === 0) {
      console.log('ROLE column does not exist. Adding it...');
      
      // Add ROLE column
      await db.execute(`
        ALTER TABLE users ADD role VARCHAR2(20) DEFAULT 'user' NOT NULL
      `);
      
      // Add check constraint for role values
      await db.execute(`
        ALTER TABLE users ADD CONSTRAINT chk_user_role 
        CHECK (role IN ('user', 'owner', 'admin'))
      `);
      
      console.log('✅ ROLE column added successfully');
    } else {
      console.log('✅ ROLE column already exists');
    }
    
    // Check if we need to update existing users to have a role
    console.log('Step 2: Updating existing users with default role...');
    const updateResult = await db.execute(`
      UPDATE users SET role = 'user' WHERE role IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowsAffected} users with default role`);
    
    // Verify the final structure
    console.log('Step 3: Verifying final table structure...');
    const finalStructure = await db.execute(`
      SELECT column_name, data_type, nullable, data_default
      FROM user_tab_columns 
      WHERE table_name = 'USERS' 
      ORDER BY column_id
    `);
    
    console.log('\n=== FINAL USERS TABLE STRUCTURE ===');
    finalStructure.rows.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE} - ${col.NULLABLE === 'Y' ? 'NULLABLE' : 'NOT NULL'} - Default: ${col.DATA_DEFAULT || 'N/A'}`);
    });
    
    console.log('\n🎉 Database schema fixed successfully!');
    
  } catch (err) {
    console.error('❌ Error fixing database schema:', err.message);
    console.error('Error details:', err);
  }
}

fixDatabaseSchema();
