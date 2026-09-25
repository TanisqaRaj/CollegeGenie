/* ============================================================
   utils.js — Shared utility functions for all modules
   ============================================================ */

const Utils = (() => {

  // ── Toast Notifications ─────────────────────────────────────
  function toast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.setAttribute('role', 'alert');
    t.innerHTML = `
      <i class="fas ${icons[type] || icons.info} toast-icon"></i>
      <span class="toast-msg">${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close notification"><i class="fas fa-times"></i></button>
    `;
    t.querySelector('.toast-close').addEventListener('click', () => removeToast(t));
    container.appendChild(t);
    if (duration > 0) setTimeout(() => removeToast(t), duration);
  }

  function removeToast(el) {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 220);
  }

  // ── Loading State ────────────────────────────────────────────
  function showLoading(containerId, message = 'Generating with AI...') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="loading-overlay">
        <div class="spinner"></div>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  function showEmpty(containerId, icon = 'fa-magic', title = 'Nothing here yet', desc = 'Fill in the form and click Generate.') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="empty-state">
        <i class="fas ${icon}"></i>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc)}</p>
      </div>
    `;
  }

  function showError(containerId, message = 'Something went wrong. Please try again.', onRetry = null) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const retryBtn = onRetry
      ? `<button class="btn btn-outline btn-sm" id="${containerId}-retry"><i class="fas fa-redo"></i> Retry</button>`
      : '';
    el.innerHTML = `
      <div class="error-state">
        <div class="error-state-title"><i class="fas fa-exclamation-triangle"></i> Error</div>
        <p>${escapeHtml(message)}</p>
        ${retryBtn}
      </div>
    `;
    if (onRetry) {
      document.getElementById(`${containerId}-retry`)?.addEventListener('click', onRetry);
    }
  }

  // ── Button Loading State ─────────────────────────────────────
  function setButtonLoading(btn, loading, originalText = null) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = `<span class="spinner"></span> Generating...`;
      btn.disabled = true;
    } else {
      btn.innerHTML = originalText || btn.dataset.originalText || 'Generate';
      btn.disabled = false;
    }
  }

  // ── Clipboard ────────────────────────────────────────────────
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard!', 'success', 2500);
      return true;
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('Copied to clipboard!', 'success', 2500); return true; }
      catch { toast('Copy failed. Please select and copy manually.', 'error'); return false; }
      finally { ta.remove(); }
    }
  }

  // ── File Download ────────────────────────────────────────────
  function downloadText(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, filename);
  }

  function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    triggerDownload(blob, filename);
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 100);
    toast(`Downloaded: ${filename}`, 'success', 2500);
  }

  // ── PDF Generation ────────────────────────────────────────────
  function downloadPDF(htmlElement, filename = 'document.pdf') {
    if (window.html2canvas && window.jspdf) {
      const { jsPDF } = window.jspdf;
      html2canvas(htmlElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
        .then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
          const pageW = doc.internal.pageSize.getWidth();
          const pageH = doc.internal.pageSize.getHeight();
          const imgH = (canvas.height * pageW) / canvas.width;
          let y = 0;
          while (y < imgH) {
            if (y > 0) doc.addPage();
            doc.addImage(imgData, 'PNG', 0, -y, pageW, imgH);
            y += pageH;
          }
          doc.save(filename);
          toast(`Downloaded: ${filename}`, 'success', 2500);
        })
        .catch(() => toast('PDF generation failed. Try printing instead (Ctrl+P).', 'error'));
    } else if (window.jspdf) {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        doc.html(htmlElement, {
          callback(d) { d.save(filename); toast(`Downloaded: ${filename}`, 'success', 2500); },
          x: 28, y: 28, width: 540, windowWidth: 794
        });
      } catch { toast('PDF generation failed. Try printing instead (Ctrl+P).', 'error'); }
    } else {
      toast('PDF library not loaded yet. Please wait a moment and try again.', 'error');
    }
  }

  // ── Word / Character Counter ─────────────────────────────────
  function updateCounters(text, charsEl, wordsEl) {
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    if (charsEl) charsEl.textContent = chars.toLocaleString();
    if (wordsEl) wordsEl.textContent = words.toLocaleString();
  }

  // ── Validation ───────────────────────────────────────────────
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateRequired(value, label) {
    if (!value || value.trim() === '') return `${label} is required.`;
    return null;
  }

  function markFieldError(input, show) {
    if (!input) return;
    input.classList.toggle('error', show);
  }

  // ── HTML Sanitization ────────────────────────────────────────
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeHTML(str) {
    if (window.DOMPurify) return DOMPurify.sanitize(str);
    return escapeHtml(str);
  }

  // ── Markdown Rendering ───────────────────────────────────────
  function renderMarkdown(text) {
    if (!window.marked) return `<pre>${escapeHtml(text)}</pre>`;
    const html = marked.parse(text);
    return window.DOMPurify ? DOMPurify.sanitize(html) : html;
  }

  // ── String Helpers ───────────────────────────────────────────
  function truncate(str, len = 60) {
    if (!str || str.length <= len) return str;
    return str.slice(0, len) + '…';
  }

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // ── Expose ───────────────────────────────────────────────────
  return {
    toast, showLoading, showEmpty, showError,
    setButtonLoading, copyToClipboard,
    downloadText, downloadJSON, downloadPDF,
    updateCounters, validateEmail, validateRequired, markFieldError,
    escapeHtml, safeHTML, renderMarkdown,
    truncate, slugify
  };
})();
