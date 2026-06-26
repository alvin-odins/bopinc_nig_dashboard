# Contributing to the BOPinc Nigeria Dashboard

This guide explains how to suggest and make changes to the dashboard. It is written for everyone on the BOPinc Nigeria team — not just developers.

---

## Before you start

1. Make sure you have been added to the repository by the admin (you need write access to push changes)
2. Pull the latest version of the code before making any edits — see the GitHub guide in the docs
3. Never edit files directly on the `main` branch — always create a new branch first

---

## Branch naming

Name your branch so anyone can understand what it contains at a glance.

**Format:** `type/short-description-with-dashes`

**Types:**

| Type | When to use it |
|---|---|
| `feat` | Adding a new feature or module |
| `fix` | Fixing something that is broken |
| `docs` | Adding or updating documentation |
| `content` | Updating data content (keywords, team info, etc.) |
| `style` | Visual or CSS changes only, no logic changes |
| `sync` | Changes to a Google Apps Script sync file |

**Examples:**
```
feat/phase-2-sheets-connection
fix/leave-heatmap-weekend-display
docs/add-slack-intel-module-guide
content/update-energy-sector-keywords
style/adjust-sidebar-spacing-mobile
sync/add-opportunity-keyword-matcher
```

---

## Commit messages

A commit message is a short plain-English note describing what you changed. Future you — and your teammates — will thank you for writing clear ones.

**Rules:**
- Start with a lowercase verb: `add`, `fix`, `update`, `remove`, `rename`
- Keep it under 72 characters
- No full stop at the end
- No vague words like "update", "changes", or "stuff"

**Good examples:**
```
add USAID rural energy opportunity to Nigeria pipeline
fix leave tracker not showing Emeka's annual leave
update Chidi expertise tag from health to energy
remove outdated Q1 visit record
add deadline urgency keyword to Slack matcher
```

**Bad examples:**
```
update                    ← too vague
fix stuff                 ← tells nobody anything
WIP                       ← never commit work in progress to a shared branch
FINAL FINAL v3            ← this is not what commits are for
```

If your change needs more explanation, add a second line after a blank line:
```
add USAID rural energy opportunity

Includes estimated funding value of $2.4M, two consortium partners,
and deadline of 15 March. Needs country director review before publishing.
```

---

## Pull request process

A pull request (PR) is a request to merge your branch into `main` — which makes it live on the dashboard.

### Writing a good PR description

When you open a pull request, fill in:

**Title:** Same format as your commit message — short, specific, verb first.

**Description — answer these three questions:**
1. What did you change?
2. Why did you change it?
3. Anything the reviewer needs to check or be aware of?

**Example PR description:**
```
Add USAID rural energy opportunity to Nigeria pipeline

Added the USAID West Africa Rural Energy Access opportunity to the
opportunities tab. Includes sector tag (energy), funding estimate
($2.4M), two consortium partners (REAN, ASES Nigeria), and deadline.

Please check: the funding value is an estimate — Chidi to confirm
exact figure before this is merged.
```

### Review expectations

- PRs that change data or content (not code): reviewed within 1 working day
- PRs that change code or sync scripts: reviewed within 2 working days
- Urgent fixes (site broken): tag the admin directly on Slack — do not wait for normal review

### Who reviews what

| Change type | Reviewer |
|---|---|
| Content and data updates | Country director or partnerships lead |
| CSS / layout changes | Any team member with design eye + admin sign-off |
| JavaScript or sync scripts | Admin or technical lead |
| Documentation | Any team member |

---

## What not to do

- **Do not push secrets.** The `config/secrets.js` file must never be committed. It is in `.gitignore` for this reason. If you accidentally commit it, contact the admin immediately — the API key must be rotated.
- **Do not push directly to `main`.** Every change goes through a branch and a pull request, no exceptions.
- **Do not merge your own pull request** unless you are the only person on the project and have confirmed the change is safe.
- **Do not rename Sheets tabs** without updating the corresponding reference in the sync scripts — the scripts will break silently if a tab name changes.

---

## Questions?

If you are unsure about anything in this guide, ask in the `#nigeria-dashboard` Slack channel before making a change. It is always better to ask first.