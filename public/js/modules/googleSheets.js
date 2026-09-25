/* ============================================================
   googleSheets.js — Google Sheets Backend / Dynamic Frontend
   Module #10 for AI Student Toolkit

   Features:
   - Configure Apps Script Web App URL
   - Real-time GET/POST to Google Sheets via Apps Script
   - Dynamic HTML table with search + subject filter
   - Summary statistics calculated from live data
   - Add Record form with full validation
   - AI Insights via existing Api.generate()
   - Demo Mode with clearly labelled sample data
   - Full error handling — no stack traces ever shown
   ============================================================ */

window.GoogleSheetsModule = (() => {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────
  const LS_KEY = 'gs_web_app_url';

  const DEMO_RECORDS = [
    { id: 1, name: 'Rahul Sharma',  subject: 'Artificial Intelligence', marks: 85, attendance: 92 },
    { id: 2, name: 'Priya Mehta',   subject: 'DBMS',                    marks: 78, attendance: 88 },
    { id: 3, name: 'Aman Gupta',    subject: 'Computer Networks',       marks: 91, attendance: 95 },
    { id: 4, name: 'Neha Verma',    subject: 'NLP',                     marks: 87, attendance: 90 },
    { id: 5, name: 'Rohan Kapoor',  subject: 'Machine Learning',        marks: 92, attendance: 97 },
    { id: 6, name: 'Sneha Joshi',   subject: 'DBMS',                    marks: 74, attendance: 82 },
    { id: 7, name: 'Karan Singh',   subject: 'Artificial Intelligence', marks: 88, attendance: 94 },
    { id: 8, name: 'Tanisqa Raj',   subject: 'Machine Learning',        marks: 90, attendance: 95 },
  ];

  // ── Module State ──────────────────────────────────────────────
  let _containerId  = '';
  let _webAppUrl    = '';
  let _allRecords   = [];
  let _filteredRecs = [];
  let _connStatus   = 'disconnected'; // disconnected | connecting | connected | error
  let _isDemo       = false;

  // ── Init ──────────────────────────────────────────────────────
  function init(containerId) {
    _containerId = containerId;
    _webAppUrl   = localStorage.getItem(LS_KEY) || '';
    _isDemo      = !_webAppUrl;
    render();
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER — builds the entire page HTML
  // ─────────────────────────────────────────────────────────────
  function render() {
    const el = document.getElementById(_containerId);
    if (!el) return;

    el.innerHTML = `
      <!-- Page Header -->
      <div class="tool-header">
        <div class="tool-header-icon" style="background:var(--teal);">
          <i class="fas fa-table"></i>
        </div>
        <div class="tool-header-text">
          <h1>Google Sheets Live Data
            <span class="gs-badge-live">LIVE DATA</span>
          </h1>
          <p>Use Google Sheets as a simple live backend. Connect via Apps Script, fetch rows, add records, and analyse with AI.</p>
        </div>
      </div>

      <!-- Demo Mode banner -->
      <div id="gs-demo-banner" class="gs-demo-banner ${_isDemo ? '' : 'gs-hidden'}">
        <i class="fas fa-flask"></i>
        <strong>Demo Mode</strong> — Showing sample data. Enter your Apps Script Web App URL below to connect to a real Google Sheet.
      </div>

      <!-- Live Mode banner -->
      <div id="gs-live-banner" class="gs-demo-banner gs-live-banner ${_isDemo ? 'gs-hidden' : ''}">
        <i class="fas fa-circle" style="font-size:0.55rem;"></i>
        <strong>Live Google Sheets</strong> — Connected to your sheet via Apps Script.
      </div>

      <!-- ── Top Row: Config + Stats ─────────────────────── -->
      <div class="gs-top-row">

        <!-- LEFT: Config + Add Record -->
        <div class="gs-left-col">

          <!-- Connection Config Card -->
          <div class="card gs-config-card">
            <div class="card-header">
              <span class="card-title"><i class="fas fa-plug"></i> Apps Script Connection</span>
              <span id="gs-status-pill" class="gs-status-pill gs-status-disconnected">
                <span class="gs-status-dot"></span> Not Connected
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="gs-url-input">
                Google Apps Script Web App URL
              </label>
              <input
                id="gs-url-input"
                class="form-control"
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value="${Utils.escapeHtml(_webAppUrl)}"
                autocomplete="off"
                spellcheck="false"
              />
              <span class="form-hint">Paste the Web App URL after deploying your Apps Script.</span>
            </div>

            <div class="gs-config-actions">
              <button class="btn btn-primary" id="gs-btn-connect">
                <i class="fas fa-link"></i> Connect
              </button>
              <button class="btn btn-secondary" id="gs-btn-test">
                <i class="fas fa-vial"></i> Test Connection
              </button>
              ${_webAppUrl ? `<button class="btn btn-ghost" id="gs-btn-clear-url">
                <i class="fas fa-times"></i> Disconnect
              </button>` : ''}
            </div>
          </div>

          <!-- Add Record Form Card -->
          <div class="card gs-form-card">
            <div class="card-header">
              <span class="card-title"><i class="fas fa-plus-circle"></i> Add Student Record</span>
            </div>

            <div class="gs-form-grid">
              <div class="form-group">
                <label class="form-label" for="gs-f-name">Name <span class="required">*</span></label>
                <input id="gs-f-name" class="form-control" type="text" placeholder="e.g. Tanisqa Raj" />
              </div>
              <div class="form-group">
                <label class="form-label" for="gs-f-subject">Subject <span class="required">*</span></label>
                <input id="gs-f-subject" class="form-control" type="text" placeholder="e.g. Machine Learning" />
              </div>
              <div class="form-group">
                <label class="form-label" for="gs-f-marks">Marks (0–100) <span class="required">*</span></label>
                <input id="gs-f-marks" class="form-control" type="number" min="0" max="100" placeholder="e.g. 88" />
              </div>
              <div class="form-group">
                <label class="form-label" for="gs-f-att">Attendance % (0–100) <span class="required">*</span></label>
                <input id="gs-f-att" class="form-control" type="number" min="0" max="100" placeholder="e.g. 94" />
              </div>
            </div>

            <div class="gs-form-actions">
              <button class="btn btn-primary" id="gs-btn-add">
                <i class="fas fa-plus"></i> Add Record
              </button>
              <button class="btn btn-ghost" id="gs-btn-reset-form">
                <i class="fas fa-undo"></i> Clear
              </button>
            </div>

            <div id="gs-form-error" class="gs-form-error gs-hidden"></div>
          </div>

        </div>

        <!-- RIGHT: Stats -->
        <div class="gs-right-col">
          <div class="card gs-stats-card">
            <div class="card-header">
              <span class="card-title"><i class="fas fa-chart-bar"></i> Class Summary</span>
              <span id="gs-stats-source" class="gs-source-tag">${_isDemo ? 'Sample data' : 'Live data'}</span>
            </div>
            <div id="gs-stats-grid" class="gs-stats-grid">
              ${renderStatsSkeleton()}
            </div>
          </div>

          <!-- How It Works -->
          <div class="card gs-how-card">
            <div class="card-header">
              <span class="card-title"><i class="fas fa-info-circle"></i> How It Works</span>
            </div>
            <ol class="gs-flow-list">
              <li>
                <span class="gs-flow-icon" style="background:var(--teal)"><i class="fas fa-table"></i></span>
                <div>
                  <strong>Google Sheet</strong>
                  <p>Stores student records as rows</p>
                </div>
              </li>
              <li>
                <span class="gs-flow-icon" style="background:#2e9e6b"><i class="fas fa-code"></i></span>
                <div>
                  <strong>Apps Script API</strong>
                  <p>Exposes the sheet as a JSON endpoint via <code>doGet</code> / <code>doPost</code></p>
                </div>
              </li>
              <li>
                <span class="gs-flow-icon" style="background:var(--teal-dark)"><i class="fas fa-globe"></i></span>
                <div>
                  <strong>AI Student Toolkit</strong>
                  <p>Fetches &amp; posts data using <code>fetch()</code> in the browser</p>
                </div>
              </li>
              <li>
                <span class="gs-flow-icon" style="background:#c0395a"><i class="fas fa-user-graduate"></i></span>
                <div>
                  <strong>You</strong>
                  <p>See live data, add records, and generate AI insights</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <!-- ── Data Table ───────────────────────────────────── -->
      <div class="card gs-table-card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-database"></i> Student Records
            <span id="gs-record-count" class="gs-count-badge">0</span>
          </span>
          <div class="gs-table-actions">
            <button class="btn btn-ghost btn-sm" id="gs-btn-refresh">
              <i class="fas fa-sync-alt"></i> Refresh
            </button>
            <button class="btn btn-secondary btn-sm" id="gs-btn-ai">
              <i class="fas fa-robot"></i> AI Insights
            </button>
          </div>
        </div>

        <!-- Search + Filter -->
        <div class="gs-filter-bar">
          <div class="gs-search-wrap">
            <i class="fas fa-search gs-search-icon"></i>
            <input
              id="gs-search"
              class="form-control gs-search-input"
              type="text"
              placeholder="Search by name or subject…"
            />
          </div>
          <select id="gs-filter-subject" class="form-control gs-filter-select">
            <option value="">All Subjects</option>
          </select>
        </div>

        <!-- Table container -->
        <div id="gs-table-wrap" class="gs-table-wrap">
          ${renderTableSkeleton()}
        </div>
      </div>

      <!-- ── AI Insights ──────────────────────────────────── -->
      <div id="gs-ai-panel" class="card gs-ai-card gs-hidden">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-robot"></i> AI Insights</span>
          <button class="btn btn-ghost btn-sm" id="gs-btn-close-ai">
            <i class="fas fa-times"></i> Close
          </button>
        </div>
        <div id="gs-ai-output" class="gs-ai-output">
          <div class="loading-overlay">
            <div class="spinner spinner-dark"></div>
            <p>Analysing student data…</p>
          </div>
        </div>
      </div>

      <!-- ── Apps Script Setup Guide ─────────────────────── -->
      <div class="card gs-guide-card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-book-open"></i> Quick Setup Guide</span>
          <button class="btn btn-ghost btn-sm" id="gs-guide-toggle">
            <i class="fas fa-chevron-down"></i> Show
          </button>
        </div>
        <div id="gs-guide-body" class="gs-guide-body gs-hidden">
          <ol class="gs-guide-steps">
            <li>Open <strong>Google Sheets</strong> and create a new spreadsheet.</li>
            <li>In row 1, add these headers exactly: <code>ID</code> <code>Name</code> <code>Subject</code> <code>Marks</code> <code>Attendance</code></li>
            <li>Go to <strong>Extensions → Apps Script</strong>.</li>
            <li>Delete the default code and paste the Apps Script from <code>docs/google-sheets-setup.md</code>.</li>
            <li>Click <strong>Deploy → New deployment</strong>.</li>
            <li>Type: <strong>Web app</strong> — Execute as: <strong>Me</strong> — Access: <strong>Anyone</strong>.</li>
            <li>Copy the <strong>Web App URL</strong> and paste it above.</li>
          </ol>
          <div class="gs-guide-note">
            <i class="fas fa-shield-alt"></i>
            <span><strong>Security note:</strong> Anyone with the Web App URL can access the data. Do not store sensitive personal information in the demo sheet.</span>
          </div>
        </div>
      </div>
    `;

    bindEvents();

    // Load initial data
    loadData();
  }

  // ─────────────────────────────────────────────────────────────
  // BIND EVENTS
  // ─────────────────────────────────────────────────────────────
  function bindEvents() {
    // Connect button
    document.getElementById('gs-btn-connect')?.addEventListener('click', handleConnect);
    // Test button
    document.getElementById('gs-btn-test')?.addEventListener('click', handleTestConnection);
    // Disconnect
    document.getElementById('gs-btn-clear-url')?.addEventListener('click', handleDisconnect);
    // Add record
    document.getElementById('gs-btn-add')?.addEventListener('click', handleAddRecord);
    // Reset form
    document.getElementById('gs-btn-reset-form')?.addEventListener('click', resetForm);
    // Refresh table
    document.getElementById('gs-btn-refresh')?.addEventListener('click', () => loadData(true));
    // AI Insights
    document.getElementById('gs-btn-ai')?.addEventListener('click', handleAIInsights);
    // Close AI panel
    document.getElementById('gs-btn-close-ai')?.addEventListener('click', () => {
      document.getElementById('gs-ai-panel')?.classList.add('gs-hidden');
    });
    // Search
    document.getElementById('gs-search')?.addEventListener('input', applyFilters);
    // Subject filter
    document.getElementById('gs-filter-subject')?.addEventListener('change', applyFilters);
    // Setup guide toggle
    document.getElementById('gs-guide-toggle')?.addEventListener('click', toggleGuide);
  }

  // ─────────────────────────────────────────────────────────────
  // CONNECTION MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  function handleConnect() {
    const urlInput = document.getElementById('gs-url-input');
    const url = (urlInput?.value || '').trim();

    if (!url) {
      Utils.toast('Please enter your Apps Script Web App URL.', 'error');
      urlInput?.focus();
      return;
    }

    if (!isValidUrl(url)) {
      Utils.toast('Invalid URL. Please paste the full Web App URL from Apps Script.', 'error');
      urlInput?.focus();
      return;
    }

    _webAppUrl = url;
    _isDemo    = false;
    localStorage.setItem(LS_KEY, url);
    Utils.toast('URL saved. Testing connection…', 'info');
    testConnection(url, true);
  }

  function handleDisconnect() {
    _webAppUrl = '';
    _isDemo    = true;
    localStorage.removeItem(LS_KEY);
    Utils.toast('Disconnected. Showing demo data.', 'info');
    init(_containerId);
  }

  function handleTestConnection() {
    const url = (document.getElementById('gs-url-input')?.value || '').trim();
    if (!url) {
      Utils.toast('Enter the Web App URL first.', 'error');
      return;
    }
    if (!isValidUrl(url)) {
      Utils.toast('Invalid URL format.', 'error');
      return;
    }
    testConnection(url, false);
  }

  async function testConnection(url, andLoad) {
    setStatus('connecting');
    try {
      const data = await fetchFromSheet(url);
      setStatus('connected');
      Utils.toast('Google Sheets connected successfully.', 'success');
      if (andLoad) {
        _allRecords = normalizeRecords(data);
        renderTable(_allRecords);
        renderStats(_allRecords);
        updateSubjectFilter(_allRecords);
      }
    } catch (err) {
      setStatus('error');
      Utils.toast('Unable to connect to Google Sheets. Check your Web App URL and deployment settings.', 'error');
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────
  async function loadData(showRefreshToast = false) {
    if (_isDemo) {
      _allRecords = [...DEMO_RECORDS];
      _filteredRecs = [..._allRecords];
      renderTable(_allRecords);
      renderStats(_allRecords);
      updateSubjectFilter(_allRecords);
      if (showRefreshToast) Utils.toast('Demo data refreshed.', 'info');
      return;
    }

    setTableLoading(true);
    setStatus('connecting');

    try {
      const data = await fetchFromSheet(_webAppUrl);
      _allRecords   = normalizeRecords(data);
      _filteredRecs = [..._allRecords];
      setStatus('connected');
      renderTable(_allRecords);
      renderStats(_allRecords);
      updateSubjectFilter(_allRecords);
      if (showRefreshToast) Utils.toast('Data refreshed from Google Sheets.', 'success');
    } catch (err) {
      setStatus('error');
      setTableError('Unable to load data from Google Sheets. Check your connection.');
      renderStats([]);
    }
  }

  async function fetchFromSheet(url) {
    // Apps Script CORS workaround: use no-cors mode won't give body,
    // so we use the proxy approach via our own backend isn't needed —
    // Apps Script supports CORS when "Anyone" access is set.
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    let json;
    try { json = await res.json(); } catch {
      throw new Error('Invalid JSON from Apps Script.');
    }

    if (!json.success) throw new Error(json.message || 'Apps Script returned failure.');
    return json.data || [];
  }

  function normalizeRecords(raw) {
    // Accepts both [{id,name,subject,marks,attendance}] and raw arrays
    if (!Array.isArray(raw)) return [];
    return raw.map((r, i) => ({
      id:         r.id         ?? r.ID         ?? i + 1,
      name:       String(r.name        || r.Name        || '').trim(),
      subject:    String(r.subject     || r.Subject     || '').trim(),
      marks:      Number(r.marks       || r.Marks       || 0),
      attendance: Number(r.attendance  || r.Attendance  || 0),
    })).filter(r => r.name);
  }

  // ─────────────────────────────────────────────────────────────
  // ADD RECORD
  // ─────────────────────────────────────────────────────────────
  async function handleAddRecord() {
    clearFormError();

    const name    = document.getElementById('gs-f-name')?.value.trim() || '';
    const subject = document.getElementById('gs-f-subject')?.value.trim() || '';
    const marksRaw = document.getElementById('gs-f-marks')?.value.trim() || '';
    const attRaw   = document.getElementById('gs-f-att')?.value.trim() || '';

    // Validate
    const errors = [];
    if (!name)    errors.push('Name is required.');
    if (!subject) errors.push('Subject is required.');
    if (marksRaw === '') errors.push('Marks is required.');
    if (attRaw === '')   errors.push('Attendance is required.');

    const marks = parseFloat(marksRaw);
    const att   = parseFloat(attRaw);

    if (!errors.length) {
      if (isNaN(marks) || marks < 0 || marks > 100) errors.push('Marks must be a number between 0 and 100.');
      if (isNaN(att)   || att   < 0 || att   > 100) errors.push('Attendance must be a number between 0 and 100.');
    }

    if (errors.length) {
      showFormError(errors.join(' '));
      return;
    }

    const record = { name, subject, marks, attendance: att };
    const btn = document.getElementById('gs-btn-add');
    Utils.setButtonLoading(btn, true, 'Adding…');

    try {
      if (_isDemo) {
        // Demo mode: add locally
        await new Promise(r => setTimeout(r, 600));
        const newId = Math.max(0, ..._allRecords.map(r => r.id)) + 1;
        _allRecords.push({ id: newId, ...record });
        Utils.toast('Record added (demo mode — not saved to Google Sheets).', 'info');
      } else {
        await postToSheet(_webAppUrl, record);
        Utils.toast('Record added to Google Sheets successfully!', 'success');
        await loadData(false);
      }
      resetForm();
      applyFilters();
      renderStats(_allRecords);
    } catch (err) {
      Utils.toast('Unable to add the record. Please try again.', 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  }

  async function postToSheet(url, record) {
    const res = await fetch(url, {
      method:   'POST',
      redirect: 'follow',
      headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
      body:     JSON.stringify(record)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let json;
    try { json = await res.json(); } catch { throw new Error('Invalid JSON response from Apps Script.'); }
    if (!json.success) throw new Error(json.message || 'POST failed.');
    return json;
  }

  // Note: Apps Script requires Content-Type: text/plain for POST when no
  // server-side CORS preflight configuration is available. The Apps Script
  // doPost handler reads e.postData.contents and parses JSON from it.

  // ─────────────────────────────────────────────────────────────
  // SEARCH & FILTER
  // ─────────────────────────────────────────────────────────────
  function applyFilters() {
    const query   = (document.getElementById('gs-search')?.value || '').toLowerCase().trim();
    const subject = (document.getElementById('gs-filter-subject')?.value || '').toLowerCase();

    _filteredRecs = _allRecords.filter(r => {
      const matchQuery = !query ||
        r.name.toLowerCase().includes(query) ||
        r.subject.toLowerCase().includes(query);
      const matchSubject = !subject || r.subject.toLowerCase() === subject;
      return matchQuery && matchSubject;
    });

    renderTableRows(_filteredRecs);
    document.getElementById('gs-record-count').textContent = _filteredRecs.length;
  }

  function updateSubjectFilter(records) {
    const sel = document.getElementById('gs-filter-subject');
    if (!sel) return;
    const subjects = [...new Set(records.map(r => r.subject).filter(Boolean))].sort();
    const current  = sel.value;
    sel.innerHTML  = '<option value="">All Subjects</option>' +
      subjects.map(s => `<option value="${Utils.escapeHtml(s.toLowerCase())}"${s.toLowerCase() === current ? ' selected' : ''}>${Utils.escapeHtml(s)}</option>`).join('');
  }

  // ─────────────────────────────────────────────────────────────
  // TABLE RENDERING
  // ─────────────────────────────────────────────────────────────
  function renderTable(records) {
    const wrap = document.getElementById('gs-table-wrap');
    if (!wrap) return;

    document.getElementById('gs-record-count').textContent = records.length;

    if (!records.length) {
      wrap.innerHTML = `<div class="empty-state">
        <i class="fas fa-table"></i>
        <h3>No records found</h3>
        <p>${_isDemo ? 'Demo data is empty.' : 'Your Google Sheet appears to be empty. Add some rows in Sheets or use the form above.'}</p>
      </div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="gs-table-scroll">
        <table class="gs-data-table" aria-label="Student Records">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Subject</th>
              <th>Marks</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody id="gs-tbody"></tbody>
        </table>
      </div>
    `;

    _filteredRecs = [...records];
    renderTableRows(records);
  }

  function renderTableRows(records) {
    const tbody = document.getElementById('gs-tbody');
    if (!tbody) return;

    if (!records.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="gs-td-empty">
        No records match your search.
      </td></tr>`;
      document.getElementById('gs-record-count').textContent = '0';
      return;
    }

    document.getElementById('gs-record-count').textContent = records.length;

    tbody.innerHTML = records.map(r => {
      const marksClass = r.marks >= 85 ? 'gs-mark-high'
                        : r.marks >= 60 ? 'gs-mark-mid' : 'gs-mark-low';
      const attClass   = r.attendance >= 85 ? 'gs-mark-high'
                        : r.attendance >= 75 ? 'gs-mark-mid' : 'gs-mark-low';
      return `
        <tr>
          <td class="gs-td-id">${Utils.escapeHtml(String(r.id))}</td>
          <td class="gs-td-name">${Utils.escapeHtml(r.name)}</td>
          <td><span class="gs-subject-tag">${Utils.escapeHtml(r.subject)}</span></td>
          <td><span class="${marksClass}">${r.marks}</span></td>
          <td><span class="${attClass}">${r.attendance}%</span></td>
        </tr>
      `;
    }).join('');
  }

  function setTableLoading(on) {
    const wrap = document.getElementById('gs-table-wrap');
    if (wrap && on) {
      wrap.innerHTML = `<div class="loading-overlay">
        <div class="spinner spinner-dark"></div>
        <p>Fetching Google Sheets data…</p>
      </div>`;
    }
  }

  function setTableError(msg) {
    const wrap = document.getElementById('gs-table-wrap');
    if (wrap) {
      wrap.innerHTML = `<div class="empty-state">
        <i class="fas fa-exclamation-triangle" style="color:var(--error)"></i>
        <h3>Unable to load data</h3>
        <p>${Utils.escapeHtml(msg)}</p>
      </div>`;
    }
  }

  function renderTableSkeleton() {
    return `<div class="loading-overlay">
      <div class="spinner spinner-dark"></div>
      <p>${_isDemo ? 'Loading demo data…' : 'Fetching Google Sheets data…'}</p>
    </div>`;
  }

  // ─────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────
  function renderStats(records) {
    const grid = document.getElementById('gs-stats-grid');
    if (!grid) return;

    const src = document.getElementById('gs-stats-source');
    if (src) src.textContent = _isDemo ? 'Sample data' : 'Live data';

    if (!records.length) {
      grid.innerHTML = renderStatsSkeleton();
      return;
    }

    const total    = records.length;
    const avgMarks = (records.reduce((s, r) => s + r.marks, 0) / total).toFixed(1);
    const avgAtt   = (records.reduce((s, r) => s + r.attendance, 0) / total).toFixed(1);
    const maxMarks = Math.max(...records.map(r => r.marks));

    grid.innerHTML = `
      ${statCard('Total Students',    total,          'fas fa-users',         'var(--teal)')}
      ${statCard('Average Marks',     avgMarks,       'fas fa-star',          'var(--teal-dark)')}
      ${statCard('Avg Attendance',    avgAtt + '%',   'fas fa-calendar-check','var(--mint-dark)')}
      ${statCard('Highest Marks',     maxMarks,       'fas fa-trophy',        '#c97a1a')}
    `;
  }

  function statCard(label, value, icon, color) {
    return `
      <div class="gs-stat-card">
        <div class="gs-stat-icon" style="background:${color}15;color:${color}">
          <i class="${icon}"></i>
        </div>
        <div class="gs-stat-body">
          <div class="gs-stat-value">${value}</div>
          <div class="gs-stat-label">${label}</div>
        </div>
      </div>
    `;
  }

  function renderStatsSkeleton() {
    return ['Total Students','Average Marks','Avg Attendance','Highest Marks'].map(() =>
      `<div class="gs-stat-card gs-stat-skeleton"><div class="gs-skel-box"></div></div>`
    ).join('');
  }

  // ─────────────────────────────────────────────────────────────
  // AI INSIGHTS
  // ─────────────────────────────────────────────────────────────
  async function handleAIInsights() {
    const panel = document.getElementById('gs-ai-panel');
    const out   = document.getElementById('gs-ai-output');
    if (!panel || !out) return;

    if (!_allRecords.length) {
      Utils.toast('No data to analyse. Load some records first.', 'error');
      return;
    }

    panel.classList.remove('gs-hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    out.innerHTML = `<div class="loading-overlay">
      <div class="spinner spinner-dark"></div>
      <p>Analysing student data with AI…</p>
    </div>`;

    try {
      const result = await Api.generate('google-sheets-insights', {
        prompt: 'Analyse the following student records and provide a concise academic summary.',
        data:   _allRecords.slice(0, 50) // cap to avoid token overflow
      });

      const html = Utils.renderMarkdown(result.data || '');
      out.innerHTML = `
        ${result.demo ? '<div class="gs-demo-note"><i class="fas fa-flask"></i> AI Demo Mode — sample insights</div>' : ''}
        <div class="gs-ai-content">${html}</div>
      `;
    } catch (err) {
      out.innerHTML = `<div class="empty-state" style="padding:32px 20px">
        <i class="fas fa-robot"></i>
        <h3>AI Insights unavailable</h3>
        <p>Unable to generate insights at this time. Your Google Sheets data and functionality are unaffected.</p>
      </div>`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CONNECTION STATUS UI
  // ─────────────────────────────────────────────────────────────
  function setStatus(status) {
    _connStatus = status;
    const pill = document.getElementById('gs-status-pill');
    if (!pill) return;

    const map = {
      disconnected: { cls: 'gs-status-disconnected', icon: '○', label: 'Not Connected' },
      connecting:   { cls: 'gs-status-connecting',   icon: '◌', label: 'Connecting…' },
      connected:    { cls: 'gs-status-connected',    icon: '●', label: 'Connected' },
      error:        { cls: 'gs-status-error',        icon: '●', label: 'Connection Failed' },
    };
    const s = map[status] || map.disconnected;
    pill.className = `gs-status-pill ${s.cls}`;
    pill.innerHTML = `<span class="gs-status-dot"></span> ${s.label}`;
  }

  // ─────────────────────────────────────────────────────────────
  // FORM HELPERS
  // ─────────────────────────────────────────────────────────────
  function resetForm() {
    ['gs-f-name','gs-f-subject','gs-f-marks','gs-f-att'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    clearFormError();
  }

  function showFormError(msg) {
    const el = document.getElementById('gs-form-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('gs-hidden');
  }

  function clearFormError() {
    const el = document.getElementById('gs-form-error');
    if (!el) return;
    el.textContent = '';
    el.classList.add('gs-hidden');
  }

  // ─────────────────────────────────────────────────────────────
  // GUIDE TOGGLE
  // ─────────────────────────────────────────────────────────────
  function toggleGuide() {
    const body = document.getElementById('gs-guide-body');
    const btn  = document.getElementById('gs-guide-toggle');
    if (!body || !btn) return;
    const open = !body.classList.contains('gs-hidden');
    body.classList.toggle('gs-hidden', open);
    btn.innerHTML = open
      ? '<i class="fas fa-chevron-down"></i> Show'
      : '<i class="fas fa-chevron-up"></i> Hide';
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────
  function isValidUrl(str) {
    try {
      const u = new URL(str);
      return u.protocol === 'https:' && u.hostname.includes('google');
    } catch { return false; }
  }

  return { init };
})();
