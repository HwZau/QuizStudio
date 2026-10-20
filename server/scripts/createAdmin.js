require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { connectDatabase } = require('../src/config/database');

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password || password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD (8-72 bytes) in the shell.');
  }
  await connectDatabase();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findByUsername(username).select('+passwordHash') ||
    new User({ username });
  user.passwordHash = passwordHash;
  user.admin = true;
  await user.save();
  console.log(`Admin account ready: ${username}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
