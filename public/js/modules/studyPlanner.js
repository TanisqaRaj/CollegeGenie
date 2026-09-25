/* studyPlanner.js — AI Study Planner Module */
window.StudyPlannerModule = (() => {
  let planData = null;
  let currentView = 'week';

  function getHTML() {
    return `
<div class="tool-header">
  <div class="tool-header-icon" style="background:linear-gradient(135deg,#bee3f8,#4299e1)"><i class="fas fa-calendar-alt"></i></div>
  <div class="tool-header-text"><h1>AI Study Planner</h1><p>Generate a personalized weekly study timetable based on your exams and priorities.</p></div>
</div>
<div class="tool-layout">
  <!-- Input -->
  <div style="display:flex;flex-direction:column;gap:16px;">
    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-book" style="color:#4299e1"></i> Subjects & Exams</h2></div>
      <div class="dynamic-section" id="spSubjectList"></div>
      <button class="btn-add-item" id="btnAddSubject" style="margin-top:12px"><i class="fas fa-plus"></i> Add Subject</button>
    </div>

    <div class="card">
      <div class="card-header"><h2 class="card-title"><i class="fas fa-clock" style="color:#4299e1"></i> Study Schedule</h2></div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="spHours">Daily Study Hours</label>
            <select class="form-control" id="spHours">
              <option value="2">2 hours/day</option>
              <option value="3">3 hours/day</option>
              <option value="4" selected>4 hours/day</option>
              <option value="5">5 hours/day</option>
              <option value="6">6 hours/day</option>
              <option value="8">8 hours/day</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="spStart">Study Start Time</label>
            <input class="form-control" id="spStart" type="time" value="18:00" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="spEnd">Study End Time</label>
            <input class="form-control" id="spEnd" type="time" value="22:00" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Study Days</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;" id="spDaysGroup">
            ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d =>
              `<label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer;background:var(--bg);padding:6px 12px;border-radius:20px;border:1.5px solid var(--border);transition:all 0.15s;" class="sp-day-label">
                <input type="checkbox" class="sp-day" value="${d}" ${['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(d) ? 'checked' : ''} style="accent-color:#4299e1;" />
                ${d.slice(0,3)}
              </label>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="spWeak">Weak Topics (optional)</label>
          <input class="form-control" id="spWeak" placeholder="e.g. Normalization, TCP/IP, Recursion" />
        </div>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button class="btn btn-blue btn-lg" id="btnGenPlan"><i class="fas fa-magic"></i> Generate Study Plan</button>
      <button class="btn btn-ghost" id="btnClearPlan"><i class="fas fa-trash"></i> Clear</button>
    </div>
  </div>

  <!-- Output -->
  <div style="display:flex;flex-direction:column;gap:12px;">
    <div id="planOutput">
      <div class="empty-state" style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);min-height:400px;">
        <i class="fas fa-calendar-alt" style="color:#4299e1;opacity:1;font-size:2.5rem;"></i>
        <h3>Study plan will appear here</h3>
        <p>Add your subjects and click Generate Study Plan</p>
      </div>
    </div>
    <div style="display:none;flex-wrap:wrap;gap:8px;" id="planActions">
      <button class="btn btn-outline btn-sm" id="btnPrintPlan"><i class="fas fa-print"></i> Print</button>
      <button class="btn btn-outline btn-sm" id="btnRegenPlan"><i class="fas fa-redo"></i> Regenerate</button>
    </div>
  </div>
</div>`;
  }

  function addSubjectItem() {
    const list = document.getElementById('spSubjectList');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'dynamic-item';
    div.innerHTML = `
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">Subject</span>
        <button class="btn-remove-item" onclick="this.closest('.dynamic-item').remove()"><i class="fas fa-times"></i> Remove</button>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Subject Name</label><input class="form-control sp-sub-name" placeholder="e.g. AI, DBMS" /></div>
        <div class="form-group"><label class="form-label">Priority</label>
          <select class="form-control sp-sub-priority">
            <option value="High">High</option>
            <option value="Medium" selected>Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Exam Date (optional)</label><input class="form-control sp-sub-exam" type="date" /></div>
        <div class="form-group"><label class="form-label">Topics (comma separated)</label><input class="form-control sp-sub-topics" placeholder="e.g. Neural Networks, Search" /></div>
      </div>`;
    list.appendChild(div);
  }

  const SUBJECT_COLORS = {
    'High':   'linear-gradient(135deg,#fed7e2,#fc8181)',
    'Medium': 'linear-gradient(135deg,#bee3f8,#63b3ed)',
    'Low':    'linear-gradient(135deg,#c6f6d5,#48bb78)'
  };
  const ACTIVITY_COLORS = { Study: '#4299e1', Revision: '#ed8936', Practice: '#48bb78' };

  function renderPlan(data) {
    const e = Utils.escapeHtml;
    let html = `<div style="display:flex;flex-direction:column;gap:16px;">`;
    html += `<h2 style="font-size:1.1rem;font-weight:800;color:var(--text);">${e(data.title || 'Weekly Study Plan')}</h2>`;

    (data.schedule || []).forEach(dayObj => {
      html += `<div class="card" style="padding:16px 20px;">
        <h3 style="font-size:0.9rem;font-weight:700;color:var(--blue-dark);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em;">
          <i class="fas fa-calendar-day" style="margin-right:6px;"></i>${e(dayObj.day)}
        </h3>
        <div style="display:flex;flex-direction:column;gap:8px;">`;

      (dayObj.sessions || []).forEach(session => {
        const color = ACTIVITY_COLORS[session.activity] || '#4299e1';
        html += `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 14px;background:var(--bg);border-radius:var(--radius-sm);border-left:3px solid ${color};">
          <div style="min-width:100px;font-size:0.78rem;font-weight:600;color:var(--grey-dark);white-space:nowrap;">
            ${e(session.start)} – ${e(session.end)}
          </div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:0.875rem;color:var(--text);">${e(session.subject)}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${e(session.topic || '')}</div>
          </div>
          <span style="font-size:0.72rem;font-weight:600;background:${color}20;color:${color};padding:3px 8px;border-radius:20px;white-space:nowrap;">${e(session.activity)}</span>
        </div>`;
      });

      html += `</div></div>`;
    });

    html += `</div>`;
    document.getElementById('planOutput').innerHTML = html;
    document.getElementById('planActions').style.display = 'flex';
  }

  async function generate() {
    const subjects = [...document.querySelectorAll('#spSubjectList .dynamic-item')].map(el => ({
      name: el.querySelector('.sp-sub-name')?.value?.trim() || '',
      priority: el.querySelector('.sp-sub-priority')?.value || 'Medium',
      examDate: el.querySelector('.sp-sub-exam')?.value || '',
      topics: el.querySelector('.sp-sub-topics')?.value?.trim() || ''
    })).filter(s => s.name);

    if (!subjects.length) { Utils.toast('Please add at least one subject.', 'error'); return; }

    const studyHours = document.getElementById('spHours')?.value || '4';
    const startTime  = document.getElementById('spStart')?.value || '18:00';
    const endTime    = document.getElementById('spEnd')?.value   || '22:00';
    const studyDays  = [...document.querySelectorAll('.sp-day:checked')].map(c => c.value);
    const weakTopics = document.getElementById('spWeak')?.value?.trim() || '';

    if (!studyDays.length) { Utils.toast('Please select at least one study day.', 'error'); return; }

    const btn = document.getElementById('btnGenPlan');
    Utils.setButtonLoading(btn, true);
    document.getElementById('planOutput').innerHTML = `<div class="loading-overlay" style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);min-height:400px;"><div class="spinner" style="border-color:var(--blue-light);border-top-color:var(--blue-dark);width:36px;height:36px;border-width:4px;"></div><p>Creating your personalised study plan...</p></div>`;
    document.getElementById('planActions').style.display = 'none';

    try {
      const result = await Api.generateStudyPlan(subjects, studyHours, startTime, endTime, studyDays, weakTopics);
      planData = result.data;
      if (!planData.schedule?.length) throw new Error('No schedule returned. Please try again.');
      renderPlan(planData);
      if (result.demo) Utils.toast('Demo mode: showing sample study plan.', 'info');
      else Utils.toast('Study plan generated!', 'success');
    } catch (err) {
      Utils.showError('planOutput', err.message, generate);
      Utils.toast(err.message, 'error');
    } finally {
      Utils.setButtonLoading(btn, false);
    }
  }

  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = getHTML();
    planData = null;

    addSubjectItem();
    addSubjectItem();

    document.getElementById('btnAddSubject')?.addEventListener('click', addSubjectItem);
    document.getElementById('btnGenPlan')?.addEventListener('click', generate);
    document.getElementById('btnRegenPlan')?.addEventListener('click', generate);

    document.getElementById('btnClearPlan')?.addEventListener('click', () => {
      planData = null;
      document.getElementById('spSubjectList').innerHTML = '';
      document.getElementById('spWeak').value = '';
      addSubjectItem(); addSubjectItem();
      document.getElementById('planOutput').innerHTML = `<div class="empty-state" style="background:var(--white);border-radius:var(--radius-lg);border:1px solid var(--border);min-height:400px;"><i class="fas fa-calendar-alt" style="color:#4299e1;opacity:1;font-size:2.5rem;"></i><h3>Study plan will appear here</h3><p>Add your subjects and click Generate Study Plan</p></div>`;
      document.getElementById('planActions').style.display = 'none';
    });

    document.getElementById('btnPrintPlan')?.addEventListener('click', () => {
      const el = document.getElementById('planOutput');
      if (!planData || !el) { Utils.toast('Generate a plan first.', 'error'); return; }
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>Study Plan</title><style>
        body{font-family:Inter,sans-serif;padding:24px;color:#2d3748;}
        h2{font-size:1.2rem;font-weight:800;margin-bottom:16px;}
        h3{font-size:0.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#4299e1;margin:16px 0 8px;}
        .session{display:flex;gap:12px;padding:8px 12px;background:#f7f8fc;border-radius:6px;margin-bottom:6px;border-left:3px solid #4299e1;}
        .time{min-width:100px;font-size:0.78rem;font-weight:600;color:#4a5568;}
        .sub{font-weight:700;font-size:0.875rem;} .topic{font-size:0.8rem;color:#718096;}
        @media print{body{padding:12px;}}
      </style></head><body>${el.innerHTML}</body></html>`);
      w.document.close(); w.print();
    });

    // Highlight checked day labels
    document.querySelectorAll('.sp-day').forEach(cb => {
      const label = cb.closest('.sp-day-label');
      const update = () => { if(label) label.style.background = cb.checked ? '#bee3f8' : ''; label.style.borderColor = cb.checked ? '#4299e1' : ''; };
      update();
      cb.addEventListener('change', update);
    });
  }

  return { init };
})();
