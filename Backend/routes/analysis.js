// Backend/routes/analysis.js
const express = require('express');
const router = express.Router();
const nodeFetch = require('node-fetch');
require('dotenv').config({ path: '../key.env' });

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = nodeFetch;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Local uploaded sample file path (from this session)
const SAMPLE_FILE_PATH = '/mnt/data/728bb579-67ea-463d-8df5-aec934a11e1e.png';

/* ---------------------------
   Numeric parsing helpers
   --------------------------- */

function safeTrim(s) {
  return (s === null || s === undefined) ? '' : String(s).trim();
}

// clean numeric-like strings: remove currency symbols & commas
function cleanNumericString(s) {
  if (s === null || s === undefined) return null;
  const str = String(s).trim();
  if (!str) return null;
  if (/^N\/A$/i.test(str)) return null;
  // convert parentheses negative e.g. (1.5M) -> -1.5M
  const parenMatch = str.match(/^\((.*)\)$/);
  const normalized = parenMatch ? `-${parenMatch[1]}` : str;
  // remove spaces around signs
  return normalized.replace(/\s+/g, ' ');
}

// Parse money strings with suffixes and Indian units. Returns integer or null.
function parseMoneyToNumber(str) {
  if (str === null || str === undefined) return null;
  if (typeof str === 'number') return str;

  let s = String(str).trim();
  if (!s) return null;

  // Normalize parentheses negative
  s = s.replace(/^\((.*)\)$/, '-$1');

  // Detect currency symbol hints but don't remove suffix clues
  // Remove currency symbols for parsing but keep letters (k,m,b,cr,l etc)
  const currencySymbol = s.match(/(₹|\$|usd|inr)/i)?.[0]?.toLowerCase() || null;
  s = s.replace(/[₹$,\s]/g, '');

  // Patterns:
  // 1.5B, 100M, 250k, 5Cr, 12L, 909348
  const re = /^([-+]?[0-9]*\.?[0-9]+)([kKmMbB]|m|million|b|billion|cr|crore|l|lakh)?$/i;
  const m = s.match(re);
  if (m) {
    const n = parseFloat(m[1]);
    const suf = (m[2] || '').toLowerCase();

    if (suf === 'k') return Math.round(n * 1e3);
    if (suf === 'm' || suf === 'million') return Math.round(n * 1e6);
    if (suf === 'b' || suf === 'billion') return Math.round(n * 1e9);
    if (suf === 'cr' || suf === 'crore') return Math.round(n * 1e7); // 1 Crore = 1e7
    if (suf === 'l' || suf === 'lakh') return Math.round(n * 1e5);

    // no suffix -> plain number
    const plain = Number(n);
    return Number.isFinite(plain) ? Math.round(plain) : null;
  }

  // fallback: strip non-digit except - and decimal and parse
  const fallback = Number(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(fallback) ? Math.round(fallback) : null;
}

/* ---------------------------
   Year / table extraction helpers
   --------------------------- */

// Find year-like tokens (2021, 2021-22, FY21, 21-22 etc), returns array preserving order.
function extractYearLabels(text) {
  if (!text) return [];
  const years = [];
  const regex = /\b(20\d{2}(?:[-–\/]\d{2,4})?|FY\s*'?(\d{2,4})|\b\d{2}(?:-\d{2})\b)\b/gi;
  let m;
  while ((m = regex.exec(text))) {
    let token = m[1];
    if (!token) token = m[0];
    token = token.replace(/^FY\s*/i, '');
    // Normalize '21 or '21-22 or 21-22 to 2021 or 2021-22 where possible (prefer left side)
    const twoYear = token.match(/^(\d{2})-(\d{2})$/);
    if (twoYear) {
      const left = twoYear[1];
      const full = left.length === 2 ? `20${left}` : left;
      token = full;
    }
    years.push(token);
  }
  return [...new Set(years)];
}

// Extract year:value pairs from a single line or inline block.
// Returns array of { year, raw, value }
function extractYearValuePairsFromTextBlock(textBlock) {
  if (!textBlock) return [];
  const pairs = [];
  // First try explicit pairs: 2021: 1.5B$, 2022: 2B$
  const explicitRegex = /(?:FY\s*)?('?\d{2,4}'?|\d{4}(?:-\d{2,4})?)\s*[:\-]\s*([^,;]+)/gi;
  let m;
  while ((m = explicitRegex.exec(textBlock))) {
    let rawYear = m[1].replace(/'/g, '').trim();
    // normalize 2-digit year to 4-digit (prefer 20xx)
    if (/^\d{2}$/.test(rawYear)) rawYear = `20${rawYear}`;
    const rawVal = m[2].trim();
    const parsed = parseMoneyToNumber(rawVal);
    pairs.push({ year: rawYear, raw: rawVal, value: parsed });
  }

  if (pairs.length) return pairs;

  // Next try compact patterns: 2021 1.5B 2022 2B 2023 4B
  const compactRegex = /(\d{4})\s*([-\u2013\u2014]?)\s*([-+]?[0-9.,()A-Za-z₹$]+)/gi;
  while ((m = compactRegex.exec(textBlock))) {
    const rawYear = m[1];
    const rawVal = m[3].trim();
    const parsed = parseMoneyToNumber(rawVal);
    pairs.push({ year: rawYear, raw: rawVal, value: parsed });
  }

  // If still none, try comma-separated numbers after a label: "Revenue 589,060 613,401 622,425"
  if (!pairs.length) {
    // tokenize and find numeric-like tokens
    const tokens = textBlock.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
    const numericTokens = tokens.filter(t => /[0-9₹$.,kKmMbBcrlL]/.test(t));
    if (numericTokens.length) {
      // If we have nearby year labels, map them
      const years = extractYearLabels(textBlock);
      if (years.length && numericTokens.length) {
        for (let i = 0; i < numericTokens.length; i++) {
          const rawVal = numericTokens[i];
          const parsed = parseMoneyToNumber(rawVal);
          pairs.push({ year: years[i] || String(i + 1), raw: rawVal, value: parsed });
        }
      }
    }
  }

  return pairs;
}

// Given articleText, try to pull rows for revenue/profit/assets/liabilities
function extractTableFromArticle(articleText) {
  if (!articleText) return {};
  const lines = articleText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {};
  const keywords = [
    { key: 'Revenue', tests: [/^revenue\b/i, /\brevenue[:\s]/i] },
    { key: 'Profit/Loss', tests: [/^profit\b/i, /\bprofit[:\s]/i, /\bpat\b/i, /net income/i] },
    { key: 'Assets', tests: [/asset/i] },
    { key: 'Liabilities', tests: [/liabil/i] }
  ];

  for (const kw of keywords) {
    let collected = [];
    // check each line for keyword presence
    for (const line of lines) {
      for (const t of kw.tests) {
        if (t.test(line)) {
          // try to extract year:value pairs from the rest of the line
          const afterLabel = line.replace(new RegExp(`^.*?${kw.key}[:\\s]*`, 'i'), '').trim();
          // if line contains explicit pairs
          const pairs = extractYearValuePairsFromTextBlock(line).concat(extractYearValuePairsFromTextBlock(afterLabel));
          if (pairs && pairs.length) collected = collected.concat(pairs);
        }
      }
    }

    // also try inline pattern: "Revenue: 2021:1.5B,2022:2B" from whole article
    if (!collected.length) {
      const inlineRegex = new RegExp(`${kw.key}\\s*[:\\-]\\s*([^\\n]+)`, 'i');
      const im = articleText.match(inlineRegex);
      if (im && im[1]) {
        const pairs = extractYearValuePairsFromTextBlock(im[1]);
        if (pairs && pairs.length) collected = collected.concat(pairs);
      }
    }

    if (collected.length) {
      // dedupe by year preserve order
      const seen = new Set();
      const unique = [];
      for (const p of collected) {
        if (!seen.has(p.year)) {
          seen.add(p.year);
          unique.push({
            year: p.year,
            raw: safeTrim(p.raw),
            value: (p.value === null ? null : p.value)
          });
        }
      }
      result[kw.key.toLowerCase()] = unique;
    }
  }

  return result;
}

/* ---------------------------
   Canonical keys and normalization to final JSON
   --------------------------- */

function canonicalKeyName(k) {
  if (!k) return k;
  const key = String(k).toLowerCase();
  if (key.includes('revenue') || key.includes('sales') || key.includes('income')) return 'Revenue';
  if (key.includes('profit') || key.includes('pat') || key.includes('net income')) return 'Profit/Loss';
  if (key.includes('asset')) return 'Assets';
  if (key.includes('liab')) return 'Liabilities';
  return k;
}

// Ensure array of { year, raw, value } from various raw shapes (string/number/array/object)
function ensureYearRawValueArray(input) {
  if (!input) return [];
  // If already array of objects with raw & value, map and sanitize
  if (Array.isArray(input)) {
    const out = input.map((it, idx) => {
      if (it === null || it === undefined) return null;
      if (typeof it === 'object' && ('raw' in it || 'value' in it)) {
        const year = safeTrim(it.year) || String(idx + 1);
        const raw = (it.raw !== undefined && it.raw !== null) ? String(it.raw) : (it.value !== undefined ? String(it.value) : '');
        const value = (it.value !== undefined && it.value !== null) ? parseMoneyToNumber(it.value) : parseMoneyToNumber(raw);
        return { year, raw: safeTrim(raw), value: value === null ? null : value };
      }
      // If entry is string like "2021: 1.5B$"
      if (typeof it === 'string') {
        const pairs = extractYearValuePairsFromTextBlock(it);
        if (pairs.length === 1) return { year: pairs[0].year, raw: safeTrim(pairs[0].raw), value: pairs[0].value };
        // else try parse numeric
        const value = parseMoneyToNumber(it);
        return { year: String(idx + 1), raw: it, value: value };
      }
      // If number
      if (typeof it === 'number') {
        return { year: String(idx + 1), raw: String(it), value: Math.round(it) };
      }
      return null;
    }).filter(Boolean);
    return out;
  }

  // If object mapping year->value
  if (typeof input === 'object') {
    const entries = Object.entries(input).map(([k, v]) => {
      const year = safeTrim(k);
      const raw = (v === null || v === undefined) ? '' : String(v);
      const value = parseMoneyToNumber(v);
      return { year: year || '', raw: safeTrim(raw), value: value === null ? null : value };
    });
    return entries;
  }

  // primitive value -> single-element array
  const parsed = parseMoneyToNumber(input);
  return [{ year: '1', raw: String(input), value: parsed }];
}

/* ---------------------------
   Simple insight generator
   --------------------------- */

function formatCompact(n) {
  if (n === null || n === undefined) return 'N/A';
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return `${n}`;
}

function generateInsights(normalized) {
  const insights = [];
  try {
    const rev = normalized.Revenue || [];
    const prof = normalized['Profit/Loss'] || [];
    if (rev.length >= 2) {
      const r0 = rev[0].value || 0;
      const rn = rev[rev.length - 1].value || 0;
      insights.push(`Revenue grew from ${formatCompact(r0)} in ${rev[0].year} to ${formatCompact(rn)} in ${rev[rev.length - 1].year}.`);
    }
    if (prof.length >= 2) {
      const p0 = prof[0].value || 0;
      const pn = prof[prof.length - 1].value || 0;
      insights.push(`Profit/Loss changed from ${formatCompact(p0)} to ${formatCompact(pn)} over the reported years.`);
    }
  } catch (e) {
    // ignore
  }
  return insights;
}

/* ---------------------------
   Gemini call wrapper
   --------------------------- */

async function callGemini(payload) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Gemini API error ${response.status} ${response.statusText} ${text}`);
  }

  const result = await response.json();
  return result;
}

/* ---------------------------
   Build robust prompt (strict)
   --------------------------- */

function buildPrompt(articleText) {
  const sampleHint = SAMPLE_FILE_PATH ? `\n(Optional uploaded file available at server path: ${SAMPLE_FILE_PATH})\n` : '';

  const systemPrompt = `
You are a strict financial data extractor. Return ONLY JSON (no commentary).
Follow these rules exactly.

1) If text contains multi-year values (e.g., "2021: 1.5B, 2022: 2B"), you MUST return arrays of year/raw/value objects.
2) For every reported category (Revenue, Profit, Assets, Liabilities), return an array. NEVER return an empty array for a category that is present in the text.
3) Keep original textual entry as "raw". Also provide numeric "value" (integer). Example:
   { "year": "2021", "raw": "1.5B$", "value": 1500000000 }
