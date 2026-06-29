# BOPinc Nigeria Dashboard

Team dashboard for the BOPinc Nigeria country office — schedules, projects, opportunities, and intelligence in one place.

## Quick links

| | |
|---|---|
| **Live dashboard** | Configured in GitHub Pages after deployment |
| **Admin panel** | `/admin/index.html` (password required) |
| **Documentation** | `/docs/` folder |
| **Build status** | See Actions tab above |

## What this is

A single-page HTML dashboard pulling data from Google Sheets via Google Apps Script. Ten modules across eight build phases: home overview, team pulse, working relationships, leave tracker, projects, Slack intelligence, visits, opportunities, funding analysis, and global pipeline.

Built mobile-first. No build tools. No framework. Works on phones, tablets, laptops, and wide monitors.

## Who it is for

| Role | What they see |
|---|---|
| Team member | Home, schedules, leave, projects, visits, Slack intel |
| Partnerships lead | All above + opportunities, funding analysis, global pipeline |
| Country director | Everything + admin panel |

## Build phases

| Phase | What it adds | Status |
|---|---|---|
| 1 | Shell, navigation, home page, role access | ✅ Complete |
| 2 | Google Sheets live data, login, admin panel | ✅ Complete |
| 3 | Calendar sync, team pulse, leave heatmap, relationships | ✅ Complete |
| 4 | Admin CRUD, roster management, audit log, password settings | ✅ Complete |
| 5 | Opportunities pipeline, funding analysis, capacity gap engine | ✅ Complete |
| 6 | Slack intelligence, sector routing, urgency scoring | ✅ Complete |
| 7 | Visits timeline, global pipeline, cross-country data | ✅ Complete |
| 8 | Polish, print fix, demo data, docs, handover | ✅ Complete |

## How to run locally

No build tools needed. Open `index.html` in a browser, or use a local server to avoid CORS issues with the Sheets API:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## How to deploy

1. Fork or clone this repository
2. Go to Settings → Pages → Source → GitHub Actions
3. Push to `main` — the `deploy.yml` workflow deploys automatically
4. The live URL appears in Settings → Pages once the first deploy completes

## Connecting Google Sheets

1. Copy `config/secrets-template.js` to `config/secrets.js`
2. Fill in your Google Sheets API key and document ID
3. Add `config/secrets.js` to your `.gitignore` (it is already listed)
4. Deploy the Apps Script files in `sync/` following `docs/modules/calendar-sync.md`
5. Run `setupTriggers()` once in the Apps Script editor

See `docs/getting-started/03-first-time-setup.md` for the full 13-step activation checklist.

## File structure

```
/
├── index.html              Main dashboard — all pages and JS
├── admin/
│   ├── index.html          Admin login gate
│   └── data-manager.html   Admin panel — CRUD, audit log, settings
├── config/
│   ├── roles.js            Role definitions and tab access
│   ├── sheets-config.js    Sheets document ID and tab names
│   └── secrets-template.js Copy to secrets.js and fill in keys
├── src/
│   ├── components/         Reusable JS components
│   └── styles/             CSS — variables, main, responsive, print
├── sync/                   Google Apps Script files
│   ├── calendar-sync.gs    Calendar → Sheets sync engine
│   ├── slack-sync.gs       Slack → Sheets classification engine
│   ├── apps-script-api.gs  HTTP write endpoint for the dashboard
│   └── triggers.gs         Scheduled triggers and daily digest
└── docs/                   Setup guides and module documentation
```

## Tech stack

- **Frontend** — plain HTML, CSS, JavaScript. No framework, no build step.
- **Database** — Google Sheets (read via Sheets API, write via Apps Script)
- **Sync** — Google Apps Script (30-minute scheduled trigger)
- **Hosting** — GitHub Pages (auto-deploy via GitHub Actions)
- **Auth** — Google Sheets `users-roles` tab for login; admin password in localStorage

## Admin password

Default development password: `bopinc-admin-2025`

Change it immediately after deployment: Admin panel → Settings → Change admin password.
The new password is stored in localStorage and takes effect on the next login.

## Known issues

- PDF export second-page overflow: partially resolved in Phase 8 using JS DOM isolation. If a second page still appears, raise it as a GitHub issue.
- Calendar sync requires the Apps Script to have read access to each team member's Google Calendar. Personal Gmail calendars must be shared explicitly.

## Licence

Internal tool — BOPinc Nigeria country office. Not for public distribution.