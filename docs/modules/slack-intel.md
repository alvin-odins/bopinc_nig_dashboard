# Slack intelligence module
## BOPinc Nigeria Dashboard — Phase 6

The Slack intel page surfaces relevant Slack activity directly inside the dashboard — personalised by role and expertise so each team member only sees what matters to them.

---

## What it shows

**Unread alerts** — new messages sorted by urgency score. Red left border = urgent action needed. Each alert shows the type badge, sector tag where relevant, full message text, sender, channel, and time. A small blue dot marks unread items.

**Urgency scoring** — each message is automatically scored 1–10 based on keywords:
- Score 10: urgent, ASAP, critical, emergency, deadline today
- Score 8: deadline, RFP closes, submission, due date, tomorrow
- Score 6: action needed, please review, need response, awaiting
- Score 4: update, reminder, heads up, FYI
- Score 2: meeting, call, sync

**Sector routing** — messages are matched against sector keywords and routed only to team members whose expertise tag matches that sector. A health sector alert goes to the health lead, not the finance lead.

**Older alerts** — read alerts are collapsed into an expandable section to keep the main view clean.

---

## Alert types

| Type | Icon | When used |
|---|---|---|
| Mention | 💬 | Message contains @name for this team member |
| Opportunity | 🎯 | Message contains RFP, opportunity, bid |
| Deadline | ⏰ | Message contains deadline, due date, submission |
| Meeting | 📅 | Message contains meeting, call, sync |
| Sector alert | 🔍 | Message matches sector keywords |
| Update | 📌 | Everything else |

---

## Setup — connecting Slack

### Step 1 — Create a Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Name: `BOPinc Nigeria Dashboard`
4. Workspace: your BOPinc Slack workspace
5. Click **Create App**

### Step 2 — Enable Event Subscriptions

1. In the app settings, click **Event Subscriptions**
2. Toggle **Enable Events** on
3. In **Request URL**, paste the URL of your `doPostSlack` web app (see Step 4)
4. Under **Subscribe to bot events**, add: `message.channels`, `message.groups`
5. Click **Save Changes**

### Step 3 — Install the app to your workspace

1. Click **Install App** in the sidebar
2. Click **Install to Workspace** → **Allow**
3. Copy the **Bot User OAuth Token** — you will need it if you choose to use the Slack API directly instead of webhooks

### Step 4 — Deploy the Slack webhook receiver

In the Apps Script project:
1. Create a new file called `slack-webhook`
2. The `doPostSlack` function in `sync/slack-sync.gs` is the receiver
3. Deploy it as a **separate web app** (Deploy → New deployment → Web app)
4. Set **Execute as: Me**, **Who has access: Anyone**
5. Copy the web app URL
6. Paste it into the Slack Event Subscription **Request URL** field

### Step 5 — Deploy slack-sync.gs

Add `syncSlack()` to the `runAllSyncs()` function in `sync/triggers.gs`:

```javascript
function runAllSyncs() {
  try { syncAll(); } catch (err) { errors.push(...); }
  try { syncSlack(); } catch (err) { errors.push(...); }
  // ...
}
```

### Step 6 — Verify

1. Post a test message in one of your connected Slack channels
2. The message should appear in the `slack-log` Sheets tab within seconds
3. Run `syncSlack()` manually from the Apps Script editor
4. Check the `slack-alerts` tab — the classified alert should appear
5. Open the dashboard → Slack intel page — the alert should appear for the correct team member

---

## Sheets tabs required

### `slack-log` tab
Populated automatically by the webhook receiver. Each row is one incoming Slack message.

| Column | Description |
|---|---|
| messageId | Slack message timestamp (unique ID) |
| text | Full message text |
| channel | Channel name (e.g. #nigeria-country) |
| sender | Slack user ID of sender |
| timestamp | ISO timestamp when received |
| mentions | Comma-separated @mentions in message |
| processed | TRUE once slack-sync.gs has processed this row |

### `slack-alerts` tab
Written by `slack-sync.gs`. Read by the dashboard every 30 minutes.

| Column | Description |
|---|---|
| id | Unique alert ID |
| text | Message text (truncated to 280 chars) |
| sector | Matched sector(s) comma-separated |
| urgency | Score 1–10 |
| type | mention / opportunity / deadline / meeting / sector / general |
| channel | Source channel |
| sender | Sender name |
| timestamp | When the message was sent |
| routedTo | User ID this alert is routed to |
| routedToName | Display name of recipient |
| read | TRUE once marked read |
| synced | When this row was written |

### `sector-keywords` tab (optional)
If present, overrides the hardcoded keyword lists in `slack-sync.gs`. Two columns: `sector` and `keywords` (comma-separated). Allows the team to manage keywords without code changes.

---

## Customising routing

Routing is controlled by matching the team member's `expertise` field in the `team-roster` Sheets tab against the sector keywords found in each message. To change who receives which alerts:

1. Admin panel → Team roster → Edit the relevant team member
2. Update the expertise field — comma-separated sector names matching the keywords in `SECTOR_KEYWORDS` in `slack-sync.gs`
3. Changes take effect on the next sync

---

## Demo mode

When `sync/slack-sync.gs` is not yet configured, the Slack intel page shows demo alerts from `DEMO_SLACK_ALERTS` in `index.html`. Each demo user (country director, partnerships lead, health lead) has realistic alerts relevant to their role. A notice at the bottom of the page indicates demo mode is active.