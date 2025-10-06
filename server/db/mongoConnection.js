const mongoose = require('mongoose');

let connected = false;

async function initialize() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/home_rental_app';
  const opts = {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000
  };
  await mongoose.connect(uri, opts);
  connected = true;
  console.log(`Connected to MongoDB at ${uri}`);
}

async function close() {
  if (connected) {
    await mongoose.connection.close();
    connected = false;
    console.log('MongoDB connection closed');
  }
}

module.exports = { initialize, close };


