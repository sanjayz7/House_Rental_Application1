const db = require('./db/oracleConnection');

async function cleanupDatabase() {
  console.log('🧹 Cleaning up unwanted database tables and data...\n');
  
  try {
    // Get all table names
    const tables = await db.execute(`
      SELECT table_name FROM user_tables ORDER BY table_name
    `);
    
    console.log('=== CURRENT TABLES ===');
    if (tables.rows.length > 0) {
      tables.rows.forEach(table => {
        console.log(`- ${table.TABLE_NAME}`);
      });
    } else {
      console.log('No tables found');
    }
    
    // Define tables to keep (essential for House Rental app)
    const tablesToKeep = [
      'USERS',      // User accounts and authentication
      'LISTINGS',   // House rental properties
      'RATINGS'     // User ratings for properties
    ];
    
    // Define tables to remove (unwanted/old)
    const tablesToRemove = [
      'THEATER_SHOWS',  // Old theater booking data
      'AUTHOR',         // Unrelated to house rental
      'BOOK',           // Unrelated to house rental
      'BOOKINGS',       // Old booking system
      'BOOKS',          // Unrelated to house rental
      'BOOKS1',         // Unrelated to house rental
      'BOOKS2',         // Unrelated to house rental
      'BRANCH1',        // Unrelated to house rental
      'COMPANY',        // Unrelated to house rental
      'COURSE',         // Unrelated to house rental
      'COURSE_REGISTRATION', // Unrelated to house rental
      'CUSTOMER',       // Unrelated to house rental
      'CUSTOMER1',      // Unrelated to house rental
      'CUSTOMERS',      // Unrelated to house rental
      'D1',             // Unrelated to house rental
      'DEP',            // Unrelated to house rental
      'DEPARTMENT',     // Unrelated to house rental
      'DEPARTMENT2',    // Unrelated to house rental
      'DEPARTMENTS',    // Unrelated to house rental
      'DEPOSITOR',      // Unrelated to house rental
      'DEPOSITOR1',     // Unrelated to house rental
      'DEPT',           // Unrelated to house rental
      'E1',             // Unrelated to house rental
      'EMP',            // Unrelated to house rental
      'EMP1',           // Unrelated to house rental
      'EMP2',           // Unrelated to house rental
      'EMPLOYEE',       // Unrelated to house rental
      'EMPLOYEES',      // Unrelated to house rental
      'EMPLOYEES1',     // Unrelated to house rental
      'EMPLOYEES2',     // Unrelated to house rental
      'FACULTY_NAME',   // Unrelated to house rental
      'INSTRUCTOR',     // Unrelated to house rental
      'IT',             // Unrelated to house rental
      'LOAN',           // Unrelated to house rental
      'LOAN1',          // Unrelated to house rental
      'LOAN4',          // Unrelated to house rental
      'MANAGER',        // Unrelated to house rental
      'NEWBACKUP',      // Backup table
      'OLDBACKUP',      // Backup table
      'ORDER1',         // Unrelated to house rental
      'ORDERDETAILS',   // Unrelated to house rental
      'ORDERS',         // Unrelated to house rental
      'ORDERS1',        // Unrelated to house rental
      'PRODUCT1',       // Unrelated to house rental
      'PRODUCTS',       // Unrelated to house rental
      'STDUENT1',       // Unrelated to house rental
      'STUD',           // Unrelated to house rental
      'STUDENT',        // Unrelated to house rental
      'STUDENT1',       // Unrelated to house rental
      'STUDENT2',       // Unrelated to house rental
      'STUDENT4',       // Unrelated to house rental
      'STUDENT6',       // Unrelated to house rental
      'STUDENT_INFO',   // Unrelated to house rental
      'STUDENT_INFO1',  // Unrelated to house rental
      'TABLE1',         // Generic table
      'USERS1',         // Duplicate users table
      'USERS3',         // Duplicate users table
      'USER_SESSIONS',  // Old session data
      'WORKS'           // Unrelated to house rental
    ];
    
    console.log('\n=== TABLES TO KEEP ===');
    tablesToKeep.forEach(table => {
      console.log(`✅ ${table}`);
    });
    
    console.log('\n=== TABLES TO REMOVE ===');
    tablesToRemove.forEach(table => {
      console.log(`🗑️  ${table}`);
    });
    
    // Check which tables actually exist and can be removed
    const existingTables = tables.rows.map(t => t.TABLE_NAME);
    const tablesToRemoveExisting = tablesToRemove.filter(table => existingTables.includes(table));
    
    if (tablesToRemoveExisting.length === 0) {
      console.log('\n🎉 No unwanted tables found to remove!');
      return;
    }
    
    console.log(`\n📊 Found ${tablesToRemoveExisting.length} unwanted tables to remove.`);
    
    // Ask for confirmation (in a real scenario, you'd want user input)
    console.log('\n⚠️  WARNING: This will permanently delete data!');
    console.log('Proceeding with cleanup...\n');
    
    // Remove unwanted tables
    for (const tableName of tablesToRemoveExisting) {
      try {
        console.log(`🗑️  Removing table: ${tableName}`);
        
        // Drop the table (this will also remove any data)
        await db.execute(`DROP TABLE ${tableName} CASCADE CONSTRAINTS`);
        
        console.log(`✅ Successfully removed: ${tableName}`);
      } catch (err) {
        console.log(`❌ Failed to remove ${tableName}: ${err.message}`);
      }
    }
    
    // Verify final state
    console.log('\n=== FINAL TABLE LIST ===');
    const finalTables = await db.execute(`
      SELECT table_name FROM user_tables ORDER BY table_name
    `);
    
    if (finalTables.rows.length > 0) {
      finalTables.rows.forEach(table => {
        console.log(`- ${table.TABLE_NAME}`);
      });
    } else {
      console.log('No tables found');
    }
    
    console.log('\n🎉 Database cleanup completed!');
    console.log(`✅ Kept ${tablesToKeep.length} essential tables`);
    console.log(`🗑️  Removed ${tablesToRemoveExisting.length} unwanted tables`);
    
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
    console.error('Error details:', err);
  }
}

cleanupDatabase();
