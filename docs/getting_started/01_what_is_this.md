# What is this system?

No technical background needed to understand this page.

---

## The dashboard in one sentence

The BOPinc Nigeria Dashboard is a website that brings together your team's schedules, projects, opportunities, and alerts in one place — so anyone on the team can see the full picture in under a minute.

---

## The four parts

Think of the system as four rooms. Each room has one job.

### 1. Google Sheets — the filing cabinet
All information lives here: team rosters, project details, opportunities, leave records. The admin updates these directly, like editing a spreadsheet. Nothing about this requires coding.

### 2. Google Apps Script — the courier
Runs automatically every 30 minutes. Picks up new calendar events, Slack messages, and Drive files, then writes the relevant information into the Sheets filing cabinet. You never need to run it manually (though you can trigger it manually from the admin panel if needed).

### 3. The dashboard — the display board
The website everyone sees. It reads from Google Sheets and turns the data into charts, cards, timelines, and alerts. No server to manage — it's hosted on GitHub Pages, which is free and runs automatically.

### 4. The admin panel — the control room
A password-protected page where the country director or designated admin can add opportunities, upload media, manage user roles, and adjust sector keywords for Slack alerts. Only accessible to authorised users.

---

## Who sees what

| Role | Tabs visible | Can edit |
|---|---|---|
| Team member | Home, team pulse, relationships, leave, projects, visits, Slack intel | Own personal status only (via correction request) |
| Partnerships lead | All above + opportunities, funding analysis, global pipeline | Opportunities and pipeline data |
| Country director | All tabs | Everything, including the admin panel |

### The correction request flow

Team members cannot edit data directly. If you see something that looks wrong — an incorrect project assignment, a missing leave day, a wrong expertise tag — you click the "Request a correction" button on any data card. This sends a request to the country director, who reviews and approves or rejects it. You'll see the status of your request (pending, approved, rejected with a note) the next time you log in.

The only exception is your personal status ("Working from home today", "Unavailable this afternoon") — this you can update yourself without needing approval, and it appears as an overlay on the schedule view.

---

## The ten modules

| Module | What it shows | Who can see it |
|---|---|---|
| Home | Today's overview, team availability, activity feed | Everyone |
| Team pulse | Daily and weekly schedule, meetings, focus time, free blocks | Everyone |
| Relationships | Who the Nigeria team collaborates with across BOPinc | Everyone |
| Leave tracker | Nigeria and global team leave, availability calendar | Everyone |
| Projects | Active projects, status, team members, health scores | Everyone |
| Slack intel | Your personal mentions, sector alerts, opportunity signals | Everyone (personalised) |
| Visits | Upcoming and past visits from global and cross-country team | Everyone |
| Opportunities | Sector pipeline, traction, donors, actors | Partnerships lead + director |
| Funding analysis | Capacity vs opportunity by sector, gap recommendations | Partnerships lead + director |
| Global pipeline | Other BOPinc country opportunities, leads, consortia | Partnerships lead + director |

---

## What the amber strip at the top does

The green bar at the very top of every page (called the "pulse strip") shows:
- Today's date
- How many team members are available right now
- The most recent alert or system status

It updates automatically every minute and is always visible, no matter which tab you're on.

---

## Next: how data flows

Read [02-how-data-flows.md](02-how-data-flows.md) to understand the step-by-step journey from a calendar event or Slack message to a card on the dashboard.