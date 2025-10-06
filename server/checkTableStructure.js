const db = require('./db/oracleConnection');

async function checkTableStructure() {
  console.log('Checking actual table structure...');
  
  try {
    // Check USERS table structure
    console.log('\n=== USERS TABLE STRUCTURE ===');
    const userColumns = await db.execute(`
      SELECT column_name, data_type, nullable, data_length, column_id
      FROM user_tab_columns 
      WHERE table_name = 'USERS' 
      ORDER BY column_id
    `);
    
    userColumns.rows.forEach(col => {
      console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}(${col.DATA_LENGTH || 'N/A'}) - ${col.NULLABLE === 'Y' ? 'NULLABLE' : 'NOT NULL'}`);
    });
    
    // Check if there are any constraints
    console.log('\n=== USERS TABLE CONSTRAINTS ===');
    const constraints = await db.execute(`
      SELECT constraint_name, constraint_type, search_condition
      FROM user_constraints 
      WHERE table_name = 'USERS'
    `);
    
    if (constraints.rows.length > 0) {
      constraints.rows.forEach(constraint => {
        console.log(`${constraint.CONSTRAINT_NAME}: ${constraint.CONSTRAINT_TYPE} - ${constraint.SEARCH_CONDITION || 'N/A'}`);
      });
    } else {
      console.log('No constraints found');
    }
    
    // Check sample data
    console.log('\n=== SAMPLE USER DATA ===');
    const sampleUsers = await db.execute(`
      SELECT * FROM users WHERE ROWNUM <= 3
    `);
    
    if (sampleUsers.rows.length > 0) {
      sampleUsers.rows.forEach((user, index) => {
        console.log(`User ${index + 1}:`, user);
      });
    } else {
      console.log('No users found');
    }
    
  } catch (err) {
    console.error('Error checking table structure:', err.message);
  }
}

checkTableStructure();
