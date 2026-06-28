# Changelog

All changes to the BOPinc Nigeria Dashboard are recorded here in plain English.
Most recent changes appear first.

---

## Phase 8 — Polish, print fix, demo data, docs, handover
*Weeks 15–16 · Status: ✅ Complete*

**What changed**

Final polish pass across all files. Demo data updated to be always current. Print isolation fixed using JS DOM removal. Triggers updated to include Slack sync. README rewritten to final handover state.

**Edited**
- `index.html` — DEMO_VISITS dates now relative to today (always upcoming); `openVisitDetail` avatar colours pinned to visitor index; `renderRestrictedContent` fallback text updated, stale phase references removed
- `sync/triggers.gs` — `runAllSyncs()` now calls `syncSlack()` — was missing since Phase 6
- `src/components/export-toolbar.js` — print now uses JS DOM isolation: non-active pages temporarily removed from DOM before `window.print()` and restored after, resolving the second-page overflow that CSS-only approaches could not eliminate
- `README.md` — complete rewrite: all 8 phases marked complete, Sheets setup, file structure, tech stack, admin password note, known issues
- `CHANGELOG.md` — this entry

**Phase 8 items delivered:**
1. DEMO_VISITS — always-upcoming dates relative to today
2. Avatar flicker fix — pinned to index not Math.random()
3. Stale coming-soon phase text removed
4. triggers.gs — syncSlack() added to runAllSyncs()
5. Print fix — JS DOM isolation (detach / print / restore)
6. README — final handover document

**Files changed: 5 (0 new, 5 edited)**
**Total files: 53 · All 8 phases complete.**

## Phase 7 — Visits timeline, global pipeline
*Weeks 13–14 · Status: ✅ Complete*

**What changed**

Two final content pages are now fully built. Visits replaces the coming-soon placeholder with a timeline of upcoming and past visits. Global pipeline shows BOPinc-wide funding opportunities across country offices using the existing ChartStacked component.

**Added**
- `docs/modules/visits.md` — visits setup guide, Sheets tab format, global pipeline data format

**Edited**
- `index.html` — `VisitsState`, `GlobalPipelineState`, `DEMO_GLOBAL_PIPELINE` (12 cross-country opportunities); `initVisitsPage()` — full visits timeline: stat strip, upcoming visit cards with avatar stack, countdown, past visits collapsible; `initGlobalPipelinePage()` — full global pipeline: stat strip, ChartStacked by country, country breakdown table; `navigate()` wired for visits and global-pipeline; `bootDashboard()` calls both; `loadLiveData()` extended for VISITS and GLOBAL_PIPELINE tabs; `renderRoleGatedContent()` now calls `initGlobalPipelinePage()`
- `CHANGELOG.md` — this entry

**Phase 7 features delivered:**
1. Visits timeline — upcoming cards with countdown, visitor avatars, assigned contact
2. Past visits — collapsed expandable section, dimmed cards
3. Visits summary stats — upcoming count, days to next, total visitors, countries
4. Export toolbar on visits page — CSV of all visit data
5. Global pipeline stacked bar chart — one row per country, segmented by status
6. Country breakdown table — sorted by total value, Nigeria highlighted
7. Global pipeline summary stats — total, active, countries, Nigeria share
8. Export toolbar on global pipeline — CSV of all cross-country opportunities
9. Live Sheets loading for VISITS and GLOBAL_PIPELINE tabs

**Files changed: 3 (1 new, 2 edited)**
**Total files: 53**

## Phase 6 — Slack intelligence, sector routing, urgency scoring
*Weeks 11–12 · Status: ✅ Complete*

**What changed**

The Slack intel page is now fully built — replacing the coming-soon placeholder. Alerts are personalised by role and expertise, urgency-scored, and routed to the correct team member automatically. The notification bell footer now links to the full page. Live data loads from the `slack-alerts` Sheets tab when configured.

**Added**
- `sync/slack-sync.gs` — Apps Script sync engine: reads `slack-log`, classifies messages by sector keyword, scores urgency 1–10, routes to team members by expertise, writes to `slack-alerts` tab. Includes `doPostSlack()` Slack webhook receiver.
- `docs/modules/slack-intel.md` — complete setup guide: Slack app creation, Event Subscriptions, webhook receiver deployment, Sheets tab format, routing customisation.

