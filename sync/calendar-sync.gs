/* ============================================================
   BOPinc Nigeria Dashboard — Calendar Sync Engine
   File: sync/calendar-sync.gs
   
   Deploy this in Google Apps Script (script.google.com):
   1. Create a new Apps Script project
   2. Paste this file content
   3. Set SPREADSHEET_ID below to your Sheets document ID
   4. Run authoriseCalendarSync() once to grant permissions
   5. Then run syncAll() to test
   6. Set up the time trigger in triggers.gs
   ============================================================ */

/* ── Configuration ── */
const SPREADSHEET_ID = 'PASTE_YOUR_SHEETS_ID_HERE';
const DAYS_AHEAD     = 60;   /* How many days forward to sync */
const DAYS_BACK      = 14;   /* How many days back to sync */

/* ── Sheet tab names (must match sheets-config.js) ── */
const TABS = {
  TEAM_ROSTER:     'team-roster',
  CALENDAR_EVENTS: 'calendar-events',
  LEAVE_RECORDS:   'leave-records',
};

/* ── Leave keywords — calendar events containing these words
      are classified as leave rather than meetings ── */
const LEAVE_KEYWORDS = [
  'annual leave', 'sick leave', 'sick day', 'leave', 'annual',
  'holiday', 'vacation', 'out of office', 'ooo', 'compassionate',
  'maternity', 'paternity', 'study leave', 'pl', 'al',
];

/* ── Meeting keywords — used to classify event type ── */
const MEETING_KEYWORDS = [
  'call', 'meeting', 'sync', 'catch up', 'catch-up', 'review',
  'briefing', 'workshop', 'training', 'interview', 'presentation',
];


/* ════════════════════════════════════════
   MAIN ENTRY POINT
   Called by the time trigger every 30 minutes.
   Also callable manually from the Apps Script editor.
════════════════════════════════════════ */
function syncAll() {
  const ss        = SpreadsheetApp.openById(SPREADSHEET_ID);
  const roster    = getRoster(ss);
  const startDate = new Date();
  const endDate   = new Date();
  
  startDate.setDate(startDate.getDate() - DAYS_BACK);
  endDate.setDate(endDate.getDate() + DAYS_AHEAD);
  
  Logger.log(`[CalSync] Syncing ${roster.length} team members | ${fmtDate(startDate)} → ${fmtDate(endDate)}`);
  
  const allEvents = [];
  const allLeave  = [];
  
  roster.forEach(member => {
    if (!member.calendarId) {
      Logger.log(`[CalSync] Skipping ${member.name} — no calendarId`);
      return;
    }
    
    try {
      const events = getCalendarEvents(member, startDate, endDate);
      events.forEach(e => {
        if (e.isLeave) {
          allLeave.push(e);
        } else {
          allEvents.push(e);
        }
      });
      Logger.log(`[CalSync] ${member.name}: ${events.length} events (${events.filter(e=>e.isLeave).length} leave)`);
    } catch (err) {
      Logger.log(`[CalSync] ERROR for ${member.name}: ${err.message}`);
    }
  });
  
  writeCalendarEvents(ss, allEvents);
  writeLeaveRecords(ss, allLeave);
  
  /* Update last-synced timestamp in a named range */
  try {
    const range = ss.getRangeByName('lastSyncTime');
    if (range) range.setValue(new Date().toISOString());
  } catch (_) {}
  
  Logger.log(`[CalSync] Complete. ${allEvents.length} events, ${allLeave.length} leave records written.`);
}


/* ════════════════════════════════════════
   READ TEAM ROSTER FROM SHEETS
════════════════════════════════════════ */
function getRoster(ss) {
  const sheet  = ss.getSheetByName(TABS.TEAM_ROSTER);
  if (!sheet) {
    Logger.log('[CalSync] ERROR: team-roster tab not found');
    return [];
  }
  
  const data    = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim().toLowerCase());
  
  /* Find column indices */
  const col = {
    id:         headers.indexOf('id'),
    name:       headers.indexOf('name'),
    email:      headers.indexOf('email'),
    calendarId: headers.indexOf('calendarid'),
    role:       headers.indexOf('role'),
    initials:   headers.indexOf('initials'),
    avatarColor:headers.indexOf('avatarcolor'),
    expertise:  headers.indexOf('expertise'),
  };
  
  return data.slice(1)
    .filter(row => row[col.name])
    .map(row => ({
      id:          row[col.id]          || '',
      name:        row[col.name]        || '',
      email:       row[col.email]       || '',
      calendarId:  row[col.calendarId]  || row[col.email] || '',
      role:        row[col.role]        || 'team_member',
      initials:    row[col.initials]    || '',
      avatarColor: row[col.avatarColor] || 0,
      expertise:   row[col.expertise]   || '',
    }));
}


