# Spendwise — Expense Tracker App Audit

**Project:** Spendwise — Expense Tracker
**Date:** 2026-11-19
**File reviewed:** `index.html` (single-file static app)

---

## 1. Overview

Spendwise is a personal expense tracker that runs entirely in the browser — no server, no account, no build step. All data is stored in the browser's `localStorage`, so your transactions and budgets persist between visits but never leave your device.

The app ships as a single `index.html` file containing all markup, styles, and scripts, with one external dependency (Google Fonts). It is ready to drop into any static host, including GitHub Pages.

### Features
| # | Feature | Description |
|---|---------|-------------|
| 1 | Add transactions | Log income or expense entries with description, amount, category, and date |
| 2 | Summary dashboard | Four cards: total balance, total income, total expenses, monthly savings rate |
| 3 | Transaction list | Searchable, filterable (all / expenses / income), sorted by date with delete on hover |
| 4 | Category donut chart | SVG donut showing this month's expense breakdown by category with legend |
| 5 | 7-day bar chart | Daily income (green) vs expense (red) bars for the last week |
| 6 | Monthly budgets | Set per-category spending limits; progress bars turn amber at 80% and red when exceeded |
| 7 | Dark / light theme | Toggle with sun/moon icon; persists choice across sessions; respects system preference on first visit |
| 8 | Seed data | First-time visitors see sample transactions and budgets so the app isn't empty |

---

## 2. Design System

### Typography
- **Headings:** Sora (700, 600) — modern geometric sans.
- **Body:** Inter (400, 500, 600) — highly legible UI sans.
- Line height: 1.2 for headings, 1.6 for body.

### Color
A six-ramp system plus neutrals, defined as CSS custom properties:
- Primary (green) — 300 / 500 / 700 / 900 / 50
- Accent (amber) — 300 / 500
- Success — 600
- Warning — 500
- Error — 500 / 50
- Neutral — 50 / 100 / 300 / 500 / 700 / 900 / 950

Green was chosen as the primary color to evoke financial health and growth. No purple/indigo hues are used. Income is green, expenses are red, warnings are amber — consistent semantic coloring throughout.

### Spacing
8-pixel base unit with consistent 16px / 24px / 28px padding on cards and panels.

### Radius & Shadow
- Radius: 12px (inputs, chips), 20px (cards/panels), 100px (pills/buttons).
- Three shadow tokens for depth hierarchy.

---

## 3. Responsiveness

| Breakpoint | Behavior |
|------------|----------|
| > 900px | Two-column layout (add panel + transaction list side by side), two-column chart row, four-column summary |
| ≤ 900px | Single-column layout, stacked charts, two-column summary |
| ≤ 480px | Two-column summary (compact), reduced padding, smaller donut, wrapping filter buttons |

All card grids use `auto-fill` / `minmax` so budget cards reflow naturally at any width.

---

## 4. Data Architecture

### Storage
- `localStorage['spendwise_tx']` — JSON array of transaction objects.
- `localStorage['spendwise_budgets']` — JSON object mapping category IDs to monthly limit numbers.
- `localStorage['sw_theme']` — `'light'` or `'dark'`.

### Transaction object
```
{ id: number, type: 'income' | 'expense', cat: string, desc: string, amount: number, date: 'YYYY-MM-DD' }
```

### Categories (9 total)
Food & Dining, Transport, Shopping, Entertainment, Bills & Utilities, Health, Salary, Other Income, Other. Each has a unique color and SVG icon. Income-type categories are filtered to Salary + Other Income when the income toggle is active.

### Seed data
On first visit (no stored transactions), eight sample transactions and four budgets are inserted so the user immediately sees a populated dashboard. This data is only seeded once.

### Data safety
- Deletion only removes the targeted transaction by ID — no bulk deletes or cascading operations.
- All user input is HTML-escaped before rendering (`escapeHtml`) to prevent XSS via description text.
- `localStorage` reads are wrapped in try/catch to handle corrupted data gracefully.

---

## 5. Charts

### Donut chart (spending by category)
- Pure SVG — no chart library.
- Calculated from this month's expenses only, grouped by category.
- Uses `stroke-dasharray` / `stroke-dashoffset` on `<circle>` elements to create segments.
- Center shows total monthly spend; legend lists top 6 categories with amounts and percentages.
- Degrades to a "no data" message if no expenses exist this month.

### Bar chart (income vs expenses, last 7 days)
- CSS-based stacked bars (no SVG or library).
- Each day shows income (green) and expense (red) segments, scaled to the week's maximum value.
- Bars animate height on render via CSS transition.

---

## 6. Budget System

- Users set a monthly spending limit per expense category via a modal.
- Each budget card shows: amount spent vs limit, a progress bar, and a status line.
- Progress bar color and status text change at thresholds:
  - **< 80%:** Category color, "remaining" amount shown.
  - **≥ 80%:** Amber, "left" amount shown (warning).
  - **> 100%:** Red, "over by" amount shown.
