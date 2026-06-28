# Phase 2 — GitHub commit guide

**Branch name:**
```
feat/phase-2-sheets-data-layer
```

Create this branch before touching any files:

```bash
git checkout main
git pull origin main
git checkout -b feat/phase-2-sheets-data-layer
```

---

## Commit sequence — one commit per logical unit

Make each commit after completing and testing that specific piece. Do not commit everything in one go.

### Commit 1 — Sheets config and secrets template
After creating `config/sheets-config.js` and `config/secrets-template.js`.

```
add sheets-config and secrets template — API connection foundation
```

Confirm `config/secrets.js` is listed in `.gitignore` before committing. Run `git status` and verify `secrets.js` does not appear in the list.

---

### Commit 2 — Sheets client
After creating `src/components/sheets-client.js` and confirming it loads without errors in the browser console.

```
add sheets-client — central API fetch, cache, and write engine
```

---

### Commit 3 — Login component
After creating `src/components/login.js` and confirming the demo bypass works in the browser.

```
add login component — replaces demo role-switcher with real auth flow
```

---

### Commit 4 — Project card component
After creating `src/components/project-card.js` and confirming a test card renders without errors.

```
add project-card component — avatars, health bar, detail modal
```

---

### Commit 5 — Admin panel
After creating `admin/index.html` and `admin/data-manager.html` and confirming you can log into the admin panel and add a test project.

```
add admin panel — login gate, data manager, change request review, sync controls
```

---

### Commit 6 — Wire session to Sheets roster
After updating `src/components/session.js` with `fetchRoster()` and confirming demo mode still works.

```
update session — add fetchRoster() for live Sheets data, backward compatible
```

---

### Commit 7 — Wire change requests to Sheets
After updating `src/components/change-request-modal.js` to use `SheetsClient.append()`.

```
update change-request-modal — POST to Sheets pending-changes via SheetsClient
```

---

### Commit 8 — Wire index.html
After updating `index.html` with all Phase 2 script tags, `bootDashboard()`, `loadLiveData()`, the Projects page container, and the updated dev banner. Confirm the dashboard still loads in demo mode.

```
update index.html — Phase 2 boot, live data loading, projects page wired
```

---

### Commit 9 — Docs and changelog
After creating the three docs files and updating `CHANGELOG.md`.

```
add Phase 2 docs — sheets-schema, how-to-update-data, projects module guide
```

---

## After all 9 commits — push and open PR

```bash
git push -u origin feat/phase-2-sheets-data-layer
```

Then go to GitHub → your repository → you will see a prompt to open a pull request.

---

## Pull request title
```
Phase 2 — Google Sheets data layer, login system, admin panel, project cards
```

## Pull request description
```
Replaces all hardcoded demo data with live Google Sheets API connection.

What changed:
— New SheetsClient handles all API calls with sessionStorage caching and stale data fallback
— Login system replaces demo role-switcher — checks credentials against users-roles Sheets tab
— Project cards render from Sheets projects tab with live team member availability dots
— Change requests POST to Sheets pending-changes tab (was localStorage)
— Admin panel added — projects, visits, roster view, change request review, sync controls
— Session.fetchRoster() pulls live team data; falls back to demo users if Sheets not configured
— Dashboard continues to work in demo mode with no configuration required

Before merging:
— Confirm config/secrets.js is NOT in the file list (should be gitignored)
— Test in demo mode: dashboard loads without any Sheets configuration
— Test admin panel: add a test project, check it appears in the projects list
— Test correction request: submit one, confirm it shows in admin panel change requests
— Confirm no console errors in browser developer tools

Files added: 10
Files edited: 4 (index.html, session.js, change-request-modal.js, CHANGELOG.md)
Total repository files after merge: 36
```

---

## After the PR is merged

GitHub Actions (`deploy.yml`) deploys automatically within 2 minutes. Check the Actions tab for a green tick.

Then do the three activation steps to go from demo mode to live data:

1. Open `config/sheets-config.js` — replace `PASTE_YOUR_SHEETS_ID_HERE` with your actual Sheets document ID
2. Copy `config/secrets-template.js` → save as `config/secrets.js` (this file stays local, never committed) → replace the placeholder API key
3. Open the admin panel → Sync controls → Run all syncs now

The dashboard will immediately start showing live data from your Google Sheets.