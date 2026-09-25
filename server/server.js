// server.js — AI Student Toolkit Express Server

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' }
});
app.use('/api/', limiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/ai', aiRouter);

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const demoMode = process.env.DEMO_MODE === 'true' || !process.env.AI_API_KEY;
  console.log(`\n✅  AI Student Toolkit running at http://localhost:${PORT}`);
  console.log(`📦  Mode: ${demoMode ? '🎭 DEMO MODE (no API key required)' : '🤖 AI Mode (' + (process.env.AI_PROVIDER || 'openai') + ')'}`);
  console.log(`\nPress Ctrl+C to stop.\n`);
});