- Budgets can be edited after creation (category is locked in edit mode, only the amount changes).

---

## 7. Interactions & Animation

- **New transaction slide-in:** Each newly rendered transaction item animates in from the left.
- **Bar chart growth:** Bars animate from 0 to their target height on render.
- **Progress bar fill:** Budget bars animate width over 0.8s.
- **Hover states:** Summary cards lift 3px; budget cards lift 3px; transaction items reveal a delete button on hover.
- **Modal:** Fade-in overlay with a scale-in pop animation on the dialog.
- **Toast:** Success/error messages slide up from the bottom, auto-dismiss after ~3 seconds.
- **Theme toggle:** Icon rotates 20° on hover; smooth color transition on all elements.
- **Reduced motion:** All animations disabled when `prefers-reduced-motion: reduce` is set.

---

## 8. Accessibility

- Semantic HTML: `header`, `main`, `section`, `footer` with heading hierarchy (h2 → h3).
- Theme toggle has `aria-label`.
- Delete buttons have `aria-label="Delete"`.
- Form inputs have associated `<label>` elements.
- Focus styles: inputs show a 3px focus ring in the primary color.
- Color contrast meets WCAG AA for all text and UI elements.
- Modal is dismissible by clicking the overlay or the Cancel button.
- `prefers-reduced-motion` is respected.

### Room for improvement
- Add keyboard support (Escape key) to close the modal.
- Add `aria-live` to the toast for screen reader announcements.
- The donut chart is visual only — adding a data table alternative would help screen reader users.

---

## 9. Performance

- **No JavaScript framework** — vanilla JS, ~6 KB of script.
- **No external JS** — only Google Fonts CSS is fetched.
- **No chart library** — both charts are hand-built with SVG and CSS, keeping the bundle tiny.
- **Fonts:** Loaded with `preconnect` and `display=swap` to avoid invisible text.
- **Rendering:** All re-renders are batched into a single `renderAll()` call after data changes.
- **localStorage:** Synchronous reads/writes only on data changes — not on every render.

### Estimated Lighthouse scores
| Category | Score (est.) | Notes |
|----------|--------------|-------|
| Performance | 98–100 | No render-blocking JS, minimal CSS, no images |
| Accessibility | 90+ | Semantic, labeled, contrast-compliant; modal keyboard support needed |
| Best Practices | 100 | No console errors, no insecure origins |
| SEO | 85 | Has title/description; not primarily an SEO-target app |

---

## 10. Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge — last 2 versions).
- Uses `color-mix(in srgb, …)` and `backdrop-filter` — both supported in all current browsers since mid-2023.
- `localStorage` is universally supported.
- Input types `date` and `number` use native browser pickers.

---

## 11. Deployment

### GitHub Pages
1. Create a new repository on GitHub.
2. Upload `index.html` and this `audit.md` to the repo root.
3. Go to **Settings → Pages**, set **Source** to `Deploy from a branch`, choose `main` / `root`, and save.
4. The app will be live at `https://<username>.github.io/<repo-name>/` within a minute.

### Other hosts
The file is fully self-contained. It works on Netlify, Vercel, Cloudflare Pages, or any static file server — just upload `index.html`.

---

## 12. Security Notes

- **No server communication:** All data stays in the browser via `localStorage`. No network requests are made except the Google Fonts stylesheet.
- **XSS prevention:** User-entered transaction descriptions are HTML-escaped before insertion into the DOM.
- **No external APIs:** The app does not call any third-party services.
- **No authentication:** The app is single-user, local-only. If multi-user or cloud sync is needed, it should be rebuilt with a backend (e.g., Supabase) with proper RLS policies.

---

## 13. Customization Checklist

Before publishing, consider updating:

- [ ] Change the app name "Spendwise" and logo to your own branding.
- [ ] Add or remove categories in the `CATEGORIES` array (each needs an `id`, `label`, `color`, and `icon`).
- [ ] Adjust the seed data or remove it entirely if you want a blank start.
- [ ] Change the default budget categories and amounts.
- [ ] Add a favicon.
- [ ] Add Open Graph meta tags if sharing on social media.
- [ ] If you want cloud sync / multi-device, integrate Supabase for storage instead of `localStorage`.
- [ ] Add CSV export for tax or record-keeping purposes.
- [ ] Add recurring transaction support for monthly bills.

---

## 14. Summary

Spendwise is a complete, self-contained expense tracker with income/expense logging, category breakdowns, a 7-day income vs spending chart, monthly budget tracking with visual alerts, dark/light theming, and local persistence — all in a single HTML file with no build step or backend. It is ready to upload to a GitHub repository and publish via GitHub Pages immediately. The main enhancement paths are cloud sync (via Supabase) and data export if needed.
