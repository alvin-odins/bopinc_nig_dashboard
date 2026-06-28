/* ============================================================
   BOPinc Nigeria Dashboard — Swimlane Bar Chart
   File: src/components/chart-bar.js
   
   Pure JS/SVG — no Chart.js dependency.
   Renders a horizontal swimlane chart showing each team
   member's schedule blocks across a working day (7am–8pm).
   
   Usage:
     ChartBar.render(containerId, events, options)
   
   Events shape (from Sheets calendar-events tab):
     [{ userId, userName, userInitials, avatarColor,
        title, type, startHour, endHour, date, isLeave }]
   
   Options:
     { date: 'YYYY-MM-DD', weekMode: false, height: 480 }
   ============================================================ */

const ChartBar = {

  /* ── Visual config ── */
  DAY_START:  7,    /* 7am */
  DAY_END:    20,   /* 8pm */
  ROW_HEIGHT: 44,   /* px per person */
  ROW_GAP:    8,
  LABEL_W:    90,   /* left column width for names */
  PADDING:    { top: 40, right: 16, bottom: 16, left: 0 },

  /* ── Event type colours (matching main.css bar colours) ── */
  COLOURS: {
    meeting:  { fill: '#2e6843', text: '#ffffff', label: 'Meeting' },
    focus:    { fill: '#1d4ed8', text: '#ffffff', label: 'Focus'   },
    personal: { fill: '#94a3b8', text: '#ffffff', label: 'Personal'},
    leave:    { fill: '#d98f0f', text: '#412402', label: 'Leave'   },
    travel:   { fill: '#7c3aed', text: '#ffffff', label: 'Travel'  },
    external: { fill: '#0f6e56', text: '#ffffff', label: 'External'},
  },

  /* ════════════════════════════════════════
     PUBLIC: render chart into a container
  ════════════════════════════════════════ */
  render(containerId, events = [], options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const date     = options.date || this._todayStr();
    const filtered = events.filter(e => e.date === date || !e.date);

    /* Group by user */
    const users = this._groupByUser(filtered);

    if (users.length === 0) {
      container.innerHTML = this._emptyState(date);
      return;
    }

    const totalH = this.PADDING.top
      + users.length * (this.ROW_HEIGHT + this.ROW_GAP)
      + this.PADDING.bottom;

    const svg = this._buildSVG(users, totalH, date);
    container.innerHTML = svg;

    /* Wire tooltip */
    this._attachTooltips(container);
  },

  /* ════════════════════════════════════════
     BUILD SVG
  ════════════════════════════════════════ */
  _buildSVG(users, totalH, date) {
    const W        = 680; /* matches viewBox standard */
    const chartW   = W - this.LABEL_W - this.PADDING.right;
    const hours    = this.DAY_END - this.DAY_START;
    const hourW    = chartW / hours;

    /* Hour tick marks */
    const hourLabels = Array.from({ length: hours + 1 }, (_, i) => {
      const h    = this.DAY_START + i;
      const x    = this.LABEL_W + i * hourW;
      const lbl  = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
      return `<text class="ts" x="${x}" y="24" text-anchor="middle"
        style="fill:var(--text-muted);font-size:10px">${lbl}</text>
        <line x1="${x}" y1="30" x2="${x}" y2="${totalH - this.PADDING.bottom}"
          stroke="var(--border)" stroke-width="0.5" stroke-dasharray="3 3"/>`;
    }).join('');

    /* User rows */
    const rows = users.map((user, idx) => {
      const y = this.PADDING.top + idx * (this.ROW_HEIGHT + this.ROW_GAP);
      return this._buildRow(user, y, chartW, hourW);
    }).join('');

    /* Date display */
    const dateLabel = new Date(date + 'T12:00:00')
      .toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });

    return `
      <svg width="100%" viewBox="0 0 ${W} ${totalH}"
        role="img" xmlns="http://www.w3.org/2000/svg">
        <title>Team pulse schedule — ${dateLabel}</title>
        <desc>Swimlane chart showing each team member's schedule blocks for ${dateLabel}</desc>

        <!-- Date label -->
        <text class="th" x="${this.LABEL_W}" y="14"
          style="fill:var(--text-primary);font-size:12px">${dateLabel}</text>

        <!-- Hour grid -->
        ${hourLabels}

        <!-- Rows -->
        ${rows}
      </svg>`;
  },

  _buildRow(user, y, chartW, hourW) {
    const cx     = 40;
    const cy     = y + this.ROW_HEIGHT / 2;
    const bgY    = y;
    const colour = this._avatarColour(user.avatarColor || 0);

    /* Background stripe */
    const bg = `<rect x="${this.LABEL_W}" y="${bgY}" width="${chartW}"
      height="${this.ROW_HEIGHT}" rx="4"
      fill="var(--surface-1)" stroke="var(--border)" stroke-width="0.5"/>`;

    /* Avatar circle */
    const avatar = `
      <circle cx="${cx}" cy="${cy}" r="14" fill="${colour.bg}"/>
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
        style="font-size:10px;font-weight:600;fill:${colour.text}">${user.initials}</text>`;

    /* Name */
    const name = `<text x="60" y="${cy - 3}" class="th"
      style="font-size:11px;fill:var(--text-primary)">${user.name.split(' ')[0]}</text>
      <text x="60" y="${cy + 9}" class="ts"
      style="font-size:9px;fill:var(--text-muted)">${user.name.split(' ').slice(1).join(' ')}</text>`;

    /* Event blocks */
    const blocks = user.events.map(ev => {
      const startH  = Math.max(ev.startHour, this.DAY_START);
      const endH    = Math.min(ev.endHour,   this.DAY_END);
      if (startH >= endH) return '';

      const xStart  = this.LABEL_W + (startH - this.DAY_START) * hourW;
      const width   = Math.max((endH - startH) * hourW - 2, 4);
      const col     = this.COLOURS[ev.type] || this.COLOURS.meeting;
      const bY      = bgY + 4;
      const bH      = this.ROW_HEIGHT - 8;
      const label   = width > 50 ? this._truncate(ev.title, Math.floor(width / 7)) : '';

      return `
        <g class="chart-block" data-title="${this._esc(ev.title)}"
          data-type="${ev.type}" data-start="${ev.startHour}" data-end="${ev.endHour}"
          style="cursor:pointer">
          <rect x="${xStart + 1}" y="${bY}" width="${width}" height="${bH}"
            rx="3" fill="${col.fill}" opacity="0.92"/>
          ${label ? `<text x="${xStart + 5}" y="${bY + bH / 2}"
            dominant-baseline="central"
            style="font-size:9px;fill:${col.text};pointer-events:none;
              font-family:var(--font-sans)">${label}</text>` : ''}
        </g>`;
    }).join('');

    /* Availability dot */
    const dotFill = user.status === 'leave'
      ? 'var(--color-danger)'
      : user.status === 'busy' ? 'var(--color-warning)' : 'var(--color-success)';
    const dot = `<circle cx="${cx + 10}" cy="${cy - 10}" r="4"
      fill="${dotFill}" stroke="var(--surface-2)" stroke-width="1.5"/>`;

    return `<g class="chart-row">${bg}${blocks}${avatar}${dot}${name}</g>`;
  },

  /* ════════════════════════════════════════
     TOOLTIP
  ════════════════════════════════════════ */
  _attachTooltips(container) {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position:fixed;display:none;background:var(--color-surface);
      border:1px solid var(--color-border);border-radius:6px;
      padding:8px 12px;font-size:12px;z-index:9999;
      box-shadow:var(--shadow-md);pointer-events:none;max-width:200px;
    `;
    document.body.appendChild(tooltip);

    container.querySelectorAll('.chart-block').forEach(block => {
      block.addEventListener('mouseenter', e => {
        const type  = block.dataset.type;
        const col   = ChartBar.COLOURS[type] || ChartBar.COLOURS.meeting;
        const start = ChartBar._fmtHour(parseFloat(block.dataset.start));
        const end   = ChartBar._fmtHour(parseFloat(block.dataset.end));
        tooltip.innerHTML = `
          <div style="font-weight:500;margin-bottom:3px">${block.dataset.title}</div>
          <div style="color:var(--color-text-secondary)">${start} – ${end}</div>
          <div style="display:inline-block;margin-top:4px;padding:1px 6px;border-radius:4px;
            font-size:10px;background:${col.fill};color:${col.text}">${col.label}</div>`;
        tooltip.style.display = 'block';
      });
      block.addEventListener('mousemove', e => {
        tooltip.style.left = `${e.clientX + 12}px`;
        tooltip.style.top  = `${e.clientY - 10}px`;
      });
      block.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    });
  },

  /* ════════════════════════════════════════
     HELPERS
  ════════════════════════════════════════ */
  _groupByUser(events) {
    const map = new Map();
    events.forEach(ev => {
      if (!map.has(ev.userId)) {
        map.set(ev.userId, {
          userId:     ev.userId,
          name:       ev.userName    || 'Unknown',
          initials:   ev.userInitials|| '??',
          avatarColor:ev.avatarColor || 0,
          status:     ev.isLeave ? 'leave' : 'available',
          events:     [],
        });
      }
      const user = map.get(ev.userId);
      if (ev.isLeave) user.status = 'leave';
      else if (ev.type === 'meeting' && user.status !== 'leave') user.status = 'busy';
      user.events.push(ev);
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  },

  _avatarColour(index) {
    const palettes = [
      { bg:'#2e6843', text:'#fff' }, { bg:'#1d4ed8', text:'#fff' },
      { bg:'#d98f0f', text:'#412402' }, { bg:'#0f6e56', text:'#fff' },
      { bg:'#7c3aed', text:'#fff' }, { bg:'#be185d', text:'#fff' },
      { bg:'#0369a1', text:'#fff' }, { bg:'#b45309', text:'#fff' },
    ];
    return palettes[parseInt(index, 10) % palettes.length] || palettes[0];
  },

  _todayStr() {
    return new Date().toISOString().slice(0, 10);
  },

  _truncate(str, maxChars) {
    return str.length > maxChars ? str.slice(0, maxChars - 1) + '…' : str;
  },

  _esc(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  },

  _fmtHour(h) {
    const hh  = Math.floor(h);
    const mm  = Math.round((h - hh) * 60);
    const ampm= hh < 12 ? 'am' : 'pm';
    const disp= hh <= 12 ? hh : hh - 12;
    return mm === 0 ? `${disp}${ampm}` : `${disp}:${mm.toString().padStart(2,'0')}${ampm}`;
  },

  _emptyState(date) {
    const label = new Date(date + 'T12:00:00')
      .toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
    return `<div class="coming-soon">
      <div class="coming-soon-icon">📅</div>
      <div class="coming-soon-title">No schedule data for ${label}</div>
      <p>Sync Google Calendar data via Admin panel → Sync controls.</p>
    </div>`;
  },

  /* ── Legend HTML — use below the chart ── */
  legend() {
    return `<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:11px">
      ${Object.entries(this.COLOURS).map(([type, col]) => `
        <div style="display:flex;align-items:center;gap:5px">
          <div style="width:12px;height:12px;border-radius:2px;background:${col.fill}"></div>
          <span style="color:var(--color-text-secondary)">${col.label}</span>
        </div>`).join('')}
    </div>`;
  },
};