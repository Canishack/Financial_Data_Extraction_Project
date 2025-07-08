const express = require('express');       // Import Express framework
const multer = require('multer');         // For handling file uploads
const cors = require('cors');             // To enable cross-origin requests
const path = require('path');             // To work with directory paths
const fs = require('fs');                 // To check/create folders


const app = express();
app.use(cors()); // Allow frontend (localhost:3000) to talk to backend (localhost:5000)

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder); // Save files in /uploads
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });


app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  res.json({
    message: 'File uploaded successfully!',
    filename: req.file.filename
  });
});


app.listen(5000, () => {
  console.log('Backend running on http://localhost:5000');
});