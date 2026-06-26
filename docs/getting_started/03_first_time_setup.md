# First-time setup

This guide walks a technical admin through deploying the BOPinc Nigeria Dashboard for the first time — from a fresh repository to a live URL. Estimated time: 45–90 minutes.

You will need:
- A GitHub account (with admin access to the repository)
- Access to the BOPinc Nigeria Google Workspace (Google Sheets, Drive, Calendar)
- Access to the BOPinc Slack workspace
- A computer with a browser

---

## Part 1 — Get the code onto GitHub

### Step 1: Create the GitHub repository

1. Go to **github.com** and sign in
2. Click the **+** icon (top right) → **New repository**
3. Name it: `bopinc-nigeria-dashboard`
4. Set visibility to **Private** (the pipeline data is confidential)
5. Leave "Add a README" unchecked — we'll push our own
6. Click **Create repository**

You'll see a page with setup instructions. Keep this open.

### Step 2: Upload the project files

**Option A — GitHub Desktop (easier):**
1. Open GitHub Desktop → File → Add local repository
2. Select the `bopinc-dashboard` folder you downloaded
3. Click **Publish repository** → select your organisation → **Publish**

**Option B — Command line:**
```bash
cd path/to/bopinc-dashboard
git init
git add .
git commit -m "initial commit — phase 1 shell"
git branch -M main
git remote add origin https://github.com/YOUR-ORG/bopinc-nigeria-dashboard.git
git push -u origin main
```

Replace `YOUR-ORG` with your GitHub organisation name.

---

## Part 2 — Enable GitHub Pages (live hosting)

1. Go to your repository on GitHub
2. Click **Settings** (top tab row)
3. In the left sidebar, click **Pages**
4. Under "Source", select **GitHub Actions**
5. Click **Save**

The `.github/deploy.yml` file in the repository will now automatically deploy the dashboard every time you push to `main`. The first deploy triggers automatically within 2 minutes of completing Step 1.

**To find your live URL:** Settings → Pages → your URL will appear at the top once the first deploy completes. It will look like:
`https://YOUR-ORG.github.io/bopinc-nigeria-dashboard`

> **Screenshot placeholder:** GitHub Pages settings screen showing "Source: GitHub Actions" selected and the live URL displayed.

---

## Part 3 — Set up the Google Sheets database

### Step 3: Create the Sheets document

1. Go to **sheets.google.com** in your BOPinc Google account
2. Create a new spreadsheet
3. Name it: `BOPinc Nigeria Dashboard — Database`
4. Share it with: anyone in your BOPinc Google Workspace who will use the admin panel (Editor access)

### Step 4: Create the required tabs

In your new spreadsheet, create these tabs (click the **+** at the bottom to add each one). Name them exactly as shown — the sync scripts depend on these exact names:

| Tab name | Purpose |
|---|---|
| `team-roster` | Team member details |
| `calendar-events` | Synced from Google Calendar |
| `leave-records` | Leave entries |
| `projects` | Active and past projects |
| `opportunities` | Nigeria opportunities (restricted) |
| `funding-analysis` | Funding and capacity data |
| `global-pipeline` | Other country pipeline |
| `visits` | Visit log |
| `slack-alerts` | Keyword-matched Slack messages |
| `capacity-gaps` | Expertise vs opportunity gaps |
| `sector-keywords` | Slack alert keyword list |
| `pending-changes` | Team correction requests |
| `users-roles` | User login and role data |

### Step 5: Add the column headers

For each tab, add headers in row 1. Copy these exactly (case-sensitive):

**team-roster:**
`id | name | initials | role | expertise | email | avatarColor | status | joinDate`

**projects:**
`id | name | status | startDate | endDate | sector | lead | teamMembers | description | health`

**opportunities:**
`id | title | sector | status | fundingValue | donor | partners | traction | description | dateAdded`

**visits:**
`id | visitorName | visitorRole | visitorCountry | purpose | arrivalDate | departureDate | notes | status`

**sector-keywords:**
`sector | keywords | urgencyWords | assignedExpertise`

**pending-changes:**
`id | submittedBy | userId | field | currentValue | correctValue | note | status | submittedAt | reviewedAt | reviewNote`

**users-roles:**
`id | name | initials | role | email | lastLogin`

