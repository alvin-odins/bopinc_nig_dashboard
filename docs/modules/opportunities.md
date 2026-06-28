# Opportunities and funding analysis
## BOPinc Nigeria Dashboard — Phase 5

Phase 5 adds two strategy-level pages visible only to the partnerships lead and country director: the opportunities pipeline and funding analysis.

---

## Access

Both pages are restricted to `partnerships_lead`, `country_director`, and `superadmin` roles. Team members see a lock screen when they navigate to these sections.

---

## Opportunities page

### What it shows

- **Pipeline map** — a bubble chart where each bubble is one opportunity. The horizontal axis is sector, the vertical axis is probability of winning, and the bubble size represents the funding value. Clicking a bubble opens a detail card.
- **Capacity gap analysis** — compares the sectors of active and pipeline opportunities against the expertise tags of team members. Flags any sector where there is an open opportunity but no team member with matching expertise.
- **Filter bar** — filter the chart and table by status: All, Active, Pipeline, At risk, Won.
- **Opportunities table** — a sortable list of all opportunities showing name, funder, sector, deadline, value, probability, and status.

### Data format for the opportunities Sheets tab

| Column | Description | Example |
|---|---|---|
| id | Unique identifier | op_001 |
| name | Opportunity name | USAID Rural Energy |
| sector | Must match team expertise tags | Energy |
| value | Funding value in USD (number only) | 2500000 |
| status | active / pipeline / at-risk / won / closed | active |
| funder | Organisation providing funding | USAID |
| deadline | Proposal deadline YYYY-MM-DD | 2025-09-30 |
| probability | Estimated win probability 0–100 | 75 |
| teamLead | Assigned team member name | Chidi N. |
| description | Brief description | Rural electrification for 12 communities |

### Capacity gap engine

The capacity gap engine reads team expertise from `localStorage` (if roster has been populated via admin panel) or falls back to a default list. It compares the sectors of all active and pipeline opportunities against the available expertise tags and highlights any sectors not covered by at least one team member.

To update team expertise: Admin panel → Team roster → Edit each member → update expertise field.

---

## Funding analysis page

### What it shows

- **Summary stats** — total tracked funding, active/won, pipeline, and at-risk values with percentage of total
- **Stacked bar chart** — one row per sector, each bar segmented by status. Bar width is proportional to value relative to the highest-value sector.
- **Sector breakdown table** — same data in tabular form with per-status values and sector totals

### Data source

The funding analysis page is driven entirely by the same opportunities data — no separate funding tab is needed. It aggregates `value` by `sector` and `status` from the opportunities Sheets tab.

---

## Adding opportunities

Add rows directly to the `opportunities` tab in your Google Sheets document using the column format above. The dashboard syncs every 30 minutes, or you can trigger an immediate sync from Admin panel → Sync controls → Run all syncs now.

---

## Phase 7 additions

Phase 7 will add the global pipeline page, which shows BOPinc-wide opportunity data across all country offices alongside the Nigeria entries.