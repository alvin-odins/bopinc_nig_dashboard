# Google Sheets schema

This page documents every tab in the BOPinc Nigeria Dashboard database spreadsheet and every column within each tab. Written so a non-developer can confidently update data without breaking anything.

**Golden rule:** Never rename a tab or a column header. The sync scripts find data by exact name. If a name changes, the dashboard silently shows nothing for that field.

---

## Tab: team-roster

One row per team member. The dashboard reads this tab to populate the role switcher, availability view, and project team assignments.

| Column | What it contains | Accepted values | Example |
|---|---|---|---|
| `id` | Unique ID for this person | Any text, no spaces (use underscores) | `u_amaka_01` |
| `name` | Full name | Any text | `Amaka Osei` |
| `initials` | 2-letter initials for avatar | 2 uppercase letters | `AO` |
| `role` | Dashboard role (controls what they see) | `team_member` · `partnerships_lead` · `country_director` · `superadmin` | `country_director` |
| `expertise` | Sectors this person covers | Comma-separated list from sector list below | `energy,agriculture` |
| `email` | Work email | Valid email address | `amaka@bopinc.org` |
| `avatarColor` | Avatar colour number | 0 through 7 | `0` |
| `status` | Current availability | `available` · `busy` · `leave` · `offline` | `available` |
| `joinDate` | Date they joined the team | YYYY-MM-DD format | `2023-06-01` |

**Valid sectors for `expertise`:** energy · agriculture · health · wash · education · finance · livelihoods · gender · monitoring · data · strategy · partnerships

---

## Tab: projects

One row per project. The dashboard reads this tab to show project cards on the Projects page and to compute the active projects stat.

| Column | What it contains | Accepted values | Example |
|---|---|---|---|
| `id` | Unique project ID | Any text, no spaces | `proj_wash_ng_24` |
| `name` | Project name | Any text | `WASH-NG Phase 2` |
| `status` | Current status | `active` · `at-risk` · `delayed` · `blocked` · `completed` · `pipeline` | `active` |
| `startDate` | Project start | YYYY-MM-DD | `2024-01-15` |
| `endDate` | Project end / due date | YYYY-MM-DD | `2025-06-30` |
| `sector` | Primary sector | Single value from sector list | `Health` |
| `lead` | Project lead full name | Any text | `Fatima Aliyu` |
| `teamMembers` | All team members | `Name\|Role` pairs separated by commas | `Fatima Aliyu\|Health Lead,Bola Tunde\|MEL` |
| `description` | Short project description | Any text, 1–3 sentences | `Community WASH infrastructure…` |
| `health` | Project health score | Number 0–100 | `78` |
| `projectCode` | Short project code | Any text | `WASH-NG-24` |
| `accountManager` | Account manager name | Any text | `Amaka Osei` |

---

## Tab: visits

One row per visit. The dashboard shows upcoming visits on the home page and in the Visits tab.

| Column | What it contains | Accepted values | Example |
|---|---|---|---|
| `id` | Unique visit ID | Any text, no spaces | `visit_sarah_jul25` |
| `visitorNames` | All visitors | `Name\|Role\|Country` pairs, comma-separated | `Sarah Mensah\|Global Director\|Switzerland` |
| `arrival` | Arrival date | YYYY-MM-DD | `2025-07-09` |
| `departure` | Departure date | YYYY-MM-DD | `2025-07-14` |
| `purpose` | Purpose of the visit | Any text | `Country strategy review` |
| `assignedContact` | Nigeria team contact | Full name of team member | `Amaka Osei` |
| `appointments` | Day-by-day schedule | `Date: Description` pairs separated by semicolons | `9 Jul: Arrival; 10 Jul: Strategy session` |
| `notes` | Logistics notes | Any text | `Hotel near VI. No pork.` |
| `status` | Visit status | `upcoming` · `ongoing` · `past` | `upcoming` |

---

## Tab: pending-changes

Written to automatically when a team member submits a correction request. Do not edit manually — the admin panel manages this tab.

| Column | What it contains |
|---|---|
| `id` | Auto-generated request ID |
| `submittedBy` | Name of the team member who submitted |
| `userId` | Their user ID |
| `field` | Which field they are correcting |
| `currentValue` | What it currently shows |
| `correctValue` | What it should show |
| `note` | Additional context from the submitter |
| `status` | `pending` · `approved` · `rejected` |
| `submittedAt` | ISO timestamp of submission |
| `reviewedAt` | ISO timestamp of review |
| `reviewNote` | Director's note on decision |

---

## Tab: users-roles

One row per user account. Used by the login system to authenticate team members.

| Column | What it contains | Notes |
|---|---|---|
| `id` | Unique user ID | Must match `team-roster` id for the same person |
| `name` | Full name | |
| `initials` | 2-letter initials | |
| `role` | Dashboard role | Same values as team-roster role column |
| `email` | Login email | Must be the exact email the user enters at login |
| `password` | Login password | Plain text for now — Phase 4 will hash these |
| `lastLogin` | Last login timestamp | Updated automatically — do not edit |

**Security note:** Plain text passwords in Sheets are acceptable for Phase 2 because the Sheets document is private and access-controlled within your Google Workspace. Phase 4 will replace this with hashed passwords via Apps Script.

---

## Tab: sector-keywords

One row per sector. The Slack sync engine uses this to route opportunity alerts.

| Column | What it contains | Example |
|---|---|---|
| `sector` | Sector name | `energy` |
| `keywords` | Words that trigger a sector alert | `solar,renewable,energy access,rural electrification,off-grid` |
| `urgencyWords` | Words that make an alert high priority | `deadline,RFP,proposal due,closing date,urgent` |
| `assignedExpertise` | Which expertise tag routes to this sector | `energy` |

---

## Tabs populated automatically by sync scripts

These tabs are written by Google Apps Script and should not be edited manually. Their column headers are created automatically on the first sync run.

| Tab | Populated by |
|---|---|
| `calendar-events` | `sync/calendar-sync.gs` |
| `leave-records` | `sync/calendar-sync.gs` |
| `slack-alerts` | `sync/slack-sync.gs` |
| `capacity-gaps` | `sync/capacity-gap-engine.gs` |
| `funding-analysis` | Manual entry via admin panel + Apps Script |
| `global-pipeline` | Manual entry via admin panel |