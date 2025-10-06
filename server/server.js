// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const useMongo = (process.env.DB_DRIVER || '').toLowerCase() === 'mongo';
const oracleDb = require('./db/oracleConnection');
const mongoDb = require('./db/mongoConnection');
const showRoutes = require('./routes/shows');
const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const ratingsRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');
const imagesRoutes = require('./routes/images');
const purchaseRoutes = require('./routes/purchases');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize database
if (useMongo) {
  mongoDb.initialize().catch(err => {
    console.error('Failed to initialize MongoDB:', err);
  });
} else {
  oracleDb.initialize().then(() => {
    console.log('Connected to Oracle database');
  }).catch(err => {
    console.error('Failed to initialize database:', err);
    console.warn('Starting server without database connection. Some endpoints may be limited.');
  });
}

// Routes
app.use('/api/shows', showRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/purchases', purchaseRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Theater Booking API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at: http://localhost:${PORT}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Using default'}`);
});

// Handle application shutdown
process.on('SIGINT', async () => {
  try {
    if (useMongo) {
      await mongoDb.close();
    } else {
      await oracleDb.closePool();
    }
    console.log('Database connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});