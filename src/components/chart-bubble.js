/* ============================================================
   BOPinc Nigeria Dashboard — Opportunities Ranked Bar Chart
   File: src/components/chart-bubble.js

   Ranked horizontal bar chart — opportunities sorted by
   funding value descending. Each row shows:
     · Coloured left border  = status
     · Bar length            = funding value (vs axis max)
     · Value label           = inside bar if wide, outside if narrow
     · Right column          = win probability % in colour
     · Deadline              = urgency colour beneath probability

   Pure HTML/CSS — no SVG, no coordinate system.
   Designed for 8–20 opportunities. Responsive.

   Usage:
     ChartBubble.render(containerId, opportunities, options)
     options: { onSelect: (opp) => {} }
============================================================ */

const ChartBubble = {

  STATUS: {
    active:   { fill:'#2e6843', light:'#d4edd9', text:'#1a3d27', label:'Active'   },
    pipeline: { fill:'#1d4ed8', light:'#dbeafe', text:'#1e3a8a', label:'Pipeline' },
    'at-risk':{ fill:'#d97706', light:'#fef3c7', text:'#78350f', label:'At risk'  },
    won:      { fill:'#0f6e56', light:'#ccfbf1', text:'#065f46', label:'Won'      },
    closed:   { fill:'#64748b', light:'#f1f5f9', text:'#334155', label:'Closed'   },
  },

  get STATUS_COLOURS() { return this.STATUS; },

  render(containerId, opps = [], opts = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!opps.length) { el.innerHTML = this._empty(); return; }
    el.innerHTML = this._build(opps);
    this._wire(el, opps, opts);
  },

  _fmt(v) {
    const n = parseFloat(v) || 0;
    if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
    if (n >= 1000)    return `$${(n/1000).toFixed(0)}K`;
    return `$${n}`;
  },

  _build(opps) {
    /* Sort by value descending */
    const sorted = [...opps].sort((a,b) =>
      (parseFloat(b.value)||0) - (parseFloat(a.value)||0)
    );

    const maxVal = parseFloat(sorted[0]?.value) || 1;

    /* Round axis max to clean number */
    const mag    = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const axMax  = Math.ceil(maxVal / mag) * mag;

    /* ── Column header ── */
    const header = `
      <div style="
        display:flex;align-items:center;
        padding-bottom:8px;
        margin-bottom:6px;
        border-bottom:1px solid var(--color-border)">
        <div style="
          width:176px;flex-shrink:0;
          font-size:10px;font-weight:500;
          text-transform:uppercase;letter-spacing:.04em;
          color:var(--color-text-tertiary);
          padding-left:12px">
          Opportunity
        </div>
        <div style="flex:1;position:relative;height:16px">
          ${[0,0.25,0.5,0.75,1].map(f => `
            <div style="
              position:absolute;
              left:${f*100}%;
              transform:translateX(-50%);
              font-size:10px;
              color:var(--color-text-tertiary);
              white-space:nowrap">
              ${f === 0 ? '$0' : this._fmt(axMax * f)}
            </div>`).join('')}
        </div>
        <div style="
          width:76px;flex-shrink:0;
          font-size:10px;font-weight:500;
          text-transform:uppercase;letter-spacing:.04em;
          color:var(--color-text-tertiary);
          text-align:right">
          Win %
        </div>
      </div>`;

    /* ── Rows ── */
    const rows = sorted.map(opp => {
      const s       = this.STATUS[opp.status] || this.STATUS.pipeline;
      const val     = parseFloat(opp.value) || 0;
      const barPct  = Math.round((val / axMax) * 100);
      const prob    = parseFloat(opp.probability) || 0;
      const probCol = prob >= 70 ? '#2e6843' : prob >= 40 ? '#d97706' : '#dc2626';
      const valStr  = this._fmt(val);

      /* Deadline */
      let dlLabel = '', dlCol = 'var(--color-text-tertiary)';
      if (opp.deadline) {
        const days = Math.ceil((new Date(opp.deadline) - new Date()) / 86400000);
        if      (days < 0)   { dlLabel = 'Overdue';      dlCol = '#dc2626'; }
        else if (days <= 14) { dlLabel = `${days}d`;     dlCol = '#dc2626'; }
        else if (days <= 45) { dlLabel = `${days}d`;     dlCol = '#d97706'; }
        else {
          dlLabel = new Date(opp.deadline)
            .toLocaleDateString('en-GB', { day:'numeric', month:'short' });
        }
      }

      /* Gridlines at 25 / 50 / 75 % */
      const gridLines = [0.25, 0.5, 0.75].map(f => `
        <div style="
          position:absolute;left:${f*100}%;top:0;bottom:0;
          width:1px;background:var(--color-border);opacity:0.6">
        </div>`).join('');

      return `
        <div class="opp-bar-row" data-id="${opp.id}"
          role="button" tabindex="0"
          aria-label="${opp.name}, ${s.label}, ${valStr}, ${prob}% probability"
          style="
            display:flex;align-items:center;
            padding:5px 0;
            border-bottom:0.5px solid var(--color-border);
            cursor:pointer;
            border-radius:3px;
            transition:background .1s">

          <!-- Name column: 176px fixed -->
          <div style="
            width:176px;flex-shrink:0;
            border-left:3px solid ${s.fill};
            padding:0 10px 0 9px">
            <div style="
              font-size:12px;font-weight:500;
              color:var(--color-text-primary);
              line-height:1.3;
              white-space:nowrap;overflow:hidden;
              text-overflow:ellipsis"
              title="${opp.name}">
              ${opp.name}
            </div>
            <div style="
              font-size:10px;color:var(--color-text-tertiary);
              margin-top:1px;
              white-space:nowrap;overflow:hidden;
              text-overflow:ellipsis">
              ${opp.funder || opp.sector}
            </div>
          </div>

          <!-- Bar track: flex:1 -->
          <div style="
            flex:1;
            height:30px;
            position:relative;
            background:var(--color-surface-2);
            border-radius:3px;
            overflow:hidden">

            ${gridLines}

            <!-- Filled bar -->
            <div style="
              position:absolute;
              left:0;top:4px;bottom:4px;
              width:${barPct}%;
              background:${s.fill};
              border-radius:2px;
              opacity:0.85;
              display:flex;align-items:center;
              padding-left:7px;
              overflow:hidden;
              min-width:2px">
              ${barPct > 18 ? `
                <span style="
                  font-size:10px;font-weight:500;
                  color:#fff;white-space:nowrap;
                  pointer-events:none">
                  ${valStr}
                </span>` : ''}
            </div>

            <!-- Value outside bar when bar is short -->
            ${barPct <= 18 ? `
              <div style="
                position:absolute;
                left:${barPct}%;top:50%;
                transform:translateY(-50%);
                padding-left:6px;
                font-size:10px;font-weight:500;
                color:var(--color-text-secondary);
                white-space:nowrap;
                pointer-events:none">
                ${valStr}
              </div>` : ''}
          </div>

          <!-- Probability + deadline: 76px fixed -->
          <div style="
            width:76px;flex-shrink:0;
            padding-left:12px;
            display:flex;flex-direction:column;
            align-items:flex-end;gap:2px">
            <span style="
              font-size:13px;font-weight:500;
              color:${probCol}">
              ${prob}%
            </span>
            ${dlLabel ? `
              <span style="
                font-size:10px;font-weight:500;
                color:${dlCol}">
                ${dlLabel}
              </span>` : ''}
          </div>

        </div>`;
    }).join('');

    /* ── Legend ── */
    const usedStatuses = [...new Set(sorted.map(o => o.status))];
    const legend = usedStatuses.map(st => {
      const s = this.STATUS[st] || this.STATUS.pipeline;
      return `
        <div style="display:flex;align-items:center;gap:5px;font-size:11px">
          <div style="
            width:10px;height:10px;border-radius:2px;
            background:${s.fill};flex-shrink:0">
          </div>
          <span style="color:var(--color-text-secondary)">${s.label}</span>
        </div>`;
    }).join('');

    return `
      <div>
        ${header}
        <div>${rows}</div>
        <div style="
          display:flex;align-items:center;
          justify-content:space-between;
          flex-wrap:wrap;gap:8px;
          margin-top:12px;padding-top:10px;
          border-top:0.5px solid var(--color-border)">
          <div style="display:flex;gap:12px;flex-wrap:wrap">${legend}</div>
          <span style="font-size:10px;color:var(--color-text-tertiary)">
            Sorted by value · click any row for full details
          </span>
        </div>
      </div>`;
  },

  _wire(el, opps, opts) {
    const sorted = [...opps].sort((a,b) =>
      (parseFloat(b.value)||0) - (parseFloat(a.value)||0)
    );

    el.querySelectorAll('.opp-bar-row').forEach(row => {
      const opp = sorted.find(o => o.id === row.dataset.id);
      if (!opp) return;

      row.addEventListener('mouseenter', () => {
        row.style.background = 'var(--color-surface-2)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = '';
      });
      row.addEventListener('click', () => {
        if (opts.onSelect) opts.onSelect(opp);
      });
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (opts.onSelect) opts.onSelect(opp);
        }
      });
    });
  },

  _empty() {
    return `
      <div class="coming-soon">
        <div class="coming-soon-icon">🎯</div>
        <div class="coming-soon-title">No opportunities yet</div>
        <p>Add opportunities to the opportunities tab in Google Sheets.</p>
      </div>`;
  },

  formatValue(v) { return this._fmt(v); },
};