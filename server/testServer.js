const express = require('express');
const cors = require('cors');
const db = require('./db/oracleConnection');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Test server is running' });
});

// Test registration route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Registration attempt:', { name, email, role });
    
    // Simple validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    res.json({ message: 'Registration endpoint working', data: req.body });
    
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Press Ctrl+C to stop');
});

// Keep server running
process.on('SIGINT', () => {
  console.log('Shutting down test server...');
  process.exit(0);
});
