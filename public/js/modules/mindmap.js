/* mindmap.js — AI Mind Map Generator Module */
window.MindMapModule = (() => {

  let mapData = null;
  let zoomLevel = 1;

  function getHTML() {
    return `
<div class="tool-header">
  <div class="tool-header-icon" style="background:linear-gradient(135deg,#e9d8fd,#b794f4)"><i class="fas fa-project-diagram"></i></div>
  <div class="tool-header-text"><h1>AI Mind Map Generator</h1><p>Convert your syllabus or topic list into a visual hierarchical mind map.</p></div>
</div>
<div class="tool-layout">

  <!-- Input -->
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-list"></i> Topic / Syllabus</h2></div>
      <div class="form-group">
        <label class="form-label" for="mmInput">Paste your syllabus or topic list <span class="required">*</span></label>
        <textarea class="form-control" id="mmInput" rows="14"
          placeholder="Unit 1: Introduction to AI&#10;- AI definition&#10;- History of AI&#10;- Applications&#10;&#10;Unit 2: Machine Learning&#10;- Supervised Learning&#10;- Unsupervised Learning&#10;- Reinforcement Learning"></textarea>
      </div>
      <div class="counter-bar">
        <span>Characters: <span id="mmCharCount">0</span></span>
        <span>Words: <span id="mmWordCount">0</span></span>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-purple btn-lg" id="btnGenMM"><i class="fas fa-magic"></i> Generate Mind Map</button>
      <button class="btn btn-ghost" id="btnClearMM"><i class="fas fa-trash"></i> Clear</button>
    </div>

    <!-- Explanation Panel -->
    <div id="explainPanel" style="display:none;" class="explain-panel">
      <h4><i class="fas fa-lightbulb" style="color:var(--purple-dark)"></i> <span id="explainTopic">Topic</span></h4>
      <div id="explainContent"><div class="spinner spinner-dark"></div></div>
    </div>
  </div>

  <!-- Mind Map Viewer -->
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div class="mindmap-canvas-wrap">
      <div class="mindmap-controls">
        <button class="btn btn-ghost btn-icon btn-sm" id="btnZoomIn" title="Zoom In"><i class="fas fa-search-plus"></i></button>
        <button class="btn btn-ghost btn-icon btn-sm" id="btnZoomOut" title="Zoom Out"><i class="fas fa-search-minus"></i></button>
        <button class="btn btn-ghost btn-icon btn-sm" id="btnZoomReset" title="Reset Zoom"><i class="fas fa-expand-arrows-alt"></i></button>
      </div>
      <div class="mindmap-canvas" id="mmCanvas">
        <div class="empty-state" style="width:100%;justify-content:center;">
          <i class="fas fa-project-diagram"></i>
          <h3>Mind map will appear here</h3>
          <p>Paste your syllabus and click Generate</p>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;" id="mmExportBar" style="display:none;">
      <button class="btn btn-outline btn-sm" id="btnDownloadMM"><i class="fas fa-download"></i> Download JSON</button>
      <button class="btn btn-outline btn-sm" id="btnRegenMM"><i class="fas fa-redo"></i> Regenerate</button>
    </div>
  </div>
</div>`;
  }

  // ── Render HTML tree ──────────────────────────────────────
  function renderNode(node, depth) {
    if (!node) return '';
    const hasChildren = node.children && node.children.length > 0;
    const depthClass = `depth-${Math.min(depth, 3)}`;
    const toggleBtn = hasChildren
      ? `<button class="mm-toggle" title="Toggle"><i class="fas fa-chevron-down"></i></button>`
      : '';

    const childrenHTML = hasChildren
      ? `<div class="mm-node-children" id="mmchildren-${Math.random().toString(36).slice(2)}">
          ${node.children.map(c => renderNode(c, depth + 1)).join('')}
        </div>`
      : '';

    return `
      <div class="mm-node">
        <span class="mm-label ${depthClass}" data-topic="${Utils.escapeHtml(node.title || '')}">
          ${toggleBtn}
          ${Utils.escapeHtml(node.title || '')}
        </span>
        ${childrenHTML}
      </div>`;
  }

  function renderMap(data) {
    const canvas = document.getElementById('mmCanvas');
    if (!canvas) return;
    const inner = document.createElement('div');
    inner.className = 'mm-tree';
    inner.style.transform = `scale(${zoomLevel})`;
    inner.style.transformOrigin = 'top left';
    inner.innerHTML = renderNode(data, 0);
    canvas.innerHTML = '';
    canvas.appendChild(inner);

    // Toggle collapse on click of toggle button
    canvas.querySelectorAll('.mm-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const node = btn.closest('.mm-node');
        const children = node?.querySelector('.mm-node-children');
        if (!children) return;
        const collapsed = children.classList.toggle('collapsed');
        btn.innerHTML = collapsed
          ? '<i class="fas fa-chevron-right"></i>'
          : '<i class="fas fa-chevron-down"></i>';
      });
    });

    // Click label to explain
    canvas.querySelectorAll('.mm-label').forEach(label => {
      label.addEventListener('click', (e) => {
        if (e.target.closest('.mm-toggle')) return;
        const topic = label.dataset.topic;
        if (topic) explainTopic(topic);
      });
    });
  }

  // ── Explain topic ─────────────────────────────────────────
  async function explainTopic(topic) {
    const panel = document.getElementById('explainPanel');
    const topicEl = document.getElementById('explainTopic');
    const contentEl = document.getElementById('explainContent');
    if (!panel || !topicEl || !contentEl) return;

    panel.style.display = '';
    topicEl.textContent = topic;
    contentEl.innerHTML = `<div style="display:flex;gap:8px;align-items:center;color:var(--text-muted);font-size:0.875rem;"><div class="spinner spinner-dark" style="width:18px;height:18px;border-width:2px;"></div> Generating explanation...</div>`;

    try {
      const result = await Api.explainTopic(topic);
      const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
      contentEl.innerHTML = `<p style="font-size:0.875rem;color:var(--grey-dark);line-height:1.65;">${Utils.escapeHtml(text)}</p>`;
    } catch (err) {
      contentEl.innerHTML = `<p style="color:var(--pink-dark);font-size:0.875rem;">${Utils.escapeHtml(err.message)}</p>`;
    }
  }

  // ── Main Generate ─────────────────────────────────────────
  async function generate() {
    const input = document.getElementById('mmInput')?.value?.trim();
    if (!input) { Utils.toast('Please paste some content first.', 'error'); return; }

    const btn = document.getElementById('btnGenMM');
    Utils.setButtonLoading(btn, true);

    const canvas = document.getElementById('mmCanvas');
    canvas.innerHTML = `<div class="loading-overlay" style="width:100%;"><div class="spinner" style="border-color:var(--purple-light);border-top-color:var(--purple-dark);width:36px;height:36px;border-width:4px;"></div><p>Generating mind map...</p></div>`;

    try {
      const result = await Api.generateMindMap(input);
      mapData = result.data;
      if (!mapData || !mapData.title) throw new Error('Invalid mind map data returned. Please try again.');
      zoomLevel = 1;
      renderMap(mapData);
      document.getElementById('mmExportBar').style.display = 'flex';
      document.getElementById('explainPanel').style.display = 'none';
      if (result.demo) Utils.toast('Demo mode: showing sample mind map. Add API key for real AI.', 'info');
      else Utils.toast('Mind map generated!', 'success');
    } catch (err) {
      canvas.innerHTML = `<div class="error-state" style="margin:0;width:100%;"><div class="error-state-title"><i class="fas fa-exclamation-triangle"></i> Error</div><p>${Utils.escapeHtml(err.message)}</p></div>`;
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  }

  function applyZoom() {
    const tree = document.querySelector('#mmCanvas .mm-tree');
    if (tree) { tree.style.transform = `scale(${zoomLevel})`; tree.style.transformOrigin = 'top left'; }
  }

  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML();

    // Counter
    document.getElementById('mmInput')?.addEventListener('input', e => {
      Utils.updateCounters(e.target.value, document.getElementById('mmCharCount'), document.getElementById('mmWordCount'));
    });

    document.getElementById('btnGenMM')?.addEventListener('click', generate);
    document.getElementById('btnRegenMM')?.addEventListener('click', generate);

    document.getElementById('btnZoomIn')?.addEventListener('click', () => {
      zoomLevel = Math.min(2, zoomLevel + 0.15); applyZoom();
    });
    document.getElementById('btnZoomOut')?.addEventListener('click', () => {
      zoomLevel = Math.max(0.4, zoomLevel - 0.15); applyZoom();
    });
    document.getElementById('btnZoomReset')?.addEventListener('click', () => {
      zoomLevel = 1; applyZoom();
    });

    document.getElementById('btnDownloadMM')?.addEventListener('click', () => {
      if (!mapData) { Utils.toast('Generate mind map first.', 'error'); return; }
      Utils.downloadJSON(mapData, 'mindmap.json');
    });

    document.getElementById('btnClearMM')?.addEventListener('click', () => {
      document.getElementById('mmInput').value = '';
      mapData = null; zoomLevel = 1;
      Utils.updateCounters('', document.getElementById('mmCharCount'), document.getElementById('mmWordCount'));
      document.getElementById('mmCanvas').innerHTML = `<div class="empty-state" style="width:100%;justify-content:center;"><i class="fas fa-project-diagram"></i><h3>Mind map will appear here</h3><p>Paste your syllabus and click Generate</p></div>`;
      document.getElementById('mmExportBar').style.display = 'none';
      document.getElementById('explainPanel').style.display = 'none';
    });
  }

  return { init };
})();
