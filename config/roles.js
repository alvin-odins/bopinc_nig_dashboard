/* ============================================================
   BOPinc Nigeria Dashboard — Roles & Access Configuration
   Central definition for all roles and tab visibility.
   ============================================================ */

const ROLES = {
  TEAM_MEMBER: 'team_member',
  PARTNERSHIPS_LEAD: 'partnerships_lead',
  COUNTRY_DIRECTOR: 'country_director',
  SUPERADMIN: 'superadmin',
};

const ROLE_LABELS = {
  [ROLES.TEAM_MEMBER]:       'Team member',
  [ROLES.PARTNERSHIPS_LEAD]: 'Partnerships lead',
  [ROLES.COUNTRY_DIRECTOR]:  'Country director',
  [ROLES.SUPERADMIN]:        'Admin',
};

const ROLE_BADGE_COLOURS = {
  [ROLES.TEAM_MEMBER]:       '#4da06a',  /* green */
  [ROLES.PARTNERSHIPS_LEAD]: '#d98f0f',  /* amber */
  [ROLES.COUNTRY_DIRECTOR]:  '#3b82f6',  /* blue  */
  [ROLES.SUPERADMIN]:        '#e53e3e',  /* red   */
};

/* ── Tab definitions ──
   id:         matches .page[data-page] and nav items
   label:      display text
   icon:       SVG icon key (rendered by icons.js)
   section:    sidebar grouping
   phase:      which build phase activates this tab
   roles:      which roles can see this tab (empty = all)
   restricted: true = shows access-restricted screen instead of hiding
*/
const TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: 'home',
    section: 'main',
    phase: 1,
    roles: [],  /* all roles */
    inBottomNav: true,
  },
  {
    id: 'team-pulse',
    label: 'Team pulse',
    icon: 'users',
    section: 'main',
    phase: 3,
    roles: [],
    inBottomNav: true,
  },
  {
    id: 'relationships',
    label: 'Relationships',
    icon: 'arrows-cross',
    section: 'main',
    phase: 3,
    roles: [],
    inBottomNav: false,
  },
  {
    id: 'leave-tracker',
    label: 'Leave tracker',
    icon: 'calendar-off',
    section: 'main',
    phase: 3,
    roles: [],
    inBottomNav: true,
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'folders',
    section: 'main',
    phase: 2,
    roles: [],
    inBottomNav: true,
  },
  {
    id: 'slack-intel',
    label: 'Slack intel',
    icon: 'bell',
    section: 'main',
    phase: 6,
    roles: [],
    inBottomNav: false,
    badge: 0,  /* populated dynamically from alerts */
  },
  {
    id: 'visits',
    label: 'Visits',
    icon: 'plane',
    section: 'main',
    phase: 7,
    roles: [],
    inBottomNav: false,
  },
  /* ── Restricted tabs ── */
  {
    id: 'opportunities',
    label: 'Opportunities',
    icon: 'target',
    section: 'strategy',
    phase: 5,
    roles: [ROLES.PARTNERSHIPS_LEAD, ROLES.COUNTRY_DIRECTOR, ROLES.SUPERADMIN],
    restricted: true,
    inBottomNav: false,
  },
  {
    id: 'funding-analysis',
    label: 'Funding analysis',
    icon: 'chart-pie',
    section: 'strategy',
    phase: 5,
    roles: [ROLES.PARTNERSHIPS_LEAD, ROLES.COUNTRY_DIRECTOR, ROLES.SUPERADMIN],
    restricted: true,
    inBottomNav: false,
  },
  {
    id: 'global-pipeline',
    label: 'Global pipeline',
    icon: 'world',
    section: 'strategy',
    phase: 7,
    roles: [ROLES.PARTNERSHIPS_LEAD, ROLES.COUNTRY_DIRECTOR, ROLES.SUPERADMIN],
    restricted: true,
    inBottomNav: false,
  },
];

/* ── canAccess(tabId, role) → boolean ── */
function canAccess(tabId, role) {
  const tab = TABS.find(t => t.id === tabId);
  if (!tab) return false;
  if (tab.roles.length === 0) return true;          /* open to all */
  return tab.roles.includes(role);
}

/* ── getVisibleTabs(role) → Tab[] ──
   Returns tabs the role can see in the sidebar.
   Restricted-tab users see the tab but get an access screen.
   Non-listed users do not see the tab at all.
*/
function getVisibleTabs(role) {
  return TABS.filter(tab => {
    if (tab.roles.length === 0) return true;        /* open to all */
    if (tab.restricted) return tab.roles.includes(role);  /* show if in role list */
    return tab.roles.includes(role);
  });
}

/* ── getBottomNavTabs(role) → Tab[] (max 5) ── */
function getBottomNavTabs(role) {
  return getVisibleTabs(role)
    .filter(t => t.inBottomNav)
    .slice(0, 4)
    .concat([{ id: 'more', label: 'More', icon: 'dots', inBottomNav: true }]);
}

/* Export for use in other modules */
if (typeof module !== 'undefined') {
  module.exports = { ROLES, ROLE_LABELS, ROLE_BADGE_COLOURS, TABS, canAccess, getVisibleTabs, getBottomNavTabs };
}