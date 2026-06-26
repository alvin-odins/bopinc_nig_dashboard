# Responsive design guide

The dashboard works on every screen size — from small Android phones to wide desktop monitors. This page explains how it adapts, how to test it, and what to do if something looks broken on a specific device.

---

## The five screen sizes

The dashboard is designed and tested at five sizes:

| Name | Width | Typical device |
|---|---|---|
| Mobile S | 320px and up | Older or small phones |
| Mobile L | 480px and up | Large phones, iPhone Pro Max |
| Tablet | 768px and up | iPads, Android tablets, phones in landscape |
| Laptop | 1024px and up | MacBooks, Windows laptops, iPad Pro landscape |
| Desktop | 1280px and up | External monitors, wide screens |

The dashboard is built **mobile-first**: the base design is for the smallest screen, and each larger size adds to it. This means if you're on a slow connection and only part of the stylesheet loads, the page still works — it just looks like the mobile version.

---

## How the navigation changes by screen

### On mobile (under 768px)
The navigation is at the **bottom of the screen** — within thumb reach. It shows the five most-used tabs. Remaining tabs are under "More". There is no sidebar.

### On tablet (768px and above)
A **narrow icon sidebar** appears on the left, 60px wide. Each icon has a label that appears as a tooltip when you hover over it. The bottom navigation disappears.

### On laptop and desktop (1024px and above)
The sidebar **expands to full width** with icons and labels always visible. You can collapse it back to icon-only by clicking the toggle button at the bottom of the sidebar.

---

## How charts respond to screen size

All charts have a minimum height of 200px and scale upward as the screen gets wider.

On mobile:
- Charts take the full width of the screen
- Charts are taller to compensate for lost horizontal space
- The team pulse swimlane view collapses to show one person at a time — swipe left or right to move between team members

On tablet and desktop:
- Charts show their full width
- Multiple people can be compared side by side

---

## How tables respond on mobile

Data tables (for example, leave records or project lists) automatically become **card stacks** on small screens. Each row becomes a card with the field name shown on the left and the value on the right. This avoids horizontal scrolling, which is awkward on phones.

On tablet and desktop, the full table is shown. If a table is very wide it will scroll horizontally within its container — you can swipe left to see additional columns.

---

## Exporting on mobile

The export toolbar (PDF, Word, CSV) collapses to a single "Export" button on mobile. Tapping it opens a panel from the bottom of the screen with the three format options.

Use **Chrome** or **Edge** on mobile for the best PDF export results — they have the most reliable print-to-PDF support.

---

## Touch rules

- Every tappable element is at least 44×44px — the minimum size recommended by Apple and Google for comfortable touch targets
- Carousels (the sector view, the visits timeline, the country cards) can be **swiped** left and right on touch screens
- Nothing important is hidden behind a hover — all tooltips and labels are accessible by tap as well

---

## Testing on different screen sizes

You don't need a physical device to test. In Chrome or Firefox:

1. Open the dashboard
2. Press **F12** (or right-click → Inspect)
3. Click the phone/tablet icon near the top of the developer tools panel
4. Select a device from the dropdown (or type in a custom width)
5. Refresh the page

To test a specific width, type the pixel value into the width field at the top of the responsive view.

---

## Reporting a layout issue

If something looks broken on a specific device or screen size:

1. Note the device name and screen width (you can find this in Settings → About)
2. Note the tab you were on and what looks wrong
3. Take a screenshot if possible
4. Create a GitHub issue or send it to the admin — include all three details

Common things to include in the report:
- "On iPhone 14, the stat cards overlap on the home page at 390px"
- "On iPad in landscape, the sidebar shows but the main content is cut off"

The more specific the description, the faster it can be fixed.