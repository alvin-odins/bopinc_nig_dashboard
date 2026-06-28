/* ============================================================
   BOPinc Nigeria Dashboard — Export Toolbar
   File: src/components/export-toolbar.js
   
   Reusable export toolbar that attaches to any page.
   Provides PDF (print), CSV data export, and share link.
   
   Usage:
     ExportToolbar.render(containerId, options)
   
   Options:
     {
       title:    'Team Pulse — 14 Jul 2025',
       getData:  () => [{ col1, col2 }],   // for CSV
       onPrint:  () => {},                  // custom print prep
     }
   ============================================================ */

const ExportToolbar = {

  /* ── Render the toolbar into a container ── */
  render(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this._options = options;
    const id      = `export-tb-${containerId}`;

    container.innerHTML = `
      <div id="${id}" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;
        padding:var(--space-3) 0;border-bottom:1px solid var(--color-border);
        margin-bottom:var(--space-4)">

        <span style="font-size:var(--text-xs);font-weight:500;
          color:var(--color-text-secondary);margin-right:4px">Export:</span>

        <button class="btn btn-secondary btn-sm" id="${id}-pdf"
          title="Save as PDF or print this view">
          ${getIcon('file-text', 14)}
          PDF / Print
        </button>

        <button class="btn btn-secondary btn-sm" id="${id}-csv"
          title="Download data as CSV spreadsheet">
          ${getIcon('table', 14)}
          CSV
        </button>

        <button class="btn btn-secondary btn-sm" id="${id}-copy"
          title="Copy a link to this page">
          ${getIcon('link', 14)}
          Copy link
        </button>

        <div style="flex:1"></div>

        <div id="${id}-status" style="font-size:var(--text-xs);
          color:var(--color-success);display:none">
          ✓ Done
        </div>
      </div>`;

    this._wire(id, options);
  },

  /* ── Wire button events ── */
  _wire(id, options) {
    /* PDF / Print */
    document.getElementById(`${id}-pdf`)?.addEventListener('click', () => {
      if (options.onPrint) options.onPrint();
      const title = options.title || document.title;
      const prev  = document.title;
      document.title = `BOPinc Nigeria — ${title}`;

      /* Ensure all non-active pages are hidden for print —
         the active page is already set by navigate(), but this
         is a safety net for the export toolbar which may be
         clicked without navigating first. */
      const activeSection = options.pageId
        ? document.querySelector(`.page[data-page="${options.pageId}"]`)
        : document.querySelector('.page.active');

      /* Temporarily mark only the correct page as active */
      let swapped = false;
      if (activeSection && !activeSection.classList.contains('active')) {
        document.querySelectorAll('.page.active').forEach(p => p.classList.remove('active'));
        activeSection.classList.add('active');
        swapped = true;
      }

      window.print();

      document.title = prev;
      if (swapped) {
        /* Restore — the page the user was actually on */
        activeSection.classList.remove('active');
        const currentId = typeof window.currentPage !== 'undefined' ? window.currentPage : '';
        if (currentId) {
          const current = document.querySelector(`.page[data-page="${currentId}"]`);
          if (current) current.classList.add('active');
        }
      }
    });

    /* CSV */
    document.getElementById(`${id}-csv`)?.addEventListener('click', () => {
      const data = options.getData ? options.getData() : [];
      if (data.length === 0) {
        Toast.show('No data to export.', 'warning');
        return;
      }
      this._downloadCSV(data, options.title || 'export');
      this._flash(id);
    });

    /* Copy link */
    document.getElementById(`${id}-copy`)?.addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        this._flash(id, 'Link copied');
      }).catch(() => {
        Toast.show('Could not copy — use Ctrl+C on the address bar.', 'warning');
      });
    });
  },

  /* ── Generate and download a CSV file ── */
  _downloadCSV(data, filename) {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const rows    = data.map(row =>
      headers.map(h => {
        const val = row[h] !== undefined ? row[h] : '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"')
          ? `"${str}"` : str;
      }).join(',')
    );

    const csv  = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href     = url;
    link.download = `bopinc-${filename.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /* ── Brief status flash ── */
  _flash(id, msg = 'Done') {
    const status = document.getElementById(`${id}-status`);
    if (!status) return;
    status.textContent = `✓ ${msg}`;
    status.style.display = 'block';
    setTimeout(() => { status.style.display = 'none'; }, 2000);
  },

  /* ════════════════════════════════════════
     DATA HELPERS
     Formatters for common export shapes
  ════════════════════════════════════════ */

  /* Format calendar events for CSV export */
  formatEventsForCSV(events) {
    return events.map(e => ({
      'Team member':  e.userName     || '',
      'Date':         e.date         || '',
      'Event':        e.title        || '',
      'Type':         e.type         || '',
      'Start':        ChartBar._fmtHour ? ChartBar._fmtHour(e.startHour) : e.startHour,
      'End':          ChartBar._fmtHour ? ChartBar._fmtHour(e.endHour)   : e.endHour,
      'All day':      e.isAllDay     ? 'Yes' : 'No',
      'Location':     e.location     || '',
    }));
  },

  /* Format leave records for CSV export */
  formatLeaveForCSV(records) {
    return records.map(r => ({
      'Team member':   r.userName  || '',
      'Leave type':    r.type      || '',
      'Start date':    r.startDate || '',
      'End date':      r.endDate   || '',
      'Duration':      r.durationDays || '',
      'Status':        r.status    || '',
    }));
  },

  /* Format projects for CSV export */
  formatProjectsForCSV(projects) {
    return projects.map(p => ({
      'Project code':    p.projectCode    || '',
      'Name':            p.name           || '',
      'Status':          p.status         || '',
      'Sector':          p.sector         || '',
      'Lead':            p.lead           || '',
      'Account manager': p.accountManager || '',
      'Start date':      p.startDate      || '',
      'End date':        p.endDate        || '',
      'Health score':    p.health         || '',
    }));
  },
};