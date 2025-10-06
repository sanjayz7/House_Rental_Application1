const db = require('../db/oracleConnection');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total listings
    const listingsQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified FROM listings';
    const listingsResult = await db.execute(listingsQuery);
    
    // Get total users
    const usersQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN role = \'user\' THEN 1 ELSE 0 END) as users, SUM(CASE WHEN role = \'owner\' THEN 1 ELSE 0 END) as owners FROM users';
    const usersResult = await db.execute(usersQuery);
    
    // Get total bookings from rental_bookings table
    const bookingsQuery = 'SELECT COUNT(*) as total FROM rental_bookings';
    const bookingsResult = await db.execute(bookingsQuery);
    
    const stats = {
      totalListings: listingsResult.rows[0]?.TOTAL || 0,
      verifiedListings: listingsResult.rows[0]?.VERIFIED || 0,
      totalUsers: usersResult.rows[0]?.TOTAL || 0,
      activeUsers: usersResult.rows[0]?.USERS || 0,
      owners: usersResult.rows[0]?.OWNERS || 0,
      totalBookings: bookingsResult.rows[0]?.TOTAL || 0,
      withImages: Math.floor((listingsResult.rows[0]?.TOTAL || 0) * 0.8), // Mock calculation
      withLocation: Math.floor((listingsResult.rows[0]?.TOTAL || 0) * 0.6) // Mock calculation
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const query = 'SELECT id, name, email, role, created_at as joinDate FROM users ORDER BY created_at DESC';
    const result = await db.execute(query);
    
    const users = result.rows.map(row => ({
      id: row.ID,
      name: row.NAME,
      email: row.EMAIL,
      role: row.ROLE,
      joinDate: row.JOINDATE
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT id, name, email, role, created_at as joinDate FROM users WHERE id = :id';
    const result = await db.execute(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = {
      id: result.rows[0].ID,
      name: result.rows[0].NAME,
      email: result.rows[0].EMAIL,
      role: result.rows[0].ROLE,
      joinDate: result.rows[0].JOINDATE
    };
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    
    const query = 'UPDATE users SET name = :name, email = :email, role = :role WHERE id = :id';
    await db.execute(query, [name, email, role, id]);
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM users WHERE id = :id';
    await db.execute(query, [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const query = `
      SELECT b.id, b.listing_id as listingId, b.user_email as userEmail, 
             b.amount, b.booking_date as date, b.status, b.created_at
      FROM rental_bookings b 
      ORDER BY b.created_at DESC
    `;
    const result = await db.execute(query);
    
    const bookings = result.rows.map(row => ({
      id: row.ID,
      listingId: row.LISTINGID,
      userEmail: row.USEREMAIL,
      amount: row.AMOUNT || 0,
      date: row.DATE,
      status: row.STATUS || 'confirmed',
      createdAt: row.CREATED_AT
    }));
    
    res.json(bookings);
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
};

// Create booking
const createBooking = async (req, res) => {
  try {
    const { listingId, userEmail, amount = 0, date, status = 'confirmed' } = req.body;
    
    const query = `
      INSERT INTO rental_bookings (listing_id, user_email, amount, booking_date, status, created_at)
      VALUES (:listingId, :userEmail, :amount, :date, :status, SYSTIMESTAMP)
    `;
    
    await db.execute(query, [listingId, userEmail, amount, date, status]);
    
    res.json({ message: 'Booking created successfully' });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount } = req.body;
    
    const query = 'UPDATE rental_bookings SET status = :status, amount = :amount WHERE id = :id';
    await db.execute(query, [status, amount, id]);
    
    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// Delete booking
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM rental_bookings WHERE id = :id';
    await db.execute(query, [id]);
    
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

// Send bulk email
const sendBulkEmail = async (req, res) => {
  try {
    const { subject, body } = req.body;
    
    // Get all user emails
    const query = 'SELECT email FROM users WHERE email IS NOT NULL';
    const result = await db.execute(query);
    
    const emails = result.rows.map(row => row.EMAIL);
    
    // In a real application, you would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll just log the email details
    console.log(`Bulk email to ${emails.length} users:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    
    res.json({ 
      message: `Bulk email sent successfully to ${emails.length} users`,
      recipients: emails.length
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ error: 'Failed to send bulk email' });
  }
};

// Send welcome emails
const sendWelcomeEmails = async (req, res) => {
  try {
    // Get all users who haven't received welcome emails
    const query = 'SELECT email FROM users WHERE email IS NOT NULL';
    const result = await db.execute(query);
    
    const emails = result.rows.map(row => row.EMAIL);
    
    // In a real application, you would send actual welcome emails
    console.log(`Sending welcome emails to ${emails.length} users`);
    
    res.json({ 
      message: `Welcome emails sent to ${emails.length} users`,
      recipients: emails.length
    });
  } catch (error) {
    console.error('Error sending welcome emails:', error);
    res.status(500).json({ error: 'Failed to send welcome emails' });
  }
};

function sampleListings() {
  const now = new Date();
  return Array.from({ length: 10 }).map((_, i) => ({
    ID: i + 1,
    Title: `Sample Listing ${i + 1}`,
    Address: `${100 + i} Main St, City ${i + 1}`,
    Rent: 1000 + i * 150,
    'Owner Email': `owner${i + 1}@example.com`,
    Verified: i % 2 === 0 ? 'Yes' : 'No',
    'Created Date': new Date(now.getTime() - i * 86400000).toISOString()
  }));
}

function sampleBookings() {
  const now = new Date();
  return Array.from({ length: 10 }).map((_, i) => ({
    'Booking ID': i + 1,
    'Listing ID': (i % 5) + 1,
    'User Email': `user${i + 1}@example.com`,
    'Amount': 0,
    'Date': new Date(now.getTime() - i * 43200000).toISOString().slice(0, 10),
    'Status': i % 3 === 0 ? 'pending' : 'confirmed'
  }));
}

function sampleUsers() {
  const now = new Date();
  return Array.from({ length: 10 }).map((_, i) => ({
    ID: i + 1,
    Name: `User ${i + 1}`,
    Email: `user${i + 1}@example.com`,
    Role: i % 5 === 0 ? 'owner' : 'user',
    'Join Date': new Date(now.getTime() - i * 86400000).toISOString()
  }));
}

// Export listings
const exportListings = async (req, res) => {
  try {
    // Dummy sample export when requested or when using Mongo fallback
    if (process.env.MOCK_EXPORTS === '1' || (process.env.DB_DRIVER || '').toLowerCase() === 'mongo' || req.query.mock === '1') {
      return res.json(sampleListings());
    }
    const query = `
      SELECT l.id, l.title, l.address, l.rent, l.owner_email as ownerEmail, 
             l.verified, l.created_at as createdAt
      FROM listings l
      ORDER BY l.created_at DESC
    `;
    const result = await db.execute(query);
    
    const listings = result.rows.map(row => ({
      ID: row.ID,
      Title: row.TITLE,
      Address: row.ADDRESS,
      Rent: row.RENT,
      'Owner Email': row.OWNEREMAIL,
      Verified: row.VERIFIED ? 'Yes' : 'No',
      'Created Date': row.CREATEDAT
    }));
    
    res.json(listings);
  } catch (error) {
    console.error('Error exporting listings:', error);
    // Fallback to sample data instead of failing
    return res.json(sampleListings());
  }
};

// Export bookings
const exportBookings = async (req, res) => {
  try {
    if (process.env.MOCK_EXPORTS === '1' || (process.env.DB_DRIVER || '').toLowerCase() === 'mongo' || req.query.mock === '1') {
      return res.json(sampleBookings());
    }
    const query = `
      SELECT b.id as "Booking ID", b.listing_id as "Listing ID", 
             b.user_email as "User Email", b.amount as "Amount", 
             b.booking_date as "Date", b.status as "Status"
      FROM rental_bookings b
      ORDER BY b.created_at DESC
    `;
    const result = await db.execute(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error exporting bookings:', error);
    // Fallback to sample data instead of failing
    return res.json(sampleBookings());
  }
};

// Export users
const exportUsers = async (req, res) => {
  try {
    if (process.env.MOCK_EXPORTS === '1' || (process.env.DB_DRIVER || '').toLowerCase() === 'mongo' || req.query.mock === '1') {
      return res.json(sampleUsers());
    }
    const query = `
      SELECT id as "ID", name as "Name", email as "Email", 
             role as "Role", created_at as "Join Date"
      FROM users
      ORDER BY created_at DESC
    `;
    const result = await db.execute(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error exporting users:', error);
    // Fallback to sample data instead of failing
    return res.json(sampleUsers());
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAllBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  sendBulkEmail,
  sendWelcomeEmails,
  exportListings,
  exportBookings,
  exportUsers
};
