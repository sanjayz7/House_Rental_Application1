const db = require('./db/oracleConnection');

async function checkTheaterShows() {
  console.log('Checking THEATER_SHOWS table structure...');
  
  try {
    // Check THEATER_SHOWS table structure
    console.log('\n=== THEATER_SHOWS TABLE STRUCTURE ===');
    const showsColumns = await db.execute(`
      SELECT column_name, data_type, nullable, data_length, column_id
      FROM user_tab_columns 
      WHERE table_name = 'THEATER_SHOWS' 
      ORDER BY column_id
    `);
    
    if (showsColumns.rows.length > 0) {
      showsColumns.rows.forEach(col => {
        console.log(`${col.COLUMN_NAME}: ${col.DATA_TYPE}(${col.DATA_LENGTH || 'N/A'}) - ${col.NULLABLE === 'Y' ? 'NULLABLE' : 'NOT NULL'}`);
      });
    } else {
      console.log('THEATER_SHOWS table has no columns');
    }
    
    // Check sample data
    console.log('\n=== SAMPLE THEATER_SHOWS DATA ===');
    const sampleShows = await db.execute(`
      SELECT * FROM THEATER_SHOWS WHERE ROWNUM <= 3
    `);
    
    if (sampleShows.rows.length > 0) {
      sampleShows.rows.forEach((show, index) => {
        console.log(`Show ${index + 1}:`, show);
      });
    } else {
      console.log('No shows found');
    }
    
    // Check total count
    const totalShows = await db.execute(`
      SELECT COUNT(*) as count FROM THEATER_SHOWS
    `);
    console.log(`\nTotal shows: ${totalShows.rows[0].COUNT}`);
    
  } catch (err) {
    console.error('Error checking THEATER_SHOWS:', err.message);
  }
}

checkTheaterShows();
