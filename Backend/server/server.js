const express = require('express');       // Import Express framework
const multer = require('multer');         // For handling file uploads
const cors = require('cors');             // To enable cross-origin requests
const path = require('path');             // To work with directory paths
const fs = require('fs');                 // To check/create folders


const app = express();
app.use(cors()); // Allow frontend (localhost:3000) to talk to backend (localhost:5000)

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder)