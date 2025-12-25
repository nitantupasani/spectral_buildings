const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Base directory of the project (backend/..)
const rootDir = path.join(__dirname, '..', '..');
const envPath = path.join(rootDir, '.env');
const envLocalPath = path.join(rootDir, '.env.local');

// Load base .env first (if it exists)
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Load .env.local last so it can override defaults and hold secrets like API keys
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
}

module.exports = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
};
