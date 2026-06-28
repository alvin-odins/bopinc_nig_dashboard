# Admin panel guide
## BOPinc Nigeria Dashboard — Phase 4

The admin panel lives at `/admin/index.html`. Only the country director should have access. This guide explains every section.

---

## Accessing the panel

Navigate to `admin/index.html` from the dashboard header or directly from the URL. Enter the admin password when prompted. The default development password is `bopinc-admin-2025` — change this immediately using the Settings section before sharing the dashboard with the team.

---

## Projects

**Add a project** — fill in the form at the top. Name, start date, and end date are required. Health score (0–100) indicates project health on the dashboard cards. Team members use the format `Name|Role` separated by commas.

**Edit a project** — click Edit on any row in the table. The form pre-fills with the current values. Click Update project to save.

**Delete a project** — click Delete on any row. You will be asked to confirm. Deletion is permanent in localStorage. If Sheets is configured, the row will need to be manually removed from the projects tab.

**Where the data goes** — saved to `localStorage` under `bopinc_local_projects` immediately. If the Apps Script URL is configured, it also pushes to the projects Sheets tab.

---

## Visits

**Add a visit** — fill in the visitors (Name|Role|Country format), dates, purpose, and in-country schedule. The assigned contact is the Nigeria team member responsible for the visit.

**Edit a visit** — click Edit on any row. The form pre-fills and the button changes to Update visit.

**Delete a visit** — click Delete with confirmation. Permanent in localStorage.

---

## Team roster

**View the team** — shows all team members with role, expertise, and current status. In demo mode, the six demo members are shown. Once you add members using the form, the live roster replaces the demo data.

**Add a team member** — fill in name, email, role, and expertise. The avatar colour (0–7) sets which colour circle appears on the dashboard.

**Edit a member** — click Edit to pre-fill the form. Use this to change a member's role, status, or expertise.

**Remove a member** — click Remove with confirmation. Use this when someone leaves the team.

**Status values:**
- Available — green dot, fully reachable
- Busy — amber dot, in meetings
- On leave — red dot, out of office
- Offline — grey dot

---

## Change requests

Team members submit corrections through the dashboard. Each request shows:
- Who submitted it and when
- The correction type (role, expertise, leave, project, availability)
- What it currently shows versus what it should be
- Any note from the team member

**Approve** — marks the request as approved and, for expertise, role, and availability corrections, automatically applies the change to the roster in localStorage. Project, leave, and name corrections are flagged as approved but must be applied manually (they affect Sheets data).

**Reject** — marks the request as rejected. You can add a reply note that the team member will see.

**Reply notes** — whatever you type in the reply field is stored with the request. The team member sees it on their next view of the change request status.

---

## Sync controls

**Run all syncs now** — triggers the Apps Script to fetch the latest Google Calendar data and write to Sheets. Requires the Apps Script URL to be configured in `config/secrets.js`.

**Calendar only / Slack only** — targeted syncs for when you only want to refresh one data source.

**Clear cache** — removes all sessionStorage cached Sheets data. The dashboard will fetch fresh data on the next page load. Use this if you have just updated data in Sheets and want it to appear immediately without waiting for the 15-minute cache to expire.

**Connection status** — shows whether Google Sheets, the API key, and the Apps Script URL are all configured. Red ✗ means that component is not yet set up and the corresponding feature will not work.

**Admin action log** — a timestamped record of everything done in the admin panel in this browser — projects added, members updated, requests approved, syncs triggered. Stored locally, last 20 entries. Use Clear log to reset it.

---

## Settings

**Change admin password** — enter the current password, then the new one twice. The new password must be at least 12 characters. It takes effect immediately and is stored in `localStorage` — it overrides the dev default without requiring any code change.

**Dashboard information** — a quick status view showing whether Sheets, Apps Script, and other components are configured, plus counts of pending requests and cached projects.

---

## Security notes

- The admin password is stored in `localStorage` as plain text. This is adequate for an internal team tool but not suitable for public-facing deployments.
- Never share the admin URL with team members who should not have admin access.
- The `config/secrets.js` file is gitignored — never commit it to GitHub.
- Change the default password before showing the dashboard to the team.