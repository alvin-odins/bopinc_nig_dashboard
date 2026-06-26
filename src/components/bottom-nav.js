/* ============================================================
   BOPinc Nigeria Dashboard — Bottom Navigation Component
   Mobile only (hidden at 768px+ via responsive.css).
   Renders the bottom tab bar from TABS config in roles.js.
   ============================================================ */
 
const BottomNav = {
 
  /* ── State ── */
  moreMenuOpen: false,
 
  /* ── Initialise: render and wire events ── */
  init() {
    this.render();
    this.initMoreMenu();
    this.initSwipeClose();
  },
 
  /* ── Render the bottom nav from visible tabs ── */
  render() {
    const container = document.getElementById('bottom-nav');
    if (!container) return;
 
    const session  = Session.get();
    const role     = session ? session.role : ROLES.TEAM_MEMBER;
    const allTabs  = getVisibleTabs(role);
 
    /* Primary tabs — first 4 that have inBottomNav: true */
    const primaryTabs = allTabs
      .filter(t => t.inBottomNav)
      .slice(0, 4);
 
    /* Overflow tabs — everything else visible to this role */
    const overflowTabs = allTabs.filter(t =>
      !primaryTabs.find(p => p.id === t.id)
    );
 
    /* Store overflow for the More menu */
    this._overflowTabs = overflowTabs;
 
    const currentPage = window.currentPage || 'home';
 
    container.innerHTML = [
      ...primaryTabs.map(tab => this._renderItem(tab, currentPage)),
      this._renderMoreItem(overflowTabs, currentPage),
    ].join('');
 
    /* Wire tab clicks */
    container.querySelectorAll('.bottom-nav-item[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pageId = btn.getAttribute('data-page');
        if (typeof navigate === 'function') navigate(pageId);
        this.setActive(pageId);
      });
    });
 
    /* Wire More button */
    const moreBtn = container.querySelector('#bottom-nav-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMoreMenu();
      });
    }
  },
 
  /* ── Render a single nav item ── */
  _renderItem(tab, currentPage) {
    const isActive = tab.id === currentPage;
    const badgeHtml = (tab.badge > 0)
      ? `<span class="bottom-nav-badge" aria-label="${tab.badge} unread">${tab.badge}</span>`
      : '';
    return `
      <button
        class="bottom-nav-item${isActive ? ' active' : ''}"
        data-page="${tab.id}"
        aria-label="${tab.label}"
        ${isActive ? 'aria-current="page"' : ''}
        title="${tab.label}">
        <span class="bottom-nav-icon" aria-hidden="true">${getIcon(tab.icon, 22)}</span>
        <span class="bottom-nav-label">${tab.label}</span>
        ${badgeHtml}
      </button>`;
  },
 
  /* ── Render the More button ── */
  _renderMoreItem(overflowTabs, currentPage) {
    /* If any overflow tab is the current page, highlight More */
    const moreActive = overflowTabs.some(t => t.id === currentPage);
    return `
      <button
        class="bottom-nav-item bottom-nav-more${moreActive ? ' active' : ''}"
        id="bottom-nav-more-btn"
        aria-label="More tabs"
        aria-haspopup="true"
        aria-expanded="false">
        <span class="bottom-nav-icon" aria-hidden="true">${getIcon('dots', 22)}</span>
        <span class="bottom-nav-label">More</span>
      </button>`;
  },
 
  /* ── Set active state on a tab ── */
  setActive(pageId) {
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      const isActive = btn.getAttribute('data-page') === pageId;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
 
    /* If the active tab is in overflow, highlight More */
    const moreBtn = document.getElementById('bottom-nav-more-btn');
    if (moreBtn && this._overflowTabs) {
      const moreActive = this._overflowTabs.some(t => t.id === pageId);
      moreBtn.classList.toggle('active', moreActive);
    }
 
    /* Close More menu on navigation */
    this.closeMoreMenu();
  },
 
  /* ── More menu ── */
  initMoreMenu() {
    /* Create the More menu overlay */
    const existing = document.getElementById('bottom-nav-more-menu');
    if (existing) existing.remove();
 
    const menu = document.createElement('div');
    menu.id = 'bottom-nav-more-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'More navigation options');
    menu.setAttribute('aria-modal', 'true');
    menu.style.cssText = `
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      padding: var(--space-3) var(--space-4) calc(var(--bottom-nav-height) + var(--space-4));
      z-index: calc(var(--z-sidebar) + 1);
      transform: translateY(100%);
      transition: transform var(--transition-normal);
      box-shadow: var(--shadow-lg);
    `;
 
    menu.innerHTML = `
      <div style="width:40px;height:4px;background:var(--color-border-strong);border-radius:var(--radius-full);margin:0 auto var(--space-4)"></div>
      <div style="font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:var(--space-3)">More</div>
      <div id="bottom-nav-more-list" style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-2)"></div>
    `;
 
    document.body.appendChild(menu);
    this._moreMenu = menu;
    this._renderMoreMenuItems();
  },
 
  _renderMoreMenuItems() {
    const list = document.getElementById('bottom-nav-more-list');
    if (!list || !this._overflowTabs) return;
 
    const currentPage = window.currentPage || 'home';
 
    list.innerHTML = this._overflowTabs.map(tab => `
      <button
        class="more-menu-item${tab.id === currentPage ? ' active' : ''}"
        data-page="${tab.id}"
        style="
          display:flex;flex-direction:column;align-items:center;gap:6px;
          padding:var(--space-3) var(--space-2);
          border-radius:var(--radius-md);
          border:1px solid var(--color-border);
          background:var(--color-surface);
          color:var(--color-text-primary);
          font-size:var(--text-xs);
          font-weight:var(--weight-medium);
          cursor:pointer;
          min-height:68px;
          transition:background var(--transition-fast);
        ">
        <span style="color:var(--color-text-secondary)">${getIcon(tab.icon, 24)}</span>
        ${tab.label}
      </button>
    `).join('');
 
    list.querySelectorAll('.more-menu-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const pageId = btn.getAttribute('data-page');
        if (typeof navigate === 'function') navigate(pageId);
        this.setActive(pageId);
        this.closeMoreMenu();
      });
    });
  },
 
  toggleMoreMenu() {
    this.moreMenuOpen ? this.closeMoreMenu() : this.openMoreMenu();
  },
 
  openMoreMenu() {
    const menu = this._moreMenu;
    if (!menu) return;
    this.moreMenuOpen = true;
    menu.style.transform = 'translateY(0)';
    const moreBtn = document.getElementById('bottom-nav-more-btn');
    if (moreBtn) moreBtn.setAttribute('aria-expanded', 'true');
    this._renderMoreMenuItems();
  },
 
  closeMoreMenu() {
    const menu = this._moreMenu;
    if (!menu) return;
    this.moreMenuOpen = false;
    menu.style.transform = 'translateY(100%)';
    const moreBtn = document.getElementById('bottom-nav-more-btn');
    if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
  },
 
  /* ── Swipe down on More menu to close ── */
  initSwipeClose() {
    let startY = 0;
    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });
 
    document.addEventListener('touchend', (e) => {
      if (!this.moreMenuOpen) return;
      const endY = e.changedTouches[0].clientY;
      if (endY - startY > 60) this.closeMoreMenu(); /* swipe down 60px = close */
    }, { passive: true });
 
    /* Tap outside to close */
    document.addEventListener('click', (e) => {
      if (!this.moreMenuOpen) return;
      const menu = this._moreMenu;
      const moreBtn = document.getElementById('bottom-nav-more-btn');
      if (menu && !menu.contains(e.target) && e.target !== moreBtn) {
        this.closeMoreMenu();
      }
    });
  },
 
  /* ── Re-render when role changes ── */
  refresh() {
    this.closeMoreMenu();
    this.render();
    const existing = document.getElementById('bottom-nav-more-menu');
    if (existing) existing.remove();
    this.initMoreMenu();
  },
};