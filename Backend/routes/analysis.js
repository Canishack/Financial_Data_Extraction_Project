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


  const prompt = `
Extract the following financial information from the given article text and return it as a JSON object.
If a piece of information is not explicitly mentioned or cannot be confidently inferred, use "N/A" for its value.

Return the JSON exactly in this property order (case sensitive):
[
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

Rules:
- Output **ONLY** valid JSON.
- No explanations.
- No backticks.
- No additional text before or after the JSON.

Article Text:
"${articleText}"
`;

  const payload = {
    contents: [
      { parts: [{ text: prompt }] }
    ],
    generationConfig: {
      temperature: 0.2
    }
  };

  const apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

      if (
        result.candidates &&
        result.candidates[0]?.content?.parts?.[0]?.text
      ) {
        let text = result.candidates[0].content.parts[0].text.trim();

        // Remove accidental Markdown wrappers
        text = text.replace(/```json|```/g, '').trim();

        let parsedJson;
        try {
          parsedJson = JSON.parse(text);
        } catch (err) {
          console.error("JSON parse failed. Model returned:", text);
          throw new Error("Model returned invalid JSON");
        }

        return res.json(parsedJson);
      }

      console.error("LLM response structure unexpected:", JSON.stringify(result, null, 2));
      return res.status(500).json({ message: 'LLM did not return expected structured content.' });

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return res.status(500).json({ message: 'Failed to analyze data with LLM.', error: error.message });
    }
  }

  return res.status(500).json({
    message: 'LLM analysis failed after multiple retries due to rate limiting or persistent errors.'
  });
});

module.exports = router;
