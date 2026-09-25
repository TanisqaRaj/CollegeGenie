// routes/sheetsProxy.js — Proxy for Google Apps Script to avoid browser CORS

const express = require('express');
const router  = express.Router();

function isValidAppsScriptUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('google.com');
  } catch { return false; }
}

// GET /api/sheets-proxy?url=<appsScriptUrl>
router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url || !isValidAppsScriptUrl(url))
    return res.status(400).json({ success: false, error: 'Invalid or missing Apps Script URL.' });

  try {
    const upstream = await fetch(url, { redirect: 'follow' });
    const json = await upstream.json();
    res.status(upstream.status).json(json);
  } catch (err) {
    res.status(502).json({ success: false, error: 'Unable to reach Google Apps Script.' });
  }
});

// POST /api/sheets-proxy?url=<appsScriptUrl>
router.post('/', async (req, res) => {
  const { url } = req.query;
  if (!url || !isValidAppsScriptUrl(url))
    return res.status(400).json({ success: false, error: 'Invalid or missing Apps Script URL.' });

  try {
    const upstream = await fetch(url, {
      method:   'POST',
      redirect: 'follow',
      headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
      body:     JSON.stringify(req.body),
    });
    const json = await upstream.json();
    res.status(upstream.status).json(json);
  } catch (err) {
    res.status(502).json({ success: false, error: 'Unable to reach Google Apps Script.' });
  }
});

module.exports = router;
