/* ============================================================
   BOPinc Nigeria Dashboard — Session Manager
   Phase 1: simple session stored in sessionStorage.
   Phase 2 upgrade path: swap getSession() to fetch from backend.
   ============================================================ */

const SESSION_KEY = 'bopinc_session';

/* Demo team data for phase 1 — replaced by Sheets API in phase 2 */
const DEMO_USERS = [
  { id: 'u1', name: 'Amaka Osei',      initials: 'AO', role: 'country_director',  expertise: ['strategy', 'partnerships'] },
  { id: 'u2', name: 'Chidi Nwosu',     initials: 'CN', role: 'partnerships_lead', expertise: ['energy', 'agriculture'] },
  { id: 'u3', name: 'Fatima Aliyu',    initials: 'FA', role: 'team_member',       expertise: ['health', 'wash'] },
  { id: 'u4', name: 'Emeka Okonkwo',  initials: 'EO', role: 'team_member',       expertise: ['finance', 'livelihoods'] },
  { id: 'u5', name: 'Ngozi Adeyemi',  initials: 'NA', role: 'team_member',       expertise: ['education', 'gender'] },
  { id: 'u6', name: 'Bola Tunde',     initials: 'BT', role: 'team_member',       expertise: ['monitoring', 'data'] },
];

const Session = {
  /* Set a session (called on login / role-switch in demo) */
  set(userId) {
    const user = DEMO_USERS.find(u => u.id === userId) || DEMO_USERS[0];
    const session = {
      userId: user.id,
      name: user.name,
      initials: user.initials,
      role: user.role,
      expertise: user.expertise,
      loginTime: Date.now(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  /* Get current session — returns null if not logged in */
  get() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  /* Clear session (logout) */
  clear() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  /* Check if user has access to a tab */
  canAccess(tabId) {
    const session = this.get();
    if (!session) return false;
    return canAccess(tabId, session.role);  /* from roles.js */
  },

  /* Get demo users list (for role-switcher in phase 1) */
  getDemoUsers() { return DEMO_USERS; },
};

/* ── Initialise session on first load ── */
(function initSession() {
  if (!Session.get()) {
    /* Default to team member for first load */
    Session.set('u3');
  }
})();