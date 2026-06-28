/* ============================================================
   BOPinc Nigeria Dashboard — Opportunities Pipeline Chart
   File: src/components/chart-bubble.js

   Replaced bubble chart with a ranked horizontal bar chart.
   Reason: bubble chart requires 20+ data points to show
   meaningful clusters. With 8 opportunities spread across
   8 sectors the chart was always 8 isolated dots.

   This chart communicates the same information clearly:
   - Bar length = funding value (longest = biggest opportunity)
   - Bar colour = status (active/pipeline/at-risk/won)
   - Right label = probability percentage
   - Left border = status colour accent
   - Sorted by value descending (biggest at top)
   - Click any row to open the detail panel

   Pure HTML/CSS — no SVG, no coordinate system,
   no scaling issues, no font inheritance problems.

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
    el.innerHTML = this._build(opps, opts);
    this._wire(el, opps, opts);
  },

  _fmt(v) {
    const n = parseFloat(v) || 0;
    if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
    if (n >= 1000)    return `$${(n/1000).toFixed(0)}K`;
    return `$${n}`;
  },

  _build(opps, opts) {
    const maxVal = Math.max(...opps.map(o => parseFloat(o.value) || 0));

    /* Sort by value descending — biggest opportunity at top */
    const sorted = [...opps].sort((a,b) =>
      (parseFloat(b.value)||0) - (parseFloat(a.value)||0)
    );

    /* ── Scale axis ticks ── */
    /* Round maxVal up to a clean number for the axis */
    const axisMag   = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const axisMax   = Math.ceil(maxVal / axisMag) * axisMag;
    const axisTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
      pct: f * 100,
      label: f === 0 ? '$0' : this._fmt(axisMax * f),
    }));

    /* ── Axis header ── */
    const axisHeader = `
      <div style="
        display:flex;
        margin-left:180px;
        margin-bottom:4px;
        position:relative;
        height:18px">
        ${axisTicks.map(t => `
          <div style="
            position:absolute;
            left:${t.pct}%;
            transform:translateX(-50%);
            font-size:10px;
            color:var(--color-text-tertiary);
            white-space:nowrap">
            ${t.label}
          </div>`).join('')}
      </div>`;

    /* ── Rows ── */
    const rows = sorted.map((opp, idx) => {
      const s      = this.STATUS[opp.status] || this.STATUS.pipeline;
      const barPct = Math.round((parseFloat(opp.value)||0) / axisMax * 100);
      const prob   = parseFloat(opp.probability) || 0;
      const val    = this._fmt(opp.value);

      /* Deadline urgency */
      const daysLeft = opp.deadline
        ? Math.ceil((new Date(opp.deadline) - new Date()) / 86400000)
        : null;
      const dlColour = daysLeft !== null && daysLeft < 0  ? '#dc2626'
                     : daysLeft !== null && daysLeft <= 30 ? '#d97706'
                     : 'var(--color-text-tertiary)';
      const dlLabel  = daysLeft === null        ? ''
                     : daysLeft < 0             ? 'Overdue'
                     : daysLeft <= 30           ? `${daysLeft}d`
                     : opp.deadline;

      /* Probability colour */
      const probColour = prob >= 70 ? '#2e6843'
                       : prob >= 40 ? '#d97706'
                       : '#dc2626';

      /* Tick lines behind bar */
      const ticks = [0.25, 0.5, 0.75].map(f => `
        <div style="
          position:absolute;
          left:${f*100}%;
          top:0;bottom:0;
          width:1px;
          background:var(--color-border);
          opacity:0.5">
        </div>`).join('');

      return `
        <div class="opp-bar-row" data-idx="${idx}"
          role="button" tabindex="0"
          aria-label="${opp.name}, ${s.label}, ${val}, ${prob}% probability"
          style="
            display:flex;
            align-items:center;
            gap:0;
            padding:6px 0;
            border-bottom:1px solid var(--color-border);
            cursor:pointer;
            transition:background .12s;
            border-radius:4px;
          ">

          <!-- Left: name + meta — fixed 180px -->
          <div style="
            width:180px;
            flex-shrink:0;
            padding-right:12px;
            border-left:3px solid ${s.fill};
            padding-left:8px;
          ">
            <div style="
              font-size:12px;
              font-weight:600;
              color:var(--color-text-primary);
              line-height:1.3;
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis"
              title="${opp.name}">
              ${opp.name}
            </div>
            <div style="
              font-size:10px;
              color:var(--color-text-tertiary);
              margin-top:1px;
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis">
              ${opp.funder || opp.sector}
            </div>
          </div>

          <!-- Centre: bar track — fills remaining space -->
          <div style="
            flex:1;
            position:relative;
            height:28px;
            background:var(--color-surface-2);
            border-radius:3px;
            overflow:hidden">

            ${ticks}

            <!-- Filled bar -->
            <div style="
              position:absolute;
              left:0;top:4px;bottom:4px;
              width:${barPct}%;
              background:${s.fill};
              border-radius:2px;
              opacity:0.85;
              transition:width .4s ease;
              display:flex;
              align-items:center;
              padding-left:6px;
              overflow:hidden">
              <!-- Value label inside bar if wide enough -->
              ${barPct > 20 ? `
                <span style="
                  font-size:10px;
                  font-weight:700;
                  color:#fff;
                  white-space:nowrap;
                  pointer-events:none">
                  ${val}
                </span>` : ''}
            </div>

            <!-- Value label outside bar if bar too short -->
            ${barPct <= 20 ? `
              <div style="
                position:absolute;
                left:${barPct}%;
                top:50%;
                transform:translateY(-50%);
                margin-left:5px;
                font-size:10px;
                font-weight:700;
                color:var(--color-text-secondary);
                white-space:nowrap;
                pointer-events:none">
                ${val}
              </div>` : ''}
          </div>

          <!-- Right: probability + deadline — fixed 80px -->
          <div style="
            width:80px;
            flex-shrink:0;
            padding-left:10px;
            display:flex;
            flex-direction:column;
            align-items:flex-end;
            gap:3px">
            <div style="
              font-size:12px;
              font-weight:700;
              color:${probColour}">
              ${prob}%
            </div>
            ${dlLabel ? `
              <div style="
                font-size:9px;
                color:${dlColour};
                font-weight:500">
                ${dlLabel}
              </div>` : ''}
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
            width:10px;height:10px;
            border-radius:2px;
            background:${s.fill};
            flex-shrink:0">
          </div>
          <span style="color:var(--color-text-secondary)">${s.label}</span>
        </div>`;
    }).join('');

    /* ── Column headers ── */
    const colHeaders = `
      <div style="
        display:flex;
        align-items:center;
        gap:0;
        padding-bottom:6px;
        border-bottom:1px solid var(--color-border);
        margin-bottom:4px">
        <div style="
          width:180px;flex-shrink:0;
          font-size:10px;font-weight:600;
          color:var(--color-text-tertiary);
          text-transform:uppercase;
          letter-spacing:.04em;
          padding-left:11px">
          Opportunity
        </div>
        <div style="
          flex:1;
          font-size:10px;font-weight:600;
          color:var(--color-text-tertiary);
          text-transform:uppercase;
          letter-spacing:.04em">
          Funding value
        </div>
        <div style="
          width:80px;flex-shrink:0;
          font-size:10px;font-weight:600;
          color:var(--color-text-tertiary);
          text-transform:uppercase;
          letter-spacing:.04em;
          text-align:right;
          padding-right:0">
          Win %
        </div>
      </div>`;

    return `
      <div>
        ${colHeaders}
        ${axisHeader}
        <div style="display:flex;flex-direction:column;gap:0">
          ${rows}
        </div>
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
    /* Sort matches _build sort */
    const sorted = [...opps].sort((a,b) =>
      (parseFloat(b.value)||0) - (parseFloat(a.value)||0)
    );

    el.querySelectorAll('.opp-bar-row').forEach(row => {
      const opp = sorted[parseInt(row.dataset.idx, 10)];
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