/* ════════════════════════════════════════
   FETCH EVENTS FROM GOOGLE CALENDAR
════════════════════════════════════════ */
function getCalendarEvents(member, startDate, endDate) {
  let calendar;
  try {
    calendar = CalendarApp.getCalendarById(member.calendarId);
    if (!calendar) {
      /* Try by email if ID not found */
      calendar = CalendarApp.getCalendarById(member.email);
    }
    if (!calendar) throw new Error('Calendar not found');
  } catch (err) {
    Logger.log(`[CalSync] Cannot access calendar for ${member.name}: ${err.message}`);
    return [];
  }
  
  const events  = calendar.getEvents(startDate, endDate);
  const results = [];
  
  events.forEach(ev => {
    const title    = (ev.getTitle() || '').toLowerCase();
    const isAllDay = ev.isAllDayEvent();
    const start    = ev.getStartTime();
    const end      = ev.getEndTime();
    const isLeave  = isAllDay && LEAVE_KEYWORDS.some(kw => title.includes(kw));
    
    /* Classify event type */
    let eventType = 'focus';
    if (isLeave) {
      eventType = 'leave';
    } else if (MEETING_KEYWORDS.some(kw => title.includes(kw))) {
      eventType = 'meeting';
    } else if (ev.getGuestList().length > 0) {
      eventType = 'meeting';
    }
    
    results.push({
      id:          `${member.id}_${ev.getId().slice(-8)}`,
      userId:      member.id,
      userName:    member.name,
      userInitials:member.initials,
      avatarColor: member.avatarColor,
      title:       ev.getTitle() || 'Untitled',
      type:        eventType,
      isLeave,
      isAllDay,
      start:       start.toISOString(),
      end:         end.toISOString(),
      startHour:   isAllDay ? 0  : start.getHours() + start.getMinutes() / 60,
      endHour:     isAllDay ? 24 : end.getHours()   + end.getMinutes()   / 60,
      date:        fmtDate(start),
      week:        getWeekKey(start),
      location:    ev.getLocation() || '',
      description: (ev.getDescription() || '').slice(0, 200),
      synced:      new Date().toISOString(),
    });
  });
  
  return results;
}


/* ════════════════════════════════════════
   WRITE CALENDAR EVENTS TO SHEETS
════════════════════════════════════════ */
function writeCalendarEvents(ss, events) {
  let sheet = ss.getSheetByName(TABS.CALENDAR_EVENTS);
  
  if (!sheet) {
    sheet = ss.insertSheet(TABS.CALENDAR_EVENTS);
    Logger.log('[CalSync] Created calendar-events tab');
  }
  
  const headers = [
    'id','userId','userName','userInitials','avatarColor',
    'title','type','isLeave','isAllDay',
    'start','end','startHour','endHour',
    'date','week','location','description','synced',
  ];
  
  /* Clear and rewrite — full refresh every sync */
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (events.length === 0) return;
  
  const rows = events.map(e => headers.map(h => e[h] !== undefined ? e[h] : ''));
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  
  /* Format header row */
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#2e6843')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  
  Logger.log(`[CalSync] Wrote ${events.length} rows to ${TABS.CALENDAR_EVENTS}`);
}


/* ════════════════════════════════════════
   WRITE LEAVE RECORDS TO SHEETS
════════════════════════════════════════ */
function writeLeaveRecords(ss, leaveEvents) {
  let sheet = ss.getSheetByName(TABS.LEAVE_RECORDS);
  
  if (!sheet) {
    sheet = ss.insertSheet(TABS.LEAVE_RECORDS);
    Logger.log('[CalSync] Created leave-records tab');
  }
  
  const headers = [
    'id','userId','userName','type','startDate',
    'endDate','durationDays','status','synced',
  ];
  
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (leaveEvents.length === 0) return;
  
  /* Merge consecutive all-day leave events per person into single records */
  const merged = mergeLeaveEvents(leaveEvents);
  
  const rows = merged.map(e => [
    e.id, e.userId, e.userName,
    classifyLeaveType(e.title),
    e.start.slice(0, 10),       /* YYYY-MM-DD */
    e.end.slice(0, 10),
    e.durationDays,
    'approved',                  /* All calendar entries treated as approved */
    new Date().toISOString(),
  ]);
  
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#2e6843')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  
  Logger.log(`[CalSync] Wrote ${merged.length} leave records`);
}


/* ════════════════════════════════════════
   HELPER FUNCTIONS
════════════════════════════════════════ */

function classifyLeaveType(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('sick') || t.includes('medical')) return 'Sick leave';
  if (t.includes('maternity'))    return 'Maternity leave';
  if (t.includes('paternity'))    return 'Paternity leave';
  if (t.includes('compassionate'))return 'Compassionate leave';
  if (t.includes('study'))        return 'Study leave';
  if (t.includes('public') || t.includes('holiday')) return 'Public holiday';
  return 'Annual leave';
}

function mergeLeaveEvents(events) {
  /* Group by userId, then merge consecutive date ranges */
  const byUser = {};
  events.forEach(e => {
    if (!byUser[e.userId]) byUser[e.userId] = [];
    byUser[e.userId].push(e);
  });
  
  const result = [];
  Object.values(byUser).forEach(userEvents => {
    userEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    let current = null;
    userEvents.forEach(ev => {
      if (!current) {
        current = { ...ev, durationDays: 1 };
      } else {
        const prevEnd  = new Date(current.end);
        const thisStart= new Date(ev.start);
        const gap      = (thisStart - prevEnd) / 86400000;
        if (gap <= 3) { /* Merge if gap is a weekend or 1 day */
          current.end = ev.end;
          current.durationDays += 1;
        } else {
          result.push(current);
          current = { ...ev, durationDays: 1 };
        }
      }
    });
    if (current) result.push(current);
  });
  
  return result;
}

function fmtDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getWeekKey(date) {
  const d     = new Date(date);
  const day   = d.getDay();
  const diff  = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday= new Date(d.setDate(diff));
  return fmtDate(monday);
}


/* ════════════════════════════════════════
   ONE-TIME AUTHORISATION
   Run this once from the Apps Script editor
   to grant calendar read permissions.
════════════════════════════════════════ */
function authoriseCalendarSync() {
  const calendars = CalendarApp.getAllCalendars();
  Logger.log(`[CalSync] Authorised. Found ${calendars.length} calendars accessible.`);
  Logger.log('[CalSync] Ready. Now run syncAll() to test.');
}


/* ════════════════════════════════════════
   MANUAL SYNC — call from admin panel trigger
════════════════════════════════════════ */
function manualSync() {
  Logger.log('[CalSync] Manual sync triggered.');
  syncAll();
}