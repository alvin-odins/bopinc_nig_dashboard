/* ============================================================
   BOPinc Nigeria Dashboard — Change Request Modal

   Fixes applied:
   1. Storage: always writes to localStorage 'bopinc_cr_queue'
      so admin panel can read it. SheetsClient.append used when
      Apps Script is configured, but localStorage is ALWAYS
      written as the local source of truth.
   2. UX: dropdown selection auto-populates current value from
      live session data and shows a context-appropriate input
      for the correction value.
   ============================================================ */

const ChangeRequest = {

  /* ── Field definitions ──
     Each field knows its label, how to get the current value,
     and what kind of input to show for the correction.
  ── */
  FIELDS: {
    project_assignment: {
      label:       'Project assignment',
      currentFn:   () => {
        const session = Session.get();
        return session ? `${session.name} is currently assigned to projects listed on the Projects page` : '';
      },
      inputType:   'text',
      placeholder: 'Which project should you be added to or removed from?',
      hint:        'e.g. "Add me to WASH-NG Phase 2" or "Remove me from Energy-NG-24"',
    },
    expertise_tag: {
      label:       'Expertise / sector tag',
      currentFn:   () => {
        const session = Session.get();
        return session && session.expertise && session.expertise.length
          ? session.expertise.join(', ')
          : 'Not set';
      },
      inputType:   'select',
      options:     ['energy', 'agriculture', 'health', 'wash', 'education',
                    'finance', 'livelihoods', 'gender', 'monitoring', 'data',
                    'strategy', 'partnerships'],
      placeholder: 'Select the correct sector',
      hint:        'Select all that apply — you can list multiple separated by commas',
      multi:       true,
    },
    leave_record: {
      label:       'Leave record',
      currentFn:   () => 'Check your leave entries on the Leave tracker page',
      inputType:   'text',
      placeholder: 'e.g. "Annual leave 14–18 Jul 2025 is missing"',
      hint:        'Include the leave type, start date, and end date',
    },
    name_spelling: {
      label:       'Name spelling',
      currentFn:   () => {
        const session = Session.get();
        return session ? session.name : '';
      },
      inputType:   'text',
      placeholder: 'Correct spelling of your name',
      hint:        '',
    },
    role_title: {
      label:       'Role / job title',
      currentFn:   () => {
        const session = Session.get();
        return session ? (ROLE_LABELS[session.role] || session.role) : '';
      },
      inputType:   'select',
      options:     ['team_member', 'partnerships_lead', 'country_director'],
      optionLabels: ['Team member', 'Partnerships lead', 'Country director'],
      placeholder: 'Select your correct role',
      hint:        'Role changes require country director approval',
    },
    availability_status: {
      label:       'Availability status',
      currentFn:   () => 'Check your current status in the Team availability panel',
      inputType:   'select',
      options:     ['available', 'busy', 'leave', 'offline'],
      optionLabels: ['Available', 'In meetings / busy', 'On leave', 'Offline'],
      placeholder: 'Select your correct status',
      hint:        '',
    },
    other: {
      label:       'Something else',
      currentFn:   () => '',
      inputType:   'text',
      placeholder: 'Describe what the correct value should be',
      hint:        '',
    },
  },

  /* ── Initialise — inject modal HTML into DOM ── */
  init() {
    if (document.getElementById('change-request-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'change-request-overlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'cr-title');

    overlay.innerHTML = `
      <div class="modal" id="change-request-modal" style="max-width:500px">
        <div class="modal-drag-handle" aria-hidden="true"></div>
        <h2 class="modal-title" id="cr-title">Request a correction</h2>
        <p class="modal-subtitle">
          Select what needs correcting. We'll show you the current value
          and ask for the right one. Your request goes to the country director.
        </p>

        <!-- Step 1: field selector -->
        <div class="form-group" id="cr-step-1">
          <label class="form-label" for="cr-field">What needs correcting?</label>
          <div id="cr-field-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">
            <!-- Populated by JS -->
          </div>
        </div>

        <!-- Step 2: current + correction (shown after field selected) -->
        <div id="cr-step-2" style="display:none">

          <!-- Current value (read-only, auto-populated) -->
          <div class="form-group" id="cr-current-group">
            <label class="form-label">Current value on file</label>
            <div id="cr-current-display"
              style="padding:var(--space-3) var(--space-3);
                background:var(--color-surface-2);border-radius:var(--radius-md);
                border:1px solid var(--color-border);font-size:var(--text-sm);
                color:var(--color-text-secondary);min-height:40px;
                display:flex;align-items:center">
              —
            </div>
          </div>

          <!-- Correction input (dynamic) -->
          <div class="form-group" id="cr-correct-group">
            <label class="form-label" for="cr-correct-input" id="cr-correct-label">
              What should it be?
            </label>
            <div id="cr-correct-input-container">
              <!-- Populated dynamically based on field type -->
            </div>
            <div id="cr-hint"
              style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-top:6px">
            </div>
          </div>

          <!-- Optional note -->
          <div class="form-group">
            <label class="form-label" for="cr-note">
              Additional context
              <span style="color:var(--color-text-tertiary);font-weight:400">(optional)</span>
            </label>
            <textarea class="form-textarea" id="cr-note"
              placeholder="Any extra detail that helps the director decide…"
              style="min-height:70px"></textarea>
          </div>

          <!-- Change field link -->
          <div style="margin-bottom:var(--space-4)">
            <button id="cr-change-field"
              style="font-size:var(--text-xs);color:var(--color-accent);
                background:none;border:none;cursor:pointer;padding:0;text-decoration:underline">
              ← Choose a different field
            </button>
          </div>
        </div>

        <!-- Status (shown after submit) -->
        <div id="cr-status" style="display:none"
          class="alert alert-success mb-4" role="status">
          <span class="alert-icon">✓</span>
          <div class="alert-body">
            <div class="alert-title">Request submitted</div>
            <div>The country director will review this shortly.</div>
          </div>
        </div>

        <!-- Actions -->
        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
          <button class="btn btn-secondary btn-full" id="cr-cancel">Cancel</button>
          <button class="btn btn-primary btn-full" id="cr-submit"
            style="display:none">Submit request</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    /* Wire static events */
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
    document.getElementById('cr-cancel').addEventListener('click', () => this.close());
    document.getElementById('cr-submit').addEventListener('click', () => this.submit());
    document.getElementById('cr-change-field').addEventListener('click', () => this._showStep1());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) this.close();
    });

    /* Render field picker */
    this._renderFieldPicker();
  },

  /* ── Render the field picker grid ── */
  _renderFieldPicker() {
    const grid = document.getElementById('cr-field-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(this.FIELDS).map(([key, def]) => `
      <button class="cr-field-btn" data-field="${key}"
        style="display:flex;align-items:center;gap:8px;padding:10px 12px;
          border:1px solid var(--color-border);border-radius:var(--radius-md);
          background:var(--color-surface);cursor:pointer;font-size:var(--text-sm);
          font-weight:var(--weight-medium);color:var(--color-text-primary);
          text-align:left;transition:all var(--transition-fast);width:100%"
        onmouseenter="this.style.borderColor='var(--color-accent)';this.style.background='var(--color-accent-light)'"
        onmouseleave="this.style.borderColor='var(--color-border)';this.style.background='var(--color-surface)'">
        ${def.label}
      </button>
    `).join('');

    grid.querySelectorAll('.cr-field-btn').forEach(btn => {
      btn.addEventListener('click', () => this._selectField(btn.dataset.field));
    });
  },

  /* ── User selects a field ── */
  _selectField(fieldKey) {
    const def = this.FIELDS[fieldKey];
    if (!def) return;

    this._currentField = fieldKey;

    /* Populate current value */
    const currentDisplay = document.getElementById('cr-current-display');
    const currentValue   = def.currentFn();
    currentDisplay.textContent = currentValue || 'Not set / unavailable';
    this._currentValue = currentValue;

    /* Build correction input */
    const container = document.getElementById('cr-correct-input-container');
    const hint      = document.getElementById('cr-hint');

    if (def.inputType === 'select' && def.options) {
      container.innerHTML = `
        <select class="form-select" id="cr-correct-input" style="font-size:var(--text-base)">
          <option value="">${def.placeholder}</option>
          ${def.options.map((opt, i) => `
            <option value="${opt}">${def.optionLabels ? def.optionLabels[i] : opt}</option>
          `).join('')}
        </select>
        ${def.multi ? `
          <div style="margin-top:8px;font-size:var(--text-xs);color:var(--color-text-secondary)">
            Need multiple? Add a note below listing all that apply.
          </div>` : ''}
      `;
    } else {
      container.innerHTML = `
        <input class="form-input" type="text" id="cr-correct-input"
          placeholder="${def.placeholder}"
          style="font-size:var(--text-base)">
      `;
    }

    hint.textContent = def.hint || '';

    /* Show step 2, hide step 1 */
    document.getElementById('cr-step-1').style.display = 'none';
    document.getElementById('cr-step-2').style.display = 'block';
    document.getElementById('cr-submit').style.display = 'block';

    /* Focus the correction input */
    setTimeout(() => {
      document.getElementById('cr-correct-input')?.focus();
    }, 50);
  },

  _showStep1() {
    document.getElementById('cr-step-1').style.display = 'block';
    document.getElementById('cr-step-2').style.display = 'none';
    document.getElementById('cr-submit').style.display = 'none';
    document.getElementById('cr-note').value = '';
    this._currentField = null;
  },

  /* ── Open the modal ── */
  open(context = {}) {
    const overlay = document.getElementById('change-request-overlay');
    if (!overlay) { this.init(); }

    /* Reset to clean state */
    this._showStep1();
    document.getElementById('cr-status').style.display = 'none';
    document.getElementById('cr-submit').disabled  = false;
    document.getElementById('cr-submit').textContent = 'Submit request';

    /* If a field was pre-specified (e.g. from a card button), jump straight to step 2 */
    if (context.field && this.FIELDS[context.field]) {
      this._selectField(context.field);
      /* Override current value if explicitly provided */
      if (context.currentValue) {
        const display = document.getElementById('cr-current-display');
        if (display) display.textContent = context.currentValue;
        this._currentValue = context.currentValue;
      }
    }

    document.getElementById('change-request-overlay').classList.add('open');
  },

  close() {
    const overlay = document.getElementById('change-request-overlay');
    if (overlay) overlay.classList.remove('open');
  },

  /* ── Submit ── */
  async submit() {
    const session = Session.get();
    const field   = this._currentField;
    const correctEl = document.getElementById('cr-correct-input');
    const correct = correctEl ? correctEl.value.trim() : '';
    const note    = (document.getElementById('cr-note')?.value || '').trim();

    if (!field) {
      Toast.show('Please select what needs correcting.', 'warning');
      return;
    }
    if (!correct) {
      Toast.show('Please enter the correct value.', 'warning');
      correctEl?.focus();
      return;
    }

    const request = {
      id:           `cr_${Date.now()}`,
      submittedBy:  session ? session.name  : 'Unknown',
      userId:       session ? session.userId : null,
      field,
      fieldLabel:   this.FIELDS[field]?.label || field,
      currentValue: this._currentValue || '',
      correctValue: correct,
      note,
      status:       'pending',
      submittedAt:  new Date().toISOString(),
    };

    /* ── ALWAYS write to localStorage first (admin panel reads from here) ── */
    const queue = JSON.parse(localStorage.getItem('bopinc_cr_queue') || '[]');
    queue.push(request);
    localStorage.setItem('bopinc_cr_queue', JSON.stringify(queue));

    /* ── Also push to Sheets if Apps Script is configured ── */
    try {
      if (typeof SheetsClient !== 'undefined' &&
          typeof SHEETS_CONFIG !== 'undefined' &&
          SHEETS_CONFIG.APPS_SCRIPT_URL &&
          SHEETS_CONFIG.APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
        await SheetsClient.append(SHEETS_CONFIG.TABS.PENDING_CHANGES, request);
      }
    } catch (err) {
      console.warn('[ChangeRequest] Sheets write failed — saved locally only:', err);
    }

    /* Show confirmation */
    document.getElementById('cr-status').style.display = 'flex';
    const submitBtn = document.getElementById('cr-submit');
    submitBtn.disabled   = true;
    submitBtn.textContent = 'Submitted ✓';

    /* Update admin badge if the admin panel is open in another tab (best effort) */
    try {
      const ev = new StorageEvent('storage', {
        key: 'bopinc_cr_queue', newValue: JSON.stringify(queue),
      });
      window.dispatchEvent(ev);
    } catch (_) {}

    setTimeout(() => this.close(), 2500);
  },
};

/* ── Global helper: attach request-correction buttons to a container ── */
function attachRequestButtons(container) {
  if (!container) return;
  container.querySelectorAll('[data-request-field]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      ChangeRequest.open({
        field:        btn.getAttribute('data-request-field'),
        currentValue: btn.getAttribute('data-request-value') || '',
      });
    });
  });
}