/* ============================================================
   BOPinc Nigeria Dashboard — Change Request Modal v2
   
   Full contextual UX per field type:
   - Role/job title: shows current role, project assignments with roles, options to add/correct
   - Project assignment: shows all current projects as cards with links
   - Leave record: shows all leave entries with status, dates, resume date
   - Expertise/sector: shows current tags, account cluster, add/update options
   - Availability status: shows all current status entries, add/edit/delete
   
   Storage: always writes to localStorage 'bopinc_cr_queue' (admin reads from here)
   Also pushes to Sheets if Apps Script URL is configured.
   ============================================================ */

const ChangeRequest = {

  _currentField:  null,
  _currentValue:  '',
  _corrections:   [],   /* array of sub-corrections built up in complex fields */

  /* ════════════════════════════════════════
     INIT
  ════════════════════════════════════════ */
  init() {
    if (document.getElementById('cr-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id        = 'cr-overlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'cr-modal-title');

    overlay.innerHTML = `
      <div class="modal" id="cr-modal"
        style="max-width:520px;max-height:88vh;overflow-y:auto;padding:var(--space-5) var(--space-5) var(--space-4)">

        <!-- Header -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--space-4)">
          <div>
            <div class="modal-drag-handle" style="margin:0 0 var(--space-3)"></div>
            <h2 style="font-size:var(--text-lg);font-weight:600;margin:0" id="cr-modal-title">
              Request a correction
            </h2>
            <p id="cr-subtitle" style="font-size:var(--text-sm);color:var(--color-text-secondary);margin:4px 0 0">
              Select what needs correcting and we'll guide you through it.
            </p>
          </div>
          <button id="cr-close-btn"
            style="background:var(--color-surface-2);border:none;border-radius:50%;
              width:28px;height:28px;cursor:pointer;font-size:15px;display:flex;
              align-items:center;justify-content:center;color:var(--color-text-secondary);
              flex-shrink:0;margin-left:12px;margin-top:4px"
            aria-label="Close">✕</button>
        </div>

        <!-- Step 1: field picker -->
        <div id="cr-step-picker">
          <div style="display:grid;gap:8px" id="cr-field-grid"></div>
        </div>

        <!-- Step 2: contextual panel (swapped in by JS) -->
        <div id="cr-step-context" style="display:none"></div>

        <!-- Status -->
        <div id="cr-submitted-msg" style="display:none;
          padding:var(--space-3) var(--space-4);
          background:var(--color-success-bg);
          border-left:3px solid var(--color-success);
          border-radius:var(--radius-md);
          font-size:var(--text-sm);
          color:var(--color-success);margin-top:var(--space-3)">
          ✓ Request submitted — the country director will review this shortly.
        </div>

        <!-- Footer actions -->
        <div id="cr-footer" style="display:flex;gap:var(--space-2);margin-top:var(--space-4)">
          <button id="cr-back-btn" class="btn btn-secondary btn-sm" style="display:none">← Back</button>
          <div style="flex:1"></div>
          <button id="cr-cancel-btn" class="btn btn-secondary">Cancel</button>
          <button id="cr-submit-btn" class="btn btn-primary" style="display:none">Submit request</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click',  e => { if (e.target === overlay) this.close(); });
    document.getElementById('cr-close-btn').addEventListener('click',  () => this.close());
    document.getElementById('cr-cancel-btn').addEventListener('click', () => this.close());
    document.getElementById('cr-back-btn').addEventListener('click',   () => this._showPicker());
    document.getElementById('cr-submit-btn').addEventListener('click', () => this.submit());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('cr-overlay').classList.contains('open')) this.close();
    });

    this._renderPicker();
  },

  /* ════════════════════════════════════════
     FIELD PICKER
  ════════════════════════════════════════ */
  _FIELDS: [
    { key: 'role',         icon: '🎭', label: 'Role / job title',       desc: 'Your dashboard role or project role' },
    { key: 'project',      icon: '📁', label: 'Project assignment',     desc: 'Projects you are on or missing from' },
    { key: 'leave',        icon: '🗓️', label: 'Leave record',           desc: 'Leave dates, status, or missing entries' },
    { key: 'expertise',    icon: '🔬', label: 'Expertise / sector tag', desc: 'Your sector skills and account cluster' },
    { key: 'availability', icon: '🟢', label: 'Availability status',    desc: 'Your current or upcoming availability' },
    { key: 'other',        icon: '✏️', label: 'Something else',         desc: 'Any other data that looks incorrect' },
  ],

  _renderPicker() {
    const grid = document.getElementById('cr-field-grid');
    const session = Session.get();
    if (!grid) return;

    grid.innerHTML = this._FIELDS.map(f => `
      <button data-field="${f.key}"
        style="display:flex;align-items:center;gap:12px;padding:12px 14px;
          border:1px solid var(--color-border);border-radius:var(--radius-md);
          background:var(--color-surface);cursor:pointer;text-align:left;
          width:100%;transition:all 150ms ease"
        onmouseenter="this.style.borderColor='var(--color-accent)';this.style.background='var(--color-accent-light)'"
        onmouseleave="this.style.borderColor='var(--color-border)';this.style.background='var(--color-surface)'">
        <span style="font-size:20px;flex-shrink:0">${f.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--text-sm);font-weight:500;color:var(--color-text-primary)">${f.label}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">${f.desc}</div>
        </div>
        <span style="color:var(--color-text-tertiary);font-size:14px">›</span>
      </button>
    `).join('');

    grid.querySelectorAll('[data-field]').forEach(btn => {
      btn.addEventListener('click', () => this._openField(btn.dataset.field));
    });
  },

  _showPicker() {
    document.getElementById('cr-step-picker').style.display  = 'block';
    document.getElementById('cr-step-context').style.display = 'none';
    document.getElementById('cr-back-btn').style.display     = 'none';
    document.getElementById('cr-submit-btn').style.display   = 'none';
    document.getElementById('cr-submitted-msg').style.display = 'none';
    this._currentField    = null;
    this._corrections     = [];
    const submitBtn = document.getElementById('cr-submit-btn');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Submit request';
  },

  _showContext(html, fieldKey) {
    this._currentField = fieldKey;
    const ctx = document.getElementById('cr-step-context');
    ctx.innerHTML = html;
    document.getElementById('cr-step-picker').style.display  = 'none';
    ctx.style.display = 'block';
    document.getElementById('cr-back-btn').style.display     = 'block';
    document.getElementById('cr-submit-btn').style.display   = 'block';
  },

  /* ════════════════════════════════════════
     FIELD: ROLE / JOB TITLE
  ════════════════════════════════════════ */
  _openField(key) {
    const session = Session.get();
    const s = session || {};
    const name = s.name || 'You';

    if      (key === 'role')         this._buildRolePanel(s, name);
    else if (key === 'project')      this._buildProjectPanel(s, name);
    else if (key === 'leave')        this._buildLeavePanel(s, name);
    else if (key === 'expertise')    this._buildExpertisePanel(s, name);
    else if (key === 'availability') this._buildAvailabilityPanel(s, name);
    else                             this._buildOtherPanel(s, name);
  },

  _sectionHead(icon, title, subtitle) {
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--space-4);
        padding-bottom:var(--space-3);border-bottom:1px solid var(--color-border)">
        <span style="font-size:22px">${icon}</span>
        <div>
          <div style="font-size:var(--text-base);font-weight:600">${title}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">${subtitle}</div>
        </div>
      </div>`;
  },

  _infoRow(label, value, accent) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:8px 0;border-bottom:1px solid var(--color-border)">
        <span style="font-size:var(--text-xs);color:var(--color-text-secondary)">${label}</span>
        <span style="font-size:var(--text-sm);font-weight:500;
          color:${accent || 'var(--color-text-primary)'}">
          ${value || '—'}
        </span>
      </div>`;
  },

  /* -- Role panel -- */
  _buildRolePanel(session, name) {
    /* Get projects this user is on from ProjectCard store */
    const store = (typeof ProjectCard !== 'undefined' && ProjectCard._store)
      ? Object.values(ProjectCard._store) : [];
    const myProjects = store.filter(s => {
      const members = typeof SheetsClient !== 'undefined'
        ? SheetsClient.parseTeamMembers(s.project.teamMembers || '')
        : [];
      return members.some(m => m.name.toLowerCase().includes((session.name||'').split(' ')[0].toLowerCase()));
    });

    /* Also check localStorage projects */
    const localProjects = JSON.parse(localStorage.getItem('bopinc_local_projects') || '[]');
    const allProjects   = [
      ...myProjects.map(s => s.project),
      ...localProjects.filter(p => (p.teamMembers||'').toLowerCase().includes((session.name||'').split(' ')[0].toLowerCase())),
    ];
    const uniqueProjects = [...new Map(allProjects.map(p => [p.name, p])).values()];

    const projectRows = uniqueProjects.length > 0
      ? uniqueProjects.map(p => {
          const members = typeof SheetsClient !== 'undefined'
            ? SheetsClient.parseTeamMembers(p.teamMembers || '') : [];
          const me = members.find(m => m.name.toLowerCase().includes((session.name||'').split(' ')[0].toLowerCase()));
          const myRole = me ? me.role : 'Team member';
          return `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;
              background:var(--color-surface-2);border-radius:var(--radius-md);margin-bottom:6px">
              <div style="flex:1;min-width:0">
                <div style="font-size:var(--text-sm);font-weight:500">${p.name}</div>
                <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
                  Your role: <strong>${myRole}</strong>
                  ${p.status ? `· <span class="badge badge-${p.status==='active'?'green':'amber'}" style="font-size:9px">${p.status}</span>` : ''}
                </div>
              </div>
            </div>`;
        }).join('')
      : `<div style="font-size:var(--text-sm);color:var(--color-text-secondary);
          padding:10px 0">No projects on record yet.</div>`;

    const roleOptions = [
      { value:'team_member',       label:'Team member' },
      { value:'partnerships_lead', label:'Partnerships lead' },
      { value:'country_director',  label:'Country director' },
    ];

    const html = `
      ${this._sectionHead('🎭', 'Role / job title', `Correction for ${name}`)}

      <div style="margin-bottom:var(--space-4)">
        ${this._infoRow('Your name',           name)}
        ${this._infoRow('Dashboard role',      ROLE_LABELS[session.role] || session.role, 'var(--color-accent)')}
        ${this._infoRow('Number of projects',  `${uniqueProjects.length} project${uniqueProjects.length!==1?'s':''}`)}
      </div>

      <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
        text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
        Your current projects
      </div>
      <div style="margin-bottom:var(--space-4)">${projectRows}</div>

      <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
        text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
        What needs correcting?
      </div>

      <div style="display:grid;gap:8px;margin-bottom:var(--space-4)">
        <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;
          border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer">
          <input type="radio" name="role-correction-type" value="wrong_dashboard_role" style="margin-top:2px">
          <div>
            <div style="font-size:var(--text-sm);font-weight:500">My dashboard role is wrong</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
              Change what I can see and access on this dashboard
            </div>
          </div>
        </label>
        <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;
          border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer">
          <input type="radio" name="role-correction-type" value="wrong_project_role" style="margin-top:2px">
          <div>
            <div style="font-size:var(--text-sm);font-weight:500">My role on a project is wrong</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
              Correct the role shown next to my name on a specific project
            </div>
          </div>
        </label>
        <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;
          border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer">
          <input type="radio" name="role-correction-type" value="add_project" style="margin-top:2px">
          <div>
            <div style="font-size:var(--text-sm);font-weight:500">Add me to another project</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
              I am working on a project not shown above
            </div>
          </div>
        </label>
      </div>

      <!-- Sub-form: changes based on radio selection -->
      <div id="role-sub-form"></div>

      <div class="form-group">
        <label class="form-label" for="cr-note-role">Additional context (optional)</label>
        <textarea class="form-textarea" id="cr-note-role"
          placeholder="Any extra detail for the country director…"
          style="min-height:60px"></textarea>
      </div>
    `;

    this._showContext(html, 'role');

    /* Wire radio → sub-form */
    document.querySelectorAll('[name="role-correction-type"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const sub = document.getElementById('role-sub-form');
        if (radio.value === 'wrong_dashboard_role') {
          sub.innerHTML = `
            <div class="form-group" style="margin-bottom:var(--space-4)">
              <label class="form-label">Correct dashboard role</label>
              <select class="form-select" id="role-new-value" style="font-size:var(--text-base)">
                <option value="">Select correct role…</option>
                ${roleOptions.map(o => `<option value="${o.value}"${o.value===session.role?' selected':''}>${o.label}</option>`).join('')}
              </select>
            </div>`;
        } else if (radio.value === 'wrong_project_role') {
          sub.innerHTML = `
            <div class="form-group" style="margin-bottom:var(--space-4)">
              <label class="form-label">Which project?</label>
              <select class="form-select" id="role-project-select" style="font-size:var(--text-base)">
                <option value="">Select project…</option>
                ${uniqueProjects.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                <option value="__other">Other / not listed</option>
              </select>
              <label class="form-label" style="margin-top:10px">My correct role on this project</label>
              <input class="form-input" type="text" id="role-project-role"
                placeholder="e.g. Project Lead, MEL Specialist, Finance Officer"
                style="font-size:var(--text-base)">
            </div>`;
        } else if (radio.value === 'add_project') {
          sub.innerHTML = `
            <div class="form-group" style="margin-bottom:var(--space-4)">
              <label class="form-label">Project name</label>
              <select class="form-select" id="role-add-project" style="font-size:var(--text-base)">
                <option value="">Select from existing projects…</option>
                ${JSON.parse(localStorage.getItem('bopinc_local_projects')||'[]')
                  .filter(p => !uniqueProjects.find(u => u.name === p.name))
                  .map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                <option value="__adhoc">Ad-hoc task / not in system</option>
              </select>
              <div id="role-adhoc-name-wrap" style="display:none;margin-top:8px">
                <input class="form-input" type="text" id="role-adhoc-name"
                  placeholder="Describe the task or project name"
                  style="font-size:var(--text-base)">
              </div>
              <label class="form-label" style="margin-top:10px">My role on this project</label>
              <input class="form-input" type="text" id="role-add-project-role"
                placeholder="e.g. Technical Advisor, Project Manager"
                style="font-size:var(--text-base)">
            </div>`;
          document.getElementById('role-add-project')?.addEventListener('change', e => {
            document.getElementById('role-adhoc-name-wrap').style.display =
              e.target.value === '__adhoc' ? 'block' : 'none';
          });
        }
      });
    });
  },

  /* -- Project assignment panel -- */
  _buildProjectPanel(session, name) {
    const store = (typeof ProjectCard !== 'undefined' && ProjectCard._store)
      ? Object.values(ProjectCard._store) : [];
    const localProjects = JSON.parse(localStorage.getItem('bopinc_local_projects') || '[]');

    /* All projects in the system */
    const allSystemProjects = [
      ...store.map(s => s.project),
      ...localProjects,
    ];
    const unique = [...new Map(allSystemProjects.map(p => [p.name, p])).values()];

    /* Projects this user is on */
    const myProjects = unique.filter(p =>
      (p.teamMembers || '').toLowerCase()
        .includes((session.name || '').split(' ')[0].toLowerCase())
    );

    const projectCard = (p, isOnIt) => `
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-md);
        padding:10px 12px;margin-bottom:8px;position:relative">
        <div style="display:flex;align-items:flex-start;justify-content:space-between">
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--text-sm);font-weight:600">${p.name}</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-top:2px">
              ${p.sector ? `<span class="badge badge-blue" style="font-size:9px">${p.sector}</span> · ` : ''}
              ${p.status || 'active'} ·
              ${p.endDate ? `ends ${p.endDate}` : 'ongoing'}
            </div>
            ${p.lead ? `<div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-top:3px">Lead: ${p.lead}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;margin-left:10px">
            <span class="badge ${isOnIt ? 'badge-green' : 'badge-slate'}" style="font-size:9px">
              ${isOnIt ? '✓ You are on this' : 'Not assigned'}
            </span>
            <button data-proj-link="${p.id || p.name}"
              style="font-size:10px;color:var(--color-accent);background:none;
                border:none;cursor:pointer;padding:0;text-decoration:underline">
              View details →
            </button>
          </div>
        </div>
      </div>`;

    const html = `
      ${this._sectionHead('📁', 'Project assignment', `Correction for ${name}`)}

      <div style="margin-bottom:var(--space-3)">
        ${this._infoRow('Your name',            name)}
        ${this._infoRow('Projects assigned to', `${myProjects.length} of ${unique.length} in system`)}
      </div>

      <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
        text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
        All projects in the system
      </div>

      <div style="max-height:240px;overflow-y:auto;margin-bottom:var(--space-4);padding-right:4px">
        ${unique.length > 0
          ? unique.map(p => projectCard(p, myProjects.some(m => m.name === p.name))).join('')
          : `<div style="font-size:var(--text-sm);color:var(--color-text-secondary);padding:10px 0">
              No projects in the system yet.</div>`}
      </div>

      <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
        text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
        What needs correcting?
      </div>

      <div class="form-group">
        <label class="form-label">Select the project</label>
        <select class="form-select" id="proj-cr-select" style="font-size:var(--text-base)">
          <option value="">Choose a project…</option>
          ${unique.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
          <option value="__new">A project not listed here</option>
        </select>
        <div id="proj-new-name-wrap" style="display:none;margin-top:8px">
          <input class="form-input" type="text" id="proj-new-name"
            placeholder="Project name" style="font-size:var(--text-base)">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">What is the issue?</label>
        <select class="form-select" id="proj-cr-issue" style="font-size:var(--text-base)">
          <option value="">Select the issue…</option>
          <option value="add_me">Add me to this project</option>
          <option value="remove_me">Remove me — I am no longer on it</option>
          <option value="wrong_role">My role on this project is wrong</option>
        </select>
        <div id="proj-role-wrap" style="display:none;margin-top:8px">
          <input class="form-input" type="text" id="proj-correct-role"
            placeholder="My correct role e.g. Technical Lead"
            style="font-size:var(--text-base)">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Additional context (optional)</label>
        <textarea class="form-textarea" id="cr-note-project"
          placeholder="Any extra detail for the director…"
          style="min-height:60px"></textarea>
      </div>
    `;

    this._showContext(html, 'project');

    document.getElementById('proj-cr-select')?.addEventListener('change', e => {
      document.getElementById('proj-new-name-wrap').style.display =
        e.target.value === '__new' ? 'block' : 'none';
    });
    document.getElementById('proj-cr-issue')?.addEventListener('change', e => {
      document.getElementById('proj-role-wrap').style.display =
        e.target.value === 'wrong_role' ? 'block' : 'none';
    });

    /* View details links — navigate to Projects tab */
    document.querySelectorAll('[data-proj-link]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.close();
        if (typeof navigate === 'function') navigate('projects');
      });
    });
  },

  /* -- Leave record panel -- */
  _buildLeavePanel(session, name) {
    /* Demo leave data — replaced by Sheets calendar-events in Phase 3 */
    const DEMO_LEAVE = [
      { id:'l1', type:'Annual leave',  start:'2025-06-02', end:'2025-06-06',
        submitted:'2025-05-20', status:'approved',  resumeDate:'2025-06-09' },
      { id:'l2', type:'Sick leave',    start:'2025-04-14', end:'2025-04-14',
        submitted:'2025-04-14', status:'approved',  resumeDate:'2025-04-15' },
      { id:'l3', type:'Annual leave',  start:'2025-07-14', end:'2025-07-18',
        submitted:'2025-06-28', status:'pending',   resumeDate:'2025-07-21' },
    ];

    const statusBadge = s => {
      if (s === 'approved')  return `<span class="badge badge-green" style="font-size:9px">Approved</span>`;
      if (s === 'pending')   return `<span class="badge badge-amber" style="font-size:9px">Under review</span>`;
      return `<span class="badge badge-red" style="font-size:9px">Not approved</span>`;
    };
    const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';

    const leaveRows = DEMO_LEAVE.map(l => `
      <div style="border:1px solid var(--color-border);border-radius:var(--radius-md);
        padding:10px 12px;margin-bottom:8px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">
          <div style="font-size:var(--text-sm);font-weight:500">${l.type}</div>
          ${statusBadge(l.status)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
          <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
            📅 ${fmtDate(l.start)} → ${fmtDate(l.end)}
          </div>
          <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
            🔄 Resume: ${fmtDate(l.resumeDate)}
          </div>
          <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
            Submitted: ${fmtDate(l.submitted)}
          </div>
        </div>
      </div>
    `).join('');

    const html = `
      ${this._sectionHead('🗓️', 'Leave record', `Correction for ${name}`)}

      ${this._infoRow('Team member', name)}
      <div style="margin-bottom:var(--space-4)"></div>

      <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
        text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
        Leave on record
      </div>
      <div style="max-height:220px;overflow-y:auto;margin-bottom:var(--space-4);padding-right:4px">
        ${leaveRows}
      </div>

      <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
        text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
        What needs correcting?
      </div>

      <div class="form-group">
        <label class="form-label">Type of correction</label>
        <select class="form-select" id="leave-cr-type" style="font-size:var(--text-base)">
          <option value="">Select…</option>
          <option value="missing">A leave entry is missing</option>
          <option value="wrong_dates">Dates on an entry are wrong</option>
          <option value="wrong_status">Status is incorrect</option>
          <option value="wrong_resume">Resume date is wrong</option>
          <option value="delete">An entry should be removed</option>
        </select>
      </div>

      <div id="leave-sub-form"></div>

      <div class="form-group">
        <label class="form-label">Additional context (optional)</label>
        <textarea class="form-textarea" id="cr-note-leave"
          placeholder="Any extra detail for the director…"
          style="min-height:60px"></textarea>
      </div>
    `;

    this._showContext(html, 'leave');

    document.getElementById('leave-cr-type')?.addEventListener('change', e => {
      const sub  = document.getElementById('leave-sub-form');
      const type = e.target.value;
      if (type === 'missing') {
        sub.innerHTML = `
          <div class="form-group">
            <label class="form-label">Leave type</label>
            <select class="form-select" id="leave-new-type" style="font-size:var(--text-base)">
              <option>Annual leave</option><option>Sick leave</option>
              <option>Public holiday</option><option>Compassionate leave</option><option>Other</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
            <div class="form-group">
              <label class="form-label">Start date</label>
              <input class="form-input" type="date" id="leave-new-start" style="font-size:var(--text-base)">
            </div>
            <div class="form-group">
              <label class="form-label">End date</label>
              <input class="form-input" type="date" id="leave-new-end" style="font-size:var(--text-base)">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Expected resume date</label>
            <input class="form-input" type="date" id="leave-resume" style="font-size:var(--text-base)">
          </div>`;
      } else {
        sub.innerHTML = `
          <div class="form-group">
            <label class="form-label">Which entry? (describe dates)</label>
            <input class="form-input" type="text" id="leave-ref"
              placeholder="e.g. Annual leave 2–6 Jun 2025"
              style="font-size:var(--text-base)">
          </div>
          <div class="form-group">
            <label class="form-label">What should it say instead?</label>
            <input class="form-input" type="text" id="leave-correct"
              placeholder="Correct value or dates"
              style="font-size:var(--text-base)">
          </div>`;
      }
    });
  },

  /* -- Expertise / sector tag panel -- */
  _buildExpertisePanel(session, name) {
    const currentTags = session.expertise || [];
    const ALL_SECTORS = [
      'energy','agriculture','health','wash','education',
      'finance','livelihoods','gender','monitoring','data','strategy','partnerships',
    ];

    /* Account clusters — demo data */
    const CLUSTERS = {
      energy: 'Energy & Climate',
      agriculture: 'Food Systems',
      health: 'Health & WASH',
      wash: 'Health & WASH',
      education: 'Human Development',
      gender: 'Human Development',
      finance: 'Inclusive Finance',
      livelihoods: 'Inclusive Finance',
      strategy: 'Partnerships & Strategy',
      partnerships: 'Partnerships & Strategy',
    };
    const myCluster = currentTags.map(t => CLUSTERS[t]).filter(Boolean);
    const uniqueClusters = [...new Set(myCluster)];

    const tagChip = (tag, selected) => `
      <button class="sector-chip" data-tag="${tag}"
        style="padding:5px 12px;border-radius:var(--radius-full);font-size:var(--text-xs);
          font-weight:500;cursor:pointer;border:1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'};
          background:${selected ? 'var(--color-accent-light)' : 'var(--color-surface)'};
          color:${selected ? 'var(--color-accent-text)' : 'var(--color-text-secondary)'};
          transition:all 150ms ease">
        ${selected ? '✓ ' : ''}${tag}
      </button>`;

    const html = `
      ${this._sectionHead('🔬', 'Expertise / sector tag', `Correction for ${name}`)}

      <div style="margin-bottom:var(--space-3)">
        ${this._infoRow('Team member', name)}
        ${this._infoRow('Account cluster', uniqueClusters.length ? uniqueClusters.join(', ') : 'None assigned', 'var(--color-accent)')}
        ${this._infoRow('Current expertise tags', currentTags.length ? currentTags.join(', ') : 'None set')}
      </div>

      <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
        text-transform:uppercase;letter-spacing:.06em;margin:var(--space-4) 0 10px">
        Update expertise tags
      </div>
      <div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:10px">
        Click to select all sectors that apply to you. Currently selected tags are highlighted.
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:var(--space-4)" id="sector-chips">
        ${ALL_SECTORS.map(s => tagChip(s, currentTags.includes(s))).join('')}
      </div>

      <div id="selected-preview"
        style="padding:8px 12px;background:var(--color-surface-2);border-radius:var(--radius-md);
          font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:var(--space-4)">
        Selected: <strong id="selected-tags-list">${currentTags.join(', ') || 'none'}</strong>
      </div>

      <div class="form-group">
        <label class="form-label">Additional context (optional)</label>
        <textarea class="form-textarea" id="cr-note-expertise"
          placeholder="e.g. recently moved from health to energy projects…"
          style="min-height:60px"></textarea>
      </div>
    `;

    this._showContext(html, 'expertise');

    /* Track selected tags */
    let selectedTags = [...currentTags];
    document.querySelectorAll('.sector-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        if (selectedTags.includes(tag)) {
          selectedTags = selectedTags.filter(t => t !== tag);
          chip.style.background    = 'var(--color-surface)';
          chip.style.borderColor   = 'var(--color-border)';
          chip.style.color         = 'var(--color-text-secondary)';
          chip.textContent         = tag;
        } else {
          selectedTags.push(tag);
          chip.style.background    = 'var(--color-accent-light)';
          chip.style.borderColor   = 'var(--color-accent)';
          chip.style.color         = 'var(--color-accent-text)';
          chip.textContent         = `✓ ${tag}`;
        }
        document.getElementById('selected-tags-list').textContent =
          selectedTags.join(', ') || 'none';
        this._selectedTags = selectedTags;
      });
    });
    this._selectedTags = [...currentTags];
  },

  /* -- Availability status panel -- */
  _buildAvailabilityPanel(session, name) {
    const schedule = (typeof DEMO_SCHEDULE !== 'undefined') ? DEMO_SCHEDULE : [];
    const me = schedule.find(p =>
      p.name.toLowerCase().includes((session.name||'').split(' ')[0].toLowerCase())
    );

    const STATUS_OPTS = [
      { value:'available', label:'Available',      color:'var(--color-success)' },
      { value:'busy',      label:'In meetings',    color:'var(--color-warning)' },
      { value:'leave',     label:'On leave',       color:'var(--color-danger)'  },
      { value:'offline',   label:'Offline',        color:'var(--slate-400)'     },
    ];

    const todayBlocks = me
      ? me.bars.map(b => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;
            border-bottom:1px solid var(--color-border)">
            <div style="width:10px;height:10px;border-radius:2px;flex-shrink:0;
              background:${b.type==='meeting'?'var(--green-500)':b.type==='focus'?'var(--blue-500)':'var(--amber-400)'}"></div>
            <div style="font-size:var(--text-sm);flex:1">${b.label}</div>
            <span class="badge badge-slate" style="font-size:9px">${b.type}</span>
          </div>`).join('')
      : `<div style="font-size:var(--text-sm);color:var(--color-text-secondary)">No schedule entries found for today.</div>`;

    const currentStatus = me ? me.status : (session.status || 'available');
    const currentLabel  = STATUS_OPTS.find(o => o.value === currentStatus)?.label || currentStatus;

    const html = `
      ${this._sectionHead('🟢', 'Availability status', `Correction for ${name}`)}

      <div style="margin-bottom:var(--space-3)">
        ${this._infoRow('Team member', name)}
        ${this._infoRow('Status shown today', currentLabel,
          STATUS_OPTS.find(o => o.value === currentStatus)?.color || 'var(--color-text-primary)')}
      </div>

      <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
        text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
        Today's schedule entries
      </div>
      <div style="max-height:140px;overflow-y:auto;margin-bottom:var(--space-4)">${todayBlocks}</div>

      <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
        text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">
        What needs correcting?
      </div>

      <div style="display:grid;gap:6px;margin-bottom:var(--space-4)">
        <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;
          border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer">
          <input type="radio" name="avail-type" value="status_wrong">
          <div>
            <div style="font-size:var(--text-sm);font-weight:500">My overall status is wrong</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">Currently shows: ${currentLabel}</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;
          border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer">
          <input type="radio" name="avail-type" value="block_missing">
          <div>
            <div style="font-size:var(--text-sm);font-weight:500">A schedule block is missing</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">A meeting or focus time is not showing</div>
          </div>
        </label>
        <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;
          border:1px solid var(--color-border);border-radius:var(--radius-md);cursor:pointer">
          <input type="radio" name="avail-type" value="block_wrong">
          <div>
            <div style="font-size:var(--text-sm);font-weight:500">A block is wrong or should be removed</div>
          </div>
        </label>
      </div>

      <div id="avail-sub-form"></div>

      <div class="form-group">
        <label class="form-label">Additional context (optional)</label>
        <textarea class="form-textarea" id="cr-note-avail"
          placeholder="Any extra detail…" style="min-height:60px"></textarea>
      </div>
    `;

    this._showContext(html, 'availability');

    document.querySelectorAll('[name="avail-type"]').forEach(r => {
      r.addEventListener('change', () => {
        const sub = document.getElementById('avail-sub-form');
        if (r.value === 'status_wrong') {
          sub.innerHTML = `
            <div class="form-group">
              <label class="form-label">Correct status</label>
              <select class="form-select" id="avail-correct-status" style="font-size:var(--text-base)">
                ${STATUS_OPTS.map(o => `
                  <option value="${o.value}"${o.value===currentStatus?' selected':''}>${o.label}</option>
                `).join('')}
              </select>
            </div>`;
        } else {
          sub.innerHTML = `
            <div class="form-group">
              <label class="form-label">Describe the block</label>
              <input class="form-input" type="text" id="avail-block-desc"
                placeholder="e.g. Focus time 2–4pm missing on Tuesday"
                style="font-size:var(--text-base)">
            </div>`;
        }
      });
    });
  },

  /* -- Other panel -- */
  _buildOtherPanel(session, name) {
    const html = `
      ${this._sectionHead('✏️', 'Something else', `Correction for ${name}`)}
      <div class="form-group">
        <label class="form-label">What is incorrect?</label>
        <input class="form-input" type="text" id="other-field-name"
          placeholder="e.g. Email address, phone number, office location"
          style="font-size:var(--text-base)">
      </div>
      <div class="form-group">
        <label class="form-label">Current (incorrect) value</label>
        <input class="form-input" type="text" id="other-current"
          placeholder="What it currently shows" style="font-size:var(--text-base)">
      </div>
      <div class="form-group">
        <label class="form-label">Correct value</label>
        <input class="form-input" type="text" id="other-correct"
          placeholder="What it should say" style="font-size:var(--text-base)">
      </div>
      <div class="form-group">
        <label class="form-label">Additional context (optional)</label>
        <textarea class="form-textarea" id="cr-note-other"
          placeholder="Any extra detail for the director…"
          style="min-height:60px"></textarea>
      </div>`;
    this._showContext(html, 'other');
  },

  /* ════════════════════════════════════════
     OPEN / CLOSE
  ════════════════════════════════════════ */
  open(context = {}) {
    if (!document.getElementById('cr-overlay')) this.init();
    this._showPicker();
    document.getElementById('cr-overlay').classList.add('open');
    if (context.field) this._openField(context.field);
  },

  close() {
    const overlay = document.getElementById('cr-overlay');
    if (overlay) overlay.classList.remove('open');
  },

  /* ════════════════════════════════════════
     SUBMIT — collects values based on active field
  ════════════════════════════════════════ */
  async submit() {
    const session = Session.get();
    const field   = this._currentField;
    if (!field) { Toast.show('Please select what needs correcting.', 'warning'); return; }

    let correctValue  = '';
    let currentValue  = '';
    let note          = '';

    try {
      if (field === 'role') {
        const type = document.querySelector('[name="role-correction-type"]:checked')?.value;
        if (!type) { Toast.show('Please select what needs correcting about your role.', 'warning'); return; }
        if (type === 'wrong_dashboard_role') {
          correctValue = document.getElementById('role-new-value')?.value;
          currentValue = ROLE_LABELS[session.role] || session.role;
        } else if (type === 'wrong_project_role') {
          const proj = document.getElementById('role-project-select')?.value;
          const role = document.getElementById('role-project-role')?.value;
          correctValue = `${proj}: ${role}`;
          currentValue = `Project role on ${proj}`;
        } else if (type === 'add_project') {
          const proj = document.getElementById('role-add-project')?.value;
          const adhoc = document.getElementById('role-adhoc-name')?.value;
          const role  = document.getElementById('role-add-project-role')?.value;
          correctValue = `Add to project: ${proj === '__adhoc' ? adhoc : proj} as ${role}`;
          currentValue = 'Not currently assigned';
        }
        note = document.getElementById('cr-note-role')?.value || '';

      } else if (field === 'project') {
        const proj  = document.getElementById('proj-cr-select')?.value;
        const newN  = document.getElementById('proj-new-name')?.value;
        const issue = document.getElementById('proj-cr-issue')?.value;
        const role  = document.getElementById('proj-correct-role')?.value;
        if (!proj || !issue) { Toast.show('Please select a project and the issue.', 'warning'); return; }
        currentValue = proj === '__new' ? newN : proj;
        correctValue = issue === 'add_me' ? `Add ${session.name} to ${currentValue}`
          : issue === 'remove_me' ? `Remove ${session.name} from ${currentValue}`
          : `Correct role on ${currentValue} to: ${role}`;
        note = document.getElementById('cr-note-project')?.value || '';

      } else if (field === 'leave') {
        const type = document.getElementById('leave-cr-type')?.value;
        if (!type) { Toast.show('Please select the type of leave correction.', 'warning'); return; }
        if (type === 'missing') {
          const ltype = document.getElementById('leave-new-type')?.value;
          const start = document.getElementById('leave-new-start')?.value;
          const end   = document.getElementById('leave-new-end')?.value;
          const res   = document.getElementById('leave-resume')?.value;
          if (!start || !end) { Toast.show('Please enter the leave dates.', 'warning'); return; }
          currentValue = 'Missing entry';
          correctValue = `Add ${ltype}: ${start} to ${end}, resume ${res}`;
        } else {
          const ref  = document.getElementById('leave-ref')?.value;
          const corr = document.getElementById('leave-correct')?.value;
          if (!ref || !corr) { Toast.show('Please describe the entry and correction.', 'warning'); return; }
          currentValue = ref;
          correctValue = corr;
        }
        note = document.getElementById('cr-note-leave')?.value || '';

      } else if (field === 'expertise') {
        const selected = this._selectedTags || [];
        const original = session.expertise || [];
        if (JSON.stringify(selected.sort()) === JSON.stringify([...original].sort())) {
          Toast.show('No changes detected — select or deselect tags to make a correction.', 'warning');
          return;
        }
        currentValue = original.join(', ') || 'None';
        correctValue = selected.join(', ')  || 'None';
        note = document.getElementById('cr-note-expertise')?.value || '';

      } else if (field === 'availability') {
        const type = document.querySelector('[name="avail-type"]:checked')?.value;
        if (!type) { Toast.show('Please select what needs correcting.', 'warning'); return; }
        if (type === 'status_wrong') {
          currentValue = session.status || 'available';
          correctValue = document.getElementById('avail-correct-status')?.value;
        } else {
          const desc   = document.getElementById('avail-block-desc')?.value;
          currentValue = 'Schedule block';
          correctValue = desc;
        }
        note = document.getElementById('cr-note-avail')?.value || '';

      } else {
        const fname = document.getElementById('other-field-name')?.value;
        currentValue = document.getElementById('other-current')?.value;
        correctValue = document.getElementById('other-correct')?.value;
        note         = document.getElementById('cr-note-other')?.value || '';
        if (!fname || !correctValue) { Toast.show('Please fill in all required fields.', 'warning'); return; }
        this._currentField = fname;
      }

    } catch (err) {
      console.error('[ChangeRequest.submit] Error collecting values:', err);
      Toast.show('Something went wrong — please try again.', 'warning');
      return;
    }

    if (!correctValue) { Toast.show('Please complete the correction details.', 'warning'); return; }

    const request = {
      id:           `cr_${Date.now()}`,
      submittedBy:  session ? session.name   : 'Unknown',
      userId:       session ? session.userId : null,
      field:        this._currentField,
      fieldLabel:   this._FIELDS.find(f => f.key === field)?.label || field,
      currentValue,
      correctValue,
      note,
      status:      'pending',
      submittedAt: new Date().toISOString(),
    };

    /* Always write to localStorage — admin panel reads from here */
    const queue = JSON.parse(localStorage.getItem('bopinc_cr_queue') || '[]');
    queue.push(request);
    localStorage.setItem('bopinc_cr_queue', JSON.stringify(queue));

    /* Also push to Sheets if configured */
    try {
      if (typeof SheetsClient !== 'undefined' &&
          typeof SHEETS_CONFIG !== 'undefined' &&
          SHEETS_CONFIG.APPS_SCRIPT_URL &&
          SHEETS_CONFIG.APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
        await SheetsClient.append(SHEETS_CONFIG.TABS.PENDING_CHANGES, request);
      }
    } catch (_) {}

    /* Notify admin tab if open */
    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'bopinc_cr_queue', newValue: JSON.stringify(queue),
      }));
    } catch (_) {}

    /* Success state */
    document.getElementById('cr-submitted-msg').style.display = 'block';
    document.getElementById('cr-step-context').style.display  = 'none';
    document.getElementById('cr-back-btn').style.display      = 'none';
    const submitBtn = document.getElementById('cr-submit-btn');
    submitBtn.disabled   = true;
    submitBtn.textContent = 'Submitted ✓';

    setTimeout(() => this.close(), 2800);
  },
};

function attachRequestButtons(container) {
  if (!container) return;
  container.querySelectorAll('[data-request-field]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      ChangeRequest.open({
        field:        btn.getAttribute('data-request-field'),
        currentValue: btn.getAttribute('data-request-value') || '',
      });
    });
  });
}