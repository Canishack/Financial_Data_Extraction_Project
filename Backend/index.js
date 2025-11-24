const express = require('express');
const cors = require('cors');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, 'key.env') });

// Import routes
const uploadRoute = require('./routes/upload');
const analysisRoute = require('./routes/analysis');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', uploadRoute);
app.use('/api', analysisRoute);

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: "OK", message: "Backend running" });
});

// For Vercel
module.exports = app;

// For LOCAL development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Local backend running at http://localhost:${PORT}`);
  });
}
