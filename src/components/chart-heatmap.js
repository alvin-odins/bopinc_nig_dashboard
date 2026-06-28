/* ============================================================
   BOPinc Nigeria Dashboard — Leave Heatmap Calendar
   File: src/components/chart-heatmap.js
   
   Pure JS/HTML — renders a monthly heatmap calendar
   showing how many team members are on leave each day.
   
   Usage:
     ChartHeatmap.render(containerId, leaveRecords, options)
   
   Leave records shape (from Sheets leave-records tab):
     [{ userId, userName, type, startDate, endDate, status }]
   
   Options:
     { year: 2025, month: 6 }  (month is 0-indexed: Jan=0)
   ============================================================ */

const ChartHeatmap = {

  /* ── Team size — used to calculate intensity ── */
  TEAM_SIZE: 8,

  /* ── Colour intensity steps (0 = no leave, 4 = all on leave) ── */
  HEAT_COLOURS: [
    { min: 0, max: 0,   bg: 'var(--color-surface-2)',  text: 'var(--color-text-tertiary)', label: 'None'    },
    { min: 1, max: 1,   bg: '#fef9c3',                 text: '#713f12',                    label: '1 person' },
    { min: 2, max: 2,   bg: '#fed7aa',                 text: '#7c2d12',                    label: '2 people' },
    { min: 3, max: 4,   bg: '#fca5a5',                 text: '#7f1d1d',                    label: '3–4 people' },
    { min: 5, max: 999, bg: '#ef4444',                 text: '#ffffff',                    label: '5+ people' },
  ],

  /* ════════════════════════════════════════
     PUBLIC: render heatmap into container
  ════════════════════════════════════════ */
  render(containerId, leaveRecords = [], options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const now   = new Date();
    const year  = options.year  || now.getFullYear();
    const month = options.month !== undefined ? options.month : now.getMonth();

    /* Build a map of date → array of people on leave */
    const leaveMap = this._buildLeaveMap(leaveRecords, year, month);

    container.innerHTML = this._buildCalendar(leaveMap, year, month);
    this._attachDayInteraction(container, leaveMap);
  },

  /* ════════════════════════════════════════
     BUILD LEAVE MAP
     Returns: { 'YYYY-MM-DD': [{ userName, type }] }
  ════════════════════════════════════════ */
  _buildLeaveMap(records, year, month) {
    const map      = {};
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    records
      .filter(r => r.status !== 'rejected')
      .forEach(r => {
        const start = new Date(r.startDate + 'T00:00:00');
        const end   = new Date(r.endDate   + 'T00:00:00');

        /* Walk each day in the leave range */
        const cursor = new Date(Math.max(start, firstDay));
        const limit  = new Date(Math.min(end, lastDay));

        while (cursor <= limit) {
          const dateStr = cursor.toISOString().slice(0, 10);
          const dow     = cursor.getDay();
          /* Skip weekends */
          if (dow !== 0 && dow !== 6) {
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push({
              userName: r.userName || 'Unknown',
              type:     r.type     || 'Annual leave',
              userId:   r.userId   || '',
            });
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      });

    return map;
  },

  /* ════════════════════════════════════════
     BUILD CALENDAR HTML
  ════════════════════════════════════════ */
  _buildCalendar(leaveMap, year, month) {
    const monthName = new Date(year, month, 1)
      .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow    = new Date(year, month, 1).getDay(); /* 0=Sun */
    /* Adjust so week starts Monday */
    const startOffset = (firstDow === 0 ? 6 : firstDow - 1);
    const today       = new Date().toISOString().slice(0, 10);

    /* Day of week headers */
    const dowHeaders = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      .map(d => `<div style="font-size:10px;font-weight:500;
        color:var(--color-text-secondary);text-align:center;padding:4px 0">${d}</div>`)
      .join('');

    /* Empty leading cells */
    const leadingCells = Array(startOffset).fill(
      `<div style="background:none"></div>`
    ).join('');

    /* Day cells */
    const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
      const day     = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const people  = leaveMap[dateStr] || [];
      const count   = people.length;
      const col     = this._heatColour(count);
      const isToday = dateStr === today;
      const isWknd  = (() => { const d = new Date(dateStr + 'T12:00:00').getDay(); return d === 0 || d === 6; })();

      const border  = isToday ? '2px solid var(--color-accent)' : '1px solid var(--color-border)';

      return `
        <div class="heatmap-day"
          data-date="${dateStr}"
          data-count="${count}"
          data-people="${this._esc(JSON.stringify(people))}"
          style="
            background:${isWknd ? 'var(--color-surface)' : col.bg};
            border:${border};
            border-radius:6px;
            padding:6px 4px;
            text-align:center;
            cursor:${count > 0 ? 'pointer' : 'default'};
            transition:transform 150ms,box-shadow 150ms;
            min-height:52px;
            display:flex;flex-direction:column;
            align-items:center;justify-content:center;
            position:relative;
          "
          ${count > 0 ? 'tabindex="0" role="button"' : ''}
          title="${count > 0 ? `${count} on leave: ${people.map(p=>p.userName).join(', ')}` : isWknd ? 'Weekend' : 'No leave'}">
          <div style="font-size:12px;font-weight:500;
            color:${isWknd ? 'var(--color-text-tertiary)' : col.text}">${day}</div>
          ${count > 0 ? `<div style="font-size:9px;font-weight:600;
            color:${col.text};margin-top:2px">${count}</div>` : ''}
          ${isToday ? `<div style="position:absolute;bottom:2px;left:50%;transform:translateX(-50%);
            width:4px;height:4px;border-radius:50%;background:var(--color-accent)"></div>` : ''}
        </div>`;
    }).join('');

    /* Legend */
    const legend = this.HEAT_COLOURS.map(c => `
      <div style="display:flex;align-items:center;gap:5px;font-size:11px">
        <div style="width:14px;height:14px;border-radius:3px;
          background:${c.bg};border:1px solid var(--color-border)"></div>
        <span style="color:var(--color-text-secondary)">${c.label}</span>
      </div>`).join('');

    /* Summary stats */
    const totalLeaveDays = Object.values(leaveMap).reduce((sum, p) => sum + p.length, 0);
    const uniquePeople   = [...new Set(Object.values(leaveMap).flat().map(p => p.userId))].length;

    return `
      <div style="margin-bottom:var(--space-4)">
        <div style="display:flex;align-items:center;justify-content:space-between;
          margin-bottom:var(--space-3)">
          <div style="font-size:var(--text-base);font-weight:600">${monthName}</div>
          <div style="display:flex;gap:var(--space-4)">
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
              <span style="font-weight:500;color:var(--color-text-primary)">${uniquePeople}</span>
              team member${uniquePeople !== 1 ? 's' : ''} on leave
            </div>
            <div style="font-size:var(--text-xs);color:var(--color-text-secondary)">
              <span style="font-weight:500;color:var(--color-text-primary)">${totalLeaveDays}</span>
              total leave days
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:8px">
          ${dowHeaders}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">
          ${leadingCells}${dayCells}
        </div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px">
          ${legend}
        </div>
      </div>

      <!-- Day detail panel (shown when a day is clicked) -->
      <div id="heatmap-detail" style="display:none;padding:12px 14px;
        background:var(--color-surface-2);border-radius:var(--radius-md);
        border:1px solid var(--color-border);margin-top:8px">
      </div>`;
  },

  /* ════════════════════════════════════════
     INTERACTIONS
  ════════════════════════════════════════ */
  _attachDayInteraction(container, leaveMap) {
    container.querySelectorAll('.heatmap-day[data-count]').forEach(cell => {
      const count = parseInt(cell.dataset.count, 10);
      if (count === 0) return;

      cell.addEventListener('mouseenter', () => {
        cell.style.transform  = 'translateY(-1px)';
        cell.style.boxShadow  = 'var(--shadow-md)';
      });
      cell.addEventListener('mouseleave', () => {
        cell.style.transform  = '';
        cell.style.boxShadow  = '';
      });

      const openDetail = () => {
        const people  = JSON.parse(cell.dataset.people || '[]');
        const date    = cell.dataset.date;
        const label   = new Date(date + 'T12:00:00')
          .toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
        const panel   = container.querySelector('#heatmap-detail');
        if (!panel) return;

        panel.style.display = 'block';
        panel.innerHTML = `
          <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:8px">
            ${label} — ${people.length} on leave
          </div>
          ${people.map(p => `
            <div style="display:flex;align-items:center;gap:8px;
              padding:5px 0;border-bottom:1px solid var(--color-border)">
              <div style="font-size:var(--text-sm);font-weight:500;flex:1">${p.userName}</div>
              <span class="badge badge-amber" style="font-size:10px">${p.type}</span>
            </div>`).join('')}
          <button onclick="this.closest('#heatmap-detail').style.display='none'"
            style="margin-top:8px;font-size:11px;color:var(--color-text-secondary);
              background:none;border:none;cursor:pointer;padding:0;text-decoration:underline">
            Close
          </button>`;

        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };

      cell.addEventListener('click', openDetail);
      cell.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(); }
      });
    });
  },

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */
  _heatColour(count) {
    return this.HEAT_COLOURS.find(c => count >= c.min && count <= c.max)
      || this.HEAT_COLOURS[0];
  },

  _esc(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },
};git