> The remaining tabs (`calendar-events`, `leave-records`, `slack-alerts`, `capacity-gaps`, `funding-analysis`, `global-pipeline`) are populated entirely by the sync scripts — their column headers are created automatically when the scripts first run.

### Step 6: Get the Sheets document ID

1. Open your Sheets document
2. Look at the URL — it looks like: `https://docs.google.com/spreadsheets/d/ABC123XYZ.../edit`
3. Copy the long string between `/d/` and `/edit` — that is your **Sheets ID**

---

## Part 4 — Connect the dashboard to Google Sheets

### Step 7: Add the Sheets ID to the dashboard config

1. Open `config/sheets-config.js` in your code editor (this file is created in Phase 2 — see below)
2. Replace `YOUR_SHEETS_ID_HERE` with your actual Sheets ID
3. Save, commit, and push

> **Note:** `config/sheets-config.js` is built in Phase 2 (Weeks 3–4). In Phase 1, the dashboard uses demo data. This step is a reminder to return here when Phase 2 begins.

### Step 8: Enable the Google Sheets API

1. Go to **console.cloud.google.com**
2. Create a new project (or select your BOPinc one)
3. Search for "Google Sheets API" → Enable it
4. Go to **Credentials** → **Create credentials** → **API key**
5. Copy the API key — you'll need it in Phase 2

> **Never put the API key in a file that gets pushed to GitHub.** It goes in a local `config/secrets.js` file that is listed in `.gitignore`. This is explained in the Phase 2 setup guide.

---

## Part 5 — Add team members and initial data

### Step 9: Populate the team roster

In your `team-roster` Sheets tab, add a row for each Nigeria team member:

| id | name | initials | role | expertise | email | avatarColor | status |
|---|---|---|---|---|---|---|---|
| u1 | Amaka Osei | AO | country_director | strategy,partnerships | amaka@bopinc.org | 0 | available |
| u2 | Chidi Nwosu | CN | partnerships_lead | energy,agriculture | chidi@bopinc.org | 1 | available |

Continue for each team member. The `avatarColor` is a number 0–7 that maps to the eight avatar colour classes in the CSS.

Role values must be exactly one of: `team_member`, `partnerships_lead`, `country_director`, `superadmin`

### Step 10: Add the admin password

1. Open `config/secrets-template.js` — this is a template showing the format
2. Create a new file: `config/secrets.js` (this file is in `.gitignore` — it will NOT be pushed to GitHub)
3. Add your admin password following the template format
4. Keep a secure copy of this password somewhere safe

---

## Part 6 — Verify everything is working

### Step 11: Open the live dashboard

1. Go to your GitHub Pages URL
2. You should see the dashboard with the green pulse strip at the top
3. Click the avatar (top right) to switch between demo user roles
4. Confirm that team members cannot see Opportunities and that country directors can

### Step 12: Test the correction request flow

1. Switch to any team member role
2. Click "Request a correction" on the home page
3. Fill in the form and submit
4. Open `config/secrets.js` locally and note the admin URL
5. Open the admin panel, find the correction request, approve it
6. Switch back to the team member role and confirm the status updated

### Step 13: Check the GitHub Actions deploy is working

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. You should see a green tick on the most recent workflow run
4. If you see a red X, click it to read the error and check the troubleshooting guide

---

## You're live

The Phase 1 shell is now fully deployed. The dashboard shows demo data until Phase 2 (the Google Sheets data connection) is complete.

**Next steps:**
- Share the dashboard URL with the Nigeria team
- Ask team members to test the role switching and correction request flow
- Start filling in the team-roster Sheets tab with real names and roles
- Begin Phase 2: [../modules/projects.md](../modules/projects.md)

---

## Checklist

- [ ] Repository created on GitHub and set to Private
- [ ] Code pushed to main branch
- [ ] GitHub Pages enabled (Source: GitHub Actions)
- [ ] Live URL confirmed working
- [ ] Google Sheets database document created
- [ ] All 13 Sheets tabs created with correct names
- [ ] Column headers added to manual-entry tabs
- [ ] Sheets ID copied and ready for Phase 2
- [ ] Team roster tab populated with real team names
- [ ] Admin password set in local secrets.js (not pushed to GitHub)
- [ ] Dashboard live URL shared with the team
- [ ] Role switching tested with at least 3 roles
- [ ] Correction request flow tested end-to-end
- [ ] GitHub Actions showing green tick