**Edited**
- `index.html` — `DEMO_SLACK_ALERTS` (per-user demo data for 4 role types); `SlackState`; `initSlackIntelPage()` — full page: summary stat strip, unread alerts sorted by urgency with red border for urgent items, older alerts collapsed in `<details>`; `navigate()` wired for slack-intel; `bootDashboard()` calls `initSlackIntelPage()`; `loadLiveData()` extended to fetch `SLACK_ALERTS` tab; notification bell footer replaced with "View all in Slack intel →" link
- `CHANGELOG.md` — this entry

**Phase 6 features delivered:**
1. Slack intel page — full implementation, personalised by role
2. Urgency scoring — 1–10 score from keyword detection, red border for urgent
3. Sector routing — alerts filtered to team members by expertise tag match
4. Alert type badges — mention, opportunity, deadline, meeting, sector, update
5. Unread / read split — older alerts collapsed, unread sorted by urgency first
6. Notification bell upgrade — footer links to Slack intel page
7. Live Sheets data loading for slack-alerts tab
8. Demo mode — per-user realistic demo alerts for all 4 role types

**Files changed: 4 (2 new, 2 edited)**
**Total files: 52**

## Phase 5 — Opportunities pipeline, funding analysis, capacity gap engine
*Weeks 9–10 · Status: ✅ Complete*

**What changed**

Two role-gated strategy pages — Opportunities and Funding Analysis — are now fully built. Both were previously showing "coming soon" placeholders. The capacity gap engine compares open opportunity sectors against team expertise and flags mismatches.

**Added**
- `src/components/chart-bubble.js` — SVG bubble chart: sector × probability, size = funding value, click-to-detail
- `src/components/chart-stacked.js` — stacked horizontal bar chart for funding by sector and status
- `docs/modules/opportunities.md` — data format guide, capacity gap explanation, Sheets column reference

**Edited**
- `index.html` — Phase 5 script tags added; DEMO_OPPORTUNITIES (8 entries); OppsState; initOpportunitiesPage(), renderOpportunitiesContent(), showOpportunityDetail(), renderCapacityGap(), initFundingPage() all implemented; renderRoleGatedContent() updated to call real renderers; loadLiveData() extended to load opportunities from Sheets; bootDashboard() wires both pages on init
- `CHANGELOG.md` — this entry

**Phase 5 features delivered:**
1. Opportunities bubble chart — sector × probability, bubble size = funding value
2. Status filter bar — All / Active / Pipeline / At risk / Won
3. Click-to-detail panel — name, funder, sector, value, probability, deadline, description
4. Capacity gap engine — compares opportunity sectors vs team expertise, flags gaps
5. Funding analysis stacked bar — one row per sector, segmented by status
6. Funding sector breakdown table — per-status values and totals
7. Summary stat cards on both pages
8. Export toolbar on both pages — CSV and PDF
9. Live Sheets data loading for opportunities tab

**Files changed: 5 (3 new, 2 edited)**
**Total files: 49**

## Phase 4 — Admin panel completion, roster management, audit log, password settings
*Weeks 7–8 · Status: ✅ Complete*

**What changed**

The admin panel is now fully functional. Every section has add, edit, and delete capability. Approving a change request now automatically applies the correction to the underlying data. A new Settings section lets the director change the admin password without editing code. An audit log records every admin action.

**Edited**
- `admin/data-manager.html` — complete rewrite: project edit/delete, visit edit/delete, full roster management (add/edit/delete with form), change request apply-on-approve, audit log, Settings section with password management, dashboard information panel. Nav button added for Settings. `showSection()` wired to all six sections.
- `admin/index.html` — password check now reads custom password from `localStorage` first, allowing the director to change it via the Settings panel without touching code.

**Added**
- `docs/modules/admin-panel.md` — complete guide to every admin section, all actions, security notes.

**Phase 4 features delivered:**
1. Project edit and delete — inline form pre-fill, confirmation on delete
2. Visit edit and delete — same pattern as projects
3. Full roster management — add, edit, remove team members with role/expertise/status/avatar colour
4. Change request auto-apply — approving expertise, role, or availability corrections updates localStorage roster immediately
5. Admin audit log — timestamped record of last 20 admin actions, viewable in Sync controls
6. Password management — Settings section lets director set a custom password (minimum 12 chars) stored in localStorage
7. Dashboard information panel — quick status of all configured components

**Files changed: 3 (2 edited, 1 new)**
**Total files: 47**


*Weeks 5–6 · Status: ✅ Complete*

**What changed**

