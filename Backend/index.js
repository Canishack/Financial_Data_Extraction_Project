const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const path = require('path');

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