4) If a numeric value is negative, still return it as "value": -50000000 and include "loss": true in the object.
5) Interpret "$" as USD always. Interpret Indian comma formatting and ₹/INR as INR.
6) Convert shorthand to raw numbers: 1.5B -> 1500000000, 100M -> 100000000, 5Cr -> 50000000, 12L -> 1200000.
7) Recognize year formats: 2021, 2021-22, FY21, '21, 21-22; prefer the leftmost 4-digit for year label when possible.
8) Output JSON EXACT structure:

{
  "Company Name": "",
  "Headquarters": "",
  "Revenue": [ {"year":"", "raw":"", "value": number, "loss": optional boolean } ],
  "Profit/Loss": [ {"year":"", "raw":"", "value": number, "loss": optional boolean } ],
  "Assets": [ {"year":"", "raw":"", "value": number } ],
  "Liabilities": [ {"year":"", "raw":"", "value": number } ],
  "Profit Margin": [ {"year":"", "raw":"", "value": number } ],
  "Insights": []
}

${sampleHint}

Article Text:
<<<ARTICLE_START>>>
${articleText}
<<<ARTICLE_END>>>
`;

  return { contents: [{ parts: [{ text: systemPrompt }] }], generationConfig: { temperature: 0.0 } };
}

/* ---------------------------
   Main route
   --------------------------- */

router.post('/analyze', async (req, res) => {
  try {
    const { articleText } = req.body;
    if (!articleText || !String(articleText).trim()) {
      return res.status(400).json({ message: 'No article text provided for analysis.' });
    }

    // Build prompt and call model
    const promptPayload = buildPrompt(articleText);

    let modelParsed = null;
    try {
      const modelRes = await callGemini(promptPayload);
      const rawText = modelRes?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText.replace(/```json|```/g, '').trim();
        try {
          modelParsed = JSON.parse(cleaned);
        } catch (err) {
          // attempt extract first JSON object substring
          const match = cleaned.match(/\{[\s\S]*\}/);
          if (match) {
            try { modelParsed = JSON.parse(match[0]); } catch (e) { modelParsed = null; }
          } else {
            modelParsed = null;
          }
        }
      }
    } catch (e) {
      console.warn('Gemini call failed or returned non-JSON. Continuing with fallback text parsing.', e.message || e);
    }

    // Build initial final structure
    const final = {
      "Company Name": null,
      "Headquarters": null,
      "Revenue": [],
      "Profit/Loss": [],
      "Assets": [],
      "Liabilities": [],
      "Profit Margin": [],
      "Insights": []
    };

    // If model returned parsed JSON, map canonical keys and normalize
    if (modelParsed && typeof modelParsed === 'object') {
      for (const [rawKey, rawVal] of Object.entries(modelParsed)) {
        const canon = canonicalKeyName(rawKey);
        if (['Revenue', 'Profit/Loss', 'Assets', 'Liabilities', 'Profit Margin'].includes(canon)) {
          const arr = ensureYearRawValueArray(rawVal);
          final[canon] = final[canon].concat(arr);
        } else if (/company/i.test(rawKey)) {
          final['Company Name'] = final['Company Name'] || rawVal;
        } else if (/headquarter|hq/i.test(rawKey)) {
          final['Headquarters'] = final['Headquarters'] || rawVal;
        } else if (/insight/i.test(rawKey)) {
          final['Insights'] = final['Insights'].concat(Array.isArray(rawVal) ? rawVal : [String(rawVal)]);
        }
      }
    }

    // Fallback extraction from article text
    const fallback = extractTableFromArticle(articleText);
    if (fallback.revenue && fallback.revenue.length) {
      // convert fallback entries to expected shape
      const converted = fallback.revenue.map(e => ({ year: e.year, raw: safeTrim(e.raw || e.value || ''), value: e.value }));
      // only use fallback if model didn't provide multi-year revenue
      if (!final.Revenue.length || final.Revenue.length < converted.length) final.Revenue = converted;
    }
    if (fallback['profit/loss'] && fallback['profit/loss'].length) {
      const converted = fallback['profit/loss'].map(e => ({ year: e.year, raw: safeTrim(e.raw || e.value || ''), value: e.value }));
      if (!final['Profit/Loss'].length || final['Profit/Loss'].length < converted.length) final['Profit/Loss'] = converted;
    }
    if (fallback.assets && fallback.assets.length) {
      const converted = fallback.assets.map(e => ({ year: e.year, raw: safeTrim(e.raw || e.value || ''), value: e.value }));
      if (!final.Assets.length) final.Assets = converted;
    }
    if (fallback.liabilities && fallback.liabilities.length) {
      const converted = fallback.liabilities.map(e => ({ year: e.year, raw: safeTrim(e.raw || e.value || ''), value: e.value }));
      if (!final.Liabilities.length) final.Liabilities = converted;
    }

    // If still empty for important categories but model provided single values, convert them
    if ((!final.Revenue || final.Revenue.length === 0) && modelParsed) {
      const candidates = modelParsed.Revenue || modelParsed['Revenue'] || modelParsed['Revenue1'] || modelParsed.revenue;
      if (candidates) final.Revenue = ensureYearRawValueArray(candidates);
    }
    if ((!final['Profit/Loss'] || final['Profit/Loss'].length === 0) && modelParsed) {
      const candidates = modelParsed['Profit'] || modelParsed['Profit (Net Income)'] || modelParsed['PAT'] || modelParsed['Profit/Loss'] || modelParsed.profit;
      if (candidates) final['Profit/Loss'] = ensureYearRawValueArray(candidates);
    }

    // Final sanitize: ensure .value numeric and add loss flag where needed; also set defaults for raw if missing
    function sanitizeAndFlag(arr) {
      return (arr || []).map(item => {
        const year = safeTrim(item.year) || '';
        const raw = safeTrim(item.raw !== undefined ? item.raw : (item.value !== undefined ? String(item.value) : ''));
        let value = (item.value !== undefined && item.value !== null) ? parseMoneyToNumber(item.value) : parseMoneyToNumber(raw);
        if (value === null) value = null; // keep null if cannot parse
        const out = { year, raw, value };
        if (typeof value === 'number' && value < 0) out.loss = true;
        return out;
      }).filter(Boolean);
    }

    final.Revenue = sanitizeAndFlag(final.Revenue);
    final['Profit/Loss'] = sanitizeAndFlag(final['Profit/Loss']);
    final.Assets = sanitizeAndFlag(final.Assets);
    final.Liabilities = sanitizeAndFlag(final.Liabilities);
    final['Profit Margin'] = sanitizeAndFlag(final['Profit Margin']);

    // Populate metadata if empty using modelParsed
    if (modelParsed) {
      final['Company Name'] = final['Company Name'] || modelParsed['Company Name'] || modelParsed.company || modelParsed.Company || null;
      final['Headquarters'] = final['Headquarters'] || modelParsed['Headquarters'] || modelParsed.hq || modelParsed.HQ || null;
    }

    // If some arrays are empty but the article contains those labels, try a more aggressive inline scan
    const aggressive = extractTableFromArticle(articleText);
    if ((!final.Revenue || final.Revenue.length === 0) && aggressive.revenue) final.Revenue = aggressive.revenue.map(e => ({ year: e.year, raw: safeTrim(e.raw || ''), value: e.value }));
    if ((!final['Profit/Loss'] || final['Profit/Loss'].length === 0) && aggressive['profit/loss']) final['Profit/Loss'] = aggressive['profit/loss'].map(e => ({ year: e.year, raw: safeTrim(e.raw || ''), value: e.value }));

    // Generate simple insights and merge
    const autoInsights = generateInsights(final);
    final.Insights = Array.isArray(final.Insights) ? [...new Set([...(final.Insights || []), ...autoInsights])] : autoInsights;

    // Ensure arrays exist
    final.Revenue = final.Revenue || [];
    final['Profit/Loss'] = final['Profit/Loss'] || [];
    final.Assets = final.Assets || [];
    final.Liabilities = final.Liabilities || [];
    final['Profit Margin'] = final['Profit Margin'] || [];
    final.Insights = final.Insights || [];

    return res.json(final);

  } catch (err) {
    console.error('Analysis route error:', err);
    return res.status(500).json({ message: 'Analysis failed', error: err.message });
  }
});

module.exports = router;
