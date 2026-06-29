/* ============================================================
   BOPinc Nigeria Dashboard — Trigger Setup
   File: sync/triggers.gs
   
   Run setupTriggers() ONCE from the Apps Script editor
   after deploying calendar-sync.gs and apps-script-api.gs.
   This creates the scheduled sync and error alerting.
   ============================================================ */

const ADMIN_EMAIL = 'PASTE_ADMIN_EMAIL_HERE'; /* e.g. amaka@bopinc.org */

/* ════════════════════════════════════════
   SETUP — run once to install triggers
════════════════════════════════════════ */
function setupTriggers() {
  /* Remove any existing triggers first (prevents duplicates) */
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  
  /* Calendar sync every 30 minutes */
  ScriptApp.newTrigger('runAllSyncs')
    .timeBased()
    .everyMinutes(30)
    .create();
  
  /* Daily summary email at 7am Lagos time (UTC+1) */
  ScriptApp.newTrigger('sendDailySummary')
    .timeBased()
    .atHour(6)        /* 6am UTC = 7am Lagos */
    .everyDays(1)
    .create();
  
  Logger.log('[Triggers] Installed: 30-min sync + daily summary at 7am.');
  Logger.log('[Triggers] Run runAllSyncs() now to test the first sync.');
}


/* ════════════════════════════════════════
   MAIN SCHEDULED FUNCTION
   Called every 30 minutes by the time trigger.
════════════════════════════════════════ */
function runAllSyncs() {
  const start = Date.now();
  const errors = [];

  try {
    syncAll(); /* from calendar-sync.gs */
  } catch (err) {
    errors.push(`Calendar sync: ${err.message}`);
    Logger.log(`[Triggers] Calendar sync error: ${err.message}`);
  }

  try {
    syncSlack(); /* from slack-sync.gs — added Phase 6 */
  } catch (err) {
    errors.push(`Slack sync: ${err.message}`);
    Logger.log(`[Triggers] Slack sync error: ${err.message}`);
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  Logger.log(`[Triggers] All syncs complete in ${elapsed}s. Errors: ${errors.length}`);
  
  /* Email admin if errors occurred */
  if (errors.length > 0 && ADMIN_EMAIL && ADMIN_EMAIL !== 'PASTE_ADMIN_EMAIL_HERE') {
    try {
      MailApp.sendEmail({
        to:      ADMIN_EMAIL,
        subject: `BOPinc Dashboard — Sync error (${new Date().toLocaleDateString()})`,
        body:    `The following errors occurred during the scheduled sync:\n\n${errors.join('\n\n')}\n\nCheck the Apps Script execution log for details:\nhttps://script.google.com`,
      });
    } catch (mailErr) {
      Logger.log(`[Triggers] Could not send error email: ${mailErr.message}`);
    }
  }
}


/* ════════════════════════════════════════
   DAILY SUMMARY EMAIL
   Sends a brief digest to the admin each morning.
════════════════════════════════════════ */
function sendDailySummary() {
  if (!ADMIN_EMAIL || ADMIN_EMAIL === 'PASTE_ADMIN_EMAIL_HERE') return;
  
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const today = Utilities.formatDate(
      new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'
    );
    
    /* Count today's events */
    const evSheet = ss.getSheetByName('calendar-events');
    const evCount = evSheet
      ? evSheet.getDataRange().getValues()
          .slice(1)
          .filter(row => (row[13] || '').toString().startsWith(today))
          .length
      : 0;
    
    /* Count people on leave today */
    const lvSheet = ss.getSheetByName('leave-records');
    const onLeave = lvSheet
      ? lvSheet.getDataRange().getValues()
          .slice(1)
          .filter(row => {
            const start = (row[4] || '').toString();
            const end   = (row[5] || '').toString();
            return start <= today && end >= today;
          })
          .map(row => row[2])
      : [];
    
    MailApp.sendEmail({
      to:      ADMIN_EMAIL,
      subject: `BOPinc Nigeria Dashboard — Daily digest ${today}`,
      body:    [
        `Good morning,`,
        ``,
        `Dashboard daily digest for ${today}:`,
        ``,
        `• Calendar events synced today: ${evCount}`,
        `• Team members on leave: ${onLeave.length > 0 ? onLeave.join(', ') : 'None'}`,
        ``,
        `View the dashboard: https://YOUR-ORG.github.io/bopinc-nigeria-dashboard/`,
        ``,
        `— BOPinc Nigeria Dashboard (automated)`,
      ].join('\n'),
    });
    
    Logger.log(`[Triggers] Daily summary sent to ${ADMIN_EMAIL}`);
  } catch (err) {
    Logger.log(`[Triggers] Daily summary error: ${err.message}`);
  }
}


/* ════════════════════════════════════════
   REMOVE ALL TRIGGERS
   Run this if you need to reset.
════════════════════════════════════════ */
function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log(`[Triggers] Removed ${triggers.length} triggers.`);
}


/* ════════════════════════════════════════
   LIST ACTIVE TRIGGERS
   Run to check what is currently installed.
════════════════════════════════════════ */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  if (triggers.length === 0) {
    Logger.log('[Triggers] No triggers installed. Run setupTriggers().');
    return;
  }
  triggers.forEach(t => {
    Logger.log(`[Triggers] ${t.getHandlerFunction()} — ${t.getEventType()} — ${t.getTriggerSource()}`);
  });
}