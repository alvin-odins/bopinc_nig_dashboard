# How to update data

This guide explains how to add and update information on the dashboard. Every task is described as a step-by-step process — no coding required.

---

## Adding a new project

**Option A — Admin panel (recommended):**

1. Open the admin panel at `/admin/index.html` and log in
2. Click **Projects** in the top navigation
3. Fill in the form — required fields are marked with an asterisk
4. Click **Save project**
5. The project appears on the dashboard within 30 minutes (or immediately after a manual sync)

**Option B — Google Sheets directly:**

1. Open the Google Sheets database document
2. Click the **projects** tab at the bottom
3. Add a new row below the last existing row — do not insert rows above the headers
4. Fill in each column according to the schema in [sheets-schema.md](sheets-schema.md)
5. Save the sheet — the dashboard picks it up on the next sync cycle

**Common mistakes to avoid:**
- The `status` column must be one of the exact values listed in the schema. `Active` (capital A) will not work — it must be `active`.
- The `teamMembers` column uses a specific format: `Name|Role,Name|Role`. The separator between name and role is a pipe (`|`), and members are separated by a comma. No spaces around the pipe.
- Leave the `id` column blank if you want the system to generate one automatically, or enter a unique value in the format `proj_shortname_year`.

---

## Adding an upcoming visit

**Admin panel:**

1. Admin panel → **Visits** → fill in the form
2. Visitors format: `First Last|Their Role|Their Country` — for multiple visitors, separate with a comma
3. In-country schedule format: `9 Jul: Description; 10 Jul: Description` — dates and descriptions separated by a semicolon
4. Click **Save visit**

**Google Sheets:**

1. Open the **visits** tab
2. Add a new row with all required columns
3. Set status to `upcoming`
4. The dashboard shows the visit on the home page once the arrival date is in the future

---

## Updating a team member's details

Team member details (name, role, expertise, status) live in the **team-roster** tab in Google Sheets. The admin panel shows a read-only view of the roster — to edit, go directly to Sheets.

1. Open Google Sheets → **team-roster** tab
2. Find the person's row
3. Edit the relevant cell
4. Save — the dashboard picks up the change within 30 minutes

**If a team member's role changes:**
Update both the `team-roster` tab (the `role` column) and the `users-roles` tab (the `role` column) for the same person. Both must match.

---

## Updating a project status

1. Google Sheets → **projects** tab
2. Find the project row
3. Change the `status` column to the new value
4. Save

Or from the admin panel → **Projects** → find the project in the table → click Edit.

---

## Responding to a correction request

1. Admin panel → **Change requests**
2. You will see all pending requests with what the team member says is wrong and what they say it should be
3. Read the request and optionally add a review note
4. Click **Approve** or **Reject**
5. The team member sees the outcome the next time they open the dashboard

Approved requests update the data immediately. Rejected requests return your note to the team member.

---

## Adding sector keywords for Slack alerts

1. Google Sheets → **sector-keywords** tab
2. Find the sector you want to add keywords for
3. Add new keywords to the `keywords` column, separated by commas
4. Save — new keywords take effect on the next Slack sync (within 30 minutes)

To add a new sector entirely:
1. Add a new row with the sector name, keywords, urgency words, and assigned expertise
2. Make sure the `assignedExpertise` value matches exactly what is in the `expertise` column of the team-roster tab for the person who should receive alerts for this sector

---

## Forcing an immediate data refresh

If you have made changes in Sheets and want the dashboard to show them now rather than waiting for the next sync:

1. Admin panel → **Sync controls** → **Run all syncs now**

Or if you just want to clear the browser cache and fetch fresh data:

1. Admin panel → **Sync controls** → **Clear cache**
2. Reload the dashboard

---

## What NOT to edit in Sheets

- **Do not rename any tab** — the sync scripts find tabs by exact name
- **Do not rename column headers** (row 1) — same reason
- **Do not delete rows** in `calendar-events`, `leave-records`, `slack-alerts`, or `capacity-gaps` — these are managed by sync scripts and will be recreated on the next sync
- **Do not edit the `pending-changes` tab** directly — use the admin panel instead so the review flow works correctly