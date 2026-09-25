/* notes.js — AI Notes Generator Module */
window.NotesModule = (() => {

  let currentNotes = '';
  let selectedStyle = 'detailed';

  function getHTML() {
    return `
<div class="tool-header">
  <div class="tool-header-icon" style="background:linear-gradient(135deg,#b2f5ea,#4fd1c5)"><i class="fas fa-book-open"></i></div>
  <div class="tool-header-text"><h1>AI Notes Generator</h1><p>Paste any study material and get structured, exam-ready notes instantly.</p></div>
</div>
<div class="tool-layout">

  <!-- Input Panel -->
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-paste"></i> Study Material</h2></div>

      <div style="margin-bottom:12px;">
        <p style="font-size:0.82rem;font-weight:600;color:var(--grey-dark);margin-bottom:8px;">Notes Style</p>
        <div class="notes-options">
          <button class="notes-option-btn active" data-style="short">Short Notes</button>
          <button class="notes-option-btn" data-style="detailed">Detailed Notes</button>
          <button class="notes-option-btn" data-style="exam">Exam Notes</button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="notesInput">Paste your textbook content, topic, or chapter here <span class="required">*</span></label>
        <textarea class="form-control" id="notesInput" rows="14"
          placeholder="Paste your study material here...&#10;&#10;Example:&#10;Chapter 3: Machine Learning&#10;Machine learning is a subset of AI that enables systems to learn from data..."></textarea>
      </div>

      <div class="counter-bar">
        <span>Characters: <span id="notesCharCount">0</span></span>
        <span>Words: <span id="notesWordCount">0</span></span>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-mint btn-lg" id="btnGenNotes"><i class="fas fa-magic"></i> Generate Notes</button>
      <button class="btn btn-ghost" id="btnClearNotes"><i class="fas fa-trash"></i> Clear</button>
    </div>
  </div>

  <!-- Output Panel -->
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div class="card" style="flex:1;">
      <div class="card-header">
        <h2 class="card-title"><i class="fas fa-file-alt"></i> Generated Notes</h2>
        <div style="display:flex;gap:8px;" id="notesOutputActions">
          <button class="btn btn-outline btn-sm" id="btnCopyNotes" title="Copy"><i class="fas fa-copy"></i></button>
          <button class="btn btn-outline btn-sm" id="btnRegenNotes" title="Regenerate"><i class="fas fa-redo"></i></button>
        </div>
      </div>
      <div class="notes-output" id="notesOutput">
        <div class="empty-state"><i class="fas fa-book-open"></i><h3>Notes will appear here</h3><p>Paste content and click Generate Notes</p></div>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;" id="notesDownloadBar">
      <button class="btn btn-outline btn-sm" id="btnDownloadTxt"><i class="fas fa-download"></i> Download TXT</button>
      <button class="btn btn-outline btn-sm" id="btnDownloadNotesPDF"><i class="fas fa-file-pdf"></i> Download PDF</button>
    </div>
  </div>

</div>`;
  }

  async function generate() {
    const input = document.getElementById('notesInput')?.value?.trim();
    if (!input) { Utils.toast('Please paste some study material first.', 'error'); return; }
    if (input.length < 20) { Utils.toast('Content too short. Please paste more text.', 'error'); return; }

    const btn = document.getElementById('btnGenNotes');
    Utils.setButtonLoading(btn, true);
    Utils.showLoading('notesOutput', 'Generating structured notes...');

    try {
      const result = await Api.generateNotes(input, selectedStyle);
      currentNotes = result.data;
      document.getElementById('notesOutput').innerHTML = Utils.renderMarkdown(currentNotes);
      if (result.demo) Utils.toast('Demo mode: showing sample notes. Add API key for real AI.', 'info');
      else Utils.toast('Notes generated!', 'success');
    } catch (err) {
      Utils.showError('notesOutput', err.message, generate);
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  }

  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML();

    // Style selector
    document.querySelectorAll('.notes-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.notes-option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedStyle = btn.dataset.style;
      });
    });

    // Counter
    document.getElementById('notesInput')?.addEventListener('input', e => {
      Utils.updateCounters(e.target.value,
        document.getElementById('notesCharCount'),
        document.getElementById('notesWordCount')
      );
    });

    document.getElementById('btnGenNotes')?.addEventListener('click', generate);
    document.getElementById('btnRegenNotes')?.addEventListener('click', generate);

    document.getElementById('btnClearNotes')?.addEventListener('click', () => {
      document.getElementById('notesInput').value = '';
      currentNotes = '';
      Utils.updateCounters('', document.getElementById('notesCharCount'), document.getElementById('notesWordCount'));
      document.getElementById('notesOutput').innerHTML = `<div class="empty-state"><i class="fas fa-book-open"></i><h3>Notes will appear here</h3><p>Paste content and click Generate Notes</p></div>`;
    });

    document.getElementById('btnCopyNotes')?.addEventListener('click', () => {
      if (!currentNotes) { Utils.toast('Generate notes first.', 'error'); return; }
      Utils.copyToClipboard(currentNotes);
    });

    document.getElementById('btnDownloadTxt')?.addEventListener('click', () => {
      if (!currentNotes) { Utils.toast('Generate notes first.', 'error'); return; }
      Utils.downloadText(currentNotes, 'notes.txt');
    });

    document.getElementById('btnDownloadNotesPDF')?.addEventListener('click', () => {
      const el = document.getElementById('notesOutput');
      if (!currentNotes || !el) { Utils.toast('Generate notes first.', 'error'); return; }
      Utils.downloadPDF(el, 'notes.pdf');
    });
  }

  return { init };
})();
