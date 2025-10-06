const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['user', 'owner', 'admin'], required: true },
  created_at: { type: Date, default: Date.now }
}, { collection: 'users' });

module.exports = mongoose.model('User', UserSchema);


