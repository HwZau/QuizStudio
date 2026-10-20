require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const { seedQuiz } = require('./seedDemo');

async function account(username, password, admin) {
  const existing = await User.findByUsername(username);
  if (existing) {
    if (existing.admin !== admin) throw new Error(username + ' exists with a different role. Choose another demo username.');
    console.log(username + ' already exists; its password is unchanged.');
    return existing;
  }
  if (password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new Error('Demo passwords must contain at least 8 characters and at most 72 bytes.');
  }
  const user = await User.create({ username, passwordHash: await bcrypt.hash(password, 12), admin });
  console.log('Created ' + username + (admin ? ' (admin).' : ' (learner).'));
  return user;
}

async function main() {
  await connectDatabase();
  const admin = await account(process.env.DEMO_ADMIN_USERNAME || 'Mary', process.env.DEMO_ADMIN_PASSWORD || 'Mary12345!', true);
  await account(process.env.DEMO_LEARNER_USERNAME || 'John', process.env.DEMO_LEARNER_PASSWORD || 'John12345!', false);
  await seedQuiz(admin);
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
