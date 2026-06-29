/* ============================================================
   BOPinc Nigeria Dashboard — Google Sheets Client
   
   The ONLY file that talks to the Google Sheets API.
   All other components call SheetsClient.get() or .append().
   
   Architecture:
   - READ  → Sheets API v4 (direct, uses API key from SECRETS)
   - WRITE → Apps Script web app endpoint (handles auth server-side)
   - CACHE → sessionStorage, TTL from SHEETS_CONFIG.CACHE_TTL
   ============================================================ */

const SheetsClient = {

  /* ── Internal state ── */
  _loading: {},   /* tracks in-flight requests to prevent duplicate fetches */
  _listeners: {}, /* tab → [callback] for reactive updates */

  /* ════════════════════════════════════════
     READ — fetch a tab from Sheets
     Returns an array of row objects (header row becomes keys).
     Uses sessionStorage cache with TTL.
  ════════════════════════════════════════ */
  async get(tabName, { forceRefresh = false } = {}) {
    const cacheKey = `bopinc_sheets_${tabName}`;
    const tsKey    = `${cacheKey}_ts`;

    /* Return cached data if still fresh */
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        const ts     = parseInt(sessionStorage.getItem(tsKey) || '0', 10);
        if (cached && Date.now() - ts < SHEETS_CONFIG.CACHE_TTL) {
          return JSON.parse(cached);
        }
      } catch (_) { /* sessionStorage unavailable — proceed to fetch */ }
    }

    /* Prevent duplicate in-flight requests for same tab */
    if (this._loading[tabName]) {
      return this._loading[tabName];
    }

    /* Check config is set up */
    if (SHEETS_CONFIG.DOCUMENT_ID === 'PASTE_YOUR_SHEETS_ID_HERE') {
      console.warn('[SheetsClient] Document ID not configured — returning empty array for', tabName);
      return [];
    }

    /* Build request */
    const apiKey = (typeof SECRETS !== 'undefined') ? SECRETS.SHEETS_API_KEY : '';
    if (!apiKey || apiKey === 'A]IzaSyA8S_4BEGIu6zXXlhI1MQCpZfPcP-9eMjk') {
      console.warn('[SheetsClient] API key not configured — returning empty array for', tabName);
      return [];
    }

    const url = `${SHEETS_CONFIG.BASE_URL}/${encodeURIComponent(tabName)}?key=${apiKey}`;

    this._loading[tabName] = (async () => {
      try {
        const res = await fetch(url);

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          throw new Error(`Sheets API ${res.status}: ${errBody}`);
        }

        const json = await res.json();
        const rows  = json.values || [];
        if (rows.length === 0) return [];

        /* Convert rows array to array of objects using header row as keys */
        const headers = rows[0].map(h => h.trim());
        const data    = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((key, i) => { obj[key] = row[i] ?? ''; });
          return obj;
        }).filter(row => Object.values(row).some(v => v !== '')); /* skip blank rows */

        /* Cache result */
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
          sessionStorage.setItem(tsKey, Date.now().toString());
        } catch (_) { /* quota exceeded — skip cache */ }

        /* Notify listeners */
        (this._listeners[tabName] || []).forEach(cb => cb(data));

        return data;

      } catch (err) {
        console.error(`[SheetsClient] Failed to fetch ${tabName}:`, err);

        /* Return stale cache if available */
        try {
          const stale = sessionStorage.getItem(cacheKey);
          if (stale) {
            console.warn('[SheetsClient] Returning stale cache for', tabName);
            SheetsClient._showStaleNotice();
            return JSON.parse(stale);
          }
        } catch (_) {}

        return []; /* ultimate fallback */

      } finally {
        delete this._loading[tabName];
      }
    })();

    return this._loading[tabName];
  },

  /* ════════════════════════════════════════
     WRITE — append a row via Apps Script web app
     The Apps Script handles OAuth — we never expose write credentials.
  ════════════════════════════════════════ */
  async append(tabName, rowData) {
    const url = SHEETS_CONFIG.APPS_SCRIPT_URL ||
      (typeof SECRETS !== 'undefined' ? SECRETS.APPS_SCRIPT_URL : '');

    if (!url || url === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
      /* Fallback: store locally if Apps Script not yet configured */
      console.warn('[SheetsClient] Apps Script URL not set — storing locally for', tabName);
      const key   = `bopinc_local_${tabName}`;
      const queue = JSON.parse(localStorage.getItem(key) || '[]');
      queue.push({ ...rowData, _localTimestamp: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(queue));
      return { success: true, fallback: true };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'append', tab: tabName, data: rowData }),
      });

      if (!res.ok) throw new Error(`Apps Script ${res.status}`);
      const json = await res.json();

      /* Invalidate cache for this tab so next read is fresh */
      this.invalidate(tabName);

      return { success: true, ...json };

    } catch (err) {
      console.error('[SheetsClient] Write failed for', tabName, err);
      return { success: false, error: err.message };
    }
  },

  /* ════════════════════════════════════════
     UPDATE — update a specific row via Apps Script
  ════════════════════════════════════════ */
  async update(tabName, rowId, updates) {
    const url = SHEETS_CONFIG.APPS_SCRIPT_URL ||
      (typeof SECRETS !== 'undefined' ? SECRETS.APPS_SCRIPT_URL : '');

    if (!url || url === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE') {
      console.warn('[SheetsClient] Apps Script URL not set — update skipped for', tabName);
      return { success: false, fallback: true };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', tab: tabName, id: rowId, data: updates }),
      });
      if (!res.ok) throw new Error(`Apps Script ${res.status}`);
      this.invalidate(tabName);
      return { success: true };
    } catch (err) {
      console.error('[SheetsClient] Update failed for', tabName, err);
      return { success: false, error: err.message };
    }
  },

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */

  /* Invalidate cache for a tab so next get() hits the API */
  invalidate(tabName) {
    try {
      sessionStorage.removeItem(`bopinc_sheets_${tabName}`);
      sessionStorage.removeItem(`bopinc_sheets_${tabName}_ts`);
    } catch (_) {}
  },

  /* Invalidate all cached tabs */
  invalidateAll() {
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('bopinc_sheets_'))
        .forEach(k => sessionStorage.removeItem(k));
    } catch (_) {}
  },

  /* Register a callback that fires whenever a tab's data is refreshed */
  onUpdate(tabName, callback) {
    if (!this._listeners[tabName]) this._listeners[tabName] = [];
    this._listeners[tabName].push(callback);
  },

  /* Check if a tab has fresh cached data */
  isCached(tabName) {
    try {
      const ts = parseInt(sessionStorage.getItem(`bopinc_sheets_${tabName}_ts`) || '0', 10);
      return Date.now() - ts < SHEETS_CONFIG.CACHE_TTL;
    } catch (_) { return false; }
  },

  /* Get last sync timestamp for a tab */
  lastSynced(tabName) {
    try {
      const ts = parseInt(sessionStorage.getItem(`bopinc_sheets_${tabName}_ts`) || '0', 10);
      if (!ts) return null;
      const mins = Math.round((Date.now() - ts) / 60000);
      return mins < 1 ? 'just now' : `${mins} min ago`;
    } catch (_) { return null; }
  },

  /* Show a stale data notice on the dashboard */
  _staleShown: false,
  _showStaleNotice() {
    if (this._staleShown) return;
    this._staleShown = true;
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast toast-warning';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span>⚠</span>
      <span>Showing cached data — live sync unavailable. Check your connection.</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
  },

  /* ════════════════════════════════════════
     DATA HELPERS — transform raw Sheets rows into usable objects
  ════════════════════════════════════════ */

  /* Parse comma-separated expertise string into array */
  parseExpertise(str) {
    return (str || '').split(',').map(s => s.trim()).filter(Boolean);
  },

  /* Parse team members string "name1|role1,name2|role2" into array of objects */
  parseTeamMembers(str) {
    return (str || '').split(',').map(s => {
      const [name, role] = s.split('|').map(p => p.trim());
      return { name: name || '', role: role || '' };
    }).filter(m => m.name);
  },

  /* Parse appointments string "date:desc;date:desc" into array */
  parseAppointments(str) {
    return (str || '').split(';').map(s => {
      const [date, ...descParts] = s.split(':');
      return { date: date.trim(), desc: descParts.join(':').trim() };
    }).filter(a => a.date && a.desc);
  },

  /* Parse visitors string "name|role|country,name|role|country" */
  parseVisitors(str) {
    return (str || '').split(',').map(s => {
      const [name, role, country] = s.split('|').map(p => p.trim());
      return { name: name || '', role: role || '', country: country || '' };
    }).filter(v => v.name);
  },

  /* Calculate days from today to a date string */
  daysUntil(dateStr) {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / 86400000);
  },

  /* Format a raw Sheets date string for display */
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch (_) { return dateStr; }
  },

};

/* Export for module environments */
if (typeof module !== 'undefined') {
  module.exports = { SheetsClient };
}