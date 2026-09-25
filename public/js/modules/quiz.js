/* quiz.js — AI Quiz Generator Module */
window.QuizModule = (() => {
  let questions = [];
  let currentQ = 0;
  let score = 0;
  let answered = [];

  function getHTML() {
    return `
<div class="tool-header">
  <div class="tool-header-icon" style="background:linear-gradient(135deg,#fefcbf,#f6e05e)"><i class="fas fa-question-circle" style="color:#744210"></i></div>
  <div class="tool-header-text"><h1>AI Quiz Generator</h1><p>Generate MCQ quizzes on any topic and test your knowledge.</p></div>
</div>
<div class="tool-layout">
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-edit" style="color:#d69e2e"></i> Quiz Settings</h2></div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label" for="quizTopic">Topic <span class="required">*</span></label>
          <input class="form-control" id="quizTopic" placeholder="e.g. Machine Learning, DBMS, Operating Systems" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="quizCount">Number of Questions</label>
            <select class="form-control" id="quizCount">
              <option value="5">5 questions</option>
              <option value="8" selected>8 questions</option>
              <option value="10">10 questions</option>
              <option value="15">15 questions</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="quizDifficulty">Difficulty</label>
            <select class="form-control" id="quizDifficulty">
              <option value="Easy">Easy</option>
              <option value="Medium" selected>Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-lg" style="background:linear-gradient(135deg,#f6e05e,#d69e2e);color:#744210;" id="btnGenQuiz"><i class="fas fa-magic"></i> Generate Quiz</button>
      <button class="btn btn-ghost" id="btnClearQuiz"><i class="fas fa-trash"></i> Clear</button>
    </div>
    <div id="quizScoreCard" style="display:none;" class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-trophy" style="color:#d69e2e"></i> Score</h2></div>
      <div id="quizScoreContent"></div>
    </div>
  </div>

  <div>
    <div id="quizOutput">
      <div class="empty-state" style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);min-height:300px;">
        <i class="fas fa-question-circle" style="color:#d69e2e;opacity:1;font-size:2.5rem;"></i>
        <h3>Quiz will appear here</h3>
        <p>Enter a topic and click Generate Quiz</p>
      </div>
    </div>
  </div>
</div>`;
  }

  function renderQuestion() {
    if (!questions.length) return;
    const q = questions[currentQ];
    const isAnswered = answered[currentQ] !== undefined;
    const e = Utils.escapeHtml;

    const optionsHTML = q.options.map((opt, i) => {
      let cls = 'quiz-option';
      if (isAnswered) {
        if (i === q.correct) cls += ' correct';
        else if (i === answered[currentQ] && i !== q.correct) cls += ' wrong';
      }
      return `<button class="quiz-option ${isAnswered ? '' : 'quiz-option-clickable'}" data-idx="${i}" ${isAnswered ? 'disabled' : ''}>
        <span class="quiz-option-letter">${String.fromCharCode(65 + i)}</span>
        <span>${e(opt)}</span>
        ${isAnswered && i === q.correct ? '<i class="fas fa-check" style="margin-left:auto;color:#276749"></i>' : ''}
        ${isAnswered && i === answered[currentQ] && i !== q.correct ? '<i class="fas fa-times" style="margin-left:auto;color:#c53030"></i>' : ''}
      </button>`;
    }).join('');

    const explanationHTML = isAnswered
      ? `<div class="quiz-explanation"><i class="fas fa-lightbulb"></i> ${e(q.explanation || 'The highlighted option is correct.')}</div>`
      : '';

    document.getElementById('quizOutput').innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <span style="font-size:0.82rem;font-weight:600;color:var(--grey-dark);">Question ${currentQ + 1} of ${questions.length}</span>
          <span style="font-size:0.82rem;font-weight:700;color:#d69e2e;">Score: ${score} / ${questions.length}</span>
        </div>
        <div class="quiz-progress"><div class="quiz-progress-bar" style="width:${((currentQ+1)/questions.length)*100}%"></div></div>
        <p class="quiz-question">${e(q.question)}</p>
        <div class="quiz-options">${optionsHTML}</div>
        ${explanationHTML}
        <div style="display:flex;justify-content:space-between;margin-top:16px;">
          <button class="btn btn-ghost btn-sm" id="btnQuizPrev" ${currentQ === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Prev</button>
          ${currentQ < questions.length - 1
            ? `<button class="btn btn-sm" style="background:linear-gradient(135deg,#f6e05e,#d69e2e);color:#744210;" id="btnQuizNext" ${!isAnswered ? 'disabled' : ''}>Next <i class="fas fa-chevron-right"></i></button>`
            : `<button class="btn btn-sm" style="background:linear-gradient(135deg,#48bb78,#276749);color:#fff;" id="btnQuizFinish" ${!isAnswered ? 'disabled' : ''}>Finish <i class="fas fa-flag-checkered"></i></button>`}
        </div>
      </div>`;

    document.querySelectorAll('.quiz-option-clickable').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        answered[currentQ] = idx;
        if (idx === q.correct) score++;
        renderQuestion();
        if (currentQ < questions.length - 1) {
          document.getElementById('btnQuizNext')?.removeAttribute('disabled');
        } else {
          document.getElementById('btnQuizFinish')?.removeAttribute('disabled');
        }
      });
    });

    document.getElementById('btnQuizPrev')?.addEventListener('click', () => { currentQ--; renderQuestion(); });
    document.getElementById('btnQuizNext')?.addEventListener('click', () => { currentQ++; renderQuestion(); });
    document.getElementById('btnQuizFinish')?.addEventListener('click', showResults);
  }

  function showResults() {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good' : pct >= 40 ? '📚 Keep Studying' : '💪 Keep Practicing';
    document.getElementById('quizOutput').innerHTML = `
      <div class="card" style="text-align:center;padding:40px 24px;">
        <div style="font-size:3rem;margin-bottom:12px;">${pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '📚'}</div>
        <h2 style="font-size:1.4rem;font-weight:800;color:var(--text);margin-bottom:4px;">Quiz Complete!</h2>
        <p style="font-size:2rem;font-weight:800;color:#d69e2e;margin:12px 0;">${score} / ${questions.length}</p>
        <p style="font-size:1rem;color:var(--text-muted);margin-bottom:20px;">${grade} — ${pct}%</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-sm" style="background:linear-gradient(135deg,#f6e05e,#d69e2e);color:#744210;" id="btnReviewQuiz"><i class="fas fa-eye"></i> Review Answers</button>
          <button class="btn btn-ghost btn-sm" id="btnRestartQuiz"><i class="fas fa-redo"></i> Restart</button>
        </div>
      </div>`;
    document.getElementById('btnReviewQuiz')?.addEventListener('click', () => { currentQ = 0; renderQuestion(); });
    document.getElementById('btnRestartQuiz')?.addEventListener('click', () => { score = 0; answered = []; currentQ = 0; renderQuestion(); });
  }

  async function generate() {
    const topic = document.getElementById('quizTopic')?.value?.trim();
    if (!topic) { Utils.toast('Please enter a quiz topic.', 'error'); return; }
    const count = parseInt(document.getElementById('quizCount')?.value) || 8;
    const difficulty = document.getElementById('quizDifficulty')?.value || 'Medium';
    const btn = document.getElementById('btnGenQuiz');
    Utils.setButtonLoading(btn, true);
    document.getElementById('quizOutput').innerHTML = `<div class="loading-overlay" style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);min-height:300px;"><div class="spinner" style="border-color:#fefcbf;border-top-color:#d69e2e;width:36px;height:36px;border-width:4px;"></div><p>Generating quiz...</p></div>`;
    try {
      const result = await Api.generateQuiz(topic, count, difficulty);
      const data = result.data;
      if (!data.questions?.length) throw new Error('No questions returned. Please try again.');
      questions = data.questions;
      score = 0; currentQ = 0; answered = [];
      renderQuestion();
      if (result.demo) Utils.toast('Demo mode: showing sample quiz.', 'info');
      else Utils.toast(`${questions.length} questions generated!`, 'success');
    } catch (err) {
      Utils.showError('quizOutput', err.message, generate);
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  }

  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML();
    document.getElementById('btnGenQuiz')?.addEventListener('click', generate);
    document.getElementById('btnClearQuiz')?.addEventListener('click', () => {
      questions = []; score = 0; currentQ = 0; answered = [];
      document.getElementById('quizTopic').value = '';
      document.getElementById('quizOutput').innerHTML = `<div class="empty-state" style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);min-height:300px;"><i class="fas fa-question-circle" style="color:#d69e2e;opacity:1;font-size:2.5rem;"></i><h3>Quiz will appear here</h3><p>Enter a topic and click Generate Quiz</p></div>`;
    });
  }

  return { init };
})();
