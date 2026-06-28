# Visits module
## BOPinc Nigeria Dashboard — Phase 7

The Visits page tracks incoming visits from the global BOPinc team and cross-country colleagues, showing upcoming visits with a countdown and past visits in a collapsible section.

---

## What it shows

**Upcoming visits** — displayed as cards in a responsive grid, sorted by arrival date ascending. Each card shows visitor names and avatars, purpose, arrival–departure date range, duration in days, a countdown (today / tomorrow / N days), the assigned country contact, and the visitors' home countries. Clicking a card opens the full detail modal showing the complete in-country schedule, visitor roles, notes, and documents needed.

**Past visits** — collapsed into an expandable section, sorted by arrival date descending (most recent first). Past cards are slightly dimmed. Clicking opens the same detail modal.

**Summary stats** — upcoming visit count, days until next visit, total visitor count across all visits, and number of countries represented.

---

## Adding a visit

Use the Admin panel — navigate to Admin panel → Visits → Add new visit.

Fields:
- **Visitors** — format: `Name|Role|Country` separated by commas. Example: `Sarah Mensah|Global Partnerships Director|Switzerland, James Okafor|Regional Director|Ghana`
- **Arrival date** — YYYY-MM-DD format
- **Departure date** — YYYY-MM-DD format
- **Purpose** — plain text description of the visit objectives
- **Assigned country contact** — the Nigeria team member responsible for the visit
- **In-country schedule** — format: `Date: Description` separated by semicolons. Example: `9 Jul: Arrival and office briefing; 10 Jul: Strategy review session`
- **Notes** — hotel preferences, dietary requirements, documents needed

Visits are saved to `localStorage` under `bopinc_local_visits` immediately. When the Apps Script URL is configured, they also push to the `visits` Sheets tab.

---

## Sheets tab format

The `visits` Sheets tab has these columns:

| Column | Description |
|---|---|
| id | Unique visit ID |
| visitorNames | Comma-separated visitor full names |
| visitorRoles | Comma-separated visitor roles (matching order of names) |
| visitorCountries | Comma-separated home countries (matching order of names) |
| arrival | Arrival date YYYY-MM-DD |
| departure | Departure date YYYY-MM-DD |
| purpose | Visit purpose text |
| assignedContact | Nigeria team member name |
| appointments | Semicolon-separated schedule entries (Date: Description) |
| notes | Freetext notes |
| status | upcoming / arrived / completed |

---

## Global pipeline page

The global pipeline page (Phase 7) shows BOPinc-wide opportunity data across all country offices using the `global-pipeline` Sheets tab.

### Sheets tab format for global-pipeline

| Column | Description |
|---|---|
| country | Country office name (e.g. Nigeria, Ghana, Kenya) |
| sector | Sector name matching sector keyword list |
| name | Opportunity name |
| value | Funding value in USD (number only) |
| status | active / pipeline / at-risk / won / closed |

Each row is one opportunity. The dashboard groups rows by country to produce the stacked bar chart. The Nigeria row is highlighted in the country breakdown table.

### Populating global pipeline data

Two options:

**Option A — Direct Sheets entry:** Add rows to the `global-pipeline` tab manually or ask each country office to add their opportunities to a shared Sheets document.

**Option B — Country office feeds:** Each country office maintains their own Sheets document. A consolidated Apps Script reads all country documents and writes to the central `global-pipeline` tab on a scheduled basis.

---

## Demo mode

When Sheets is not yet configured, the visits page shows the two demo visits from `DEMO_VISITS` in `index.html` and the global pipeline page shows twelve demo opportunities across six country offices. Both pages display a notice when showing demo data.