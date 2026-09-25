/* resume.js — AI Resume Builder Module */
window.ResumeModule = (() => {

  let resumeData = null;
  let latexSource = '';

  // ── HTML Template ──────────────────────────────────────────
  function getHTML() {
    return `
<div class="tool-header">
  <div class="tool-header-icon" style="background:linear-gradient(135deg,#fbb6ce,#f687b3)"><i class="fas fa-file-alt"></i></div>
  <div class="tool-header-text"><h1>AI Resume Builder</h1><p>Fill in your details — AI will polish the language and make it ATS-friendly.</p></div>
</div>
<div class="tool-layout">
  <div class="resume-form-scroll" id="resumeFormScroll">

    <!-- Personal Info -->
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-user"></i> Personal Information</h2></div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Full Name <span class="required">*</span></label><input class="form-control" id="r-name" placeholder="Arjun Sharma" /></div>
          <div class="form-group"><label class="form-label">Email <span class="required">*</span></label><input class="form-control" id="r-email" type="email" placeholder="arjun@email.com" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="r-phone" placeholder="+91 98765 43210" /></div>
          <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="r-location" placeholder="Bangalore, India" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">LinkedIn URL</label><input class="form-control" id="r-linkedin" placeholder="linkedin.com/in/yourname" /></div>
          <div class="form-group"><label class="form-label">GitHub URL</label><input class="form-control" id="r-github" placeholder="github.com/yourname" /></div>
        </div>
        <div class="form-group"><label class="form-label">Portfolio URL</label><input class="form-control" id="r-portfolio" placeholder="yourportfolio.dev (optional)" /></div>
      </div>
    </div>

    <!-- Summary -->
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-align-left"></i> Career Summary</h2></div>
      <div class="form-group"><label class="form-label">Summary / Objective</label><textarea class="form-control" id="r-summary" rows="3" placeholder="Brief professional summary or career objective..."></textarea></div>
    </div>

    <!-- Education -->
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-graduation-cap"></i> Education</h2></div>
      <div class="dynamic-section" id="eduList"></div>
      <button class="btn-add-item" id="addEdu" style="margin-top:12px"><i class="fas fa-plus"></i> Add Education</button>
    </div>

    <!-- Skills -->
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-code"></i> Skills</h2></div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="form-group"><label class="form-label">Programming Languages</label><input class="form-control" id="r-lang" placeholder="Python, JavaScript, Java, C++" /></div>
        <div class="form-group"><label class="form-label">Technologies / Frameworks</label><input class="form-control" id="r-tech" placeholder="React, Node.js, MongoDB, MySQL" /></div>
        <div class="form-group"><label class="form-label">Tools</label><input class="form-control" id="r-tools" placeholder="Git, Docker, Figma, VS Code" /></div>
        <div class="form-group"><label class="form-label">Soft Skills</label><input class="form-control" id="r-soft" placeholder="Leadership, Communication, Problem Solving" /></div>
      </div>
    </div>

    <!-- Experience -->
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-briefcase"></i> Experience</h2></div>
      <div class="dynamic-section" id="expList"></div>
      <button class="btn-add-item" id="addExp" style="margin-top:12px"><i class="fas fa-plus"></i> Add Experience</button>
    </div>

    <!-- Projects -->
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-laptop-code"></i> Projects</h2></div>
      <div class="dynamic-section" id="projList"></div>
      <button class="btn-add-item" id="addProj" style="margin-top:12px"><i class="fas fa-plus"></i> Add Project</button>
    </div>

    <!-- Certifications -->
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-certificate"></i> Certifications</h2></div>
      <div class="dynamic-section" id="certList"></div>
      <button class="btn-add-item" id="addCert" style="margin-top:12px"><i class="fas fa-plus"></i> Add Certification</button>
    </div>

    <!-- Achievements -->
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-trophy"></i> Achievements</h2></div>
      <div class="dynamic-section" id="achList"></div>
      <button class="btn-add-item" id="addAch" style="margin-top:12px"><i class="fas fa-plus"></i> Add Achievement</button>
    </div>

    <!-- Action Buttons -->
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:32px;">
      <button class="btn btn-pink btn-lg" id="btnGenResume"><i class="fas fa-magic"></i> Generate Resume</button>
      <button class="btn btn-ghost" id="btnClearResume"><i class="fas fa-trash"></i> Clear</button>
    </div>
  </div>

  <!-- Preview Panel -->
  <div class="resume-preview-wrap">
    <div class="resume-tabs">
      <button class="resume-tab active" data-tab="preview">Preview</button>
      <button class="resume-tab" data-tab="latex">LaTeX Source</button>
    </div>
    <div id="resumeTabPreview">
      <div id="resumeOutput"><div class="empty-state"><i class="fas fa-file-alt"></i><h3>Resume preview will appear here</h3><p>Fill the form and click Generate Resume</p></div></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;" id="resumeActions" style="display:none">
        <button class="btn btn-pink btn-sm" id="btnDownloadPDF"><i class="fas fa-file-pdf"></i> Download PDF</button>
        <button class="btn btn-outline btn-sm" id="btnPrint"><i class="fas fa-print"></i> Print</button>
        <button class="btn btn-outline btn-sm" id="btnRegenResume"><i class="fas fa-redo"></i> Regenerate</button>
      </div>
    </div>
    <div id="resumeTabLatex" style="display:none">
      <div id="latexOutput"><div class="empty-state"><i class="fas fa-code"></i><h3>LaTeX source will appear here</h3><p>Generate resume first, then switch to this tab</p></div></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
        <button class="btn btn-outline btn-sm" id="btnCopyLatex"><i class="fas fa-copy"></i> Copy LaTeX</button>
        <button class="btn btn-outline btn-sm" id="btnDownloadTex"><i class="fas fa-download"></i> Download .tex</button>
      </div>
    </div>
  </div>
</div>`;
  }

  // ── Dynamic List Helpers ───────────────────────────────────
  function addEduItem() {
    const list = document.getElementById('eduList');
    const id = Date.now();
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.dataset.id = id;
    div.innerHTML = `
      <div class="dynamic-item-header"><span class="dynamic-item-title">Education Entry</span><button class="btn-remove-item" onclick="this.closest('.dynamic-item').remove()"><i class="fas fa-times"></i> Remove</button></div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="form-row"><div class="form-group"><label class="form-label">Degree</label><input class="form-control edu-degree" placeholder="B.Tech Computer Science" /></div><div class="form-group"><label class="form-label">College/University</label><input class="form-control edu-college" placeholder="RV College of Engineering" /></div></div>
        <div class="form-row-3"><div class="form-group"><label class="form-label">Location</label><input class="form-control edu-location" placeholder="Bangalore" /></div><div class="form-group"><label class="form-label">Start Year</label><input class="form-control edu-start" placeholder="2021" /></div><div class="form-group"><label class="form-label">End Year</label><input class="form-control edu-end" placeholder="2025" /></div></div>
        <div class="form-group"><label class="form-label">CGPA / Percentage</label><input class="form-control edu-cgpa" placeholder="8.7 CGPA" /></div>
      </div>`;
    list.appendChild(div);
  }

  function addExpItem() {
    const list = document.getElementById('expList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
      <div class="dynamic-item-header"><span class="dynamic-item-title">Experience Entry</span><button class="btn-remove-item" onclick="this.closest('.dynamic-item').remove()"><i class="fas fa-times"></i> Remove</button></div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="form-row"><div class="form-group"><label class="form-label">Company</label><input class="form-control exp-company" placeholder="TechCorp Solutions" /></div><div class="form-group"><label class="form-label">Role</label><input class="form-control exp-role" placeholder="Software Intern" /></div></div>
        <div class="form-group"><label class="form-label">Duration</label><input class="form-control exp-duration" placeholder="May 2024 – July 2024" /></div>
        <div class="form-group"><label class="form-label">Responsibilities / Achievements</label><textarea class="form-control exp-resp" rows="3" placeholder="Describe your work, one per line..."></textarea></div>
      </div>`;
    list.appendChild(div);
  }

  function addProjItem() {
    const list = document.getElementById('projList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
      <div class="dynamic-item-header"><span class="dynamic-item-title">Project Entry</span><button class="btn-remove-item" onclick="this.closest('.dynamic-item').remove()"><i class="fas fa-times"></i> Remove</button></div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="form-row"><div class="form-group"><label class="form-label">Project Name</label><input class="form-control proj-name" placeholder="SmartExpense Tracker" /></div><div class="form-group"><label class="form-label">Technologies</label><input class="form-control proj-tech" placeholder="React, Node.js, MongoDB" /></div></div>
        <div class="form-group"><label class="form-label">Description</label><input class="form-control proj-desc" placeholder="Brief description of the project..." /></div>
        <div class="form-group"><label class="form-label">Key Contributions (one per line)</label><textarea class="form-control proj-contrib" rows="3" placeholder="Built ML model for expense categorization&#10;Designed responsive React dashboard"></textarea></div>
      </div>`;
    list.appendChild(div);
  }

  function addCertItem() {
    const list = document.getElementById('certList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
      <div class="dynamic-item-header"><span class="dynamic-item-title">Certification</span><button class="btn-remove-item" onclick="this.closest('.dynamic-item').remove()"><i class="fas fa-times"></i> Remove</button></div>
      <div class="form-row-3">
        <div class="form-group"><label class="form-label">Certification Name</label><input class="form-control cert-name" placeholder="AWS Cloud Practitioner" /></div>
        <div class="form-group"><label class="form-label">Organization</label><input class="form-control cert-org" placeholder="Amazon Web Services" /></div>
        <div class="form-group"><label class="form-label">Year</label><input class="form-control cert-year" placeholder="2024" /></div>
      </div>`;
    list.appendChild(div);
  }

  function addAchItem() {
    const list = document.getElementById('achList');
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
      <div class="dynamic-item-header"><span class="dynamic-item-title">Achievement</span><button class="btn-remove-item" onclick="this.closest('.dynamic-item').remove()"><i class="fas fa-times"></i> Remove</button></div>
      <div class="form-group"><input class="form-control ach-text" placeholder="1st Place — National Hackathon, TechFest 2024" /></div>`;
    list.appendChild(div);
  }

  // ── Collect Form Data ──────────────────────────────────────
  function collectFormData() {
    const splitComma = v => v.split(',').map(s => s.trim()).filter(Boolean);
    const splitLine  = v => v.split('\n').map(s => s.trim()).filter(Boolean);

    const education = [...document.querySelectorAll('#eduList .dynamic-item')].map(el => ({
      degree: el.querySelector('.edu-degree')?.value || '',
      college: el.querySelector('.edu-college')?.value || '',
      location: el.querySelector('.edu-location')?.value || '',
      startYear: el.querySelector('.edu-start')?.value || '',
      endYear: el.querySelector('.edu-end')?.value || '',
      cgpa: el.querySelector('.edu-cgpa')?.value || ''
    }));

    const experience = [...document.querySelectorAll('#expList .dynamic-item')].map(el => ({
      company: el.querySelector('.exp-company')?.value || '',
      role: el.querySelector('.exp-role')?.value || '',
      duration: el.querySelector('.exp-duration')?.value || '',
      responsibilities: splitLine(el.querySelector('.exp-resp')?.value || '')
    }));

    const projects = [...document.querySelectorAll('#projList .dynamic-item')].map(el => ({
      name: el.querySelector('.proj-name')?.value || '',
      technologies: el.querySelector('.proj-tech')?.value || '',
      description: el.querySelector('.proj-desc')?.value || '',
      contributions: splitLine(el.querySelector('.proj-contrib')?.value || '')
    }));

    const certifications = [...document.querySelectorAll('#certList .dynamic-item')].map(el => ({
      name: el.querySelector('.cert-name')?.value || '',
      organization: el.querySelector('.cert-org')?.value || '',
      year: el.querySelector('.cert-year')?.value || ''
    }));

    const achievements = [...document.querySelectorAll('#achList .dynamic-item')]
      .map(el => el.querySelector('.ach-text')?.value || '').filter(Boolean);

    return {
      personal: {
        name: document.getElementById('r-name')?.value || '',
        email: document.getElementById('r-email')?.value || '',
        phone: document.getElementById('r-phone')?.value || '',
        location: document.getElementById('r-location')?.value || '',
        linkedin: document.getElementById('r-linkedin')?.value || '',
        github: document.getElementById('r-github')?.value || '',
        portfolio: document.getElementById('r-portfolio')?.value || ''
      },
      summary: document.getElementById('r-summary')?.value || '',
      education,
      skills: {
        languages: splitComma(document.getElementById('r-lang')?.value || ''),
        technologies: splitComma(document.getElementById('r-tech')?.value || ''),
        tools: splitComma(document.getElementById('r-tools')?.value || ''),
        softSkills: splitComma(document.getElementById('r-soft')?.value || '')
      },
      experience,
      projects,
      certifications,
      achievements
    };
  }

  // ── Render LaTeX-style Resume Preview ──────────────────────
  function renderPreview(data) {
    const e = Utils.escapeHtml;
    const p = data.personal || {};
    const contactParts = [p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio].filter(Boolean);

    let html = `<div class="resume-preview" id="resumePreviewEl">`;
    html += `<h1 class="resume-name">${e(p.name || 'Your Name')}</h1>`;
    html += `<div class="resume-contact">${contactParts.map(c => e(c)).join(' &nbsp;|&nbsp; ')}</div>`;
    html += `<hr class="resume-line">`;

    if (data.summary) {
      html += `<div class="resume-section-title">Summary</div><hr class="resume-line">`;
      html += `<div class="resume-subsection"><p style="font-size:10pt;color:#222;">${e(data.summary)}</p></div>`;
    }

    if (data.education?.length) {
      html += `<div class="resume-section-title">Education</div><hr class="resume-line">`;
      data.education.forEach(ed => {
        html += `<div class="resume-subsection">
          <div class="resume-row"><span class="resume-role">${e(ed.degree)}</span><span class="resume-date">${e(ed.startYear)}${ed.endYear ? '–' + e(ed.endYear) : ''}</span></div>
          <div class="resume-row"><span class="resume-org">${e(ed.college)}${ed.location ? ', ' + e(ed.location) : ''}</span>${ed.cgpa ? `<span>CGPA: ${e(ed.cgpa)}</span>` : ''}</div>
        </div>`;
      });
    }

    const sk = data.skills || {};
    const hasSkills = [sk.languages, sk.technologies, sk.tools, sk.softSkills].some(a => a?.length);
    if (hasSkills) {
      html += `<div class="resume-section-title">Skills</div><hr class="resume-line">`;
      if (sk.languages?.length)    html += `<div class="resume-skills-row"><strong>Languages:</strong> ${e(sk.languages.join(', '))}</div>`;
      if (sk.technologies?.length) html += `<div class="resume-skills-row"><strong>Technologies:</strong> ${e(sk.technologies.join(', '))}</div>`;
      if (sk.tools?.length)        html += `<div class="resume-skills-row"><strong>Tools:</strong> ${e(sk.tools.join(', '))}</div>`;
      if (sk.softSkills?.length)   html += `<div class="resume-skills-row"><strong>Soft Skills:</strong> ${e(sk.softSkills.join(', '))}</div>`;
    }

    if (data.experience?.length) {
      html += `<div class="resume-section-title">Experience</div><hr class="resume-line">`;
      data.experience.forEach(ex => {
        html += `<div class="resume-subsection">
          <div class="resume-row"><span class="resume-role">${e(ex.role)} — ${e(ex.company)}</span><span class="resume-date">${e(ex.duration)}</span></div>
          <ul class="resume-bullets">${(ex.responsibilities || []).map(r => `<li>${e(r)}</li>`).join('')}</ul>
        </div>`;
      });
    }

    if (data.projects?.length) {
      html += `<div class="resume-section-title">Projects</div><hr class="resume-line">`;
      data.projects.forEach(pr => {
        html += `<div class="resume-subsection">
          <div class="resume-row"><span class="resume-role">${e(pr.name)}</span></div>
          ${pr.technologies ? `<div style="font-size:9.5pt;font-style:italic;color:#444;margin-bottom:3px;">Technologies: ${e(pr.technologies)}</div>` : ''}
          ${pr.description ? `<div style="font-size:10pt;color:#222;margin-bottom:3px;">${e(pr.description)}</div>` : ''}
          <ul class="resume-bullets">${(pr.contributions || []).map(c => `<li>${e(c)}</li>`).join('')}</ul>
        </div>`;
      });
    }

    if (data.certifications?.length) {
      html += `<div class="resume-section-title">Certifications</div><hr class="resume-line">`;
      html += `<ul class="resume-bullets">${data.certifications.map(c => `<li>${e(c.name)}${c.organization ? ' — ' + e(c.organization) : ''}${c.year ? ' (' + e(c.year) + ')' : ''}</li>`).join('')}</ul>`;
    }

    if (data.achievements?.length) {
      html += `<div class="resume-section-title">Achievements</div><hr class="resume-line">`;
      html += `<ul class="resume-bullets">${data.achievements.map(a => `<li>${e(a)}</li>`).join('')}</ul>`;
    }

    html += `</div>`;
    return html;
  }

  // ── Generate LaTeX Source ──────────────────────────────────
  function buildLatex(data) {
    const e = s => (s || '').replace(/[&%$#_{}~^\\]/g, m => `\\${m}`);
    const p = data.personal || {};
    const sk = data.skills || {};

    let tex = `\\documentclass[10pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage[hidelinks]{hyperref}
\\usepackage{parskip}
\\pagestyle{empty}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{8pt}{4pt}

\\begin{document}

\\begin{center}
  {\\LARGE \\textbf{${e(p.name)}}} \\\\[4pt]
  ${[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).map(e).join(' \\textbar\\ ')}
\\end{center}

`;

    if (data.summary) {
      tex += `\\section{Summary}\n${e(data.summary)}\n\n`;
    }

    if (data.education?.length) {
      tex += `\\section{Education}\n`;
      data.education.forEach(ed => {
        tex += `\\textbf{${e(ed.degree)}} \\hfill ${e(ed.startYear)}--${e(ed.endYear)} \\\\\n`;
        tex += `\\textit{${e(ed.college)}}${ed.location ? ', ' + e(ed.location) : ''}${ed.cgpa ? ' \\hfill CGPA: ' + e(ed.cgpa) : ''} \\\\\n\n`;
      });
    }

    if ([sk.languages, sk.technologies, sk.tools, sk.softSkills].some(a => a?.length)) {
      tex += `\\section{Skills}\n\\begin{itemize}[noitemsep,topsep=0pt]\n`;
      if (sk.languages?.length)    tex += `  \\item \\textbf{Languages:} ${e(sk.languages.join(', '))}\n`;
      if (sk.technologies?.length) tex += `  \\item \\textbf{Technologies:} ${e(sk.technologies.join(', '))}\n`;
      if (sk.tools?.length)        tex += `  \\item \\textbf{Tools:} ${e(sk.tools.join(', '))}\n`;
      if (sk.softSkills?.length)   tex += `  \\item \\textbf{Soft Skills:} ${e(sk.softSkills.join(', '))}\n`;
      tex += `\\end{itemize}\n\n`;
    }

    if (data.experience?.length) {
      tex += `\\section{Experience}\n`;
      data.experience.forEach(ex => {
        tex += `\\textbf{${e(ex.role)}} --- ${e(ex.company)} \\hfill ${e(ex.duration)} \\\\\n`;
        if (ex.responsibilities?.length) {
          tex += `\\begin{itemize}[noitemsep,topsep=2pt]\n`;
          ex.responsibilities.forEach(r => tex += `  \\item ${e(r)}\n`);
          tex += `\\end{itemize}\n`;
        }
        tex += `\n`;
      });
    }

    if (data.projects?.length) {
      tex += `\\section{Projects}\n`;
      data.projects.forEach(pr => {
        tex += `\\textbf{${e(pr.name)}}`;
        if (pr.technologies) tex += ` \\hfill \\textit{${e(pr.technologies)}}`;
        tex += ` \\\\\n`;
        if (pr.description) tex += `${e(pr.description)} \\\\\n`;
        if (pr.contributions?.length) {
          tex += `\\begin{itemize}[noitemsep,topsep=2pt]\n`;
          pr.contributions.forEach(c => tex += `  \\item ${e(c)}\n`);
          tex += `\\end{itemize}\n`;
        }
        tex += `\n`;
      });
    }

    if (data.certifications?.length) {
      tex += `\\section{Certifications}\n\\begin{itemize}[noitemsep,topsep=0pt]\n`;
      data.certifications.forEach(c => {
        tex += `  \\item ${e(c.name)}${c.organization ? ' --- ' + e(c.organization) : ''}${c.year ? ' (' + e(c.year) + ')' : ''}\n`;
      });
      tex += `\\end{itemize}\n\n`;
    }

    if (data.achievements?.length) {
      tex += `\\section{Achievements}\n\\begin{itemize}[noitemsep,topsep=0pt]\n`;
      data.achievements.forEach(a => tex += `  \\item ${e(a)}\n`);
      tex += `\\end{itemize}\n\n`;
    }

    tex += `\\end{document}\n`;
    return tex;
  }

  // ── Tab switching ──────────────────────────────────────────
  function setupTabs() {
    document.querySelectorAll('.resume-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.resume-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const t = tab.dataset.tab;
        document.getElementById('resumeTabPreview').style.display = t === 'preview' ? '' : 'none';
        document.getElementById('resumeTabLatex').style.display   = t === 'latex'   ? '' : 'none';
      });
    });
  }

  // ── Main Generate ──────────────────────────────────────────
  async function generate() {
    const formData = collectFormData();
    if (!formData.personal.name.trim()) { Utils.toast('Please enter your full name.', 'error'); return; }
    if (!formData.personal.email.trim()) { Utils.toast('Please enter your email.', 'error'); return; }

    const btn = document.getElementById('btnGenResume');
    Utils.setButtonLoading(btn, true);
    Utils.showLoading('resumeOutput', 'AI is polishing your resume...');

    try {
      const result = await Api.generateResume(formData);
      resumeData = result.data;
      const previewHtml = renderPreview(resumeData);
      document.getElementById('resumeOutput').innerHTML = previewHtml;
      document.getElementById('resumeActions').style.display = 'flex';
      latexSource = buildLatex(resumeData);
      document.getElementById('latexOutput').innerHTML = `<div class="latex-source-wrap"><pre>${Utils.escapeHtml(latexSource)}</pre></div>`;
      if (result.demo) Utils.toast('Demo mode: showing sample resume. Add API key for real AI.', 'info');
      else Utils.toast('Resume generated successfully!', 'success');
    } catch (err) {
      Utils.showError('resumeOutput', err.message, generate);
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  }

  // ── Init ───────────────────────────────────────────────────
  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML();
    setupTabs();

    // Add initial entries
    addEduItem(); addExpItem(); addProjItem(); addCertItem(); addAchItem();

    // Button events
    document.getElementById('addEdu')?.addEventListener('click', addEduItem);
    document.getElementById('addExp')?.addEventListener('click', addExpItem);
    document.getElementById('addProj')?.addEventListener('click', addProjItem);
    document.getElementById('addCert')?.addEventListener('click', addCertItem);
    document.getElementById('addAch')?.addEventListener('click', addAchItem);
    document.getElementById('btnGenResume')?.addEventListener('click', generate);
    document.getElementById('btnRegenResume')?.addEventListener('click', generate);

    document.getElementById('btnClearResume')?.addEventListener('click', () => {
      if (!confirm('Clear all form data?')) return;
      container.innerHTML = '';
      init(containerId);
    });

    document.getElementById('btnDownloadPDF')?.addEventListener('click', () => {
      const el = document.getElementById('resumePreviewEl');
      if (!el) { Utils.toast('Generate resume first.', 'error'); return; }
      Utils.downloadPDF(el, 'resume.pdf');
    });

    document.getElementById('btnPrint')?.addEventListener('click', () => {
      const el = document.getElementById('resumePreviewEl');
      if (!el) { Utils.toast('Generate resume first.', 'error'); return; }
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>Resume</title><style>
        body{font-family:Georgia,serif;font-size:10.5pt;color:#111;padding:40px 50px;line-height:1.45;}
        h1{font-size:20pt;text-align:center;margin-bottom:4px;}
        .resume-contact{text-align:center;font-size:9pt;margin-bottom:16px;}
        hr{border:none;border-top:1.2px solid #333;margin:4px 0 10px;}
        .resume-section-title{font-size:10.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin:14px 0 6px;}
        .resume-row{display:flex;justify-content:space-between;}
        .resume-role{font-weight:700;} .resume-date{font-style:italic;color:#444;}
        ul{padding-left:18px;} li{margin-bottom:2px;}
        @media print{body{padding:20px 30px;}}
      </style></head><body>${el.innerHTML}</body></html>`);
      w.document.close(); w.print();
    });

    document.getElementById('btnCopyLatex')?.addEventListener('click', () => {
      if (!latexSource) { Utils.toast('Generate resume first.', 'error'); return; }
      Utils.copyToClipboard(latexSource);
    });

    document.getElementById('btnDownloadTex')?.addEventListener('click', () => {
      if (!latexSource) { Utils.toast('Generate resume first.', 'error'); return; }
      const name = document.getElementById('r-name')?.value || 'resume';
      Utils.downloadText(latexSource, `${Utils.slugify(name)}-resume.tex`);
    });
  }

  return { init };
})();
