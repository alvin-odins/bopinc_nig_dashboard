/* ============================================================
   BOPinc Nigeria Dashboard — Secrets Template
   
   THIS FILE IS A TEMPLATE ONLY — safe to commit.
   
   To set up secrets:
   1. Copy this file and rename the copy to: config/secrets.js
   2. Fill in your real values in config/secrets.js
   3. config/secrets.js is in .gitignore — it will NEVER be committed
   4. Keep a secure backup of config/secrets.js outside the repo
   
   If you accidentally commit config/secrets.js:
   - Rotate the API key immediately at console.cloud.google.com
   - Contact the admin to purge it from git history
   ============================================================ */

const SECRETS = {

  /* Google Sheets API key
     Get this from: console.cloud.google.com → APIs → Credentials → API key
     Restrict it to: Sheets API + your GitHub Pages domain only */
  SHEETS_API_KEY: 'YOUR_GOOGLE_SHEETS_API_KEY_HERE',

  /* Admin panel password (hashed — do not store plain text)
     Generate a bcrypt hash at: bcrypt-generator.com (cost factor 10)
     Example plain text: 'bopinc-nigeria-2025' → paste the hash below */
  ADMIN_PASSWORD_HASH: 'YOUR_BCRYPT_HASH_HERE',

  /* Apps Script web app URL (for write operations — POST to Sheets)
     Get this after deploying sync/apps-script-api.gs:
     Apps Script editor → Deploy → New deployment → Web app → Copy URL */
  APPS_SCRIPT_URL: 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE',

  /* Slack Bot Token (for Phase 6 — leave empty for now)
     Get this from: api.slack.com/apps → your app → OAuth & Permissions */
  SLACK_BOT_TOKEN: '',

};

/* Export */
if (typeof module !== 'undefined') {
  module.exports = { SECRETS };
}