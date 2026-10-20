const express = require('express');
const backend = require('./server/src/app');
const { connectDatabase } = require('./server/src/config/database');

const app = express();
let databaseReady;

app.use('/api', async (_req, res, next) => {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    return res.status(503).json({
      error: 'Server configuration is incomplete.'
    });
  }

  try {
    if (!databaseReady) {
      databaseReady = connectDatabase().catch((error) => {
        databaseReady = undefined;
        throw error;
      });
    }

    await databaseReady;
    next();
  } catch {
    console.error('Database initialization failed.');
    res.status(503).json({
      error: 'Database connection is unavailable.'
    });
  }
});

app.use(backend);

module.exports = app;
