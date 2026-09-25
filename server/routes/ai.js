// routes/ai.js — Single API route for all AI tools

const express = require('express');
const router = express.Router();
const { processAIRequest } = require('../aiService');

// POST /api/ai
router.post('/', async (req, res) => {
  const { tool, payload } = req.body;

  const validTools = ['resume', 'notes', 'ppt', 'mindmap', 'explain', 'quiz', 'doubt-solver', 'flashcards', 'study-planner', 'summarizer'];
  if (!tool || !validTools.includes(tool)) {
    return res.status(400).json({ success: false, error: 'Invalid or missing tool name.' });
  }
  if (!payload) {
    return res.status(400).json({ success: false, error: 'Missing payload.' });
  }

  try {
    const result = await processAIRequest(tool, payload);
    return res.json(result);
  } catch (err) {
    console.error(`[AI Route Error] tool=${tool}:`, err.message);
    return res.status(500).json({ success: false, error: err.message || 'Something went wrong. Please try again.' });
  }
});

// GET /api/status — health check + demo mode status
router.get('/status', (req, res) => {
  const demoMode = process.env.DEMO_MODE === 'true' || !process.env.AI_API_KEY || process.env.AI_API_KEY === 'your_openai_api_key_here';
  res.json({
    success: true,
    status: 'online',
    demo: demoMode,
    provider: process.env.AI_PROVIDER || 'openai',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo'
  });
});

module.exports = router;
