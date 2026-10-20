
const fs = require('node:fs');
const path = require('node:path');

const source = path.join(__dirname, '../client/dist');
const destination = path.join(__dirname, '../public');

fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });

console.log('Frontend prepared for Vercel.');