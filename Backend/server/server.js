
const express = require('express');
const cors = require('cors');
const path = require('path');

const uploadRoute = require('../routes/upload');
const analysisRoute = require('../routes/analysis'); 
require('dotenv').config({ path: path.join(__dirname, '../key.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', uploadRoute);
app.use('/api', analysisRoute); 

app.get('/', (req, res) => {
  res.send('✅ Financial Data Extraction Backend is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
