/* ============================================================
   api.js — Shared API client for all AI modules
   All modules call Api.generate(tool, payload)
   ============================================================ */

const Api = (() => {
  const BASE = '/api/ai';
  let _isDemo = false;

  // ── Status Check ─────────────────────────────────────────────
  async function checkStatus() {
    try {
      const res = await fetch(`${BASE}/status`);
      const data = await res.json();
      _isDemo = data.demo === true;
      return data;
    } catch {
      _isDemo = true;
      return { success: false, demo: true };
    }
  }

  function isDemo() { return _isDemo; }

  // ── Core Generate ─────────────────────────────────────────────
  async function generate(tool, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 75000);

    try {
      const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, payload }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      let data;
      try { data = await res.json(); }
      catch { throw new Error('Server returned an invalid response. Please try again.'); }

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Server error (${res.status}). Please try again.`);
      }

      _isDemo = data.demo === true;
      return data; // { success, data, demo }

    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. The AI took too long. Please try again.');
      }
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Make sure the server is running on port 3000.');
      }
      throw err;
    }
  }

  // ── Tool-specific helpers (thin wrappers) ────────────────────
  function generateResume(formData)          { return generate('resume', formData); }
  function generateNotes(content, style)     { return generate('notes', { content, style }); }
  function generatePPT(topic, slides, audience, level, instructions) {
    return generate('ppt', { topic, slides, audience, level, instructions });
  }
  function generateMindMap(content)          { return generate('mindmap', { content }); }
  function explainTopic(topic)               { return generate('explain', { topic }); }
  function generateQuiz(topic, count, difficulty) { return generate('quiz', { topic, count, difficulty }); }
  function askDoubt(subject, prompt, history)     { return generate('doubt-solver', { subject, prompt, history }); }
  function generateFlashcards(topic, material, count, difficulty) { return generate('flashcards', { topic, material, count, difficulty }); }
  function generateStudyPlan(subjects, studyHours, startTime, endTime, studyDays, weakTopics) {
    return generate('study-planner', { subjects, studyHours, startTime, endTime, studyDays, weakTopics });
  }
  function summarizeText(text) { return generate('summarizer', { text }); }

  return {
    checkStatus, isDemo,
    generate, generateResume, generateNotes,
    generatePPT, generateMindMap, explainTopic,
    generateQuiz, askDoubt, generateFlashcards,
    generateStudyPlan, summarizeText
  };
})();
