/* ocrSummarizer.js — AI Notes Summarizer from Photos (OCR + AI) */
window.OCRSummarizerModule = (() => {
  let currentFile = null;
  let extractedText = '';
  let summary = '';

  const MAX_SIZE_MB = 10;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  function getHTML() {
    return `
<div class="tool-header">
  <div class="tool-header-icon" style="background:linear-gradient(135deg,#feebc8,#ed8936)"><i class="fas fa-camera"></i></div>
  <div class="tool-header-text"><h1>AI Notes Summarizer</h1><p>Upload a photo of handwritten or printed notes — OCR extracts the text, AI generates a structured summary.</p></div>
</div>

<div class="tool-layout">
  <!-- Left: Upload + OCR -->
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-upload" style="color:#ed8936"></i> Upload Notes Image</h2></div>

      <!-- Drop zone -->
      <div id="ocrDropZone" class="ocr-dropzone" tabindex="0" role="button" aria-label="Upload image">
        <i class="fas fa-cloud-upload-alt" style="font-size:2rem;color:#ed8936;margin-bottom:8px;"></i>
        <p style="font-weight:600;color:var(--text);">Drop image here or click to browse</p>
        <p style="font-size:0.8rem;color:var(--text-muted);">JPG, JPEG, PNG, WEBP — max ${MAX_SIZE_MB}MB</p>
        <input type="file" id="ocrFileInput" accept=".jpg,.jpeg,.png,.webp" style="display:none;" aria-label="Choose image file" />
      </div>

      <!-- Preview -->
      <div id="ocrPreviewWrap" style="display:none;margin-top:14px;">
        <img id="ocrPreview" style="max-width:100%;max-height:280px;border-radius:var(--radius-sm);border:1px solid var(--border);object-fit:contain;" alt="Uploaded notes preview" />
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          <button class="btn btn-sm" style="background:linear-gradient(135deg,#ed8936,#c05621);color:#fff;" id="btnRunOCR"><i class="fas fa-eye"></i> Run OCR</button>
          <button class="btn btn-ghost btn-sm" id="btnChangeImage"><i class="fas fa-sync-alt"></i> Change Image</button>
          <button class="btn btn-outline btn-sm" id="btnRemoveImage"><i class="fas fa-trash"></i> Remove</button>
        </div>
      </div>

      <!-- OCR Progress -->
      <div id="ocrProgressWrap" style="display:none;margin-top:14px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <div class="spinner" style="width:18px;height:18px;border-width:2px;border-color:#feebc8;border-top-color:#ed8936;"></div>
          <span style="font-size:0.875rem;font-weight:600;color:var(--text);">OCR Processing...</span>
          <span id="ocrPct" style="font-size:0.875rem;color:#ed8936;font-weight:700;">0%</span>
        </div>
        <div style="background:var(--border);border-radius:20px;height:6px;overflow:hidden;">
          <div id="ocrProgressBar" style="height:100%;background:linear-gradient(90deg,#ed8936,#c05621);border-radius:20px;transition:width 0.3s ease;width:0%;"></div>
        </div>
      </div>
    </div>

    <!-- Extracted Text -->
    <div class="card" id="ocrTextCard" style="display:none;">
      <div class="card-header">
        <h2 class="card-title"><i class="fas fa-align-left" style="color:#ed8936"></i> Extracted Text</h2>
        <span style="font-size:0.75rem;color:var(--text-muted);">You can edit before summarizing</span>
      </div>
      <textarea class="form-control" id="ocrExtractedText" rows="10" placeholder="Extracted text will appear here. You can edit it before generating the summary..."></textarea>
      <div class="counter-bar" style="margin-top:6px;">
        <span>Characters: <span id="ocrCharCount">0</span></span>
        <span>Words: <span id="ocrWordCount">0</span></span>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        <button class="btn btn-sm" style="background:linear-gradient(135deg,#ed8936,#c05621);color:#fff;" id="btnGenSummary"><i class="fas fa-magic"></i> Generate Summary</button>
        <button class="btn btn-ghost btn-sm" id="btnClearOCR"><i class="fas fa-trash"></i> Clear All</button>
      </div>
    </div>
  </div>

  <!-- Right: Summary -->
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div class="card" style="flex:1;">
      <div class="card-header">
        <h2 class="card-title"><i class="fas fa-file-alt" style="color:#ed8936"></i> AI Summary</h2>
        <div style="display:flex;gap:8px;" id="summaryActions">
          <button class="btn btn-outline btn-sm" id="btnCopySummary" title="Copy"><i class="fas fa-copy"></i></button>
          <button class="btn btn-outline btn-sm" id="btnRegenSummary" title="Regenerate"><i class="fas fa-redo"></i></button>
        </div>
      </div>
      <div class="notes-output" id="summaryOutput" style="min-height:400px;">
        <div class="empty-state">
          <i class="fas fa-file-alt" style="color:#ed8936;opacity:1;font-size:2.5rem;"></i>
          <h3>Summary will appear here</h3>
          <p>Upload an image, run OCR, then click Generate Summary</p>
        </div>
      </div>
    </div>
    <div style="display:none;gap:8px;flex-wrap:wrap;" id="summaryDownloadBar">
      <button class="btn btn-outline btn-sm" id="btnDownloadSummaryTxt"><i class="fas fa-download"></i> Download TXT</button>
      <button class="btn btn-outline btn-sm" id="btnDownloadSummaryPDF"><i class="fas fa-file-pdf"></i> Download PDF</button>
    </div>
  </div>
</div>`;
  }

  function validateFile(file) {
    if (!file) return 'No file selected.';
    if (!ALLOWED_TYPES.includes(file.type)) return 'Invalid file type. Please upload JPG, PNG, or WEBP.';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`;
    return null;
  }

  function loadImage(file) {
    const err = validateFile(file);
    if (err) { Utils.toast(err, 'error'); return; }
    currentFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('ocrPreview').src = e.target.result;
      document.getElementById('ocrPreviewWrap').style.display = '';
      document.getElementById('ocrDropZone').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  async function runOCR() {
    if (!currentFile) { Utils.toast('Please upload an image first.', 'error'); return; }
    if (!window.Tesseract) { Utils.toast('OCR library not loaded. Please refresh the page.', 'error'); return; }

    const progressWrap = document.getElementById('ocrProgressWrap');
    const progressBar  = document.getElementById('ocrProgressBar');
    const pctEl        = document.getElementById('ocrPct');
    const runBtn       = document.getElementById('btnRunOCR');

    progressWrap.style.display = '';
    if (runBtn) runBtn.disabled = true;

    try {
      const result = await Tesseract.recognize(currentFile, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            if (progressBar) progressBar.style.width = pct + '%';
            if (pctEl) pctEl.textContent = pct + '%';
          }
        }
      });

      const text = result.data.text?.trim();
      if (!text || text.length < 5) {
        Utils.toast('OCR could not extract readable text from this image. Try a clearer image.', 'error');
        progressWrap.style.display = 'none';
        if (runBtn) runBtn.disabled = false;
        return;
      }

      extractedText = text;
      const textArea = document.getElementById('ocrExtractedText');
      if (textArea) textArea.value = text;
      document.getElementById('ocrTextCard').style.display = '';
      progressWrap.style.display = 'none';
      Utils.updateCounters(text, document.getElementById('ocrCharCount'), document.getElementById('ocrWordCount'));
      Utils.toast('OCR complete! Review the text and click Generate Summary.', 'success');
    } catch (err) {
      progressWrap.style.display = 'none';
      Utils.toast('OCR failed: ' + err.message, 'error');
    } finally {
      if (runBtn) runBtn.disabled = false;
    }
  }

  async function generateSummary() {
    const text = document.getElementById('ocrExtractedText')?.value?.trim();
    if (!text) { Utils.toast('Please run OCR first or paste some text.', 'error'); return; }
    if (text.length < 20) { Utils.toast('Text is too short to summarize.', 'error'); return; }

    const btn = document.getElementById('btnGenSummary');
    Utils.setButtonLoading(btn, true);
    Utils.showLoading('summaryOutput', 'AI is generating your summary...');

    try {
      const result = await Api.summarizeText(text);
      // demo data may be an object with .summary, real AI returns markdown string
      const rawData = result.data;
      summary = typeof rawData === 'object' ? (rawData.summary || JSON.stringify(rawData)) : rawData;
      document.getElementById('summaryOutput').innerHTML = Utils.renderMarkdown(summary);
      document.getElementById('summaryDownloadBar').style.display = 'flex';
      if (result.demo) Utils.toast('Demo mode: showing sample summary.', 'info');
      else Utils.toast('Summary generated!', 'success');
    } catch (err) {
      Utils.showError('summaryOutput', err.message, generateSummary);
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  }

  function reset() {
    currentFile = null; extractedText = ''; summary = '';
    document.getElementById('ocrFileInput').value = '';
    document.getElementById('ocrPreviewWrap').style.display = 'none';
    document.getElementById('ocrDropZone').style.display = '';
    document.getElementById('ocrTextCard').style.display = 'none';
    document.getElementById('ocrProgressWrap').style.display = 'none';
    document.getElementById('summaryOutput').innerHTML = `<div class="empty-state"><i class="fas fa-file-alt" style="color:#ed8936;opacity:1;font-size:2.5rem;"></i><h3>Summary will appear here</h3><p>Upload an image, run OCR, then click Generate Summary</p></div>`;
    document.getElementById('summaryDownloadBar').style.display = 'none';
  }

  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML();
    currentFile = null; extractedText = ''; summary = '';

    const dropZone = document.getElementById('ocrDropZone');
    const fileInput = document.getElementById('ocrFileInput');

    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput?.click(); });
    fileInput?.addEventListener('change', e => { if (e.target.files[0]) loadImage(e.target.files[0]); });

    // Drag and drop
    dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = '#ed8936'; dropZone.style.background = '#feebc8'; });
    dropZone?.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; dropZone.style.background = ''; });
    dropZone?.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.style.borderColor = ''; dropZone.style.background = '';
      const file = e.dataTransfer.files[0];
      if (file) loadImage(file);
    });

    document.getElementById('btnRunOCR')?.addEventListener('click', runOCR);
    document.getElementById('btnChangeImage')?.addEventListener('click', () => fileInput?.click());
    document.getElementById('btnRemoveImage')?.addEventListener('click', reset);
    document.getElementById('btnClearOCR')?.addEventListener('click', reset);
    document.getElementById('btnGenSummary')?.addEventListener('click', generateSummary);
    document.getElementById('btnRegenSummary')?.addEventListener('click', generateSummary);

    document.getElementById('ocrExtractedText')?.addEventListener('input', e => {
      Utils.updateCounters(e.target.value, document.getElementById('ocrCharCount'), document.getElementById('ocrWordCount'));
    });

    document.getElementById('btnCopySummary')?.addEventListener('click', () => {
      if (!summary) { Utils.toast('Generate a summary first.', 'error'); return; }
      Utils.copyToClipboard(summary);
    });
    document.getElementById('btnDownloadSummaryTxt')?.addEventListener('click', () => {
      if (!summary) { Utils.toast('Generate a summary first.', 'error'); return; }
      Utils.downloadText(summary, 'summary.txt');
    });
    document.getElementById('btnDownloadSummaryPDF')?.addEventListener('click', () => {
      const el = document.getElementById('summaryOutput');
      if (!summary || !el) { Utils.toast('Generate a summary first.', 'error'); return; }
      Utils.downloadPDF(el, 'summary.pdf');
    });
  }

  return { init };
})();
