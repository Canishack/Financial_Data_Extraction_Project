const express = require('express');
const cors = require('cors');
const path = require('path');

// Import your route handlers
const uploadRoute = require('./routes/upload');
const analysisRoute = require('./routes/analysis');

// Vercel handles environment variables through its dashboard,
// but this line is still useful for local development (`vercel dev`)
require('dotenv').config({ path: path.join(__dirname, 'key.env') });

const app = express();

// Enable CORS for all incoming requests
app.use(cors());

// Standard middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount your API routes.
// The vercel.json rewrite rule forwards requests like '/api/upload' to this file,
// so the Express app needs to handle the full '/api' path.
app.use('/api', uploadRoute);
app.use('/api', analysisRoute);

// This is the crucial change for Vercel:
// We use the standard Node.js module export.
// Vercel uses this to serve your Express app as a serverless function.
module.exports = app;

