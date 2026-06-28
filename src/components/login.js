/* ============================================================
   BOPinc Nigeria Dashboard — Login Manager
   
   Phase 2: validates against users-roles Sheets tab.
   Phase 1 demo role-switcher is removed and replaced by this.
   
   Flow:
   1. User opens dashboard → Login.check() runs
   2. If no valid session → show login modal
   3. User enters email + password → matched against users-roles tab
   4. On success → Session.set() with real user data → dismiss modal
   5. On reload → session restored from sessionStorage (TTL: 8 hours)
   ============================================================ */

const Login = {

  SESSION_TTL: 8 * 60 * 60 * 1000, /* 8 hours */

  /* ── Check if user is logged in, show login if not ── */
  async check() {
    const session = Session.get();
    const loginTime = session ? parseInt(sessionStorage.getItem('bopinc_login_ts') || '0', 10) : 0;
    const expired   = Date.now() - loginTime > this.SESSION_TTL;

    if (!session || expired) {
      Session.clear();
      this._showModal();
      return false;
    }
    return true;
  },

  /* ── Show the login modal ── */
  _showModal() {
    const existing = document.getElementById('login-overlay');
    if (existing) { existing.style.display = 'flex'; return; }

    const overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.style.cssText = `
      position:fixed;inset:0;background:var(--green-950);
      display:flex;align-items:center;justify-content:center;
      z-index:9999;padding:var(--space-4);
    `;

    overlay.innerHTML = `
      <div style="background:var(--color-surface);border-radius:var(--radius-xl);
        padding:var(--space-8);width:100%;max-width:380px;box-shadow:var(--shadow-lg)">

        <!-- Logo -->
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
          <div style="width:40px;height:40px;background:var(--color-accent);border-radius:var(--radius-md);
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:var(--text-base);font-weight:600">BO</div>
          <div>
            <div style="font-size:var(--text-lg);font-weight:600;color:var(--color-text-primary)">BOPinc Nigeria</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">Team Intelligence Dashboard</div>
          </div>
        </div>

        <!-- Form -->
        <div id="login-error" style="display:none;margin-bottom:var(--space-4);
          padding:var(--space-3) var(--space-4);background:var(--color-danger-bg);
          border-left:3px solid var(--color-danger);border-radius:var(--radius-md);
          font-size:var(--text-sm);color:var(--color-danger)">
        </div>

        <div class="form-group">
          <label class="form-label" for="login-email">Work email</label>
          <input class="form-input" type="email" id="login-email"
            placeholder="you@bopinc.org" autocomplete="email"
            onkeydown="if(event.key==='Enter')document.getElementById('login-password').focus()">
        </div>

        <div class="form-group">
          <label class="form-label" for="login-password">Password</label>
          <input class="form-input" type="password" id="login-password"
            placeholder="Your dashboard password"
            onkeydown="if(event.key==='Enter')Login.submit()">
        </div>

        <button class="btn btn-primary btn-full" id="login-btn" onclick="Login.submit()"
          style="margin-top:var(--space-2)">
          Sign in
        </button>

        <div style="margin-top:var(--space-4);font-size:var(--text-xs);
          color:var(--color-text-secondary);text-align:center">
          Forgot your password? Contact the country director.
        </div>

        <!-- Phase 2 note — remove before production -->
        <div id="login-dev-note" style="margin-top:var(--space-4);padding:var(--space-3);
          background:var(--amber-50);border-radius:var(--radius-md);
          font-size:var(--text-xs);color:var(--amber-900)">
          <strong>Setup required:</strong> Add team emails and passwords to the
          <code style="font-size:10px">users-roles</code> Sheets tab, then set your
          Sheets ID in <code style="font-size:10px">config/sheets-config.js</code>.
          Until then, use the demo bypass below.
          <br><br>
          <button onclick="Login._demoBypass()" style="font-size:11px;color:var(--color-accent);
            background:none;border:none;cursor:pointer;text-decoration:underline;padding:0">
            Demo bypass (dev only)
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('login-email')?.focus(), 100);
  },

  /* ── Submit login ── */
  async submit() {
    const email    = document.getElementById('login-email')?.value?.trim()?.toLowerCase();
    const password = document.getElementById('login-password')?.value;
    const btn      = document.getElementById('login-btn');
    const errorEl  = document.getElementById('login-error');

    if (!email || !password) {
      this._showError('Please enter your email and password.');
      return;
    }

    /* Loading state */
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }
    if (errorEl) errorEl.style.display = 'none';

    try {
      /* Fetch users-roles tab from Sheets */
      const users = await SheetsClient.get(SHEETS_CONFIG.TABS.USERS_ROLES);

      /* Find user by email */
      const user = users.find(u => (u.email || '').toLowerCase() === email);

      if (!user) {
        this._showError('No account found for that email address.');
        return;
      }

      /* Password check — Phase 2 uses plain-text match in Sheets.
         Phase 4 upgrade: hash passwords with bcrypt server-side via Apps Script. */
      const passwordCol = user.password || user.Password || '';
      if (passwordCol !== password) {
        this._showError('Incorrect password. Contact the country director if you need a reset.');
        return;
      }

      /* Success — set session */
      const session = {
        userId:    user.id || user.Id || email,
        name:      user.name || user.Name || email,
        initials:  user.initials || user.Initials || email.slice(0, 2).toUpperCase(),
        role:      user.role || user.Role || ROLES.TEAM_MEMBER,
        expertise: SheetsClient.parseExpertise(user.expertise || ''),
        email,
        loginTime: Date.now(),
      };

      sessionStorage.setItem('bopinc_session', JSON.stringify(session));
      sessionStorage.setItem('bopinc_login_ts', Date.now().toString());

      /* Update last login in Sheets (best-effort, non-blocking) */
      SheetsClient.update(
        SHEETS_CONFIG.TABS.USERS_ROLES,
        session.userId,
        { lastLogin: new Date().toISOString() }
      ).catch(() => {});

      /* Dismiss modal and boot the dashboard */
      this._dismissModal();
      if (typeof bootDashboard === 'function') bootDashboard(session);

    } catch (err) {
      console.error('[Login] Error during login:', err);
      this._showError('Could not reach the server. Check your connection and try again.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Sign in'; }
    }
  },

  /* ── Demo bypass — only shown when Sheets is not configured ── */
  _demoBypass() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.5);
      display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px
    `;
    const users = typeof DEMO_USERS !== 'undefined' ? DEMO_USERS : [];
    overlay.innerHTML = `
      <div style="background:var(--color-surface);border-radius:var(--radius-lg);
        padding:20px;width:100%;max-width:300px">
        <div style="font-size:var(--text-sm);font-weight:500;margin-bottom:12px">
          Select a demo user
        </div>
        ${users.map((u, idx) => `
          <button data-userid="${u.id}"
            style="display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;
              border:none;background:none;cursor:pointer;border-radius:6px;
              font-size:13px;margin-bottom:4px;text-align:left"
            onmouseenter="this.style.background='var(--color-surface-2)'"
            onmouseleave="this.style.background=''">
            <div class="avatar avatar-sm avatar-${idx % 8}"
              style="width:28px;height:28px;font-size:10px;flex-shrink:0">${u.initials}</div>
            <div>
              <div style="font-weight:500">${u.name}</div>
              <div style="font-size:11px;color:var(--color-text-secondary)">${ROLE_LABELS[u.role]}</div>
            </div>
          </button>
        `).join('')}
        <button id="demo-cancel-btn"
          style="width:100%;padding:8px;margin-top:8px;border:1px solid var(--color-border);
            border-radius:6px;background:none;cursor:pointer;font-size:12px;
            color:var(--color-text-secondary)">Cancel</button>
      </div>
    `;
    document.body.appendChild(overlay);

    /* Wire user buttons via addEventListener — no inline onclick strings */
    overlay.querySelectorAll('[data-userid]').forEach(btn => {
      btn.addEventListener('click', () => {
        Login._demoLogin(btn.dataset.userid, overlay);
      });
    });
    overlay.querySelector('#demo-cancel-btn').addEventListener('click', () => overlay.remove());
  },

  _demoLogin(userId, overlayEl) {
    if (overlayEl) overlayEl.remove();
    const users  = typeof DEMO_USERS !== 'undefined' ? DEMO_USERS : [];
    const user   = users.find(u => u.id === userId) || users[0];
    /* Use Session.set() which now accepts a full user object */
    const session = (typeof Session !== 'undefined')
      ? Session.set(user)
      : (() => {
          const s = { userId: user.id, name: user.name, initials: user.initials,
            role: user.role, expertise: user.expertise || [], loginTime: Date.now() };
          sessionStorage.setItem('bopinc_session', JSON.stringify(s));
          return s;
        })();
    sessionStorage.setItem('bopinc_login_ts', Date.now().toString());
    this._dismissModal();
    if (typeof bootDashboard === 'function') bootDashboard(session);
  },

  _showError(msg) {
    const el = document.getElementById('login-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  },

  _dismissModal() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s';
      setTimeout(() => overlay.remove(), 300);
    }
  },

  /* ── Logout ── */
  logout() {
    Session.clear();
    sessionStorage.removeItem('bopinc_login_ts');
    SheetsClient.invalidateAll();
    window.location.reload();
  },
};