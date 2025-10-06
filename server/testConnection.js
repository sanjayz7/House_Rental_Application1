const db = require('./db/oracleConnection');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await db.execute('SELECT 1 as test FROM dual');
    console.log('✅ Basic connection test passed:', result.rows[0]);
    
    // Check if listings table exists
    const tableCheck = await db.execute(`
      SELECT table_name 
      FROM user_tables 
      WHERE table_name = 'LISTINGS'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ LISTINGS table exists');
      
      // Check table structure
      const structure = await db.execute(`
        SELECT column_name, data_type, nullable 
        FROM user_tab_columns 
        WHERE table_name = 'LISTINGS' 
        ORDER BY column_id
      `);
      
      console.log('📋 LISTINGS table structure:');
      structure.rows.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.NULLABLE === 'Y' ? 'nullable' : 'not null'})`);
      });
      
      // Check if there are any records
      const count = await db.execute('SELECT COUNT(*) as total FROM listings');
      console.log(`📊 Total listings: ${count.rows[0].TOTAL}`);
      
      if (count.rows[0].TOTAL > 0) {
        // Show sample data
        const sample = await db.execute('SELECT * FROM listings WHERE ROWNUM <= 3');
        console.log('📝 Sample listings:');
        sample.rows.forEach((listing, index) => {
          console.log(`  ${index + 1}. ${listing.TITLE || listing.title || 'No title'} - $${listing.PRICE || listing.price || 'No price'}`);
        });
      }
      
    } else {
      console.log('❌ LISTINGS table does not exist');
      
      // Check what tables exist
      const tables = await db.execute(`
        SELECT table_name 
        FROM user_tables 
        ORDER BY table_name
      `);
      
      console.log('📋 Available tables:');
      tables.rows.forEach(table => {
        console.log(`  - ${table.TABLE_NAME}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.closePool();
    process.exit(0);
  }
}

testConnection();
