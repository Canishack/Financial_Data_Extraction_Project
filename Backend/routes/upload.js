const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// ✅ ADD THIS LINE to import your text processing function
const { processDocumentForText } = require('../services/ocrService');

const uploadFolder = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadFolder, { recursive: true });
      cb(null, uploadFolder);
    } catch (err) {
      console.error("Error creating upload directory:", err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const mimetype = req.file.mimetype;

  try {
    // This function call will now work correctly
    const extractedText = await processDocumentForText(filePath, mimetype);
    
    // Clean up the uploaded file after processing
    await fs.unlink(filePath);
    
    res.json({
      message: '✅ File uploaded and processed successfully!',
      filename: req.file.filename,
      extractedText: extractedText
    });

  } catch (error) {
    console.error("Error during document processing:", error);
    // Clean up file even if processing fails
    await fs.unlink(filePath).catch(err => console.error("Error deleting file after failed processing:", err));
    res.status(500).json({ message: 'Error processing document.', error: error.message });
  }
});

module.exports = router;