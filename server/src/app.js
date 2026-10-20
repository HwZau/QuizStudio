const express = require('express');
const mongoose = require('mongoose');
const path = require('node:path');
const fs = require('node:fs');
const questionRoutes = require('./routes/questionRoutes');
const quizRoutes = require('./routes/quizRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const articleRoutes = require('./routes/articleRoutes');

const app = express();
app.use(express.json());

app.use('/api/quizzes', quizRoutes);
app.use(['/api/question', '/api/questions'], questionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Route not found.' }));

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.use((req, res) => {
  const indexFile = path.join(clientDist, 'index.html');
  if (req.method === 'GET' && req.accepts('html') && fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, _req, res, _next) => {
  if (error.code === 11000) {
    return res.status(409).json({ error: 'Username already exists.' });
  }
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  if (error instanceof mongoose.Error.ValidationError ||
      error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: error.message });
  }
  if (error.status && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
