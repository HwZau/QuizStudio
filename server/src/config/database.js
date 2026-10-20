const mongoose = require('mongoose');
const User = require('../models/User');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DB || 'SimpleQuizAssignment4Reference';
  await mongoose.connect(uri, { dbName });
  // Enforce username uniqueness before accepting registrations, including concurrent ones.
  await User.init();
  return mongoose.connection;
}

module.exports = { connectDatabase };
