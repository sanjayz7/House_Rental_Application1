const db = require('./db/oracleConnection');

async function createSimpleListingsTable() {
  console.log('Creating simple LISTINGS table...');
  
  try {
    // Check if LISTINGS table already exists
    const tableExists = await db.execute(`
      SELECT table_name FROM user_tables WHERE table_name = 'LISTINGS'
    `);
    
    if (tableExists.rows.length > 0) {
      console.log('✅ LISTINGS table already exists');
      return;
    }
    
    // Create LISTINGS table with simple syntax
    console.log('Creating LISTINGS table...');
    await db.execute(`
      CREATE TABLE listings (
        listing_id NUMBER PRIMARY KEY,
        owner_id NUMBER NOT NULL,
        title VARCHAR2(200) NOT NULL,
        description VARCHAR2(4000),
        image_url VARCHAR2(4000),
        address VARCHAR2(300),
        latitude NUMBER,
        longitude NUMBER,
        owner_phone VARCHAR2(40),
        bedrooms NUMBER,
        bathrooms NUMBER,
        area_sqft NUMBER,
        furnished VARCHAR2(30),
        verified NUMBER(1) DEFAULT 0,
        deposit NUMBER,
        available_from DATE,
        contact_start VARCHAR2(10),
        contact_end VARCHAR2(10),
        price NUMBER NOT NULL,
        total_units NUMBER DEFAULT 1,
        available_units NUMBER DEFAULT 1,
        city VARCHAR2(120),
        category VARCHAR2(60),
        created_at DATE DEFAULT SYSDATE,
        updated_at DATE
      )
    `);
    
    console.log('✅ LISTINGS table created successfully');
    
    // Create sequence for auto-increment
    console.log('Creating sequence for listing_id...');
    await db.execute(`
      CREATE SEQUENCE listing_seq START WITH 1 INCREMENT BY 1
    `);
    
    console.log('✅ Sequence created successfully');
    
    // Create indexes
    console.log('Creating indexes...');
    await db.execute('CREATE INDEX idx_listings_geo ON listings(latitude, longitude)');
    await db.execute('CREATE INDEX idx_listings_price ON listings(price)');
    await db.execute('CREATE INDEX idx_listings_city ON listings(city)');
    await db.execute('CREATE INDEX idx_listings_owner ON listings(owner_id)');
    
    console.log('✅ Indexes created successfully');
    
    console.log('\n🎉 LISTINGS table created successfully!');
    
  } catch (err) {
    console.error('❌ Error creating table:', err.message);
    console.error('Error details:', err);
  }
}

createSimpleListingsTable();
