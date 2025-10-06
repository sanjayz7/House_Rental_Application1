const db = require('../db/oracleConnection');
const oracledb = require('oracledb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (!['user', 'owner', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be user, owner, or admin' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists
    const existing = await db.execute(
      `SELECT user_id FROM users WHERE email = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // Insert new user - using the actual table structure
    const result = await db.execute(
      `INSERT INTO users (username, email, password_hash, full_name, role, created_at) 
       VALUES (:username, :email, :hash, :fullName, :role, SYSDATE)
       RETURNING user_id INTO :id`,
      { 
        username: email.split('@')[0], // Use email prefix as username
        email, 
        hash, 
        fullName: name,
        role, 
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } 
      }
    );
    
    const userId = result.outBinds.id[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId, role, name }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      message: 'User registered successfully',
      token, 
      user: { 
        userId, 
        name, 
        email, 
        role 
      } 
    });
    
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user by email
    const result = await db.execute(
      `SELECT user_id, username, email, password_hash, role, full_name FROM users WHERE email = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.USER_ID, 
        role: user.ROLE, 
        name: user.FULL_NAME || user.USERNAME 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      message: 'Login successful',
      token, 
      user: { 
        userId: user.USER_ID, 
        name: user.FULL_NAME || user.USERNAME, 
        email: user.EMAIL, 
        role: user.ROLE 
      } 
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// Keep the old function for backward compatibility
exports.registerOwnerOrUser = exports.register;
