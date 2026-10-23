const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HttpError } = require('../utils/http');

function safeUser(user) {
  return { _id: user.id, username: user.username, admin: user.admin };
}

function tokenFor(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d'
  });
}

function validateCredentials(body) {
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (username.length < 3 || password.length < 8 || Buffer.byteLength(password) > 72) {
    throw new HttpError(400, 'Username must have at least 3 characters and password 8-72 bytes.');
  }
  return { username, password };
}

async function createAccount(body) {
  const { username, password } = validateCredentials(body);
  if (body.admin !== undefined && typeof body.admin !== 'boolean') {
    throw new HttpError(400, 'admin must be a boolean.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  return User.create({ username, passwordHash, admin: body.admin === true });
}

async function register(req, res) {
  const user = await createAccount(req.body);
  res.status(201).json({ user: safeUser(user), token: tokenFor(user) });
}

async function createUser(req, res) {
  const user = await createAccount(req.body);
  res.status(201).json({ user: safeUser(user) });
}

async function login(req, res) {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = await User.findByUsername(username).select('+passwordHash');
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    throw new HttpError(401, 'Invalid username or password.');
  }
  res.json({ user: safeUser(user), token: tokenFor(user) });
}

function me(req, res) {
  res.json(safeUser(req.user));
}

async function listUsers(_req, res) {
  const users = await User.find().select('username admin createdAt');
  res.json(users);
}

module.exports = { register, createUser, login, me, listUsers };