Google Calendar is now the live data source for team schedules and leave. Three Apps Script files handle the sync engine. Three dashboard pages — Team pulse, Leave tracker, and Relationships — are fully built and wired to live data. Demo data is used as a fallback when Sheets is not yet configured.

**Added**
- `sync/calendar-sync.gs` — reads team Google Calendars, classifies events (meeting/focus/leave/travel), writes to calendar-events and leave-records Sheets tabs
- `sync/triggers.gs` — 30-min scheduled trigger, daily digest email to admin, error alerting
- `sync/apps-script-api.gs` — HTTP web app endpoint for all dashboard write operations; handles append, update, and pending-changes queries
- `src/components/chart-bar.js` — pure JS/SVG swimlane bar chart; date navigator; tooltip on hover; CSV export; no library dependency
- `src/components/chart-heatmap.js` — monthly heatmap calendar; intensity colour coding; click-to-detail panel; month navigator
- `src/components/export-toolbar.js` — reusable PDF/print, CSV download, and copy-link toolbar; attaches to any page
- `docs/modules/calendar-sync.md` — full deploy guide, troubleshooting, and data flow explanation

**Edited**
- `index.html` — team-pulse page fully built (swimlane + list view + date nav + export); leave-tracker page fully built (heatmap + by-person list + month nav + export); relationships page fully built (collaboration map + stats); three Phase 3 script tags added; PulseState, LeaveState, initTeamPulsePage(), initLeaveTrackerPage(), initRelationshipsPage() added; loadLiveData() extended to load calendar-events and leave-records
- `CHANGELOG.md` — this entry

**Architecture decisions**
- Chart components are pure JS/SVG — no external library (Chart.js, D3) needed. Reduces load time and eliminates CDN dependency.
- DEMO_SCHEDULE is reused as the fallback data source for Team pulse when Sheets is not configured — zero visual regression in demo mode
- PulseState and LeaveState are module-level objects that hold fetched data and current navigation state, keeping all three page functions stateless and re-renderable

**Total files: 47**


*Status: ✅ Complete*

**6 minor fixes**
- `window.currentPage` scope — changed `let` to `window.currentPage` throughout `index.html` so `bottom-nav.js` reads the correct active page
- Time-aware greeting — `getGreeting()` returns "Good morning / afternoon / evening" based on current hour; updates every minute alongside the pulse strip
- Toast `pointer-events: none` added to container so invisible area does not block clicks; individual toasts keep `pointer-events: all`
- Notification panel — `width:min(320px,calc(100vw - 24px))` prevents overflow on narrow screens; `right` reduced to 12px
- Admin panel active nav — `document.querySelector('.admin-nav-btn').classList.add('active')` on init so Projects is highlighted on load
- Schedule and `avail-dot` CSS moved from inline `<style>` block in `index.html` to `main.css`

**6 UX improvements**
- Projects page — proper empty state with "No projects yet" and "Add first project →" CTA instead of "Loading…" placeholder
- Stat card skeleton loading — when Sheets is configured, stat values show a shimmer skeleton while live data loads; removed on arrival or error
- Keyboard arrow navigation — `ArrowDown` / `ArrowUp` moves focus between sidebar nav items (ARIA nav landmark pattern)
- `nav-item:focus-visible` — amber outline ring matches the active amber indicator; visible only for keyboard users
- Stat cards — `role="button"` + `tabindex="0"` + `onkeydown` Enter/Space handler; `:active` press state and `:focus-visible` ring added
- All `.btn` variants — `focus-visible` outline ring added to primary, secondary, and ghost for full keyboard accessibility

**Files changed:** `index.html` · `src/styles/main.css` · `admin/data-manager.html`


*Weeks 3–4 · Status: ✅ Complete*

**What changed**

Replaced all hardcoded demo data with a live Google Sheets API connection. Dashboard now loads real team, project, and visit data. Login system replaces the Phase 1 demo role-switcher. Admin panel added for data entry.

**Added**
- `config/sheets-config.js` — Sheets document ID, tab names, column maps (safe to commit)
- `config/secrets-template.js` — API key template (real secrets.js stays gitignored)
- `src/components/sheets-client.js` — central Sheets API client: fetch, cache, write, error handling, stale data notice
- `src/components/login.js` — login modal with email/password auth against users-roles Sheets tab; demo bypass for dev mode
- `src/components/project-card.js` — project card with team member avatars, availability dots, health bar, detail modal, correction button
- `admin/index.html` — admin panel login gate
- `admin/data-manager.html` — data entry forms for projects, visits, roster view, change request review, sync controls
- `docs/data/sheets-schema.md` — every tab, every column, accepted values, plain English for non-developers
- `docs/data/how-to-update-data.md` — step-by-step admin guide for all data operations
- `docs/modules/projects.md` — project card data model, team linking, health score explained

