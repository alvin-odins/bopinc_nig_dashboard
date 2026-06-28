/* ============================================================
   BOPinc Nigeria Dashboard — Project Card Component
   
   Renders a project card from a Sheets projects row.
   Used on: pages/projects.html (Phase 2), home page summary.
   
   Data shape (from Sheets projects tab):
   { id, name, status, startDate, endDate, sector, lead,
     teamMembers, description, health, projectCode, accountManager }
   ============================================================ */

const ProjectCard = {

  /* Status config */
  STATUS: {
    active:    { label: 'Active',     badge: 'badge-green', dot: 'var(--color-success)' },
    'at-risk': { label: 'At risk',    badge: 'badge-amber', dot: 'var(--color-warning)' },
    delayed:   { label: 'Delayed',    badge: 'badge-amber', dot: 'var(--color-warning)' },
    blocked:   { label: 'Blocked',    badge: 'badge-red',   dot: 'var(--color-danger)'  },
    completed: { label: 'Completed',  badge: 'badge-slate', dot: 'var(--color-text-tertiary)' },
    pipeline:  { label: 'Pipeline',   badge: 'badge-blue',  dot: 'var(--color-info)'    },
  },

  /* Health bar color */
  _healthColor(score) {
    const n = parseInt(score, 10) || 0;
    if (n >= 75) return 'var(--color-success)';
    if (n >= 50) return 'var(--color-warning)';
    return 'var(--color-danger)';
  },

  /* Avatar initials from a name string */
  _initials(name) {
    return (name || '').trim().split(' ')
      .map(w => w[0]).join('').slice(0, 2).toUpperCase();
  },

  /* ── Render a single project card ── */
  render(project, teamRoster = []) {
    const status    = this.STATUS[project.status] || this.STATUS['active'];
    const members   = SheetsClient.parseTeamMembers(project.teamMembers || '');
    const health    = parseInt(project.health, 10) || 0;
    const startFmt  = SheetsClient.formatDate(project.startDate);
    const endFmt    = SheetsClient.formatDate(project.endDate);

    /* Store project in memory store keyed by id so onclick can look it up safely */
    const projectId = project.id || `proj_${Date.now()}`;
    ProjectCard._store = ProjectCard._store || {};
    ProjectCard._store[projectId] = { project, teamRoster };

    /* Match team member names to roster for availability dots */
    const memberDetails = members.map((m, i) => {
      const rosterMatch = teamRoster.find(r =>
        r.name && r.name.toLowerCase().includes(m.name.toLowerCase())
      );
      return {
        ...m,
        initials:    rosterMatch?.initials || this._initials(m.name),
        colorClass:  i % 8,
        isOnLeave:   rosterMatch?.status === 'leave',
        isAvailable: rosterMatch?.status === 'available',
      };
    });

    const teamHtml = memberDetails.slice(0, 5).map(m => `
      <div title="${m.name} — ${m.role || 'Team member'}"
        style="position:relative;width:26px;height:26px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font-size:9px;font-weight:600;color:white;
          border:2px solid var(--color-surface);margin-left:-6px;
          flex-shrink:0;cursor:default"
        class="avatar-${m.colorClass}">
        ${m.initials}
        <span style="position:absolute;bottom:-1px;right:-1px;
          width:8px;height:8px;border-radius:50%;
          background:${m.isOnLeave ? 'var(--color-danger)' : m.isAvailable ? 'var(--color-success)' : 'var(--color-warning)'};
          border:1px solid var(--color-surface)"></span>
      </div>
    `).join('');

    const extraMembers = members.length > 5
      ? `<div style="width:26px;height:26px;border-radius:50%;
           background:var(--color-surface-2);border:2px solid var(--color-surface);
           margin-left:-6px;display:flex;align-items:center;justify-content:center;
           font-size:9px;color:var(--color-text-secondary);font-weight:500;flex-shrink:0">
           +${members.length - 5}
         </div>` : '';

    return `
      <div class="card" data-project-id="${projectId}"
        style="margin-bottom:var(--space-4);cursor:pointer;
          transition:box-shadow var(--transition-fast),transform var(--transition-fast)"
        onmouseenter="this.style.boxShadow='var(--shadow-md)';this.style.transform='translateY(-1px)'"
        onmouseleave="this.style.boxShadow='';this.style.transform=''"
        role="button" tabindex="0">

        <!-- Card header -->
        <div class="card-header">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <div class="card-title" style="font-size:var(--text-base)">${project.name}</div>
              <span class="badge ${status.badge}" style="font-size:10px">${status.label}</span>
              ${project.projectCode ? `
                <span style="font-size:10px;font-family:var(--font-mono);
                  color:var(--color-text-tertiary);background:var(--color-surface-2);
                  padding:2px 6px;border-radius:4px">${project.projectCode}</span>` : ''}
            </div>
            <div class="card-subtitle" style="margin-top:3px">
              ${project.sector ? `<span class="badge badge-blue" style="font-size:10px;margin-right:4px">${project.sector}</span>` : ''}
              ${startFmt} → ${endFmt}
            </div>
          </div>
          <div style="flex-shrink:0;text-align:right">
            <button class="btn-request"
              title="Request correction" aria-label="Request correction for ${project.name}"
              data-cr-field="project_assignment" data-cr-value="${project.name}">
              ${getIcon('edit', 12)}
            </button>
          </div>
        </div>

        <!-- Card body -->
        <div class="card-body" style="padding:var(--space-3) var(--space-5)">
          ${project.description ? `
            <div style="font-size:var(--text-sm);color:var(--color-text-secondary);
              margin-bottom:var(--space-3);
              display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
              ${project.description}
            </div>` : ''}

          <div style="display:flex;align-items:center;gap:var(--space-4);flex-wrap:wrap;
            margin-bottom:var(--space-3)">
            ${project.lead ? `
              <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
                <span style="font-weight:500;color:var(--color-text-primary)">Lead:</span>
                ${project.lead}
              </div>` : ''}
            ${project.accountManager ? `
              <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
                <span style="font-weight:500;color:var(--color-text-primary)">AM:</span>
                ${project.accountManager}
              </div>` : ''}
          </div>

          ${members.length > 0 ? `
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-3)">
              <div style="display:flex;align-items:center;margin-left:6px">
                ${teamHtml}${extraMembers}
              </div>
              <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
                ${members.length} team member${members.length !== 1 ? 's' : ''}
              </div>
            </div>` : ''}

          ${health > 0 ? `
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:var(--text-xs);color:var(--color-text-secondary)">Project health</span>
                <span style="font-size:var(--text-xs);font-weight:500;color:${this._healthColor(health)}">${health}%</span>
              </div>
              <div style="height:4px;background:var(--color-surface-2);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${health}%;background:${this._healthColor(health)};
                  border-radius:2px;transition:width 0.6s ease"></div>
              </div>
            </div>` : ''}
        </div>
      </div>
    `;
  },

  /* ── Render a list of projects ── */
  renderAll(projects, teamRoster = [], containerId = 'projects-list') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="coming-soon">
          <div class="coming-soon-icon">📁</div>
          <div class="coming-soon-title">No projects yet</div>
          <p>Add the first project in the admin panel.</p>
        </div>`;
      return;
    }

    container.innerHTML = projects.map(p => this.render(p, teamRoster)).join('');

    /* Wire click events via addEventListener — safe, no data in onclick attrs */
    container.querySelectorAll('[data-project-id]').forEach(card => {
      const id    = card.dataset.projectId;
      const store = ProjectCard._store && ProjectCard._store[id];
      if (!store) return;

      /* Card click → open detail */
      card.addEventListener('click', (e) => {
        /* Don't fire if the correction button was clicked */
        if (e.target.closest('[data-cr-field]')) return;
        const memberDetails = ProjectCard._buildMemberDetails(store.project, store.teamRoster);
        ProjectCard.openDetail(store.project, memberDetails);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') card.click();
      });

      /* Correction button */
      const crBtn = card.querySelector('[data-cr-field]');
      if (crBtn) {
        crBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof ChangeRequest !== 'undefined') {
            ChangeRequest.open({
              field: crBtn.dataset.crField,
              currentValue: crBtn.dataset.crValue,
            });
          }
        });
      }
    });
  },

  /* Build member details array from project + roster */
  _buildMemberDetails(project, teamRoster = []) {
    const members = SheetsClient.parseTeamMembers(project.teamMembers || '');
    return members.map((m, i) => {
      const rosterMatch = teamRoster.find(r =>
        r.name && r.name.toLowerCase().includes(m.name.toLowerCase())
      );
      return {
        ...m,
        initials:    rosterMatch?.initials || ProjectCard._initials(m.name),
        colorClass:  i % 8,
        isOnLeave:   rosterMatch?.status === 'leave',
        isAvailable: rosterMatch?.status === 'available',
      };
    });
  },

  /* ── Open project detail modal ── */
  openDetail(project, memberDetails = []) {
    const existing = document.getElementById('project-detail-overlay');
    if (existing) existing.remove();

    const status = this.STATUS[project.status] || this.STATUS['active'];
    const health = parseInt(project.health, 10) || 0;

    const teamHtml = memberDetails.map(m => `
      <div style="display:flex;align-items:center;gap:10px;padding:6px 0;
        border-bottom:1px solid var(--color-border)">
        <div class="avatar avatar-sm avatar-${m.colorClass}"
          style="width:30px;height:30px;font-size:11px;flex-shrink:0">${m.initials}</div>
        <div style="flex:1">
          <div style="font-size:var(--text-sm);font-weight:500">${m.name}</div>
          <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">${m.role}</div>
        </div>
        <span class="badge ${m.isOnLeave ? 'badge-red' : m.isAvailable ? 'badge-green' : 'badge-amber'}"
          style="font-size:10px">${m.isOnLeave ? 'On leave' : m.isAvailable ? 'Available' : 'Busy'}</span>
      </div>
    `).join('');

    const overlay = document.createElement('div');
    overlay.id = 'project-detail-overlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', project.name);

    overlay.innerHTML = `
      <div class="modal" style="max-width:560px">
        <div class="modal-drag-handle"></div>

        <!-- Header -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;
          margin-bottom:var(--space-4)">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
              <h2 style="font-size:var(--text-xl);font-weight:600;margin:0">${project.name}</h2>
              <span class="badge ${status.badge}">${status.label}</span>
            </div>
            ${project.projectCode ? `<div style="font-family:var(--font-mono);font-size:var(--text-xs);
              color:var(--color-text-tertiary)">${project.projectCode}</div>` : ''}
          </div>
          <button onclick="document.getElementById('project-detail-overlay').classList.remove('open')"
            style="background:var(--color-surface-2);border:none;border-radius:50%;
              width:28px;height:28px;cursor:pointer;font-size:16px;display:flex;
              align-items:center;justify-content:center;color:var(--color-text-secondary);
              flex-shrink:0;margin-left:12px"
            aria-label="Close">✕</button>
        </div>

        <!-- Sector + dates -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);
          margin-bottom:var(--space-4)">
          ${[
            ['Sector', project.sector || '—'],
            ['Lead', project.lead || '—'],
            ['Account manager', project.accountManager || '—'],
            ['Duration', `${SheetsClient.formatDate(project.startDate)} → ${SheetsClient.formatDate(project.endDate)}`],
          ].map(([label, value]) => `
            <div style="padding:10px 12px;background:var(--color-surface-2);
              border-radius:var(--radius-md)">
              <div style="font-size:10px;font-weight:500;color:var(--color-text-secondary);
                text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${label}</div>
              <div style="font-size:var(--text-sm);font-weight:500">${value}</div>
            </div>
          `).join('')}
        </div>

        <!-- Description -->
        ${project.description ? `
          <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
            text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">About this project</div>
          <div style="font-size:var(--text-sm);margin-bottom:var(--space-4);
            padding:10px 12px;background:var(--color-surface-2);border-radius:var(--radius-md)">
            ${project.description}
          </div>` : ''}

        <!-- Health -->
        ${health > 0 ? `
          <div style="margin-bottom:var(--space-4)">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
                text-transform:uppercase;letter-spacing:.06em">Project health</span>
              <span style="font-size:var(--text-sm);font-weight:600;
                color:${ProjectCard._healthColor(health)}">${health}%</span>
            </div>
            <div style="height:6px;background:var(--color-surface-2);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${health}%;background:${ProjectCard._healthColor(health)};
                border-radius:3px"></div>
            </div>
          </div>` : ''}

        <!-- Team -->
        ${memberDetails.length > 0 ? `
          <div style="font-size:var(--text-xs);font-weight:500;color:var(--color-text-secondary);
            text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Team</div>
          <div style="margin-bottom:var(--space-4);max-height:200px;overflow-y:auto">${teamHtml}</div>` : ''}

        <!-- Request correction -->
        <div style="padding-top:var(--space-3);border-top:1px solid var(--color-border)">
          <button class="btn btn-secondary btn-sm"
            onclick="ChangeRequest.open({field:'project_assignment',currentValue:'${project.name}'})">
            ${getIcon('edit', 14)} Request a correction
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
    requestAnimationFrame(() => overlay.classList.add('open'));
  },
};