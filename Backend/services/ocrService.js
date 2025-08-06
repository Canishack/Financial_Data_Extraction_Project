// Backend/services/ocrService.js

const fs = require('fs').promises;
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');

/**
 * Performs OCR on an image file using Tesseract.js.
 * @param {string} filePath - The path to the image file.
 * @returns {Promise<string>} - A promise that resolves with the extracted text.
 */
async function performOcrOnImage(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(
      filePath,
      'eng', // Language code (English). You can add more like 'hin' for Hindi etc.
      {
        logger: m => console.log(m) // Log OCR progress to the console
      }
    );
    return text;
  } catch (error) {
    console.error("Error performing OCR on image:", error);
    throw new Error("Failed to perform OCR on image.");
  }
}

/**
 * Processes a document (PDF, image, or plain text) to extract its text content.
 * It uses pdf-parse for text-based PDFs and Tesseract.js for images.
 * For image-based PDFs, it will note the limitation.
 * @param {string} filePath - The path to the document file.
 * @param {string} mimetype - The MIME type of the document.
 * @returns {Promise<string>} - A promise that resolves with the extracted text.
 */
async function processDocumentForText(filePath, mimetype) {
  let extractedText = '';

  if (mimetype === 'application/pdf') {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      extractedText = data.text;

      // Basic check: if pdf-parse extracts very little text, it might be an image-based PDF
      if (extractedText.trim().length < 50 && data.numpages > 0) {
        console.warn(`PDF "${filePath}" might be image-based. pdf-parse extracted very little text.`);
        extractedText = extractedText.trim() || "Could not extract text from PDF. It might be an image-based PDF requiring advanced OCR (e.g., ImageMagick + Tesseract).";
      }

    } catch (error) {
      console.error(`Error processing PDF ${filePath}:`, error);
      extractedText = "Failed to process PDF. It might be corrupted or an unsupported format.";
    }
  } else if (mimetype.startsWith('image/')) {
    try {
      extractedText = await performOcrOnImage(filePath);
    } catch (error) {
      console.error(`Error processing image ${filePath}:`, error);
      extractedText = "Failed to process image for OCR.";
    }
  } else if (mimetype === 'text/plain') {
    try {
      extractedText = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`Error reading text file ${filePath}:`, error);
      extractedText = "Failed to read plain text file.";
    }
  } else {
    extractedText = "Unsupported file type.";
  }

  return extractedText;
}

module.exports = {
  processDocumentForText
};
