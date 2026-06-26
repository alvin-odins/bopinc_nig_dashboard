# bopinc_nig_dashboard

Team dashboard for the BOPinc Nigeria country office — schedules, projects, opportunities, and intelligence, all in one place.

## Quick links

| | |
|---|---|
| **Live dashboard** | `https://bopinc-nigeria.github.io/dashboard` (once deployed) |
| **Documentation** | `/docs/index.html` or `https://bopinc-nigeria.github.io/dashboard/docs` |
| **Admin panel** | `/admin/index.html` (password required) |
| **Build status** | See Actions tab above |

## What this is

A single-page HTML dashboard that pulls data from Google Sheets (updated by Google Apps Script sync engines) and displays it across ten modules: home overview, team pulse, working relationships, leave tracker, projects, Slack intelligence, visits, opportunities, funding analysis, and global pipeline.

Built mobile-first. Works on phones, tablets, laptops, and wide monitors.

## Who it's for

| Role | What they see |
|---|---|
| Team member | Home, schedules, leave, projects, visits, Slack intel |
| Partnerships lead | All above + opportunities, funding analysis, global pipeline |
| Country director | Everything + admin panel |

## Build phases

| Phase | What it adds | Status |
|---|---|---|
| 1 | Shell, navigation, home page, role access | ✅ Complete |
| 2 | Google Sheets live data | 🔜 Weeks 3–4 |
| 3 | Calendar sync (team pulse, leave heatmap) | 🔜 Weeks 5–6 |
| 4 | Admin panel | 🔜 Weeks 7–8 |
| 5 | Opportunities and funding analysis | 🔜 Weeks 9–10 |
| 6 | Slack intelligence | 🔜 Weeks 11–12 |
| 7 | Global pipeline, visits, projects radar | 🔜 Weeks 13–14 |
| 8 | Polish, docs, handover | 🔜 Weeks 15–16 |

## How to run locally

No build tools needed. Just open `index.html` in a browser.

```bash
# Option 1: open directly
open index.html

# Option 2: local server (recommended to avoid CORS on Sheets API)
npx serve .
# or
python3 -m http.server 8080
```

## How to deploy

See [docs/getting-started/03-first-time-setup.md](docs/getting-started/03-first-time-setup.md) for the full step-by-step deploy guide.

The short version: push to `main` branch and GitHub Actions deploys to GitHub Pages automatically.

## Folder structure

```
bopinc-nigeria-dashboard/
├── index.html              Main dashboard
├── config/
│   ├── roles.js            Role definitions and tab access map
│   └── sheets-config.js    Sheets document IDs (added in phase 2)
├── src/
│   ├── styles/
│   │   ├── variables.css   Design tokens
│   │   ├── main.css        Base styles
│   │   ├── responsive.css  Breakpoints
│   │   └── print.css       Export styles
│   ├── components/
│   │   ├── icons.js        SVG icon library
│   │   ├── session.js      User session management
│   │   └── change-request-modal.js  Correction request UI
│   └── pages/              Individual page HTML (phases 2+)
├── sync/                   Google Apps Script files (phases 3+)
├── admin/                  Admin panel (phase 4)
└── docs/                   Technical documentation site
```

## Making a change

1. Create a branch: `git checkout -b feat/your-change`
2. Make your change
3. Push and open a pull request
4. GitHub Actions runs a lint check on the PR
5. Merge to `main` — deploys automatically

See [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) for branch naming and commit message conventions.

---

Built for BOPinc Nigeria · Questions? See [docs/troubleshooting/](docs/troubleshooting/)