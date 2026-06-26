# How data flows

This page explains the step-by-step journey that information takes — from a calendar event, a Slack message, or a manually entered record all the way to a card or chart on the dashboard.

No technical background needed. If you understand the basics from [01-what-is-this.md](01-what-is-this.md), this page fills in the details.

---

## The three data routes

Information enters the dashboard through three different routes depending on where it comes from.

---

### Route 1 — Google Calendar → Team pulse and leave tracker

This is the most automated route. Nothing needs to be done manually.

```
You add or edit an event in Google Calendar
        ↓
Google Apps Script runs every 30 minutes
        ↓
It reads your calendar events (meetings, out-of-office, focus blocks)
        ↓
It categorises each event: Meeting / Focus / Leave / Personal
        ↓
It writes the event data into the Google Sheets database
(tab: calendar-events)
        ↓
The dashboard reads from that Sheets tab
        ↓
Your event appears on the Team pulse swimlane and Leave tracker
```

**Maximum delay:** 30 minutes between a calendar change and the dashboard updating. If you need it faster, go to Admin panel → Sync controls → Run sync now.

**What counts as each category:**

| Category | How it's detected |
|---|---|
| Meeting | Any event with other attendees |
| Focus | Events you created alone, title contains "focus", "deep work", "no meetings", or "writing" |
| Leave | Out-of-office events, or events marked as all-day |
| Personal | Everything else |

If an event is being categorised incorrectly, the admin can adjust the keyword rules in the sync script (`sync/calendar-sync.gs`).

---

### Route 2 — Slack → Slack intelligence alerts

This route scans Slack for things that matter to the Nigeria team.

```
A message is posted in a watched Slack channel
        ↓
Google Apps Script runs every 30 minutes
        ↓
The keyword matcher scans the message text
against the sector keyword list (managed in Admin panel)
        ↓
If a match is found, an alert record is created
in Google Sheets (tab: slack-alerts)
        ↓
The alert is tagged with: sector, urgency score, matched keywords
        ↓
The dashboard routes the alert to the right people:
  → Sector expert (based on their expertise tag in the roster)
  → Partnerships lead (always sees opportunity alerts)
  → Country director (sees all alerts as briefing items)
        ↓
Each person sees their relevant alerts in the Slack intel tab
```

**Urgency scoring:** Messages containing words like "deadline", "RFP", "closing date", "urgent", or "proposal due" are scored as high priority and appear at the top of the alert feed regardless of sector.

**Personal mentions:** Your @username mentions from the last 48 hours are always surfaced in your Slack intel view, separate from sector alerts.

---

### Route 3 — Admin panel → All other modules

Projects, opportunities, visits, funding analysis, global pipeline, and team roster changes all come through the admin panel. This is a manual but simple process.

```
Admin or country director opens the admin panel
        ↓
Navigates to the relevant section
(e.g. Projects → Add new project)
        ↓
Fills in a form with the details
        ↓
Clicks Save
        ↓
The form writes directly to the Google Sheets database
(in the relevant tab: projects, opportunities, visits, etc.)
        ↓
The dashboard reads from Sheets on the next page load
(or immediately if the user refreshes)
```

**No sync needed for admin entries.** They appear on the dashboard as soon as the page is refreshed after saving.

---

### Route 3b — Correction requests (team members)

Team members cannot write directly to any Sheets tab. Instead:

```
Team member spots an error on the dashboard
        ↓
Clicks "Request a correction" on that data card
        ↓
Fills in: what field, what it says now, what it should say
        ↓
Request is written to Google Sheets (tab: pending-changes)
        ↓
Country director sees a badge notification in the admin panel
        ↓
Director approves or rejects with an optional note
        ↓
If approved: the data is updated in the relevant Sheets tab
If rejected: the note is returned to the team member
        ↓
Team member sees the outcome in their Slack intel view
```

---

## How the dashboard reads from Google Sheets

The dashboard is a static HTML file — it has no server of its own. When it needs data, it calls the Google Sheets API directly from the browser.

To keep the dashboard fast:

- Data is cached in the browser's session memory after the first load
- The cache refreshes every 15 minutes automatically, or when the user triggers a manual sync
- If the Sheets API is unavailable (e.g. network issue), the dashboard shows the last cached data with a "data may be stale" notice

---

## What the Google Sheets database looks like

The database is a single Google Sheets document with one tab per data type:

| Tab name | What it stores | Updated by |
|---|---|---|
| `team-roster` | Names, roles, expertise tags, avatar colours | Admin panel |
| `calendar-events` | Synced meeting, focus, leave records | Apps Script (auto) |
| `leave-records` | Confirmed leave entries | Apps Script + admin |
| `projects` | Active and completed projects | Admin panel |
| `opportunities` | Nigeria sector opportunities | Admin (restricted) |
| `funding-analysis` | Sector funding breakdown and gaps | Admin (restricted) |
| `global-pipeline` | Other country opportunities | Admin (restricted) |
| `visits` | Upcoming and past visits | Admin panel |
| `slack-alerts` | Keyword-matched Slack alerts | Apps Script (auto) |
| `capacity-gaps` | Expertise vs opportunity gaps | Apps Script (auto) |
| `sector-keywords` | Words that trigger sector alerts | Admin panel |
| `pending-changes` | Team member correction requests | Change request form |
| `users-roles` | Login credentials and role assignments | Admin panel |

---

## If data isn't showing on the dashboard

Work through this checklist in order:

1. **Is the data in Google Sheets?** Open the relevant Sheets tab and check the row is there.
2. **Has the sync run?** Check Admin panel → Sync controls → Last sync time. If it's over 1 hour ago, run a manual sync.
3. **Is the browser showing cached data?** Hard-refresh the page (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac).
4. **Is the Sheets API quota hit?** Google resets API quotas daily. If the sync log shows a quota error, wait 24 hours.

If none of these fix it, see [troubleshooting/sync-not-running.md](../troubleshooting/sync-not-running.md).