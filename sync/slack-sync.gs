/* ============================================================
   BOPinc Nigeria Dashboard — Slack Intelligence Sync
   File: sync/slack-sync.gs

   Reads incoming Slack messages from a connected Slack app
   webhook log (stored in a Sheets tab called 'slack-log'),
   classifies each message by sector keyword, scores urgency,
   routes to the correct team member based on their expertise,
   and writes structured alerts to the 'slack-alerts' tab.

   Deploy alongside calendar-sync.gs in the same Apps Script
   project. Add syncSlack() to the existing 30-min trigger
   in triggers.gs.

   Setup:
   1. Create a Slack app at api.slack.com/apps
   2. Enable incoming webhooks and event subscriptions
   3. Point the event subscription URL to a second Apps Script
      web app that appends incoming messages to 'slack-log'
   4. Run authoriseSlackSync() once to grant permissions
   5. Add syncSlack() to runAllSyncs() in triggers.gs
============================================================ */

/* ── Sector keywords — must match team expertise tags ── */
const SECTOR_KEYWORDS = {
  energy:       ['energy','solar','renewable','power','electricity','grid','off-grid'],
  agriculture:  ['agriculture','farming','smallholder','crop','livestock','food','agri'],
  health:       ['health','healthcare','medical','clinic','hiv','malaria','nutrition'],
  wash:         ['wash','water','sanitation','hygiene','borehole','latrine'],
  education:    ['education','school','learning','literacy','teacher','girls'],
  finance:      ['finance','financial','inclusion','savings','credit','insurance','microfinance'],
  livelihoods:  ['livelihoods','livelihood','enterprise','income','employment','youth'],
  gender:       ['gender','women','gbv','sgbv','empowerment','female'],
};

/* ── Urgency keywords — higher score = more urgent ── */
const URGENCY_RULES = [
  { score: 10, keywords: ['urgent','asap','immediately','deadline today','critical','emergency'] },
  { score:  8, keywords: ['deadline','due date','rfp closes','submission','tonight','tomorrow'] },
  { score:  6, keywords: ['action needed','please review','need response','awaiting','follow up'] },
  { score:  4, keywords: ['update','please note','fyi','heads up','reminder'] },
  { score:  2, keywords: ['meeting','call','sync','catch up'] },
];

/* ── Alert types ── */
const ALERT_TYPES = {
  mention:     'mention',
  opportunity: 'opportunity',
  deadline:    'deadline',
  meeting:     'meeting',
  sector:      'sector',
  general:     'general',
};


/* ════════════════════════════════════════
   MAIN ENTRY POINT
   Called by triggers.gs every 30 minutes.
════════════════════════════════════════ */
function syncSlack() {
  const ss        = SpreadsheetApp.openById(SPREADSHEET_ID);
  const logSheet  = ss.getSheetByName('slack-log');
  const roster    = getRoster(ss); /* from calendar-sync.gs */

  if (!logSheet) {
    Logger.log('[Slack] No slack-log tab found. Create it or connect Slack webhook.');
    return;
  }

  const messages  = readSlackLog(logSheet);
  if (messages.length === 0) {
    Logger.log('[Slack] No new messages to process.');
    return;
  }

  Logger.log(`[Slack] Processing ${messages.length} messages.`);

  const alerts = messages.flatMap(msg => classifyMessage(msg, roster));
  writeAlerts(ss, alerts);
  markProcessed(logSheet, messages);

  Logger.log(`[Slack] Wrote ${alerts.length} alerts.`);
}


/* ════════════════════════════════════════
   READ UNPROCESSED SLACK LOG ROWS
════════════════════════════════════════ */
function readSlackLog(sheet) {
  const data    = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim().toLowerCase());
  const processed = headers.indexOf('processed');

  return data.slice(1)
    .filter(row => !row[processed]) /* only unprocessed rows */
    .map((row, i) => ({
      _rowIndex:  i + 2, /* 1-indexed, skip header */
      messageId:  row[headers.indexOf('messageid')] || '',
      text:       row[headers.indexOf('text')]      || '',
      channel:    row[headers.indexOf('channel')]   || '',
      sender:     row[headers.indexOf('sender')]    || '',
      timestamp:  row[headers.indexOf('timestamp')] || new Date().toISOString(),
      mentions:   (row[headers.indexOf('mentions')] || '').toString().split(',').map(m => m.trim()).filter(Boolean),
    }));
}


/* ════════════════════════════════════════
   CLASSIFY A SINGLE MESSAGE
   Returns one or more alert objects.
════════════════════════════════════════ */
function classifyMessage(msg, roster) {
  const text    = (msg.text || '').toLowerCase();
  const alerts  = [];

  /* Detect sector matches */
  const matchedSectors = [];
  Object.entries(SECTOR_KEYWORDS).forEach(([sector, keywords]) => {
    if (keywords.some(kw => text.includes(kw))) {
      matchedSectors.push(sector);
    }
  });

  /* Score urgency */
  let urgencyScore = 1;
  URGENCY_RULES.forEach(rule => {
    if (rule.keywords.some(kw => text.includes(kw))) {
      urgencyScore = Math.max(urgencyScore, rule.score);
    }
  });

  /* Detect alert type */
  let alertType = ALERT_TYPES.general;
  if (msg.mentions.length > 0)                           alertType = ALERT_TYPES.mention;
  else if (text.includes('rfp') || text.includes('opportunity') || text.includes('bid'))
                                                          alertType = ALERT_TYPES.opportunity;
  else if (text.includes('deadline') || text.includes('due'))
                                                          alertType = ALERT_TYPES.deadline;
  else if (text.includes('meeting') || text.includes('call') || text.includes('sync'))
                                                          alertType = ALERT_TYPES.meeting;
  else if (matchedSectors.length > 0)                    alertType = ALERT_TYPES.sector;

  /* Route to team members */
  const routedTo = routeAlert(msg, matchedSectors, roster);

  /* Create one alert per routed recipient */
  routedTo.forEach(recipient => {
    alerts.push({
      id:           `sl_${msg.messageId}_${recipient.id}`,
      text:         truncate(msg.text, 280),
      sector:       matchedSectors.join(', '),
      urgency:      urgencyScore,
      type:         alertType,
      channel:      msg.channel,
      sender:       msg.sender,
      timestamp:    msg.timestamp,
      routedTo:     recipient.id,
      routedToName: recipient.name,
      read:         false,
      synced:       new Date().toISOString(),
    });
  });

  return alerts;
}


