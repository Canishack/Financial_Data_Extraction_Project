
const express = require('express');
const cors = require('cors');
const path = require('path');


// Import your route handlers
const uploadRoute = require('./routes/upload');
const analysisRoute = require('./routes/analysis');

// Load environment variables (Vercel will use its own system for this)
require('dotenv').config({ path: path.join(__dirname, 'key.env') });

const app = express();

// Enable CORS for all incoming requests
app.use(cors());

// Standard middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount your API routes. Vercel's rewrite rule sends '/api/...' requests here,
// so the Express app needs to handle the full path.
app.use('/api', uploadRoute);
app.use('/api', analysisRoute);

// This is the crucial change:
// Instead of a Firebase-specific export, we use the standard Node.js module export.
// Vercel uses this to serve your Express app as a serverless function.
module.exports = app;
const uploadRoute = require('./routes/upload');
const analysisRoute = require('./routes/analysis');

// For local development, it will use the .env file.
// In the deployed Firebase environment, it will use the configured variable.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, 'key.env') });
}


const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', uploadRoute);
app.use('/api', analysisRoute);


exports.api = functions.https.onRequest(app);


