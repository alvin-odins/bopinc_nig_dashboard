/* ============================================================
   BOPinc Nigeria Dashboard — Apps Script Web App API
   File: sync/apps-script-api.gs
   
   Deploy as a web app:
   Apps Script editor → Deploy → New deployment
   → Type: Web app
   → Execute as: Me (your Google account)
   → Who has access: Anyone (requests authenticated by app)
   → Copy the web app URL
   → Paste into config/secrets.js as APPS_SCRIPT_URL
   ============================================================ */

/* ── Allowed actions ── */
const ALLOWED_ACTIONS = ['append', 'update', 'pendingChanges'];

/* ── Tab name whitelist — only these tabs can be written to ── */
const WRITABLE_TABS = [
  'pending-changes',
  'projects',
  'visits',
  'opportunities',
  'team-roster',
];


/* ════════════════════════════════════════
   HTTP POST HANDLER
   All dashboard write operations come through here.
════════════════════════════════════════ */
function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;
    const tab    = body.tab;
    
    /* Validate */
    if (!ALLOWED_ACTIONS.includes(action)) {
      return respond({ success: false, error: `Unknown action: ${action}` }, headers);
    }
    if (!WRITABLE_TABS.includes(tab)) {
      return respond({ success: false, error: `Tab not writable: ${tab}` }, headers);
    }
    
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(tab);
    
    if (!sheet) {
      return respond({ success: false, error: `Tab not found: ${tab}` }, headers);
    }
    
    /* Route to handler */
    if (action === 'append') {
      return respond(handleAppend(sheet, body.data), headers);
    }
    
    if (action === 'update') {
      return respond(handleUpdate(sheet, body.id, body.data), headers);
    }
    
    if (action === 'pendingChanges') {
      return respond(handleGetPending(ss), headers);
    }
    
  } catch (err) {
    Logger.log(`[API] POST error: ${err.message}`);
    return respond({ success: false, error: err.message }, headers);
  }
}


/* ════════════════════════════════════════
   HTTP GET HANDLER
   Used by admin panel to fetch pending changes count.
════════════════════════════════════════ */
function doGet(e) {
  const headers = { 'Content-Type': 'application/json' };
  
  try {
    const action = e.parameter.action || 'ping';
    
    if (action === 'ping') {
      return respond({ success: true, message: 'BOPinc API online', ts: new Date().toISOString() }, headers);
    }
    
    if (action === 'pendingCount') {
      const ss      = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet   = ss.getSheetByName('pending-changes');
      if (!sheet) return respond({ success: true, count: 0 }, headers);
      const rows    = sheet.getDataRange().getValues().slice(1);
      const pending = rows.filter(r => r[7] === 'pending').length;
      return respond({ success: true, count: pending }, headers);
    }
    
    return respond({ success: false, error: 'Unknown GET action' }, headers);
  } catch (err) {
    return respond({ success: false, error: err.message }, headers);
  }
}


/* ════════════════════════════════════════
   APPEND — add a new row
════════════════════════════════════════ */
function handleAppend(sheet, data) {
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'No data provided' };
  }
  
  /* Read headers from row 1 */
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(h => h.toString().trim());
  
  if (headers.length === 0 || !headers[0]) {
    /* Sheet has no headers yet — create them from data keys */
    const keys = Object.keys(data);
    sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
    sheet.getRange(2, 1, 1, keys.length).setValues([keys.map(k => data[k] !== undefined ? data[k] : '')]);
    return { success: true, row: 2 };
  }
  
  /* Map data to column order */
  const row = headers.map(h => data[h] !== undefined ? data[h] : '');
  const nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
  
  Logger.log(`[API] Appended row ${nextRow} to ${sheet.getName()}`);
  return { success: true, row: nextRow };
}


/* ════════════════════════════════════════
   UPDATE — update an existing row by ID
════════════════════════════════════════ */
function handleUpdate(sheet, rowId, updates) {
  if (!rowId || !updates) {
    return { success: false, error: 'Missing id or data for update' };
  }
  
  const data    = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim());
  const idCol   = headers.indexOf('id');
  
  if (idCol === -1) {
    return { success: false, error: 'No id column found in this tab' };
  }
  
  /* Find the row with matching ID */
  const rowIndex = data.findIndex((row, i) => i > 0 && row[idCol].toString() === rowId.toString());
  
  if (rowIndex === -1) {
    return { success: false, error: `Row not found for id: ${rowId}` };
  }
  
  /* Apply updates */
  const sheetRowNum = rowIndex + 1; /* 1-indexed */
  Object.entries(updates).forEach(([key, value]) => {
    const colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      sheet.getRange(sheetRowNum, colIndex + 1).setValue(value);
    }
  });
  
  Logger.log(`[API] Updated row ${sheetRowNum} (id: ${rowId}) in ${sheet.getName()}`);
  return { success: true, row: sheetRowNum };
}


/* ════════════════════════════════════════
   GET PENDING CHANGES
   Returns all pending correction requests.
════════════════════════════════════════ */
function handleGetPending(ss) {
  const sheet = ss.getSheetByName('pending-changes');
  if (!sheet) return { success: true, items: [] };
  
  const data    = sheet.getDataRange().getValues();
  const headers = data[0].map(h => h.toString().trim());
  
  const items = data.slice(1)
    .filter(row => row[headers.indexOf('status')] === 'pending')
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
  
  return { success: true, items, count: items.length };
}


/* ════════════════════════════════════════
   HELPER
════════════════════════════════════════ */
function respond(data, headers) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}


/* ════════════════════════════════════════
   TEST — run from Apps Script editor
════════════════════════════════════════ */
function testApi() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('[API] Connected to spreadsheet: ' + ss.getName());
  Logger.log('[API] Writable tabs check:');
  WRITABLE_TABS.forEach(tab => {
    const sheet = ss.getSheetByName(tab);
    Logger.log(`  ${tab}: ${sheet ? 'exists ✓' : 'NOT FOUND ✗'}`);
  });
}