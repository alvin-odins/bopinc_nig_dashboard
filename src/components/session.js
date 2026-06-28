/* ============================================================
   BOPinc Nigeria Dashboard — Session Manager
   
   Phase 1: simple session stored in sessionStorage using demo users.
   Phase 2: Session.fetchRoster() pulls live data from Sheets.
             Login.js calls Session.set() with real user data on login.
   ============================================================ */

const SESSION_KEY = 'bopinc_session';

/* Demo team data — used as fallback when Sheets is not configured */
const DEMO_USERS = [
  { id: 'u1', name: 'Amaka Osei',     initials: 'AO', role: 'country_director',  expertise: ['strategy', 'partnerships'] },
  { id: 'u2', name: 'Chidi Nwosu',    initials: 'CN', role: 'partnerships_lead', expertise: ['energy', 'agriculture'] },
  { id: 'u3', name: 'Fatima Aliyu',   initials: 'FA', role: 'team_member',       expertise: ['health', 'wash'] },
  { id: 'u4', name: 'Emeka Okonkwo',  initials: 'EO', role: 'team_member',       expertise: ['finance', 'livelihoods'] },
  { id: 'u5', name: 'Ngozi Adeyemi',  initials: 'NA', role: 'team_member',       expertise: ['education', 'gender'] },
  { id: 'u6', name: 'Bola Tunde',     initials: 'BT', role: 'team_member',       expertise: ['monitoring', 'data'] },
];

const Session = {

  /* ── Set a session from a user object (or legacy string userId) ──
     Accepts: full user object { id, name, initials, role, expertise, email }
     Also handles: string userId (legacy — looks up from DEMO_USERS as fallback)
  ── */
  set(userObj) {
    /* Safety net: if a string ID was passed (legacy call), look up the full object */
    if (typeof userObj === 'string') {
      const found = DEMO_USERS.find(u => u.id === userObj);
      if (!found) {
        console.error('[Session.set] User not found for id:', userObj);
        return null;
      }
      userObj = found;
    }

    const session = {
      userId:    userObj.id || userObj.userId,
      name:      userObj.name,
      initials:  userObj.initials,
      role:      userObj.role,
      expertise: Array.isArray(userObj.expertise)
        ? userObj.expertise
        : (userObj.expertise || '').split(',').map(s => s.trim()).filter(Boolean),
      email:     userObj.email || '',
      loginTime: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  /* ── Get current session — returns null if not logged in ── */
  get() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  /* ── Clear session (logout) ── */
  clear() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('bopinc_login_ts');
  },

  /* ── Check if user has access to a tab ── */
  canAccess(tabId) {
    const session = this.get();
    if (!session) return false;
    return canAccess(tabId, session.role);
  },

  /* ── Fetch live team roster from Sheets ──
     Returns array of user objects. Falls back to DEMO_USERS
     if Sheets is not configured or fetch fails.
  ── */
  async fetchRoster() {
    try {
      /* SheetsClient may not be available yet in early load — check */
      if (typeof SheetsClient === 'undefined') return DEMO_USERS;
      if (typeof SHEETS_CONFIG === 'undefined') return DEMO_USERS;
      if (SHEETS_CONFIG.DOCUMENT_ID === 'PASTE_YOUR_SHEETS_ID_HERE') return DEMO_USERS;

      const rows = await SheetsClient.get(SHEETS_CONFIG.TABS.TEAM_ROSTER);
      if (!rows || rows.length === 0) return DEMO_USERS;

      return rows.map((row, i) => ({
        id:        row.id || `u${i + 1}`,
        name:      row.name || '',
        initials:  row.initials || (row.name || '').split(' ').map(n => n[0]).join('').toUpperCase(),
        role:      row.role || ROLES.TEAM_MEMBER,
        expertise: (row.expertise || '').split(',').map(s => s.trim()).filter(Boolean),
        email:     row.email || '',
        status:    row.status || 'available',
        avatarColor: parseInt(row.avatarColor, 10) || (i % 8),
      }));

    } catch (err) {
      console.warn('[Session] fetchRoster failed — using demo users:', err);
      return DEMO_USERS;
    }
  },

  /* ── Get demo users (for dev bypass in login.js) ── */
  getDemoUsers() { return DEMO_USERS; },
};

/* ── Initialise session on first load ──
   If no session exists and Sheets is not configured, seed demo session.
   If Sheets is configured, Login.js will handle the login flow.
── */
(function initSession() {
  const session  = Session.get();
  const sheetsConfigured = typeof SHEETS_CONFIG !== 'undefined' &&
    SHEETS_CONFIG.DOCUMENT_ID !== 'PASTE_YOUR_SHEETS_ID_HERE';

  if (!session && !sheetsConfigured) {
    /* Dev mode: seed default demo session so dashboard loads immediately */
    Session.set(DEMO_USERS[2]); /* Fatima — team member by default */
  }
})();