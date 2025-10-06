const db = require('./db/oracleConnection');

async function createRentalBookingsTable() {
  try {
    console.log('Creating rental bookings table...');
    
    // Create the rental bookings table
    const createTableQuery = `
      CREATE TABLE rental_bookings (
        id NUMBER PRIMARY KEY,
        listing_id NUMBER NOT NULL,
        user_email VARCHAR2(150) NOT NULL,
        amount NUMBER(10,2) DEFAULT 0,
        booking_date DATE NOT NULL,
        status VARCHAR2(20) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT SYSTIMESTAMP,
        CONSTRAINT fk_rental_bookings_listing FOREIGN KEY (listing_id) REFERENCES listings(listing_id)
      )
    `;
    
    await db.execute(createTableQuery);
    console.log('Rental bookings table created successfully!');
    
    // Create sequence for ID generation
    const createSequenceQuery = `
      CREATE SEQUENCE rental_bookings_seq
      START WITH 1
      INCREMENT BY 1
      NOCACHE
      NOCYCLE
    `;
    
    await db.execute(createSequenceQuery);
    console.log('Sequence created successfully!');
    
    // Create trigger for auto-increment ID
    const createTriggerQuery = `
      CREATE OR REPLACE TRIGGER rental_bookings_id_trigger
      BEFORE INSERT ON rental_bookings
      FOR EACH ROW
      BEGIN
        SELECT rental_bookings_seq.NEXTVAL INTO :NEW.id FROM dual;
      END;
    `;
    
    await db.execute(createTriggerQuery);
    console.log('Trigger created successfully!');
    
    // Create index for better performance
    const createIndexQuery = `
      CREATE INDEX idx_rental_bookings_listing ON rental_bookings(listing_id)
    `;
    
    await db.execute(createIndexQuery);
    console.log('Index created successfully!');
    
    // Insert some sample data (only if listings exist)
    const checkListingsQuery = 'SELECT COUNT(*) as count FROM listings';
    const listingsResult = await db.execute(checkListingsQuery);
    
    if (listingsResult.rows[0].COUNT > 0) {
      const sampleDataQuery = `
        INSERT INTO rental_bookings (listing_id, user_email, amount, booking_date, status) 
        VALUES ((SELECT listing_id FROM listings WHERE ROWNUM = 1), 'user1@example.com', 0, SYSDATE, 'confirmed')
      `;
      
      await db.execute(sampleDataQuery);
      console.log('Sample data inserted successfully!');
    } else {
      console.log('No listings found, skipping sample data insertion');
    }
    
  } catch (error) {
    console.error('Error creating rental bookings table:', error);
    throw error;
  }
}

// Run the script
createRentalBookingsTable()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