**Edited**
- `src/components/session.js` — added fetchRoster() for live Sheets data; Session.set() now accepts any user object
- `src/components/change-request-modal.js` — submit() now async; POSTs to Sheets via SheetsClient (falls back to localStorage)
- `index.html` — added Phase 2 script tags; bootDashboard() function; loadLiveData() async loader; Projects page wired to ProjectCard.renderAll(); dev banner updated; init block now handles both demo and live auth modes

**Architecture decisions**
- SheetsClient is the single source of truth for all API calls — no other component fetches directly
- Write operations go through Apps Script web app (read-only direct API for fetches)
- Local storage queue for admin-entered data until Apps Script URL is configured — zero data loss
- Demo mode remains fully functional when Sheets is not configured — no config required to open and test the dashboard

**Total files: 36**


*Weeks 1–2 · Status: ✅ Complete*

**Addendum — troubleshooting docs folder added**
- `docs/troubleshooting/sync-not-running.md` — 6-step diagnosis guide for sync failures
- `docs/troubleshooting/common-errors.md` — 9 common errors written as users describe them
- `docs/troubleshooting/chart-not-loading.md` — browser console guide, network tab, extension conflicts
- Fixed broken link in `02-how-data-flows.md` pointing to `sync-not-running.md`
- Total files now: **25**

**Added**
- Home page with stat cards (team available, active projects, open opportunities, next visit)
- Today's team schedule preview with colour-coded bars (meeting, focus, leave, free)
- Team availability panel showing each person's status for today
- Activity feed with recent team updates
- Upcoming events strip for the week ahead
- Pulse strip — always-visible country awareness bar at the top of every page, showing today's date, team availability, and latest system status
- Full sidebar navigation for tablet and desktop, with icon-only and expanded modes
- Bottom navigation bar for mobile (thumb-reachable, five tabs)
- Role-based access control — opportunities, funding analysis, and global pipeline tabs are only visible to the partnerships lead and country director
- Restricted access screen for team members who navigate to a role-gated tab
- Coming soon placeholders for all modules being built in later phases (phases 2–7)
- Correction request flow — team members can flag incorrect data without editing it directly; requests go to the country director for review
- Phase 1 demo: click the avatar (top right) to switch between team member roles and see how access control works
- Dark mode support (follows system preference)
- Mobile-first responsive design: works on 320px phones up to wide desktop monitors
- Five CSS breakpoints defined: 320px, 480px, 768px, 1024px, 1280px
- Print stylesheet for PDF and Word export (foundation — expanded in phase 3)
- Design tokens: BOPinc green and amber brand palette, spacing scale, typography scale, shadow system

**Files added this phase**
- `index.html` — main dashboard (updated: print.css link, breakpoints.js, bottom-nav.js wired)
- `config/roles.js` — role definitions and tab access map
- `config/breakpoints.js` — JS mirror of CSS breakpoints for use in components
- `src/styles/variables.css` — design tokens
- `src/styles/main.css` — base layout and component styles
- `src/styles/responsive.css` — all five breakpoints
- `src/styles/print.css` — PDF and Word export stylesheet
- `src/components/icons.js` — SVG icon library
- `src/components/session.js` — user session management
- `src/components/bottom-nav.js` — mobile bottom navigation with More menu and swipe-to-close
- `src/components/change-request-modal.js` — correction request UI
- `docs/getting-started/01-what-is-this.md` — plain English system overview
- `docs/getting-started/02-how-data-flows.md` — three data routes illustrated
- `docs/getting-started/03-first-time-setup.md` — step-by-step deploy guide with checklist
- `docs/getting-started/04-roles-and-access.md` — who sees what, correction request flow
- `docs/getting-started/05-responsive-guide.md` — responsive design and testing guide
- `README.md` — project summary and folder structure
- `CHANGELOG.md` — this file
- `.gitignore` — excludes secrets, node_modules, OS files
- `.github/deploy.yml` — auto-deploy to GitHub Pages on push to main
- `.github/pr-check.yml` — lint and validation check on every pull request
- `.github/CONTRIBUTING.md` — branch naming, commit messages, PR process

---

*Next: Phase 2 — Google Sheets data layer (Weeks 3–4)*