# Changelog

All changes to the BOPinc Nigeria Dashboard are recorded here in plain English.
Most recent changes appear first.

---

## Phase 1 — Foundation shell
*Weeks 1–2 · Status: ✅ Complete*

<!-- the below addendum is for phase 8 


**Addendum — troubleshooting docs folder added**
- `docs/troubleshooting/sync-not-running.md` — 6-step diagnosis guide for sync failures
- `docs/troubleshooting/common-errors.md` — 9 common errors written as users describe them
- `docs/troubleshooting/chart-not-loading.md` — browser console guide, network tab, extension conflicts
- Fixed broken link in `02-how-data-flows.md` pointing to `sync-not-running.md`
- Total files now: **25**

-->
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