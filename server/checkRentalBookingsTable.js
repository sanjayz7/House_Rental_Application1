const db = require('./db/oracleConnection');

async function checkRentalBookingsTable() {
  try {
    console.log('Checking if rental_bookings table exists...');
    
    // Check if table exists
    const checkTableQuery = `
      SELECT COUNT(*) as count 
      FROM user_tables 
      WHERE table_name = 'RENTAL_BOOKINGS'
    `;
    
    const result = await db.execute(checkTableQuery);
    const tableExists = result.rows[0].COUNT > 0;
    
    if (tableExists) {
      console.log('✅ rental_bookings table already exists!');
      
      // Check if there are any bookings
      const checkBookingsQuery = 'SELECT COUNT(*) as count FROM rental_bookings';
      const bookingsResult = await db.execute(checkBookingsQuery);
      console.log(`📊 Found ${bookingsResult.rows[0].COUNT} bookings in the table`);
      
    } else {
      console.log('❌ rental_bookings table does not exist');
      console.log('Please run: node createRentalBookingsTable.js');
    }
    
  } catch (error) {
    console.error('Error checking table:', error);
    throw error;
  }
}

// Run the script
checkRentalBookingsTable()
  .then(() => {
    console.log('Check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Check failed:', error);
    process.exit(1);
  });

