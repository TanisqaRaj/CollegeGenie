/* flashcards.js — AI Flashcard Generator Module */
window.FlashcardsModule = (() => {
  let cards = [];
  let current = 0;
  let flipped = false;

  function getHTML() {
    return `
<div class="tool-header">
  <div class="tool-header-icon" style="background:linear-gradient(135deg,#c6f6d5,#48bb78)"><i class="fas fa-layer-group"></i></div>
  <div class="tool-header-text"><h1>AI Flashcard Generator</h1><p>Generate interactive flip flashcards to boost your memory and revision.</p></div>
</div>
<div class="tool-layout">
  <!-- Input -->
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-edit" style="color:#276749"></i> Flashcard Settings</h2></div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label" for="fcTopic">Topic <span class="required">*</span></label>
          <input class="form-control" id="fcTopic" placeholder="e.g. Machine Learning, DBMS, OS Concepts" />
        </div>
        <div class="form-group">
          <label class="form-label" for="fcMaterial">Study Material (optional)</label>
          <textarea class="form-control" id="fcMaterial" rows="4" placeholder="Paste notes or textbook content to generate cards from your own material..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="fcCount">Number of Cards</label>
            <select class="form-control" id="fcCount">
              <option value="5">5 cards</option>
              <option value="8" selected>8 cards</option>
              <option value="10">10 cards</option>
              <option value="15">15 cards</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="fcDifficulty">Difficulty</label>
            <select class="form-control" id="fcDifficulty">
              <option value="Easy">Easy</option>
              <option value="Medium" selected>Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-lg" style="background:linear-gradient(135deg,#48bb78,#276749);color:#fff;" id="btnGenFC"><i class="fas fa-magic"></i> Generate Flashcards</button>
      <button class="btn btn-ghost" id="btnClearFC"><i class="fas fa-trash"></i> Clear</button>
    </div>
  </div>

  <!-- Viewer -->
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div id="fcOutput">
      <div class="empty-state" style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);min-height:320px;">
        <i class="fas fa-layer-group" style="color:#48bb78;opacity:1;font-size:2.5rem;"></i>
        <h3>Flashcards will appear here</h3>
        <p>Enter a topic and click Generate Flashcards</p>
      </div>
    </div>
  </div>
</div>`;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderCard() {
    if (!cards.length) return;
    flipped = false;
    const card = cards[current];
    const e = Utils.escapeHtml;

    document.getElementById('fcOutput').innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <!-- Counter -->
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.85rem;font-weight:600;color:var(--grey-dark);">Card ${current + 1} of ${cards.length}</span>
          <span style="font-size:0.78rem;color:var(--text-muted);">Click card to flip</span>
        </div>

        <!-- Card -->
        <div class="fc-scene" id="fcScene" tabindex="0" role="button" aria-label="Flashcard — click to flip">
          <div class="fc-card" id="fcCard">
            <div class="fc-front">
              <div class="fc-label">Question</div>
              <p class="fc-text">${e(card.question)}</p>
            </div>
            <div class="fc-back">
              <div class="fc-label" style="color:#276749;">Answer</div>
              <p class="fc-text">${e(card.answer)}</p>
              <button class="btn btn-ghost btn-sm" id="btnCopyAnswer" style="margin-top:12px;font-size:0.75rem;">
                <i class="fas fa-copy"></i> Copy Answer
              </button>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" id="btnFCPrev" ${current === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Prev</button>
          <button class="btn btn-sm" style="background:linear-gradient(135deg,#48bb78,#276749);color:#fff;" id="btnFCFlip"><i class="fas fa-sync-alt"></i> Flip</button>
          <button class="btn btn-ghost btn-sm" id="btnFCNext" ${current === cards.length - 1 ? 'disabled' : ''}>Next <i class="fas fa-chevron-right"></i></button>
        </div>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" id="btnFCShuffle"><i class="fas fa-random"></i> Shuffle</button>
          <button class="btn btn-outline btn-sm" id="btnFCRestart"><i class="fas fa-redo"></i> Restart</button>
          <button class="btn btn-outline btn-sm" id="btnFCRegen"><i class="fas fa-magic"></i> Generate New Set</button>
        </div>

        <!-- Dot indicators -->
        <div style="display:flex;justify-content:center;gap:5px;flex-wrap:wrap;">
          ${cards.map((_, i) => `<button class="slide-dot ${i === current ? 'active' : ''}" data-fcidx="${i}" style="background:${i === current ? '#48bb78' : ''};" aria-label="Card ${i+1}"></button>`).join('')}
        </div>
      </div>`;

    // Flip on click
    const scene = document.getElementById('fcScene');
    const cardEl = document.getElementById('fcCard');
    function doFlip() {
      flipped = !flipped;
      cardEl.classList.toggle('is-flipped', flipped);
    }
    scene?.addEventListener('click', e => { if (!e.target.closest('button')) doFlip(); });
    scene?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFlip(); } });

    document.getElementById('btnFCFlip')?.addEventListener('click', doFlip);
    document.getElementById('btnFCPrev')?.addEventListener('click', () => { current--; renderCard(); });
    document.getElementById('btnFCNext')?.addEventListener('click', () => { current++; renderCard(); });
    document.getElementById('btnFCShuffle')?.addEventListener('click', () => { cards = shuffle(cards); current = 0; renderCard(); Utils.toast('Cards shuffled!', 'info', 2000); });
    document.getElementById('btnFCRestart')?.addEventListener('click', () => { current = 0; renderCard(); });
    document.getElementById('btnFCRegen')?.addEventListener('click', () => generate());
    document.getElementById('btnCopyAnswer')?.addEventListener('click', () => Utils.copyToClipboard(cards[current].answer));
    document.querySelectorAll('[data-fcidx]').forEach(dot => {
      dot.addEventListener('click', () => { current = parseInt(dot.dataset.fcidx); renderCard(); });
    });
  }

  async function generate() {
    const topic = document.getElementById('fcTopic')?.value?.trim();
    if (!topic) { Utils.toast('Please enter a topic.', 'error'); return; }
    const material = document.getElementById('fcMaterial')?.value?.trim() || '';
    const count = parseInt(document.getElementById('fcCount')?.value) || 8;
    const difficulty = document.getElementById('fcDifficulty')?.value || 'Medium';

    const btn = document.getElementById('btnGenFC');
    Utils.setButtonLoading(btn, true);
    document.getElementById('fcOutput').innerHTML = `<div class="loading-overlay" style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);min-height:320px;"><div class="spinner" style="border-color:#c6f6d5;border-top-color:#276749;width:36px;height:36px;border-width:4px;"></div><p>Generating flashcards...</p></div>`;

    try {
      const result = await Api.generateFlashcards(topic, material, count, difficulty);
      const data = result.data;
      if (!data.cards?.length) throw new Error('No cards returned. Please try again.');
      cards = data.cards;
      current = 0;
      renderCard();
      if (result.demo) Utils.toast('Demo mode: showing sample flashcards.', 'info');
      else Utils.toast(`${cards.length} flashcards generated!`, 'success');
    } catch (err) {
      Utils.showError('fcOutput', err.message, generate);
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  }

  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML();
    cards = []; current = 0;
    document.getElementById('btnGenFC')?.addEventListener('click', generate);
    document.getElementById('btnClearFC')?.addEventListener('click', () => {
      cards = []; current = 0;
      document.getElementById('fcTopic').value = '';
      document.getElementById('fcMaterial').value = '';
      document.getElementById('fcOutput').innerHTML = `<div class="empty-state" style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);min-height:320px;"><i class="fas fa-layer-group" style="color:#48bb78;opacity:1;font-size:2.5rem;"></i><h3>Flashcards will appear here</h3><p>Enter a topic and click Generate Flashcards</p></div>`;
    });
  }

  return { init };
})();
