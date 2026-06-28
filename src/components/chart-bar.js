/* ============================================================
   BOPinc Nigeria Dashboard — Swimlane Bar Chart v3
   File: src/components/chart-bar.js

   Pure HTML/CSS swimlane chart.
   v3 fixes:
   - Full name on one line (no surname split)
   - Native title="" removed — only custom JS tooltip used
   - Tooltip persists until mouse leaves
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

  render(containerId, events = [], options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const date     = options.date || this._todayStr();
    const filtered = events.filter(e => e.date === date || !e.date);
    const users    = this._groupByUser(filtered);
    if (users.length === 0) { container.innerHTML = this._emptyState(date); return; }
    container.innerHTML = this._buildHTML(users, date);
    this._attachTooltips(container);
  },

  _buildHTML(users, date) {
    const hours = this.DAY_END - this.DAY_START;

    const ticks = Array.from({ length: hours + 1 }, (_, i) => {
      const h   = this.DAY_START + i;
      const lbl = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
      const pct = (i / hours) * 100;
      return `
        <div style="position:absolute;left:${pct}%;transform:translateX(-50%);top:0;text-align:center;white-space:nowrap;
          ${i === hours ? 'opacity:0' : ''}">
          <span style="font-size:10px;color:var(--color-text-tertiary)">${lbl}</span>
        </div>
        <div style="position:absolute;left:${pct}%;top:18px;bottom:0;width:1px;
          background:var(--color-border);opacity:0.5"></div>`;
    }).join('');

    const rows = users.map(user => this._buildRow(user, hours)).join('');

    return `
      <div style="width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch">
        <div style="min-width:520px">
          <div style="display:flex;align-items:stretch;margin-bottom:4px">
            <div style="width:130px;flex-shrink:0"></div>
            <div style="flex:1;position:relative;height:28px">${ticks}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">${rows}</div>
        </div>
      </div>`;
  },

  _buildRow(user, hours) {
    const col    = this._avatarColour(user.avatarColor || 0);
    const dotCol = user.status === 'leave'
      ? 'var(--color-danger)'
      : user.status === 'busy' ? 'var(--color-warning)' : 'var(--color-success)';

    const blocks = user.events.map(ev => {
      const startH = Math.max(ev.startHour, this.DAY_START);
      const endH   = Math.min(ev.endHour,   this.DAY_END);
      if (startH >= endH) return '';
      const left  = ((startH - this.DAY_START) / hours) * 100;
      const width = ((endH - startH) / hours) * 100;
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
            display:flex;align-items:center;
            padding:0 5px;
            transition:opacity .15s;
          "
          tabindex="0"
          role="button"
          aria-label="${this._esc(ev.title)}, ${this._fmtHour(ev.startHour)} to ${this._fmtHour(ev.endHour)}">
          <span style="
            font-size:10px;font-weight:500;
            color:${c.text};
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
            pointer-events:none;line-height:1.2;
          ">${ev.title}</span>
        </div>`;
    }).join('');

    /* ── Full name on one line — no split ── */
    const displayName = user.name.length > 14
      ? user.name.slice(0, 13) + '…'
      : user.name;

    return `
      <div style="display:flex;align-items:center;gap:0;min-height:40px">
        <div style="width:130px;flex-shrink:0;display:flex;align-items:center;gap:8px;padding-right:8px">
          <div style="
            width:28px;height:28px;border-radius:50%;
            background:${col.bg};flex-shrink:0;
            display:flex;align-items:center;justify-content:center;
            font-size:10px;font-weight:600;color:${col.text};
            position:relative;
          ">
            ${user.initials}
            <div style="
              position:absolute;bottom:-1px;right:-1px;
              width:8px;height:8px;border-radius:50%;
              background:${dotCol};
              border:1.5px solid var(--color-surface);
            "></div>
          </div>
          <span style="
            font-size:11px;font-weight:500;
            color:var(--color-text-primary);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
            flex:1;min-width:0;
          " title="${this._esc(user.name)}">${displayName}</span>
        </div>
        <div style="
          flex:1;height:40px;position:relative;
          background:var(--color-surface-2);
          border-radius:4px;border:1px solid var(--color-border);
        ">${blocks}</div>
      </div>`;
  },

  _attachTooltips(container) {
    let tooltip = document.getElementById('chartbar-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'chartbar-tooltip';
      tooltip.style.cssText = `
        position:fixed;display:none;
        background:var(--color-surface);
        border:1px solid var(--color-border);
        border-radius:6px;padding:8px 12px;
        font-size:12px;z-index:9999;
        box-shadow:var(--shadow-md);
        pointer-events:none;max-width:220px;min-width:120px;
      `;
      document.body.appendChild(tooltip);
    }

    const show = (block) => {
      const type  = block.dataset.type;
      const c     = ChartBar.COLOURS[type] || ChartBar.COLOURS.meeting;
      const start = ChartBar._fmtHour(parseFloat(block.dataset.start));
      const end   = ChartBar._fmtHour(parseFloat(block.dataset.end));
      tooltip.innerHTML = `
        <div style="font-weight:500;color:var(--color-text-primary);margin-bottom:3px;word-break:break-word">${block.dataset.title}</div>
        <div style="color:var(--color-text-secondary);font-size:11px">${start} – ${end}</div>
        <div style="margin-top:5px;display:inline-block;padding:2px 7px;border-radius:4px;
          font-size:10px;font-weight:500;background:${c.fill};color:${c.text}">${c.label}</div>`;
      tooltip.style.display = 'block';
    };

    const position = (x, y) => {
      const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
      const vw = window.innerWidth,   vh = window.innerHeight;
      let left = x + 14, top = y - 8;
      if (left + tw > vw - 8) left = x - tw - 14;
      if (top + th > vh - 8) top  = vh - th - 8;
      tooltip.style.left = `${left}px`;
      tooltip.style.top  = `${top}px`;
    };

    const hide = () => { tooltip.style.display = 'none'; };

    container.querySelectorAll('.chart-block').forEach(block => {
      /* Mouse — tooltip stays visible until mouse leaves the block */
      block.addEventListener('mouseenter', () => show(block));
      block.addEventListener('mousemove',  e  => position(e.clientX, e.clientY));
      block.addEventListener('mouseleave', hide);
      /* Keyboard — show on focus, hide on blur */
      block.addEventListener('focus', () => {
        show(block);
        const r = block.getBoundingClientRect();
        position(r.left, r.bottom + 6);
      });
      block.addEventListener('blur', hide);
    });
  },

  _groupByUser(events) {
    const map = new Map();
    events.forEach(ev => {
      if (!map.has(ev.userId)) {
        map.set(ev.userId, {
          userId: ev.userId, name: ev.userName || 'Unknown',
          initials: ev.userInitials || '??', avatarColor: ev.avatarColor || 0,
          status: ev.isLeave ? 'leave' : 'available', events: [],
        });
      }
      const u = map.get(ev.userId);
      if (ev.isLeave) u.status = 'leave';
      else if (ev.type === 'meeting' && u.status !== 'leave') u.status = 'busy';
      u.events.push(ev);
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

  _todayStr() { return new Date().toISOString().slice(0, 10); },

  _esc(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;')
      .replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  _fmtHour(h) {
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    const ampm = hh < 12 ? 'am' : 'pm';
    const disp = hh === 0 ? 12 : hh <= 12 ? hh : hh - 12;
    return mm === 0 ? `${disp}${ampm}` : `${disp}:${mm.toString().padStart(2,'0')}${ampm}`;
  },

  _emptyState(date) {
    const label = new Date(date + 'T12:00:00')
      .toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
    return `<div class="coming-soon">
      <div class="coming-soon-icon">📅</div>
      <div class="coming-soon-title">No schedule data for ${label}</div>
      <p>Sync Google Calendar via Admin panel → Sync controls.</p></div>`;
  },

  legend() {
    return `<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;padding-top:10px;
      border-top:1px solid var(--color-border)">
      ${Object.entries(this.COLOURS).map(([,c]) => `
        <div style="display:flex;align-items:center;gap:5px">
          <div style="width:12px;height:12px;border-radius:2px;background:${c.fill};flex-shrink:0"></div>
          <span style="font-size:11px;color:var(--color-text-secondary)">${c.label}</span>
        </div>`).join('')}
    </div>`;
  },
};