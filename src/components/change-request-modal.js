/* ============================================================
   BOPinc Nigeria Dashboard — Change Request Modal
   Team members submit correction requests here.
   In phase 2 this writes to the Sheets pending-changes tab.
   ============================================================ */

const ChangeRequest = {
  /* Render the modal HTML into the DOM */
  init() {
    const overlay = document.createElement('div');
    overlay.id = 'change-request-overlay';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'cr-title');
    overlay.innerHTML = `
      <div class="modal" id="change-request-modal">
        <div class="modal-drag-handle" aria-hidden="true"></div>
        <h2 class="modal-title" id="cr-title">Request a correction</h2>
        <p class="modal-subtitle">
          Your request will be reviewed by the country director.
          You'll see the status update on your next login.
        </p>

        <div class="form-group">
          <label class="form-label" for="cr-field">What needs correcting?</label>
          <select class="form-select" id="cr-field">
            <option value="">Select a field…</option>
            <option value="project_assignment">Project assignment</option>
            <option value="expertise_tag">Expertise / sector tag</option>
            <option value="leave_record">Leave record</option>
            <option value="team_details">Team member details</option>
            <option value="relationship_link">Working relationship link</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="cr-current">Current (incorrect) value</label>
          <input class="form-input" type="text" id="cr-current" placeholder="What it currently shows…">
        </div>

        <div class="form-group">
          <label class="form-label" for="cr-correct">Correct value</label>
          <input class="form-input" type="text" id="cr-correct" placeholder="What it should show…">
        </div>

        <div class="form-group">
          <label class="form-label" for="cr-note">Additional context <span style="color:var(--color-text-tertiary);font-weight:400">(optional)</span></label>
          <textarea class="form-textarea" id="cr-note" placeholder="Any extra detail that helps the director review this…" style="min-height:80px"></textarea>
        </div>

        <div id="cr-status" style="display:none" class="alert alert-success mb-4" role="status">
          <span class="alert-icon">✓</span>
          <div class="alert-body">
            <div class="alert-title">Request submitted</div>
            <div>The country director will review this shortly.</div>
          </div>
        </div>

        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-5)">
          <button class="btn btn-secondary btn-full" id="cr-cancel">Cancel</button>
          <button class="btn btn-primary btn-full" id="cr-submit">Submit request</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    /* Close on overlay click */
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    document.getElementById('cr-cancel').addEventListener('click', () => this.close());
    document.getElementById('cr-submit').addEventListener('click', () => this.submit());

    /* Keyboard: Escape closes */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) this.close();
    });
  },

  /* Open with optional pre-fill context */
  open(context = {}) {
    const overlay = document.getElementById('change-request-overlay');
    if (!overlay) return;

    /* Pre-fill field dropdown if context provided */
    if (context.field) {
      const sel = document.getElementById('cr-field');
      if (sel) sel.value = context.field;
    }
    if (context.currentValue) {
      document.getElementById('cr-current').value = context.currentValue;
    }

    /* Reset status */
    document.getElementById('cr-status').style.display = 'none';
    document.getElementById('cr-submit').disabled = false;
    document.getElementById('cr-submit').textContent = 'Submit request';

    overlay.classList.add('open');
    document.getElementById('cr-field').focus();
  },

  close() {
    const overlay = document.getElementById('change-request-overlay');
    if (overlay) overlay.classList.remove('open');
  },

  async submit() {
    const session = Session.get();
    const field   = document.getElementById('cr-field').value;
    const current = document.getElementById('cr-current').value.trim();
    const correct = document.getElementById('cr-correct').value.trim();
    const note    = document.getElementById('cr-note').value.trim();

    if (!field || !correct) {
      Toast.show('Please fill in the required fields.', 'warning');
      return;
    }

    const request = {
      id:          `cr_${Date.now()}`,
      submittedBy: session ? session.name : 'Unknown',
      userId:      session ? session.userId : null,
      field,
      currentValue: current,
      correctValue: correct,
      note,
      status:      'pending',
      submittedAt: new Date().toISOString(),
    };

    /* Phase 2: POST to Sheets pending-changes tab via SheetsClient */
    /* Falls back to localStorage if Apps Script URL not yet configured */
    const result = await SheetsClient.append(SHEETS_CONFIG.TABS.PENDING_CHANGES, request);

    if (!result.success && !result.fallback) {
      Toast.show('Could not submit request — saved locally instead.', 'warning');
    }

    /* Show confirmation */
    document.getElementById('cr-status').style.display = 'flex';
    document.getElementById('cr-submit').disabled = true;
    document.getElementById('cr-submit').textContent = 'Submitted';

    /* Auto-close after 2.5s */
    setTimeout(() => this.close(), 2500);
  },
};

/* ── Global helper: attach "request correction" buttons ── */
function attachRequestButtons(container) {
  container.querySelectorAll('[data-request-field]').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.getAttribute('data-request-field');
      const currentValue = btn.getAttribute('data-request-value') || '';
      ChangeRequest.open({ field, currentValue });
    });
  });
}