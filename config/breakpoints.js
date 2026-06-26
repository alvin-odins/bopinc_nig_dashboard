/* ============================================================
   BOPinc Nigeria Dashboard — Breakpoint Configuration
   JavaScript mirror of the CSS breakpoints in variables.css.
   Use these anywhere JS needs to know the current screen size.
   ============================================================ */
 
const BREAKPOINTS = {
  xs:  320,   /* Mobile S — small phones */
  sm:  480,   /* Mobile L — large phones */
  md:  768,   /* Tablet — sidebar appears, bottom nav hides */
  lg:  1024,  /* Laptop — sidebar expands to full width */
  xl:  1280,  /* Desktop — wide monitors */
};
 
/* ── Query helpers ── */
 
/** Returns true if the current viewport is at least this wide */
function isAtLeast(bp) {
  return window.innerWidth >= BREAKPOINTS[bp];
}
 
/** Returns true if the current viewport is narrower than this breakpoint */
function isBelow(bp) {
  return window.innerWidth < BREAKPOINTS[bp];
}
 
/** Returns the current named breakpoint */
function currentBreakpoint() {
  const w = window.innerWidth;
  if (w >= BREAKPOINTS.xl) return 'xl';
  if (w >= BREAKPOINTS.lg) return 'lg';
  if (w >= BREAKPOINTS.md) return 'md';
  if (w >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}
 
/** Returns true if we are on mobile (below tablet breakpoint) */
function isMobile() {
  return isBelow('md');
}
 
/** Returns true if the sidebar is visible (tablet and above) */
function hasSidebar() {
  return isAtLeast('md');
}
 
/* ── Resize listener utility ──
   Usage:
   onBreakpointChange((bp) => {
     console.log('Now at breakpoint:', bp);
   });
*/
function onBreakpointChange(callback) {
  let lastBp = currentBreakpoint();
  let rafId;
 
  window.addEventListener('resize', () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const newBp = currentBreakpoint();
      if (newBp !== lastBp) {
        lastBp = newBp;
        callback(newBp);
      }
    });
  });
}
 
/* ── Export for use across components ── */
if (typeof module !== 'undefined') {
  module.exports = {
    BREAKPOINTS,
    isAtLeast,
    isBelow,
    currentBreakpoint,
    isMobile,
    hasSidebar,
    onBreakpointChange,
  };
}