# Bid Supply UI/UX Audit Report

> **Date:** 2026-04-03
> **Auditor:** Frontend Specialist
> **Scope:** Accessibility (WCAG AA), Responsiveness, Form Controls, LiveTicker, Empty States, Design System Consistency

---

## 1. Color Contrast — WCAG AA (Critical)

### Summary
The light-theme changes introduced **many color-contrast failures**. Normal body text requires **≥ 4.5:1** contrast on white (#FFF). Large text (≥ 18px or ≥ 14px bold) requires **≥ 3:1**. Only icons & decorative dots get a pass; any text-bearing color must meet the threshold.

### Failing Elements & Concrete Fixes

| Component | Current Color | Contrast | Fix |
|---|---|---|---|
| **TodaySummary** — label text (`text-slate-500` / `text-slate-600` via `#94a3b8`) on white | `#94a3b8` | **2.56:1** ❌ | Change to `#6b7280` (gray-500, **4.83:1** ✅) or `#6c7786` (darkened slate-400, **4.54:1** ✅) |
| **TodaySummary** — icon colors `text-indigo-400` → mapped to `text-indigo-600` | `#6366f1` | 4.47:1 ⚠️ (barely fails normal, passes large/icon) | **Acceptable** for icon-only use (not text), but if ever used as text change to `#4f46e5` (indigo-600, **6.5:1** ✅) |
| **TodaySummary** — icon colors `text-green-400` → mapped to `text-green-600` | `#16a34a` | **3.30:1** ❌ (large) | Change to `#15803d` (green-700, **5.0:1** ✅) |
| **TodaySummary** — icon colors `text-amber-400` → mapped to `text-amber-600` | `#d97706` | **3.19:1** ❌ (large) | Change to `#b45309` (amber-700, **4.55:1** ✅) |
| **TodaySummary** — icon colors `text-cyan-400` → mapped to `text-cyan-600` | `#22d3ee` → `#0891b2` | `#0891b2` is **3.5:1** ❌ (large) | Change to `#0e7490` (cyan-700, **4.9:1** ✅) |
| **TodaySummary** — icon colors `text-purple-400` → mapped to `text-purple-600` | `#c084fc` → `#9333ea` | `#9333ea` is **5.08:1** ✅ | **Pass** for icon use |
| **TodaySummary** — icon colors `text-pink-400` → mapped to `text-pink-600` | `#f472b6` → `#db2777` | `#db2777` is **4.5:1** ✅ | **Pass** |
| **PriceCharts** — section title `text-slate-700` | `#334155` | **9.26:1** ✅ | No change needed |
| **ActiveCycles** — section title `text-slate-700` | `#334155` | **9.26:1** ✅ | No change needed |
| **ActiveCycles** — cycle progress text `text-indigo-600` | `#4f46e5` | **6.5:1** ✅ | No change needed |
| **ActiveCycles** — dates text `text-slate-500` | `#64748b` | **4.76:1** ✅ | No change needed |
| **ActiveCycles** — empty state `text-slate-500` on bg-slate-50 (`#f8fafc`) | `#64748b` | ~4.37:1 ⚠️ | Change to `#475569` (slate-600, **7.1:1** ✅ on white background too) |
| **SupplierLeaderboard** — medal 2nd place `bg-slate-50` | — | decorative ✅ | No change needed |
| **SupplierLeaderboard** — `text-slate-400` on tiny icons | `#94a3b8` | **2.56:1** ❌ | Icons at 12px (w-3 h-3) are still text-level; change to `#6b7280` (gray-500) ✅ |
| **WinnerFeed** — `text-slate-500` supplier text | `#64748b` | **4.76:1** ✅ | No change needed |
| **LiveTicker** — separator `text-slate-300` ("|") | `#cbd5e1` | **1.48:1** ❌ | Change to `#94a3b8` (slate-400, **2.56:1** — decorative, acceptable since it's a visual separator, not informational) |
| **LanguageToggle** — `text-slate-700` on white | `#334155` | **9.26:1** ✅ | No change needed |
| **ErrorBoundary** — `text-red-800` on red-50 (`#fee2e2`) | `#991b1b` | **7.2:1** ✅ | No change needed |
| **charts** — X/Y axis fills `#475569` | `#475569` | **7.58:1** ✅ | No change needed |
| **charts** — Bar fill `#22c55e` (green) | `#22c55e` | **2.28:1** ❌ | This is a **filled shape** (not text), so the color is acceptable for data visualization. If you want a label beside it, ensure label text meets 4.5:1. |

### TodaySummary Card — Icon Color Mapping Fix

The current code does `.replace('400', '600')` which works for `text-green-400` → `text-green-600` but is fragile. Replace with a proper mapping:

```tsx
// Current (fragile):
<c.icon className={`w-3.5 h-3.5 ${c.color.replace('400', '600')}`} />

// Fix — use explicit WCAG-compliant colors directly:
const cards = [
  { label: 'Total Bids', value: stats.totalBids.toLocaleString(), icon: Target, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { label: 'Winners', value: stats.winners.toLocaleString(), icon: Trophy, bgColor: 'bg-green-100', iconColor: 'text-green-700' },
  { label: 'Products', value: stats.uniqueProducts.toLocaleString(), icon: Package, bgColor: 'bg-amber-100', iconColor: 'text-amber-700' },
  { label: 'Suppliers', value: stats.uniqueSuppliers.toLocaleString(), icon: Users, bgColor: 'bg-cyan-100', iconColor: 'text-cyan-700' },
  { label: 'Avg Price', value: ..., icon: TrendingUp, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  { label: 'Total Volume', value: ..., icon: Award, bgColor: 'bg-pink-100', iconColor: 'text-pink-600' },
];

// Each iconColor above passes WCAG AA on white for small icon use.
```

---

## 2. Responsiveness & Grid Layout

### TodaySummary Grid

```tsx
// Current:
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
```

| Breakpoint | Behavior | Issue |
|---|---|---|
| Mobile (< 768px) | 2 columns, `text-xl` values | **Minor**: "Avg Price" and "Total Volume" with ETB/kg suffixes may overflow at 320px width. The value `text-xl font-bold` with `10,432 ETB` pushes close to the card edge. |
| Tablet (768–1024px) | 3 columns | Good |
| Desktop (> 1024px) | 6 columns | Good |

**Fix**: Add `min-w-0` and `break-words` to the value paragraph to prevent overflow at narrow widths:

```tsx
// TodaySummary.tsx — value paragraph:
<p className="text-xl font-bold tracking-tight text-slate-900 break-words">{c.value}</p>

// Add responsive text sizing:
<p className="text-lg md:text-xl font-bold tracking-tight text-slate-900 break-words">{c.value}</p>
```

### Middle Grid (Page Layout)

```tsx
// Current:
className="grid grid-cols-1 lg:grid-cols-3 gap-6"
```

| Breakpoint | Behavior | Issue |
|---|---|---|
| Mobile (< 1024px) | Single column stack | ✅ Good |
| Desktop (> 1024px) | 3-col: charts (2) + feed (1) | ✅ Good |

**No horizontal scroll issue detected** — `max-w-7xl mx-auto` constrains properly, and `px-4 sm:px-6` handles mobile edges.

### LiveTicker — Horizontal Overflow Risk ⚠️

The marquee sets `width: ${items.length * 280}px` inline. At 60 items (30 × 2), this is **16,800px** which can trigger horizontal scroll on iOS Safari.

**Fix**: Add `position: relative` and `overflow-x: hidden` to the wrapper explicitly:

```tsx
// LiveTicker.tsx — outer wrapper:
<div className="border-b border-slate-200 bg-slate-50 py-2 overflow-hidden relative">
```

Also add `overscroll-x: none` to the body in globals.css:
```css
html, body { overscroll-behavior-x: none; }
```

---

## 3. Form Controls — PriceCharts `<select>` (Accessibility)

### Issues Found

1. **No visible `<label>`** — The product dropdown has no associated `<label>` element. Screen readers cannot determine its purpose.
2. **No `aria-label`** — No accessible name on the `<select>`.
3. **Focus ring** — Current: `focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200`. The ring color `indigo-200` (#c7d2fe) is very light.

### Fixes

```tsx
// PriceCharts.tsx — replace the <select> block:
<div className="flex items-center gap-2">
  <label htmlFor="product-select" className="sr-only">Select Product</label>
  <select
    id="product-select"
    value={selectedProduct}
    onChange={(e) => setSelectedProduct(Number(e.target.value))}
    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900
               focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300
               hover:border-slate-400 transition-colors"
  >
    {products.map(p => (
      <option key={p.id} value={p.id}>{p.name}</option>
    ))}
  </select>
</div>
```

Changes:
- **Added `sr-only` label** with `htmlFor="product-select"` (required by WCAG 1.3.1)
- **Darker focus ring**: `ring-indigo-300` (#a5b4fc) — 3.25:1 ring-to-white contrast for visibility
- **Darker default border**: `border-slate-300` instead of `border-slate-200` for better visibility
- **Added `hover:border-slate-400`** for affordance

---

## 4. LiveTicker — Marquee

### Issues Found

| Issue | Severity | Detail |
|---|---|---|
| **No pause on hover** | High | Marquee keeps scrolling on hover. Users cannot read bid details — WCAG 2.2.2 (Pause, Stop, Hide). |
| **No `prefers-reduced-motion` handling** | High | Users with vestibular disorders will experience motion sickness. |
| **Inline `width` style** | Medium | Fixed px width doesn't adapt; can overflow at extreme zoom or small screens. |
| **Duplicated content without ARIA** | Low | Screen readers read the doubled items. |
| **Text truncation** | None (intended) | `whitespace-nowrap` is correct for marquee. Text is intentionally not truncated. |
| **RTL/Amharic language fit** | Medium | Amharic characters may render at different widths, potentially causing spacing gaps in the marquee at language switch. No overflow tested. |

### Fixes

```tsx
// LiveTicker.tsx — complete fixed marquee section:

// 1. Add state for hover pause
const [paused, setPaused] = useState(false);

// 2. Add ARIA and event handlers to the outer wrapper:
<div
  className="border-b border-slate-200 bg-slate-50 py-2 overflow-hidden relative"
  role="marquee"
  aria-label={t('recentBids') || 'Recent bids'}
>
  <div
    className="flex gap-8 whitespace-nowrap"
    style={{
      animation: `marquee 60s linear infinite`,
      animationPlayState: paused ? 'paused' : 'running',
      width: 'fit-content',
    }}
    onMouseEnter={() => setPaused(true)}
    onMouseLeave={() => setPaused(false)}
    onTouchStart={() => setPaused(true)}
    onTouchEnd={() => setPaused(false)}
  >
    {/* ... items ... */}
  </div>
  <style jsx>{`
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @media (prefers-reduced-motion: reduce) {
      [style*="marquee"] {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `}</style>
</div>

// 3. For duplicated content, add aria-hidden to second half:
const items = [...bids.map((b, i) => ({ ...b, ariaHidden: false })),
               ...bids.map((b, i) => ({ ...b, ariaHidden: true }))];

// Then in the map:
<div key={`${bid.id}-${i}`} aria-hidden={bid.ariaHidden} className="flex items-center gap-2 text-sm shrink-0">
```

### RTL/Amharic Consideration
- When `locale === 'am'`, the page `<html lang="am">` is set but `dir="auto"` is not. Amharic is LTR but Ge'ez script has character width differences.
- **Fix**: Ensure `max-width` on the ticker items so no single product name overflows:
```tsx
<span className="text-slate-900 font-medium max-w-[120px] truncate">{bid.product_name}</span>
```

---

## 5. Empty States

### Current Empty States

| Component | Current Message | Has Illustration? | Quality |
|---|---|---|---|
| **PriceCharts** | `"No price data available for this product"` | ❌ No | **Poor** — plain text, centered, minimal. No icon or guidance. |
| **ActiveCycles** | `"No active cycles right now"` | ❌ No | **Poor** — same as above. |
| **SupplierLeaderboard** | `"No supplier data yet"` | ❌ No | **Poor**. |
| **WinnerFeed** | `"No winners yet today"` | ❌ No | **Poor**. |
| **LiveTicker** | `"No recent bids to display"` | ❌ No | **Adequate** — it's a thin bar, illustration might feel oversized. |
| **ErrorBoundary** | `"Something went wrong"` + error message | ❌ No | **Adequate** — functional but could have a retry button. |

### Suggested Improvements

1. **Add consistent icon + illustration** to all data-component empty states:
```tsx
// Example empty state pattern:
<div className="text-center py-12">
  <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
  <p className="text-sm text-slate-500 font-medium">No price data available for this product</p>
  <p className="text-xs text-slate-400 mt-1">Bids will appear here once suppliers start bidding</p>
</div>
```

2. **Use appropriate icons per component**:
   - PriceCharts: `<TrendingUp className="..." />`
   - ActiveCycles: `<Calendar className="..." />`
   - SupplierLeaderboard: `<Users className="..." />`
   - WinnerFeed: `<Trophy className="..." />`

3. **Add helpful sub-text** explaining *why* data is missing and *what to expect*.

4. **ErrorBoundary** — Add a "Try again" button that re-renders children:
```tsx
<button
  onClick={() => this.setState({ error: null })}
  className="mt-3 px-3 py-1 text-xs font-medium text-red-800 bg-red-100 hover:bg-red-200 rounded-full transition"
>
  Try again
</button>
```

---

## 6. Design System Consistency

### Button Styles

| Component | Button Used | Style | Consistent? |
|---|---|---|---|
| **LanguageToggle** | `<button>` border | `bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 rounded-lg` | — Baseline |
| **ErrorBoundary** (suggested retry) | `<button>` filled-ish | `text-red-800 bg-red-100 hover:bg-red-200 rounded-full` | ✅ Matches red-50 card theme |

**Verdict**: Only one button style exists. No inconsistencies, but no design system tokens either. If more buttons are added, recommend extracting to a `components/ui/Button.tsx`.

### Select Styles

| Component | Style |
|---|---|
| **PriceCharts** `<select>` | `bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900` |

**Verdict**: Only one select. If more are added, make it consistent with the fix in §3.

### Card Container Consistency

| Component | Card Classes | Consistent? |
|---|---|---|
| TodaySummary cards | `rounded-xl bg-white border border-slate-200 shadow-sm p-4` | ✅ |
| PriceCharts card | `rounded-xl bg-white border border-slate-200 shadow-sm p-6` | ✅ (larger padding for charts) |
| ActiveCycles card | `rounded-xl bg-white border border-slate-200 shadow-sm p-6` | ✅ |
| SupplierLeaderboard card | `rounded-xl bg-white border border-slate-200 shadow-sm p-6` | ✅ |
| WinnerFeed card | `rounded-xl bg-white border border-slate-200 shadow-sm p-6` | ✅ |
| Footer explainer | `rounded-xl bg-slate-50 border border-slate-200 p-6` | ⚠️ `bg-slate-50` instead of `bg-white` — intentional distinction or inconsistency? |

### Inner Item Styles (Leaderboard vs WinnerFeed)

| Component | Inner Item |
|---|---|
| SupplierLeaderboard | `p-3 rounded-lg border` + conditional bg colors |
| WinnerFeed | `p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100` |

**Verdict**: WinnerFeed has hover state; SupplierLeaderboard does not. Consider adding `hover:bg-slate-100` to leaderboard rows for consistency.

### Text Size Consistency

Section headings across components:
- PriceCharts: `text-sm font-semibold text-slate-700 uppercase tracking-wider`
- ActiveCycles: `text-sm font-semibold text-slate-700 uppercase tracking-wider`
- SupplierLeaderboard: `text-sm font-semibold text-slate-700 uppercase tracking-wider`
- WinnerFeed: `text-sm font-semibold text-slate-700 uppercase tracking-wider`

✅ **All section headings are identical** — excellent consistency.

### Layout Spacing

| Component | Main Spacing | Consistent? |
|---|---|---|
| Page sections | `space-y-8` | ✅ |
| Inner card gaps | `space-y-2` / `space-y-3` | ✅ Consistent |
| Grid gaps | `gap-6` (middle grid), `gap-3` (summary cards) | ✅ Appropriate differentiation |

---

## 7. Additional Issues Found

### `use client` Duplicate Declaration

`app/page.tsx` line 1-2:
```tsx
'use client';
'use client';
```
**Fix**: Remove the duplicate on line 2.

### Layout vs Page — Conflicting Backgrounds

In `layout.tsx`:
```tsx
<body className="min-h-screen bg-slate-50 text-slate-900">
```

In `page.tsx`:
```tsx
<div className="min-h-screen bg-white text-slate-900">
```

**Result**: The page div overrides the body background, so `bg-slate-50` from layout never applies. The footer explainer section is `bg-slate-50` which *relies* on the surrounding white — making it subtly gray. This works, but:

**Recommendation**: Move `bg-white` to `layout.tsx` body and remove from page.tsx to avoid double declaration. Or, if you *want* the subtle gray distinction on the explainer section, the current approach is fine — just remove `bg-slate-50` from `layout.tsx` to avoid confusion.

### CSS `@keyframes marquee` Defined Twice

The keyframe is defined in both:
1. `globals.css` (used by nothing currently)
2. `LiveTicker.tsx` via `<style jsx>`

**Fix**: Remove the unused definition from `globals.css` to avoid confusion. Keep the one in LiveTicker (after the `prefers-reduced-motion` addition).

---

## Priority Summary

| Priority | Issue | File |
|---|---|---|
| 🔴 Critical | `green-600` icon contrast (3.30:1) → change to `green-700` | TodaySummary.tsx |
| 🔴 Critical | `amber-600` icon contrast (3.19:1) → change to `amber-700` | TodaySummary.tsx |
| 🔴 Critical | `cyan-600` icon contrast (3.5:1) → change to `cyan-700` | TodaySummary.tsx |
| 🔴 Critical | `<select>` missing accessible label (WCAG 1.3.1 failure) | PriceCharts.tsx |
| 🟠 High | LiveTicker no pause on hover (WCAG 2.2.2) | LiveTicker.tsx |
| 🟠 High | No `prefers-reduced-motion` for marquee | LiveTicker.tsx |
| 🟠 High | Empty states lack icons / guidance across 4 components | PriceCharts, ActiveCycles, SupplierLeaderboard, WinnerFeed |
| 🟡 Medium | `slate-500` empty state text on `slate-50` bg (borderline) | ActiveCycles.tsx |
| 🟡 Medium | Ticker inline width can cause overflow | LiveTicker.tsx |
| 🟡 Medium | Supplier leaderboard rows missing hover state vs WinnerFeed | SupplierLeaderboard.tsx |
| 🟢 Low | Duplicate `use client` directive | page.tsx |
| 🟢 Low | Duplicate `marquee` keyframe definition | globals.css / LiveTicker.tsx |
| 🟢 Low | Layout/page conflicting backgrounds | layout.tsx / page.tsx |
| 🟢 Low | No `break-words` on TodaySummary values at 320px | TodaySummary.tsx |
