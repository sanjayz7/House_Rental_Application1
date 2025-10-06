const db = require('./db/oracleConnection');

async function createRatingsTable() {
  console.log('Creating RATINGS table...');
  
  try {
    // Check if RATINGS table already exists
    const tableExists = await db.execute(`
      SELECT table_name FROM user_tables WHERE table_name = 'RATINGS'
    `);
    
    if (tableExists.rows.length > 0) {
      console.log('✅ RATINGS table already exists');
      return;
    }
    
    // Create RATINGS table
    console.log('Creating RATINGS table...');
    await db.execute(`
      CREATE TABLE ratings (
        rating_id NUMBER PRIMARY KEY,
        listing_id NUMBER NOT NULL,
        user_id NUMBER NOT NULL,
        score NUMBER CHECK (score BETWEEN 1 AND 5) NOT NULL,
        created_at DATE DEFAULT SYSDATE
      )
    `);
    
    console.log('✅ RATINGS table created successfully');
    
    // Create sequence for auto-increment
    console.log('Creating sequence for rating_id...');
    await db.execute(`
      CREATE SEQUENCE rating_seq START WITH 1 INCREMENT BY 1
    `);
    
    console.log('✅ Sequence created successfully');
    
    console.log('\n🎉 RATINGS table created successfully!');
    
  } catch (err) {
    console.error('❌ Error creating table:', err.message);
    console.error('Error details:', err);
  }
}

createRatingsTable();
