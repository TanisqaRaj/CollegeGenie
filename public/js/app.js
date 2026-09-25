/* ============================================================
   app.js — Main SPA controller
   Handles: routing, sidebar, navbar, demo badge, page init
   ============================================================ */

(async () => {

  // ── Page Registry ──────────────────────────────────────────
  // Each module registers itself here when loaded
  const pageModules = {
    resume:     window.ResumeModule,
    notes:      window.NotesModule,
    ppt:        window.PPTModule,
    mindmap:    window.MindMapModule,
    quiz:       window.QuizModule,
    doubt:      window.DoubtSolverModule,
    flashcards: window.FlashcardsModule,
    planner:    window.StudyPlannerModule,
    ocr:        window.OCRSummarizerModule
  };

  const pageLabels = {
    dashboard:  'Dashboard',
    resume:     'Resume Builder',
    notes:      'Notes Generator',
    ppt:        'PPT Generator',
    mindmap:    'Mind Map Generator',
    quiz:       'Quiz Generator',
    doubt:      'Doubt Solver',
    flashcards: 'Flashcard Generator',
    planner:    'Study Planner',
    ocr:        'Notes Summarizer'
  };

  // ── Demo Status ────────────────────────────────────────────
  let demoMode = false;
  try {
    const status = await Api.checkStatus();
    demoMode = status.demo === true;
  } catch { demoMode = true; }

  const demoBadge   = document.getElementById('demoModeBadge');
  const navDemoBadge = document.getElementById('navDemoBadge');
  if (demoMode) {
    if (demoBadge)    demoBadge.style.display = 'flex';
    if (navDemoBadge) navDemoBadge.style.display = 'inline-flex';
  }

  // ── Sidebar & Hamburger ────────────────────────────────────
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburger');
  const closeBtn  = document.getElementById('sidebarClose');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    hamburger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSidebar();
  });

  // ── Navigation ─────────────────────────────────────────────
  let currentPage = 'dashboard';
  const initializedPages = new Set();

  function navigateTo(page) {
    if (!pageLabels[page]) return;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
      item.setAttribute('aria-current', item.dataset.page === page ? 'page' : 'false');
    });

    // Update breadcrumb
    updateBreadcrumb(page);

    // Initialize module if first visit
    if (page !== 'dashboard' && !initializedPages.has(page)) {
      const mod = pageModules[page];
      if (mod && typeof mod.init === 'function') {
        mod.init(`page-${page}`);
        initializedPages.add(page);
      }
    }

    currentPage = page;
    closeSidebar();

    // Update URL hash for back/forward nav
    history.pushState({ page }, '', `#${page}`);
  }

  function updateBreadcrumb(page) {
    const bc = document.getElementById('breadcrumb');
    if (!bc) return;
    if (page === 'dashboard') {
      bc.innerHTML = `<span class="breadcrumb-item active">Dashboard</span>`;
    } else {
      bc.innerHTML = `
        <button class="breadcrumb-item" style="background:none;border:none;cursor:pointer;font:inherit;padding:0;color:var(--text-muted);" 
          onclick="window._navigate('dashboard')">Dashboard</button>
        <span class="breadcrumb-sep"><i class="fas fa-chevron-right" style="font-size:0.65rem;"></i></span>
        <span class="breadcrumb-item active">${pageLabels[page]}</span>
      `;
    }
  }

  // Expose navigate globally so breadcrumbs and cards can call it
  window._navigate = navigateTo;

  // ── Sidebar nav clicks ─────────────────────────────────────
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // ── Dashboard card clicks ──────────────────────────────────
  document.querySelectorAll('[data-page]').forEach(el => {
    // Cards themselves (article)
    if (el.tagName === 'ARTICLE') {
      el.addEventListener('click', (e) => {
        // Don't trigger if the button inside was clicked (it will bubble too, handled below)
        if (e.target.closest('button')) return;
        navigateTo(el.dataset.page);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateTo(el.dataset.page);
        }
      });
    }
    // Buttons inside cards
    if (el.tagName === 'BUTTON' && el.classList.contains('tool-card-btn')) {
      el.addEventListener('click', () => navigateTo(el.dataset.page));
    }
  });

  // ── Handle browser back/forward ───────────────────────────
  window.addEventListener('popstate', e => {
    const page = e.state?.page || 'dashboard';
    navigateTo(page);
  });

  // ── Initial load: read hash ────────────────────────────────
  const hash = location.hash.replace('#', '');
  if (hash && pageLabels[hash]) {
    navigateTo(hash);
  } else {
    updateBreadcrumb('dashboard');
    history.replaceState({ page: 'dashboard' }, '', '#dashboard');
  }

})();
