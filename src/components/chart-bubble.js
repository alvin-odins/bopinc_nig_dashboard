
/* ============================================================
   BOPinc Nigeria Dashboard — Opportunities Pipeline Swimlane
   File: src/components/chart-bubble.js
 
   Four-column kanban swimlane: Active · Pipeline · At risk · Won
   Each column shows stage total value and opportunity count.
   Each card shows: name, funder + sector, probability bar,
   value pill, deadline with urgency colour.
   Click any card → onSelect(opp) → detail panel opens.
 
   Pure HTML/CSS. No SVG, no coordinate system, no scaling.
 
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
 
  STAGES: ['active','pipeline','at-risk','won'],
 
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
 
  _deadline(dateStr) {
    if (!dateStr) return { label: null, colour: null };
    const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
    if (days < 0)   return { label: 'Overdue',       colour: '#dc2626' };
    if (days <= 14) return { label: `${days}d left`,  colour: '#dc2626' };
    if (days <= 45) return { label: `${days}d left`,  colour: '#d97706' };
    const d = new Date(dateStr);
    return {
      label: d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }),
      colour: 'var(--color-text-tertiary)',
    };
  },
 
  _build(opps) {
    const columns = this.STAGES.map(stage => {
      const s     = this.STATUS[stage];
      const cards = opps
        .filter(o => o.status === stage)
        .sort((a,b) => (parseFloat(b.probability)||0) - (parseFloat(a.probability)||0));
      const total = cards.reduce((sum,o) => sum + (parseFloat(o.value)||0), 0);
 
      /* ── Column header ── */
      const header = `
        <div style="
          display:flex;align-items:center;justify-content:space-between;
          padding-bottom:10px;margin-bottom:10px;
          border-bottom:2px solid ${s.fill}">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:${s.fill}"></div>
            <span style="font-size:13px;font-weight:500;color:var(--color-text-primary)">
              ${s.label}
            </span>
            <span style="
              background:${s.light};color:${s.text};
              font-size:10px;font-weight:500;
              padding:1px 7px;border-radius:10px">
              ${cards.length}
            </span>
          </div>
          ${total > 0 ? `
            <span style="font-size:12px;font-weight:500;color:${s.fill}">
              ${this._fmt(total)}
            </span>` : ''}
        </div>`;
 
      /* ── Cards ── */
      const cardHtml = cards.map((opp, i) => {
        const prob    = parseFloat(opp.probability) || 0;
        const probCol = prob >= 70 ? '#2e6843' : prob >= 40 ? '#d97706' : '#dc2626';
        const dl      = this._deadline(opp.deadline);
        const val     = this._fmt(opp.value);
 
        return `
          <div class="sw-card" data-id="${opp.id}"
            role="button" tabindex="0"
            aria-label="${opp.name}, ${s.label}, ${val}"
            style="
              background:var(--color-surface);
              border:1px solid var(--color-border);
              border-top:3px solid ${s.fill};
              border-radius:0 0 var(--radius-md) var(--radius-md);
              padding:12px;
              margin-bottom:8px;
              cursor:pointer;
              transition:border-color .12s, transform .1s;
            ">
 
            <!-- Name -->
            <div style="
              font-size:12px;font-weight:500;
              color:var(--color-text-primary);
              line-height:1.35;margin-bottom:4px">
              ${opp.name}
            </div>
 
            <!-- Funder + sector -->
            <div style="
              font-size:11px;color:var(--color-text-secondary);
              margin-bottom:10px;
              display:flex;gap:5px;flex-wrap:wrap;align-items:center">
              <span>${opp.funder || '—'}</span>
              <span style="color:var(--color-border-strong)">·</span>
              <span style="
                background:var(--color-surface-2);
                padding:0 5px;border-radius:3px;
                font-size:10px;color:var(--color-text-secondary)">
                ${opp.sector}
              </span>
            </div>
 
            <!-- Probability bar -->
            <div style="margin-bottom:10px">
              <div style="
                display:flex;justify-content:space-between;
                font-size:10px;color:var(--color-text-tertiary);
                margin-bottom:4px">
                <span>Win probability</span>
                <span style="font-weight:500;color:${probCol}">${prob}%</span>
              </div>
              <div style="
                height:3px;background:var(--color-surface-2);
                border-radius:2px;overflow:hidden">
                <div style="
                  height:100%;width:${prob}%;
                  background:${probCol};border-radius:2px">
                </div>
              </div>
            </div>
 
            <!-- Value + deadline -->
            <div style="
              display:flex;align-items:center;
              justify-content:space-between">
              <span style="
                background:${s.light};color:${s.text};
                font-size:11px;font-weight:500;
                padding:2px 8px;border-radius:4px">
                ${val}
              </span>
              ${dl.label ? `
                <span style="
                  font-size:10px;font-weight:500;
                  color:${dl.colour}">
                  ${dl.label}
                </span>` : ''}
            </div>
 
          </div>`;
      }).join('');
 
      /* ── Empty column state ── */
      const empty = cards.length === 0 ? `
        <div style="
          border:1px dashed var(--color-border);
          border-radius:var(--radius-md);
          padding:20px 12px;
          text-align:center;
          font-size:11px;
          color:var(--color-text-tertiary)">
          No ${s.label.toLowerCase()} opportunities
        </div>` : '';
 
      return `
        <div style="min-width:0">
          ${header}
          ${cardHtml}
          ${empty}
        </div>`;
    }).join('');
 
    return `
      <div style="
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:16px;
        align-items:start;
        overflow-x:auto">
        ${columns}
      </div>`;
  },
 
  _wire(el, opps, opts) {
    el.querySelectorAll('.sw-card').forEach(card => {
      const opp = opps.find(o => o.id === card.dataset.id);
      if (!opp) return;
 
      card.addEventListener('mouseenter', () => {
        card.style.borderColor  = this.STATUS[opp.status]?.fill || 'var(--color-border)';
        card.style.transform    = 'translateY(-1px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor  = 'var(--color-border)';
        card.style.transform    = '';
      });
      card.addEventListener('click', () => {
        if (opts.onSelect) opts.onSelect(opp);
      });
      card.addEventListener('keydown', e => {
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