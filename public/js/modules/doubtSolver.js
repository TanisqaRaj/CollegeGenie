/* doubtSolver.js — AI Doubt Solver Chatbot Module */
window.DoubtSolverModule = (() => {
  let history = [];
  let currentSubject = 'Artificial Intelligence';
  const SUBJECTS = ['Artificial Intelligence','Machine Learning','NLP','DBMS','Operating Systems','Computer Networks','Python','Java','Android','Cloud Computing','IoT','Other'];

  function getHTML() {
    const subjectOptions = SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('');
    return `
<div class="tool-header">
  <div class="tool-header-icon" style="background:linear-gradient(135deg,#fed7e2,#fc8181)"><i class="fas fa-comments"></i></div>
  <div class="tool-header-text"><h1>AI Doubt Solver</h1><p>Ask any academic question and get clear, student-friendly AI explanations.</p></div>
</div>
<div style="display:flex;flex-direction:column;gap:16px;max-width:860px;">
  <!-- Subject bar -->
  <div class="card" style="padding:16px 20px;">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <label class="form-label" style="margin:0;white-space:nowrap;"><i class="fas fa-book" style="color:#e53e3e"></i> Subject:</label>
      <select class="form-control" id="doubtSubject" style="max-width:220px;">${subjectOptions}</select>
      <div id="customSubjectWrap" style="display:none;flex:1;">
        <input class="form-control" id="doubtCustomSubject" placeholder="Enter your subject..." />
      </div>
      <button class="btn btn-ghost btn-sm" id="btnClearChat" style="margin-left:auto;"><i class="fas fa-trash"></i> Clear Chat</button>
    </div>
  </div>

  <!-- Chat area -->
  <div class="card" style="padding:0;overflow:hidden;">
    <div id="chatArea" style="min-height:420px;max-height:520px;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px;">
      <div class="chat-welcome">
        <i class="fas fa-graduation-cap" style="font-size:2rem;color:#fc8181;margin-bottom:8px;"></i>
        <h3 style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:4px;">Ask any academic question!</h3>
        <p style="font-size:0.875rem;color:var(--text-muted);">Select a subject above and type your doubt below. I'll explain it clearly.</p>
      </div>
    </div>
    <!-- Input area -->
    <div style="border-top:1px solid var(--border);padding:14px 16px;display:flex;gap:10px;align-items:flex-end;background:var(--bg);">
      <textarea class="form-control" id="doubtInput" rows="2"
        placeholder="Type your question here... (Press Enter to send, Shift+Enter for new line)"
        style="resize:none;flex:1;"></textarea>
      <button class="btn btn-sm" style="background:linear-gradient(135deg,#fc8181,#e53e3e);color:#fff;height:42px;padding:0 16px;" id="btnSendDoubt">
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
</div>`;
  }

  function addMessage(role, content, isDemo) {
    const chatArea = document.getElementById('chatArea');
    if (!chatArea) return;

    const welcome = chatArea.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.className = `chat-msg chat-msg-${role}`;

    if (role === 'user') {
      div.innerHTML = `
        <div class="chat-bubble chat-bubble-user">${Utils.escapeHtml(content)}</div>`;
    } else {
      const demoTag = isDemo ? `<span class="demo-badge-small" style="margin-bottom:6px;display:inline-flex;"><i class="fas fa-flask"></i> Demo</span><br>` : '';
      div.innerHTML = `
        <div class="chat-bubble chat-bubble-ai">
          ${demoTag}
          <div class="chat-ai-content">${Utils.renderMarkdown(content)}</div>
          <button class="btn btn-ghost btn-sm chat-copy-btn" style="margin-top:8px;font-size:0.75rem;padding:4px 10px;">
            <i class="fas fa-copy"></i> Copy
          </button>
        </div>`;
      div.querySelector('.chat-copy-btn')?.addEventListener('click', () => Utils.copyToClipboard(content));
    }

    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function addTypingIndicator() {
    const chatArea = document.getElementById('chatArea');
    if (!chatArea) return;
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg-ai';
    div.id = 'typingIndicator';
    div.innerHTML = `<div class="chat-bubble chat-bubble-ai"><div class="chat-typing"><span></span><span></span><span></span></div></div>`;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  function removeTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
  }

  async function sendQuestion() {
    const input = document.getElementById('doubtInput');
    const question = input?.value?.trim();
    if (!question) return;

    const subject = document.getElementById('doubtSubject')?.value === 'Other'
      ? (document.getElementById('doubtCustomSubject')?.value?.trim() || 'General')
      : (document.getElementById('doubtSubject')?.value || 'General');

    input.value = '';
    input.style.height = 'auto';
    addMessage('user', question);
    addTypingIndicator();

    const sendBtn = document.getElementById('btnSendDoubt');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const result = await Api.askDoubt(subject, question, history);
      removeTypingIndicator();
      const answer = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
      addMessage('ai', answer, result.demo);
      history.push({ q: question, a: answer });
      // Keep last 6 exchanges to avoid token overflow
      if (history.length > 6) history = history.slice(-6);
    } catch (err) {
      removeTypingIndicator();
      addMessage('ai', `Sorry, I couldn't get an answer right now: ${err.message}`);
      Utils.toast(err.message, 'error');
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      input?.focus();
    }
  }

  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML();
    history = [];

    document.getElementById('doubtSubject')?.addEventListener('change', function() {
      const wrap = document.getElementById('customSubjectWrap');
      if (wrap) wrap.style.display = this.value === 'Other' ? 'flex' : 'none';
      currentSubject = this.value;
    });

    document.getElementById('btnSendDoubt')?.addEventListener('click', sendQuestion);

    document.getElementById('doubtInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendQuestion();
      }
    });

    document.getElementById('btnClearChat')?.addEventListener('click', () => {
      history = [];
      const chatArea = document.getElementById('chatArea');
      if (chatArea) {
        chatArea.innerHTML = `
          <div class="chat-welcome">
            <i class="fas fa-graduation-cap" style="font-size:2rem;color:#fc8181;margin-bottom:8px;"></i>
            <h3 style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:4px;">Ask any academic question!</h3>
            <p style="font-size:0.875rem;color:var(--text-muted);">Select a subject above and type your doubt below.</p>
          </div>`;
      }
      Utils.toast('Chat cleared.', 'info', 2000);
    });
  }

  return { init };
})();
