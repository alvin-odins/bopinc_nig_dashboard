/* ============================================================
   BOPinc Nigeria Dashboard — Google Sheets Configuration
   Safe to commit — contains IDs only, never API keys.
   Replace PASTE_YOUR_SHEETS_ID_HERE with your actual document ID.
   Find it in the Sheets URL between /d/ and /edit
   ============================================================ */

const SHEETS_CONFIG = {

  /* ── Document ID ── */
  DOCUMENT_ID: '1TwaXMke4ZOMYiUoQjO2QxvufdUMq8sih5VtBLBKkvsg',

  /* ── API base URL (constructed at runtime) ── */
  get BASE_URL() {
    return `https://sheets.googleapis.com/v4/spreadsheets/${this.DOCUMENT_ID}/values`;
  },

  /* ── Tab names — must match exactly what is in your Sheets document ── */
  TABS: {
    TEAM_ROSTER:      'team-roster',
    CALENDAR_EVENTS:  'calendar-events',
    LEAVE_RECORDS:    'leave-records',
    PROJECTS:         'projects',
    OPPORTUNITIES:    'opportunities',
    FUNDING_ANALYSIS: 'funding-analysis',
    GLOBAL_PIPELINE:  'global-pipeline',
    VISITS:           'visits',
    SLACK_ALERTS:     'slack-alerts',
    CAPACITY_GAPS:    'capacity-gaps',
    SECTOR_KEYWORDS:  'sector-keywords',
    PENDING_CHANGES:  'pending-changes',
    USERS_ROLES:      'users-roles',
  },

  /* ── Column maps — index of each column in each tab (0-based) ──
     These match the column headers documented in docs/data/sheets-schema.md
     If you add or reorder columns, update these numbers too.
  ── */
  COLUMNS: {
    TEAM_ROSTER: {
      id: 0, name: 1, initials: 2, role: 3,
      expertise: 4, email: 5, avatarColor: 6, status: 7, joinDate: 8,
    },
    PROJECTS: {
      id: 0, name: 1, status: 2, startDate: 3, endDate: 4,
      sector: 5, lead: 6, teamMembers: 7, description: 8, health: 9,
      projectCode: 10, accountManager: 11,
    },
    VISITS: {
      id: 0, visitorNames: 1, visitorRoles: 2, visitorCountries: 3,
      arrival: 4, departure: 5, purpose: 6, assignedContact: 7,
      appointments: 8, notes: 9, status: 10,
    },
    PENDING_CHANGES: {
      id: 0, submittedBy: 1, userId: 2, field: 3,
      currentValue: 4, correctValue: 5, note: 6,
      status: 7, submittedAt: 8, reviewedAt: 9, reviewNote: 10,
    },
    USERS_ROLES: {
      id: 0, name: 1, initials: 2, role: 3,
      email: 4, lastLogin: 5,
    },
    LEAVE_RECORDS: {
      id: 0, userId: 1, userName: 2, startDate: 3,
      endDate: 4, type: 5, status: 6,
    },
    SLACK_ALERTS: {
      id: 0, text: 1, sector: 2, urgency: 3,
      url: 4, folder: 5, timestamp: 6, routedTo: 7,
    },
  },

  /* ── Cache duration (milliseconds) ── */
  CACHE_TTL: 15 * 60 * 1000, /* 15 minutes */

  /* ── Apps Script web app URL for write operations ──
     Set this after deploying sync/apps-script-api.gs as a web app.
     Leave empty to use direct Sheets API (read-only mode).
  ── */
  APPS_SCRIPT_URL: '',

};

/* Export for module environments */
if (typeof module !== 'undefined') {
  module.exports = { SHEETS_CONFIG };
}