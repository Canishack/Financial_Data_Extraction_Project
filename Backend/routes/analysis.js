

const express = require('express');
const router = express.Router();
const nodeFetch = require('node-fetch'); 
require('dotenv').config({ path: '../key.env' });

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = nodeFetch;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

router.post('/analyze', async (req, res) => {
  const { articleText } = req.body;

  if (!articleText) {
    return res.status(400).json({ message: 'No article text provided for analysis.' });
  }

  const prompt = `Extract the following financial information from the given article text and return it as a JSON object.
  If a piece of information is not explicitly mentioned or cannot be confidently inferred, use "N/A" for its value.
  Ensure numerical values for Revenue, Profit, and Market Cap include their units (e.g., "100 Billion USD", "500 Million EUR").
  
  Expected fields (case-sensitive):
  "Company Name"
  "Revenue"
  "Profit (Net Income)"
  "Market Cap"
  "Sector/Industry"
  "CEO"
  "Headquarters"
  "Total Assets"
  "Total Liabilities"
  "Net Income Margin"
  "Earnings Per Share (EPS)"
  "P/E Ratio"
  "Dividend Yield"
  "Founding Date"
  "Number of Employees"
  
  Article Text:
  "${articleText}"`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          "Company Name": { "type": "STRING" },
          "Revenue": { "type": "STRING" },
          "Profit (Net Income)": { "type": "STRING" },
          "Market Cap": { "type": "STRING" },
          "Sector/Industry": { "type": "STRING" },
          "CEO": { "type": "STRING" },
          "Headquarters": { "type": "STRING" },
          "Total Assets": { "type": "STRING" },
          "Total Liabilities": { "type": "STRING" },
          "Net Income Margin": { "type": "STRING" },
          "Earnings Per Share (EPS)": { "type": "STRING" },
          "P/E Ratio": { "type": "STRING" },
          "Dividend Yield": { "type": "STRING" },
          "Founding Date": { "type": "STRING" },
          "Number of Employees": { "type": "STRING" }
        },
        "propertyOrdering": [
          "Company Name",
          "Revenue",
          "Profit (Net Income)",
          "Market Cap",
          "Sector/Industry",
          "CEO",
          "Headquarters",
          "Total Assets",
          "Total Liabilities",
          "Net Income Margin",
          "Earnings Per Share (EPS)",
          "P/E Ratio",
          "Dividend Yield",
          "Founding Date",
          "Number of Employees"
        ]
      }
    }
  };

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

  let retries = 0;
  const maxRetries = 5;
  const baseDelay = 1000;

  while (retries < maxRetries) {
    try {
     
      const response = await fetch(apiUrl, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 429) {
          const delay = baseDelay * Math.pow(2, retries);
          console.warn(`Rate limit hit. Retrying LLM call in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          continue;
        }
        throw new Error(`LLM API HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const jsonString = result.candidates[0].content.parts[0].text;
        const parsedJson = JSON.parse(jsonString);
        return res.json(parsedJson);
      } else {
        console.error("LLM response structure unexpected:", JSON.stringify(result, null, 2));
        return res.status(500).json({ message: 'LLM did not return expected structured content.' });
      }

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return res.status(500).json({ message: 'Failed to analyze data with LLM.', error: error.message });
    }
  }

  return res.status(500).json({ message: 'LLM analysis failed after multiple retries due to rate limiting or persistent errors.' });
});

module.exports = router;
