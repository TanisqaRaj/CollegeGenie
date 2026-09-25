/* ppt.js — AI PPT Generator Module */
window.PPTModule = (() => {

  let slides = [];
  let currentSlide = 0;
  let presentationTitle = '';

  function getHTML() {
    return `
<div class="tool-header">
  <div class="tool-header-icon" style="background:linear-gradient(135deg,#bee3f8,#63b3ed)"><i class="fas fa-desktop"></i></div>
  <div class="tool-header-text"><h1>AI PPT Generator</h1><p>Generate a complete slide deck for any topic in seconds.</p></div>
</div>
<div class="tool-layout">

  <!-- Input -->
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-edit"></i> Presentation Details</h2></div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label" for="pptTopic">Presentation Topic <span class="required">*</span></label>
          <input class="form-control" id="pptTopic" placeholder="e.g. Introduction to Machine Learning" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="pptSlides">Number of Slides</label>
            <select class="form-control" id="pptSlides">
              <option value="5">5 slides</option>
              <option value="6">6 slides</option>
              <option value="7" selected>7 slides</option>
              <option value="8">8 slides</option>
              <option value="9">9 slides</option>
              <option value="10">10 slides</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="pptLevel">Level</label>
            <select class="form-control" id="pptLevel">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate" selected>Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="pptAudience">Target Audience</label>
          <input class="form-control" id="pptAudience" placeholder="College students, professors, professionals..." />
        </div>
        <div class="form-group">
          <label class="form-label" for="pptInstructions">Additional Instructions (optional)</label>
          <textarea class="form-control" id="pptInstructions" rows="3" placeholder="e.g. Include real-world examples, focus on applications..."></textarea>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-blue btn-lg" id="btnGenPPT"><i class="fas fa-magic"></i> Generate Slides</button>
      <button class="btn btn-ghost" id="btnClearPPT"><i class="fas fa-trash"></i> Clear</button>
    </div>

    <!-- Slide deck list -->
    <div class="card" id="slideDeckCard" style="display:none;">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-list"></i> Slide Outline</h2></div>
      <div class="slide-deck-list" id="slideDeckList"></div>
    </div>
  </div>

  <!-- Viewer -->
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div id="pptViewerWrap">
      <div class="empty-state" style="min-height:380px;background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);">
        <i class="fas fa-desktop"></i><h3>Slides will appear here</h3><p>Enter a topic and click Generate Slides</p>
      </div>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;" id="pptExportBar" style="display:none;">
      <button class="btn btn-blue btn-sm" id="btnDownloadPPTX"><i class="fas fa-download"></i> Download PPTX</button>
      <button class="btn btn-outline btn-sm" id="btnCopySlide"><i class="fas fa-copy"></i> Copy Slide</button>
      <button class="btn btn-outline btn-sm" id="btnRegenPPT"><i class="fas fa-redo"></i> Regenerate</button>
    </div>
  </div>
</div>`;
  }

  function renderViewer() {
    if (!slides.length) return;
    const s = slides[currentSlide];
    const e = Utils.escapeHtml;
    const dots = slides.map((_, i) =>
      `<button class="slide-dot ${i === currentSlide ? 'active' : ''}" data-idx="${i}" aria-label="Go to slide ${i+1}"></button>`
    ).join('');

    document.getElementById('pptViewerWrap').innerHTML = `
      <div class="slide-viewer">
        <div class="slide-display">
          <span class="slide-number-badge">Slide ${currentSlide + 1} / ${slides.length}</span>
          <h2 class="slide-title-el">${e(s.title)}</h2>
          <ul class="slide-bullets">${(s.bullets || []).map(b => `<li>${e(b)}</li>`).join('')}</ul>
        </div>
        <div class="slide-controls">
          <div class="slide-nav-group">
            <button class="btn btn-ghost btn-sm" id="btnPrevSlide" ${currentSlide === 0 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Prev</button>
            <span class="slide-counter">${currentSlide + 1} / ${slides.length}</span>
            <button class="btn btn-ghost btn-sm" id="btnNextSlide" ${currentSlide === slides.length - 1 ? 'disabled' : ''}>Next <i class="fas fa-chevron-right"></i></button>
          </div>
          <div class="slide-dots">${dots}</div>
        </div>
      </div>`;

    document.getElementById('btnPrevSlide')?.addEventListener('click', () => { if (currentSlide > 0) { currentSlide--; renderViewer(); updateDeckActive(); } });
    document.getElementById('btnNextSlide')?.addEventListener('click', () => { if (currentSlide < slides.length - 1) { currentSlide++; renderViewer(); updateDeckActive(); } });
    document.querySelectorAll('.slide-dot').forEach(d => {
      d.addEventListener('click', () => { currentSlide = parseInt(d.dataset.idx); renderViewer(); updateDeckActive(); });
    });
  }

  function renderDeckList() {
    const list = document.getElementById('slideDeckList');
    if (!list) return;
    list.innerHTML = slides.map((s, i) => `
      <div class="slide-thumb ${i === currentSlide ? 'active' : ''}" data-idx="${i}">
        <span class="slide-thumb-num">${i + 1}</span>
        <span class="slide-thumb-title">${Utils.escapeHtml(s.title)}</span>
      </div>`).join('');
    document.querySelectorAll('.slide-thumb').forEach(t => {
      t.addEventListener('click', () => { currentSlide = parseInt(t.dataset.idx); renderViewer(); updateDeckActive(); });
    });
  }

  function updateDeckActive() {
    document.querySelectorAll('.slide-thumb').forEach((t, i) => t.classList.toggle('active', i === currentSlide));
  }

  async function generate() {
    const topic = document.getElementById('pptTopic')?.value?.trim();
    if (!topic) { Utils.toast('Please enter a presentation topic.', 'error'); return; }

    const numSlides = parseInt(document.getElementById('pptSlides')?.value) || 7;
    const level = document.getElementById('pptLevel')?.value || 'Intermediate';
    const audience = document.getElementById('pptAudience')?.value?.trim() || 'College students';
    const instructions = document.getElementById('pptInstructions')?.value?.trim() || '';

    const btn = document.getElementById('btnGenPPT');
    Utils.setButtonLoading(btn, true);
    document.getElementById('pptViewerWrap').innerHTML = `<div class="loading-overlay" style="min-height:380px;background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);"><div class="spinner" style="border-color:var(--blue-light);border-top-color:var(--blue-dark);width:36px;height:36px;border-width:4px;"></div><p>Generating your slide deck...</p></div>`;

    try {
      const result = await Api.generatePPT(topic, numSlides, audience, level, instructions);
      const data = result.data;
      if (!data.slides || !Array.isArray(data.slides) || data.slides.length === 0) throw new Error('No slides returned. Please try again.');
      slides = data.slides;
      presentationTitle = data.presentationTitle || topic;
      currentSlide = 0;
      renderViewer();
      renderDeckList();
      document.getElementById('slideDeckCard').style.display = '';
      document.getElementById('pptExportBar').style.display = 'flex';
      if (result.demo) Utils.toast('Demo mode: showing sample slides. Add API key for real AI.', 'info');
      else Utils.toast(`Generated ${slides.length} slides!`, 'success');
    } catch (err) {
      document.getElementById('pptViewerWrap').innerHTML = `<div class="error-state" style="margin:0;"><div class="error-state-title"><i class="fas fa-exclamation-triangle"></i> Error</div><p>${Utils.escapeHtml(err.message)}</p></div>`;
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  }

  async function downloadPPTX() {
    if (!slides.length) { Utils.toast('Generate slides first.', 'error'); return; }
    if (!window.PptxGenJS) { Utils.toast('PPTX library not loaded. Please refresh and try again.', 'error'); return; }
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';

      // Title slide
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: '1e293b' };
      titleSlide.addText(presentationTitle, { x: 0.5, y: 1.5, w: 9, h: 1.5, fontSize: 32, bold: true, color: 'f8fafc', align: 'center' });
      titleSlide.addText('AI Student Toolkit', { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 14, color: '94a3b8', align: 'center' });

      slides.forEach(s => {
        const slide = pptx.addSlide();
        slide.background = { color: '1e293b' };
        slide.addText(s.title, { x: 0.5, y: 0.4, w: 9, h: 0.9, fontSize: 24, bold: true, color: 'f8fafc' });
        slide.addShape(pptx.ShapeType.line, { x: 0.5, y: 1.35, w: 9, h: 0, line: { color: 'f687b3', width: 2 } });
        const bulletRows = (s.bullets || []).map(b => ({ text: b, options: { bullet: { type: 'bullet' }, color: 'cbd5e1', fontSize: 16, breakLine: true } }));
        if (bulletRows.length) slide.addText(bulletRows, { x: 0.5, y: 1.6, w: 9, h: 4.5, valign: 'top' });
      });

      const filename = Utils.slugify(presentationTitle) || 'presentation';
      await pptx.writeFile({ fileName: `${filename}.pptx` });
      Utils.toast('PPTX downloaded!', 'success');
    } catch (err) {
      Utils.toast('PPTX export failed: ' + err.message, 'error');
    }
  }

  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML();

    document.getElementById('btnGenPPT')?.addEventListener('click', generate);
    document.getElementById('btnRegenPPT')?.addEventListener('click', generate);
    document.getElementById('btnDownloadPPTX')?.addEventListener('click', downloadPPTX);

    document.getElementById('btnCopySlide')?.addEventListener('click', () => {
      if (!slides.length) { Utils.toast('Generate slides first.', 'error'); return; }
      const s = slides[currentSlide];
      const text = `${s.title}\n\n${(s.bullets || []).map(b => `• ${b}`).join('\n')}`;
      Utils.copyToClipboard(text);
    });

    document.getElementById('btnClearPPT')?.addEventListener('click', () => {
      slides = []; currentSlide = 0; presentationTitle = '';
      document.getElementById('pptTopic').value = '';
      document.getElementById('pptAudience').value = '';
      document.getElementById('pptInstructions').value = '';
      document.getElementById('pptViewerWrap').innerHTML = `<div class="empty-state" style="min-height:380px;background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);"><i class="fas fa-desktop"></i><h3>Slides will appear here</h3><p>Enter a topic and click Generate Slides</p></div>`;
      document.getElementById('slideDeckCard').style.display = 'none';
      document.getElementById('pptExportBar').style.display = 'none';
    });
  }

  return { init };
})();
