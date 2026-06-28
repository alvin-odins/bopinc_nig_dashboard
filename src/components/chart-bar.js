/* ============================================================
   BOPinc Nigeria Dashboard — Swimlane Bar Chart v2
   File: src/components/chart-bar.js

   Pure HTML/CSS — replaces the SVG implementation.
   SVG coordinate maths caused overlapping labels and
   misaligned rows at real screen widths. HTML flexbox
   handles alignment correctly without any coordinate logic.

   Usage:
     ChartBar.render(containerId, events, options)

   Events shape (from Sheets calendar-events tab):
     [{ userId, userName, userInitials, avatarColor,
        title, type, startHour, endHour, date, isLeave }]

   Options:
     { date: 'YYYY-MM-DD' }
============================================================ */

const ChartBar = {

  DAY_START: 7,
  DAY_END:   20,

  COLOURS: {
    meeting:  { fill: '#2e6843', text: '#fff',    label: 'Meeting'  },
    focus:    { fill: '#1d4ed8', text: '#fff',    label: 'Focus'    },
    personal: { fill: '#64748b', text: '#fff',    label: 'Personal' },
    leave:    { fill: '#d98f0f', text: '#412402', label: 'Leave'    },
    travel:   { fill: '#7c3aed', text: '#fff',    label: 'Travel'   },
    external: { fill: '#0f6e56', text: '#fff',    label: 'External' },
  },

  /* ════════════════════════════════════════
     PUBLIC: render chart into a container
  ════════════════════════════════════════ */
  render(containerId, events = [], options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const date     = options.date || this._todayStr();
    const filtered = events.filter(e => e.date === date || !e.date);
    const users    = this._groupByUser(filtered);

    if (users.length === 0) {
      container.innerHTML = this._emptyState(date);
      return;
    }

    container.innerHTML = this._buildHTML(users, date);
    this._attachTooltips(container);
  },

  /* ════════════════════════════════════════
     BUILD HTML — flexbox layout, no SVG
  ════════════════════════════════════════ */
  _buildHTML(users, date) {
    const hours    = this.DAY_END - this.DAY_START;
    const daySpan  = hours; /* 13 hours: 7am–8pm */

    /* Hour header ticks */
    const tickCount = hours + 1;
    const ticks = Array.from({ length: tickCount }, (_, i) => {
      const h   = this.DAY_START + i;
      const lbl = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
      /* Position as percentage of chart width */
      const pct = (i / hours) * 100;
      /* Hide last label to prevent right-edge overflow */
      const hide = i === tickCount - 1 ? 'opacity:0' : '';
      return `
        <div style="position:absolute;left:${pct}%;transform:translateX(-50%);
          ${hide};top:0;text-align:center;white-space:nowrap">
          <span style="font-size:10px;color:var(--color-text-tertiary)">${lbl}</span>
        </div>
        <div style="position:absolute;left:${pct}%;top:18px;bottom:0;
          width:1px;background:var(--color-border);opacity:0.5"></div>`;
    }).join('');

    /* Row for each team member */
    const rows = users.map(user => this._buildRow(user, daySpan)).join('');

    return `
      <div style="width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch">
        <div style="min-width:560px">

          <!-- Header: label column + hour ticks -->
          <div style="display:flex;align-items:stretch;margin-bottom:4px">
            <!-- Name column spacer -->
            <div style="width:110px;flex-shrink:0"></div>
            <!-- Tick marks -->
            <div style="flex:1;position:relative;height:28px">
              ${ticks}
            </div>
          </div>

          <!-- Rows -->
          <div style="display:flex;flex-direction:column;gap:4px">
            ${rows}
          </div>

        </div>
      </div>`;
  },

  _buildRow(user, daySpan) {
    const col    = this._avatarColour(user.avatarColor || 0);
    const dotCol = user.status === 'leave'
      ? 'var(--color-danger)'
      : user.status === 'busy' ? 'var(--color-warning)' : 'var(--color-success)';

    /* Build event blocks as absolutely-positioned elements */
    const blocks = user.events.map(ev => {
      const startH = Math.max(ev.startHour, this.DAY_START);
      const endH   = Math.min(ev.endHour,   this.DAY_END);
      if (startH >= endH) return '';

      const left  = ((startH - this.DAY_START) / daySpan) * 100;
      const width = ((endH - startH) / daySpan) * 100;
      const c     = this.COLOURS[ev.type] || this.COLOURS.meeting;

      return `
        <div class="chart-block"
          data-title="${this._esc(ev.title)}"
          data-type="${ev.type}"
          data-start="${ev.startHour}"
          data-end="${ev.endHour}"
          style="
            position:absolute;
            left:calc(${left.toFixed(3)}% + 1px);
            width:calc(${width.toFixed(3)}% - 2px);
            top:3px;bottom:3px;
            background:${c.fill};
            border-radius:3px;
            overflow:hidden;
            cursor:pointer;
            display:flex;
            align-items:center;
            padding:0 5px;
            transition:opacity .15s;
          "
          title="${this._esc(ev.title)}"
          tabindex="0"
          role="button"
          aria-label="${this._esc(ev.title)}, ${this._fmtHour(ev.startHour)} to ${this._fmtHour(ev.endHour)}">
          <span style="
            font-size:10px;
            font-weight:500;
            color:${c.text};
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            pointer-events:none;
            line-height:1.2;
          ">${ev.title}</span>
        </div>`;
    }).join('');

    return `
      <div style="display:flex;align-items:center;gap:0;min-height:40px">

        <!-- Name column: fixed width, never shrinks -->
        <div style="
          width:110px;
          flex-shrink:0;
          display:flex;
          align-items:center;
          gap:8px;
          padding-right:8px;
        ">
          <!-- Avatar -->
          <div style="
            width:28px;height:28px;
            border-radius:50%;
            background:${col.bg};
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:600;color:${col.text};
            flex-shrink:0;
            position:relative;
          ">
            ${user.initials}
            <!-- Status dot -->
            <div style="
              position:absolute;bottom:-1px;right:-1px;
              width:8px;height:8px;border-radius:50%;
              background:${dotCol};
              border:1.5px solid var(--color-surface);
            "></div>
          </div>
          <!-- Name -->
          <div style="min-width:0;overflow:hidden">
            <div style="
              font-size:11px;font-weight:500;
              color:var(--color-text-primary);
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
              line-height:1.3;
            ">${user.name.split(' ')[0]}</div>
            <div style="
              font-size:9px;color:var(--color-text-tertiary);
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
              line-height:1.3;
            ">${user.name.split(' ').slice(1).join(' ')}</div>
          </div>
        </div>

        <!-- Chart area: fills remaining width -->
        <div style="
          flex:1;
          height:40px;
          position:relative;
          background:var(--color-surface-2);
          border-radius:4px;
          border:1px solid var(--color-border);
        ">
          ${blocks}
        </div>

      </div>`;
  },

  /* ════════════════════════════════════════
     TOOLTIP — follows mouse, stays on screen
  ════════════════════════════════════════ */
  _attachTooltips(container) {
    /* Reuse existing tooltip if present */
    let tooltip = document.getElementById('chartbar-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'chartbar-tooltip';
      tooltip.style.cssText = `
        position:fixed;display:none;
        background:var(--color-surface);
        border:1px solid var(--color-border);
        border-radius:6px;
        padding:8px 12px;
        font-size:12px;
        z-index:9999;
        box-shadow:var(--shadow-md);
        pointer-events:none;
        max-width:220px;
        min-width:120px;
      `;
      document.body.appendChild(tooltip);
    }

    container.querySelectorAll('.chart-block').forEach(block => {
      block.addEventListener('mouseenter', () => {
        const type  = block.dataset.type;
        const c     = ChartBar.COLOURS[type] || ChartBar.COLOURS.meeting;
        const start = ChartBar._fmtHour(parseFloat(block.dataset.start));
        const end   = ChartBar._fmtHour(parseFloat(block.dataset.end));
        tooltip.innerHTML = `
          <div style="font-weight:500;color:var(--color-text-primary);margin-bottom:3px;
            word-break:break-word">${block.dataset.title}</div>
          <div style="color:var(--color-text-secondary);font-size:11px">${start} – ${end}</div>
          <div style="margin-top:5px;display:inline-block;padding:2px 7px;border-radius:4px;
            font-size:10px;font-weight:500;background:${c.fill};color:${c.text}">${c.label}</div>`;
        tooltip.style.display = 'block';
      });

      block.addEventListener('mousemove', e => {
        const tw = tooltip.offsetWidth;
        const th = tooltip.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let left = e.clientX + 14;
        let top  = e.clientY - 8;
        if (left + tw > vw - 8) left = e.clientX - tw - 14;
        if (top + th > vh - 8) top  = vh - th - 8;
        tooltip.style.left = `${left}px`;
        tooltip.style.top  = `${top}px`;
      });

      block.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });

      /* Keyboard: show tooltip on focus */
      block.addEventListener('focus', () => {
        const type  = block.dataset.type;
        const c     = ChartBar.COLOURS[type] || ChartBar.COLOURS.meeting;
        const start = ChartBar._fmtHour(parseFloat(block.dataset.start));
        const end   = ChartBar._fmtHour(parseFloat(block.dataset.end));
        const rect  = block.getBoundingClientRect();
        tooltip.innerHTML = `
          <div style="font-weight:500;color:var(--color-text-primary);margin-bottom:3px">${block.dataset.title}</div>
          <div style="color:var(--color-text-secondary);font-size:11px">${start} – ${end}</div>
          <div style="margin-top:5px;display:inline-block;padding:2px 7px;border-radius:4px;
            font-size:10px;font-weight:500;background:${c.fill};color:${c.text}">${c.label}</div>`;
        tooltip.style.display = 'block';
        tooltip.style.left    = `${rect.left}px`;
        tooltip.style.top     = `${rect.bottom + 6}px`;
      });

      block.addEventListener('blur', () => {
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
          userId:      ev.userId,
          name:        ev.userName     || 'Unknown',
          initials:    ev.userInitials || '??',
          avatarColor: ev.avatarColor  || 0,
          status:      ev.isLeave ? 'leave' : 'available',
          events:      [],
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
    const p = [
      {bg:'#2e6843',text:'#fff'},{bg:'#1d4ed8',text:'#fff'},
      {bg:'#d98f0f',text:'#412402'},{bg:'#0f6e56',text:'#fff'},
      {bg:'#7c3aed',text:'#fff'},{bg:'#be185d',text:'#fff'},
      {bg:'#0369a1',text:'#fff'},{bg:'#b45309',text:'#fff'},
    ];
    return p[parseInt(index, 10) % p.length] || p[0];
  },

  _todayStr() {
    return new Date().toISOString().slice(0, 10);
  },

  _esc(str) {
    return (str || '')
      .replace(/&/g,'&amp;')
      .replace(/"/g,'&quot;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  },

  _fmtHour(h) {
    const hh   = Math.floor(h);
    const mm   = Math.round((h - hh) * 60);
    const ampm = hh < 12 ? 'am' : 'pm';
    const disp = hh === 0 ? 12 : hh <= 12 ? hh : hh - 12;
    return mm === 0
      ? `${disp}${ampm}`
      : `${disp}:${mm.toString().padStart(2, '0')}${ampm}`;
  },

  _emptyState(date) {
    const label = new Date(date + 'T12:00:00')
      .toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
    return `
      <div class="coming-soon">
        <div class="coming-soon-icon">📅</div>
        <div class="coming-soon-title">No schedule data for ${label}</div>
        <p>Sync Google Calendar via Admin panel → Sync controls to populate this view.</p>
      </div>`;
  },

  /* ── Legend ── */
  legend() {
    return `
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;padding-top:10px;
        border-top:1px solid var(--color-border)">
        ${Object.entries(this.COLOURS).map(([, c]) => `
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:12px;height:12px;border-radius:2px;background:${c.fill};flex-shrink:0"></div>
            <span style="font-size:11px;color:var(--color-text-secondary)">${c.label}</span>
          </div>`).join('')}
      </div>`;
  },
};