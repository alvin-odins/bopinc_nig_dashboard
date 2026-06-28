# Projects module

This page explains how the Projects module works — how data flows into it, how project cards are built, and how the team member linking works.

---

## What it shows

The Projects page shows one card per active project in Nigeria. Each card displays:

- Project name, code, and status badge
- Sector tag and date range
- Project lead and account manager
- Team member avatars with live availability dots
- A health score bar
- A short description
- A "request correction" button

Clicking a card opens a detail modal with the full project information.

---

## Data source

Projects come from the `projects` tab in Google Sheets. The dashboard fetches this tab via the Sheets API on every page load (cached for 15 minutes).

Projects added through the admin panel are stored in the browser's local storage until the Apps Script web app is configured, at which point they write directly to the Sheets tab.

---

## How team member linking works

The `teamMembers` column in the projects Sheets tab contains a string like:

```
Fatima Aliyu|Health Lead,Bola Tunde|MEL Specialist
```

`ProjectCard.js` parses this string into an array of objects:

```javascript
[
  { name: 'Fatima Aliyu', role: 'Health Lead' },
  { name: 'Bola Tunde',   role: 'MEL Specialist' },
]
```

It then cross-references each name against the team roster (also fetched from Sheets) to find the person's initials, avatar colour, and current availability status. This is how the coloured availability dots under each avatar know whether the person is available, in meetings, or on leave — without any manual data entry on the project card itself.

If a team member's name in the projects tab does not exactly match a name in the team roster, the avatar still shows but without the availability dot. The fix is to ensure the spelling matches exactly across both tabs.

---

## How the health score works

The `health` column is a number from 0 to 100. It is entered manually by the project lead or admin. The dashboard displays it as a coloured progress bar:

| Score | Colour |
|---|---|
| 75–100 | Green |
| 50–74 | Amber |
| 0–49 | Red |

The health score is intentionally manual — it is a qualitative judgement by the project team, not a computed metric. Phase 5 will add a more detailed tracker (issues, risks, milestones) from which a computed score could be derived.

---

## Project status values

| Status | Badge colour | Meaning |
|---|---|---|
| `active` | Green | Project is running on track |
| `at-risk` | Amber | Running but with emerging concerns |
| `delayed` | Amber | Behind schedule |
| `blocked` | Red | Cannot progress without resolving an issue |
| `completed` | Grey | Delivered and closed |
| `pipeline` | Blue | Approved but not yet started |

---

## Home page integration

The home page shows a single stat card with the count of active projects. Clicking it navigates to the full Projects page.

In Phase 5, the home page will also show a mini project radar — a visual overview of project health across all active projects without needing to open each card individually.

---

## Adding a project

See [how-to-update-data.md](how-to-update-data.md) — adding a new project section.

---

## Requesting a correction

Any team member can flag an incorrect project assignment. Click the pencil icon on any project card to open the correction request form. The request goes to the country director for review. See [04-roles-and-access.md](../getting-started/04-roles-and-access.md) for the full correction request flow.