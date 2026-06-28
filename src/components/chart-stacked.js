/* ============================================================
   BOPinc Nigeria Dashboard — Stacked Horizontal Bar Chart
   File: src/components/chart-stacked.js

   Pure HTML/CSS stacked horizontal bar chart.
   Used for funding analysis — each row is a sector,
   each segment is a funding status (confirmed/pipeline/at-risk).

   Usage:
     ChartStacked.render(containerId, data, options)

   Data shape:
     [{ label, segments: [{ value, status, colour }] }]

   Options:
     { currency: true, target: 5000000 }
============================================================ */

const ChartStacked = {

  STATUS_COLOURS: {
    confirmed: { fill: '#2e6843', label: 'Confirmed' },
    pipeline:  { fill: '#1d4ed8', label: 'Pipeline'  },
    'at-risk': { fill: '#d98f0f', label: 'At risk'   },
    won:       { fill: '#0f6e56', label: 'Won'        },
    lost:      { fill: '#64748b', label: 'Lost'       },
  },

  render(containerId, data = [], options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = `<div class="coming-soon">
        <div class="coming-soon-icon">📊</div>
        <div class="coming-soon-title">No funding data yet</div>
        <p>Add opportunities with funding values to populate this chart.</p>
      </div>`;
      return;
    }

    container.innerHTML = this._buildHTML(data, options);
  },

  _buildHTML(data, options) {
    const maxTotal = Math.max(...data.map(row =>
      row.segments.reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0)
    ));

    const fmt = v => {
      if (!options.currency) return v.toLocaleString();
      const n = parseFloat(v) || 0;
      if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M`;
      if (n >= 1000)    return `$${(n/1000).toFixed(0)}K`;
      return `$${n}`;
    };

    const rows = data.map(row => {
      const total  = row.segments.reduce((sum, s) => sum + (parseFloat(s.value) || 0), 0);
      const widths = row.segments.map(s => ({
        ...s,
        pct: total > 0 ? (parseFloat(s.value) / maxTotal) * 100 : 0,
      }));

      const segments = widths.map(s => {
        const col = this.STATUS_COLOURS[s.status] || { fill: '#94a3b8' };
        return `
          <div style="
            width:${s.pct.toFixed(2)}%;height:100%;
            background:${col.fill};
            transition:width .4s ease;
            position:relative;
          " title="${col.label || s.status}: ${fmt(s.value)}"></div>`;
      }).join('');

      return `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:110px;flex-shrink:0;font-size:12px;font-weight:500;
            color:var(--color-text-primary);text-align:right;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
            title="${row.label}">${row.label}</div>
          <div style="flex:1;height:24px;background:var(--color-surface-2);
            border-radius:4px;overflow:hidden;display:flex">
            ${segments}
          </div>
          <div style="width:70px;flex-shrink:0;font-size:12px;font-weight:500;
            color:var(--color-text-primary);text-align:right">${fmt(total)}</div>
        </div>`;
    }).join('');

    /* Target line if specified */
    const targetLine = options.target ? (() => {
      const pct = (options.target / maxTotal) * 100;
      return `
        <div style="position:relative;height:0;margin-left:120px;margin-right:80px;
          margin-top:-${data.length * 34}px;margin-bottom:${data.length * 34}px;
          pointer-events:none">
          <div style="position:absolute;left:${pct.toFixed(2)}%;top:0;bottom:0;
            width:1px;background:var(--color-danger);opacity:0.6;z-index:1">
            <div style="position:absolute;top:-16px;left:4px;font-size:9px;
              color:var(--color-danger);white-space:nowrap">Target ${fmt(options.target)}</div>
          </div>
        </div>`;
    })() : '';

    /* Legend */
    const seenStatuses = [...new Set(data.flatMap(r => r.segments.map(s => s.status)))];
    const legend = seenStatuses.map(s => {
      const col = this.STATUS_COLOURS[s] || { fill: '#94a3b8', label: s };
      return `
        <div style="display:flex;align-items:center;gap:5px;font-size:11px">
          <div style="width:12px;height:12px;border-radius:2px;background:${col.fill}"></div>
          <span style="color:var(--color-text-secondary)">${col.label}</span>
        </div>`;
    }).join('');

    return `
      <div style="padding:4px 0">${rows}</div>
      ${targetLine}
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;padding-top:10px;
        border-top:1px solid var(--color-border)">${legend}</div>`;
  },
};