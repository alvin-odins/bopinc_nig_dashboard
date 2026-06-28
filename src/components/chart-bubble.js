/* ============================================================
   BOPinc Nigeria Dashboard — Bubble Chart
   File: src/components/chart-bubble.js

   Pure SVG bubble chart. Each bubble represents one opportunity.
   Size = funding value. Position = sector (x) × urgency (y).
   Colour = status (active / pipeline / at-risk / closed).

   Usage:
     ChartBubble.render(containerId, opportunities, options)

   Opportunity shape:
     { id, name, sector, value, status, funder, deadline,
       description, teamLead, probability }

   Options:
     { onSelect: (opp) => {} }
============================================================ */

const ChartBubble = {

  STATUS_COLOURS: {
    active:   { fill: '#2e6843', text: '#fff', label: 'Active'   },
    pipeline: { fill: '#1d4ed8', text: '#fff', label: 'Pipeline' },
    'at-risk':{ fill: '#d98f0f', text: '#412402', label: 'At risk' },
    closed:   { fill: '#64748b', text: '#fff', label: 'Closed'   },
    won:      { fill: '#0f6e56', text: '#fff', label: 'Won'      },
  },

  SECTORS: ['Energy','Agriculture','Health','WASH','Education','Finance','Livelihoods','Gender'],

  render(containerId, opportunities = [], options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (opportunities.length === 0) {
      container.innerHTML = this._emptyState();
      return;
    }

    container.innerHTML = this._buildHTML(opportunities, options);
    this._attachInteractions(container, opportunities, options);
  },

  _buildHTML(opps, options) {
    const W = 640, H = 360;
    const PAD = { top: 30, right: 20, bottom: 50, left: 60 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    const sectors = [...new Set(opps.map(o => o.sector))].sort();
    const maxVal  = Math.max(...opps.map(o => parseFloat(o.value) || 0));
    const minVal  = Math.min(...opps.map(o => parseFloat(o.value) || 0));

    /* Scale helpers */
    const xScale = i => PAD.left + (i / Math.max(sectors.length - 1, 1)) * chartW;
    const yScale = prob => PAD.top + chartH - (parseFloat(prob || 50) / 100) * chartH;
    const rScale = val => {
      const v = parseFloat(val) || 0;
      const norm = maxVal > minVal ? (v - minVal) / (maxVal - minVal) : 0.5;
      return 10 + norm * 28; /* radius 10–38px */
    };

    /* Y axis labels */
    const yLabels = [0, 25, 50, 75, 100].map(p => `
      <text x="${PAD.left - 8}" y="${yScale(p) + 4}"
        text-anchor="end" style="font-size:10px;fill:var(--color-text-tertiary)">${p}%</text>
      <line x1="${PAD.left}" y1="${yScale(p)}" x2="${PAD.left + chartW}" y2="${yScale(p)}"
        stroke="var(--color-border)" stroke-width="0.5" stroke-dasharray="3 3"/>`).join('');

    /* X axis sector labels */
    const xLabels = sectors.map((s, i) => `
      <text x="${xScale(i)}" y="${PAD.top + chartH + 18}"
        text-anchor="middle" style="font-size:10px;fill:var(--color-text-secondary)">${s}</text>
      <line x1="${xScale(i)}" y1="${PAD.top}" x2="${xScale(i)}" y2="${PAD.top + chartH}"
        stroke="var(--color-border)" stroke-width="0.5" stroke-dasharray="2 4"/>`).join('');

    /* Bubbles */
    const bubbles = opps.map((opp, idx) => {
      const si  = sectors.indexOf(opp.sector);
      const cx  = xScale(si < 0 ? 0 : si);
      const cy  = yScale(opp.probability || 50);
      const r   = rScale(opp.value);
      const col = this.STATUS_COLOURS[opp.status] || this.STATUS_COLOURS.pipeline;
      const shortName = (opp.name || '').length > 12
        ? (opp.name || '').slice(0, 11) + '…'
        : (opp.name || '');

      return `
        <g class="bubble-node" data-idx="${idx}" style="cursor:pointer">
          <circle cx="${cx}" cy="${cy}" r="${r}"
            fill="${col.fill}" opacity="0.85"
            stroke="var(--color-surface)" stroke-width="1.5"/>
          ${r > 18 ? `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
            style="font-size:9px;font-weight:600;fill:${col.text};pointer-events:none">${shortName}</text>` : ''}
        </g>`;
    }).join('');

    /* Legend */
    const legend = Object.entries(this.STATUS_COLOURS).map(([, c]) => `
      <div style="display:flex;align-items:center;gap:5px;font-size:11px">
        <div style="width:10px;height:10px;border-radius:50%;background:${c.fill}"></div>
        <span style="color:var(--color-text-secondary)">${c.label}</span>
      </div>`).join('');

    return `
      <svg width="100%" viewBox="0 0 ${W} ${H}" role="img"
        xmlns="http://www.w3.org/2000/svg">
        <title>Opportunities bubble chart</title>
        <desc>Bubble chart showing opportunities by sector and probability. Bubble size represents funding value.</desc>
        <!-- Y axis label -->
        <text x="14" y="${PAD.top + chartH / 2}" text-anchor="middle"
          transform="rotate(-90, 14, ${PAD.top + chartH / 2})"
          style="font-size:10px;fill:var(--color-text-tertiary)">Probability %</text>
        <!-- Grid -->
        ${yLabels}
        ${xLabels}
        <!-- Bubbles -->
        ${bubbles}
        <!-- Axes -->
        <line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top + chartH}"
          stroke="var(--color-border)" stroke-width="1"/>
        <line x1="${PAD.left}" y1="${PAD.top + chartH}" x2="${PAD.left + chartW}" y2="${PAD.top + chartH}"
          stroke="var(--color-border)" stroke-width="1"/>
      </svg>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;padding-top:8px;
        border-top:1px solid var(--color-border)">${legend}</div>
      <div style="font-size:11px;color:var(--color-text-muted);margin-top:6px">
        Bubble size = funding value. Click any bubble to view details.
      </div>`;
  },

  _attachInteractions(container, opps, options) {
    /* Tooltip */
    let tooltip = document.getElementById('bubble-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'bubble-tooltip';
      tooltip.style.cssText = `
        position:fixed;display:none;
        background:var(--color-surface);border:1px solid var(--color-border);
        border-radius:8px;padding:10px 14px;font-size:12px;
        z-index:9999;box-shadow:var(--shadow-md);
        pointer-events:none;max-width:240px;
      `;
      document.body.appendChild(tooltip);
    }

    container.querySelectorAll('.bubble-node').forEach(node => {
      const opp = opps[parseInt(node.dataset.idx, 10)];
      if (!opp) return;
      const col = ChartBubble.STATUS_COLOURS[opp.status] || ChartBubble.STATUS_COLOURS.pipeline;
      const val = parseFloat(opp.value) || 0;
      const fmt = v => v >= 1000000
        ? `$${(v/1000000).toFixed(1)}M`
        : v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`;

      node.addEventListener('mouseenter', () => {
        tooltip.innerHTML = `
          <div style="font-weight:600;color:var(--color-text-primary);margin-bottom:5px">${opp.name}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
            <span style="background:${col.fill};color:${col.text};padding:1px 7px;border-radius:4px;font-size:10px;font-weight:500">${col.label}</span>
            <span style="background:var(--color-surface-2);color:var(--color-text-secondary);padding:1px 7px;border-radius:4px;font-size:10px">${opp.sector}</span>
          </div>
          <div style="color:var(--color-text-secondary);font-size:11px;line-height:1.6">
            <div>Value: <strong style="color:var(--color-text-primary)">${fmt(val)}</strong></div>
            <div>Probability: <strong style="color:var(--color-text-primary)">${opp.probability || '—'}%</strong></div>
            ${opp.funder ? `<div>Funder: ${opp.funder}</div>` : ''}
            ${opp.deadline ? `<div>Deadline: ${opp.deadline}</div>` : ''}
          </div>`;
        tooltip.style.display = 'block';
      });

      node.addEventListener('mousemove', e => {
        const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
        let left = e.clientX + 14, top = e.clientY - 8;
        if (left + tw > window.innerWidth - 8) left = e.clientX - tw - 14;
        if (top + th > window.innerHeight - 8) top = window.innerHeight - th - 8;
        tooltip.style.left = `${left}px`;
        tooltip.style.top  = `${top}px`;
      });

      node.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

      node.addEventListener('click', () => {
        tooltip.style.display = 'none';
        if (options.onSelect) options.onSelect(opp);
      });
    });
  },

  _emptyState() {
    return `<div class="coming-soon">
      <div class="coming-soon-icon">🎯</div>
      <div class="coming-soon-title">No opportunities yet</div>
      <p>Add opportunities via the admin panel or directly in the opportunities tab in Google Sheets.</p>
    </div>`;
  },

  /* Format currency value */
  formatValue(v) {
    const n = parseFloat(v) || 0;
    if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
    if (n >= 1000)    return `$${(n/1000).toFixed(0)}K`;
    return `$${n}`;
  },
};