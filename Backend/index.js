const express = require('express');
const cors = require('cors');
const path = require('path');

// Import your route handlers
const uploadRoute = require('./routes/upload');
const analysisRoute = require('./routes/analysis');

// Load .env variables (for local development only)
// On Vercel, these will come from the dashboard
require('dotenv').config({ path: path.join(__dirname, 'key.env') });

const app = express();

// Enable CORS for all incoming requests
app.use(cors());

// Standard middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Prefix API routes
app.use('/api', uploadRoute);
app.use('/api', analysisRoute);

// ✅ Health check route (optional but useful)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend running successfully' });
});

// ✅ Export the app for Vercel (no app.listen)
module.exports = app;