/* ════════════════════════════════════════
   ROUTE ALERT TO CORRECT TEAM MEMBERS
════════════════════════════════════════ */
function routeAlert(msg, sectors, roster) {
  const recipients = new Set();
  const result     = [];

  /* Always route mentions directly */
  msg.mentions.forEach(mention => {
    const member = roster.find(m =>
      m.email.startsWith(mention.replace('@','')) ||
      m.name.toLowerCase().includes(mention.replace('@','').toLowerCase())
    );
    if (member && !recipients.has(member.id)) {
      recipients.add(member.id);
      result.push(member);
    }
  });

  /* Route sector alerts to matching expertise */
  if (sectors.length > 0) {
    roster.forEach(member => {
      const expertise = (member.expertise || '').toLowerCase().split(',').map(e => e.trim());
      const match     = sectors.some(s => expertise.includes(s));
      if (match && !recipients.has(member.id)) {
        recipients.add(member.id);
        result.push(member);
      }
    });
  }

  /* If no specific routing, send to country director */
  if (result.length === 0) {
    const director = roster.find(m => m.role === 'country_director');
    if (director) result.push(director);
  }

  return result;
}


/* ════════════════════════════════════════
   WRITE ALERTS TO slack-alerts TAB
════════════════════════════════════════ */
function writeAlerts(ss, alerts) {
  let sheet = ss.getSheetByName('slack-alerts');
  if (!sheet) {
    sheet = ss.insertSheet('slack-alerts');
    Logger.log('[Slack] Created slack-alerts tab.');
  }

  const headers = [
    'id','text','sector','urgency','type',
    'channel','sender','timestamp',
    'routedTo','routedToName','read','synced',
  ];

  /* Ensure header row exists */
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#2e6843').setFontColor('#ffffff').setFontWeight('bold');
  }

  if (alerts.length === 0) return;

  const rows = alerts.map(a => headers.map(h => a[h] !== undefined ? a[h] : ''));
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
}


/* ════════════════════════════════════════
   MARK PROCESSED ROWS IN SLACK LOG
════════════════════════════════════════ */
function markProcessed(logSheet, messages) {
  const headers = logSheet.getRange(1, 1, 1, logSheet.getLastColumn())
    .getValues()[0].map(h => h.toString().trim().toLowerCase());
  const processedCol = headers.indexOf('processed') + 1; /* 1-indexed */
  if (processedCol < 1) return;

  messages.forEach(msg => {
    logSheet.getRange(msg._rowIndex, processedCol).setValue(true);
  });
}


/* ════════════════════════════════════════
   HELPERS
════════════════════════════════════════ */
function truncate(str, max) {
  return (str || '').length > max ? str.slice(0, max - 1) + '…' : (str || '');
}


/* ════════════════════════════════════════
   ONE-TIME AUTHORISATION
   Run once from Apps Script editor.
════════════════════════════════════════ */
function authoriseSlackSync() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('[Slack] Authorised. Sheets access confirmed: ' + ss.getName());
  Logger.log('[Slack] Ready — add syncSlack() to runAllSyncs() in triggers.gs.');
}


/* ════════════════════════════════════════
   SLACK WEBHOOK RECEIVER
   Deploy this as a separate web app and point
   your Slack Event Subscription URL to it.
   It appends incoming messages to 'slack-log'.
════════════════════════════════════════ */
function doPostSlack(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    /* Slack URL verification challenge */
    if (payload.type === 'url_verification') {
      return ContentService.createTextOutput(payload.challenge);
    }

    /* Handle message events */
    if (payload.event && payload.event.type === 'message') {
      const ev   = payload.event;
      const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet  = ss.getSheetByName('slack-log');

      if (!sheet) {
        sheet = ss.insertSheet('slack-log');
        sheet.getRange(1, 1, 1, 6).setValues([['messageId','text','channel','sender','timestamp','mentions','processed']]);
      }

      /* Extract mentions from text (<@UXXXXXXX> pattern) */
      const mentions = (ev.text || '').match(/<@[A-Z0-9]+>/g) || [];

      sheet.appendRow([
        ev.ts       || '',
        ev.text     || '',
        ev.channel  || '',
        ev.user     || '',
        new Date().toISOString(),
        mentions.join(','),
        false,
      ]);
    }

    return ContentService.createTextOutput('ok');
  } catch (err) {
    Logger.log('[Slack webhook] Error: ' + err.message);
    return ContentService.createTextOutput('error');
  }
}