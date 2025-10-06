const db = require('./db/oracleConnection');

async function checkAllTables() {
  console.log('Checking all tables in the database...');
  
  try {
    // Get all table names
    const tables = await db.execute(`
      SELECT table_name FROM user_tables ORDER BY table_name
    `);
    
    console.log('\n=== ALL TABLES ===');
    if (tables.rows.length > 0) {
      tables.rows.forEach(table => {
        console.log(`- ${table.TABLE_NAME}`);
      });
    } else {
      console.log('No tables found');
    }
    
    // Check if LISTINGS table exists and its structure
    console.log('\n=== LISTINGS TABLE STRUCTURE ===');
    const listingsCheck = await db.execute(`
      SELECT column_name, data_type, nullable, data_length
      FROM user_tab_columns 
      WHERE table_name = 'LISTINGS' 
      ORDER BY column_id
    `);
    
    if (listingsCheck.rows.length > 0) {
      listingsCheck.rows.forEach(col => {
        console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}(${col.DATA_LENGTH || 'N/A'}) - ${col.NULLABLE === 'Y' ? 'NULLABLE' : 'NOT NULL'}`);
      });
    } else {
      console.log('LISTINGS table does not exist');
    }
    
    // Check if SHOWS table exists (might be the old table name)
    console.log('\n=== SHOWS TABLE STRUCTURE ===');
    const showsCheck = await db.execute(`
      SELECT column_name, data_type, nullable, data_length
      FROM user_tab_columns 
      WHERE table_name = 'SHOWS' 
      ORDER BY column_id
    `);
    
    if (showsCheck.rows.length > 0) {
      showsCheck.rows.forEach(col => {
        console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}(${col.DATA_LENGTH || 'N/A'}) - ${col.NULLABLE === 'Y' ? 'NULLABLE' : 'NOT NULL'}`);
      });
    } else {
      console.log('SHOWS table does not exist');
    }
    
  } catch (err) {
    console.error('Error checking tables:', err.message);
  }
}

checkAllTables();
