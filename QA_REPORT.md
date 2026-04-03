# QA Audit Report — Bid Supply Dashboard

**Date:** 2026-04-03
**Auditor:** QA Subagent
**Scope:** Pages/routes, data fetching, UI/a11y, error handling
**App:** Next.js 16.2.2 (App Router, client-side only)

---

## 1. Pages & Routes Audit

| File | Status | Notes |
|---|---|---|
| `app/page.tsx` | ✅ Exists | Main dashboard page |
| `app/layout.tsx` | ✅ Exists | Root layout (issues below) |
| `app/globals.css` | ✅ Exists | Tailwind v4 styles |
| `app/loading.tsx` | ❌ Missing | No loading UI for Suspense |
| `app/error.tsx` | ❌ Missing | No route-level error recovery |
| `app/not-found.tsx` | ❌ Missing | No 404 page |
| `app/layout.tsx` metadata | ❌ Missing | No `metadata` export (title, description, og:image) |
| `app/page.dynamic.tsx.temp` | 🗑 Stray file | Only contains `export const dynamic = "force-dynamic";` — not a valid Next.js file by name, won't be picked up. Delete it. |

**Verdict:** Single-page app with no sub-routes. Acceptable for a dashboard, but the stray `.temp` file should be removed and metadata should be added to the layout.

---

## 2. Data Fetching Review

### 2.1 TodaySummary

| Issue | Severity | Details |
|---|---|---|
| Silent error swallow | 🔴 High | `.then(({ data, error }) => { if (error \|\| !data) return; })` — errors are silently discarded. User sees all-zeros with no explanation. |
| No loading state | 🟡 Medium | Shows `0` values briefly on mount. Looks like real data = 0. |
| No polling/refresh | 🟡 Medium | Fetches once on mount. Data goes stale if bids are placed while dashboard is open. |
| `.select('*')` would be better | 🟢 Low | Already selects specific columns — fine as-is. |

### 2.2 PriceCharts

| Issue | Severity | Details |
|---|---|---|
| Silent error on product fetch | 🔴 High | Products fetch `.then(({ data }) => { if (data) ... })` — no error handling at all. If fetch fails, dropdown stays empty. |
| No loading state | 🟡 Medium | Shows empty dropdown + "No price data" text on mount. |
| No error state | 🟡 Medium | Empty state conflates "loading" with "no data" and "error". |
| Date grouping loses year | 🟢 Low | Groups by `MM/dd` — if data spans year boundary (Jan after Dec), dates collide. Unlikely but possible. |
| Bar radius on zero-height bars | 🟢 Low | Recharts renders odd-looking rounded tops on zero-value bars. Cosmetic. |

### 2.3 ActiveCycles

| Issue | Severity | Details |
|---|---|---|
| Silent error | 🔴 High | Same `if (error \|\| !data) return;` pattern — user sees "No active cycles" even on network/DB error. |
| No loading state | 🟡 Medium | Shows "No active cycles" immediately while query is in flight. |
| N+1 not a concern here | ✅ OK | Single query, then client-side filtering. |
| Client-side date filtering | 🟢 Low | Filters active cycles in JS instead of DB-level `WHERE`. Could miss records if query returns many. OK for expected small dataset. |

### 2.4 WinnerFeed

| Issue | Severity | Details |
|---|---|---|
| Silent error (main query) | 🟡 Medium | `if (error \|\| !data) return;` — silent fail. |
| Silent error (lookups) | 🟢 Low | Product/supplier lookups: `products.data \|\| []` — graceful fallback to "Unknown" names. |
| Real-time subscription is correct | ✅ OK | `postgres_changes` filter + cleanup on unmount. |
| Race condition on refetch | 🟡 Medium | `fetchWinners()` re-runs on every realtime event; no debounce, no cancellation. Could cause stale setWinners calls. |
| No loading state | 🟡 Medium | Shows "No winners yet today" during initial load. |

### 2.5 SupplierLeaderboard

| Issue | Severity | Details |
|---|---|---|
| **N+1 query problem** | 🔴 Critical | Loops over every active supplier and fires **one query per supplier** (`Promise.all(map(...))`). 50 suppliers = 51 queries. This will be slow and potentially hit rate limits. |
| Silent error | 🟡 Medium | Main supplier list error silently swallowed; fallback to empty list. |
| No loading state | 🟡 Medium | Shows "No supplier data yet" during load. |
| No re-fetch mechanism | 🟢 Low | Single fetch. Data is 30-day rolling window, acceptable. |

### 2.6 LiveTicker

| Issue | Severity | Details |
|---|---|---|
| Silent error | 🟡 Medium | Same `if (error \|\| !data) return []` — graceful but silent. |
| Real-time subscription correct | ✅ OK | INSERT listener + cleanup. |
| `style jsx` syntax issue | 🟡 Medium | Uses `<style jsx>` (styled-jsx syntax) but project doesn't install `styled-jsx`. Works because Next.js bundles it, but inconsistent with Tailwind patterns. |

### 2.7 Supabase Client (`lib/supabase.ts`)

| Issue | Severity | Details |
|---|---|---|
| Hardcoded anon key | 🟡 Medium | Key is hardcoded as fallback. If `.env.local` is missing in production, the key would leak from client bundle. Acceptable for pub/RLS-only key, but should not be in source. |
| No error retry | 🟢 Low | No retry logic on failed requests. |

---

## 3. UI, Contrast & Accessibility Audit

### 3.1 Critical Accessibility Issues

| Issue | Severity | Details |
|---|---|---|
| **No ARIA labels anywhere** | 🔴 High | Zero `aria-label`, `aria-describedby`, `aria-live`, or `aria-busy` attributes. Screen readers have no context. |
| **No semantic roles** | 🔴 High | `LiveTicker` marquee has no `role="status"` or `aria-label`. Chart containers have no ARIA descriptions. |
| **`<select>` in PriceCharts has no `<label>`** | 🟡 Medium | Only has inline context. Screen reader users won't know what the dropdown is for. Add `<label>` or `aria-label`. |
| **HTML `lang` attribute hardcoded to `am`** | 🟡 Medium | `app/layout.tsx`: `<html lang="am">` is hardcoded, but user may browse in English. Should be dynamic based on `LanguageContext`. |

### 3.2 Color Contrast Issues (WCAG 2.1 AA — 4.5:1 minimum for normal text)

| Element | Approx. Contrast | Status | Details |
|---|---|---|---|
| `text-slate-500` on `bg-white` | ~4.6:1 | ✅ Pass | Borderline for `text-sm` and below |
| `text-slate-500` (11px) | ~4.6:1 | ⚠️ Risk | 11px uppercase labels are below WCAG recommended size |
| `text-slate-400` (icon colors) | ~3.0:1 | ❌ **Fail** | Below 4.5:1 threshold for normal text |
| `text-green-600` on `bg-white` | ~5.9:1 | ✅ Pass | |
| `text-indigo-400` on `bg-white` | ~3.5:1 | ❌ **Fail** | Used in TodaySummary icon labels |
| `text-cyan-400` on `bg-white` | ~2.9:1 | ❌ **Fail** | Used in TodaySummary icon labels |
| `text-amber-400` on `bg-white` | ~2.4:1 | ❌ **Fail** | Worst offender |
| Chart tooltip text (`#0f172a` on `#ffffff`) | ~15:1 | ✅ Pass | |
| Y-Axis tick (`#475569` on `#ffffff`) | ~6.5:1 | ✅ Pass | |

**Fix:** Replace `text-indigo-400`, `text-cyan-400`, `text-amber-400`, `text-slate-400` with their `500`/`600` equivalents for text that must be readable. Icon-only decorative elements (inside colored backgrounds) are exempt.

### 3.3 Responsiveness

| Issue | Severity | Details |
|---|---|---|
| Marquee width calculated in JS | 🟡 Medium | `width: ${items.length * 280}px` — hardcoded multiplier. Breaks on wide/narrow content. |
| Grid layout | ✅ Good | `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` — proper responsive breakpoints |
| Mobile padding | ✅ Good | `px-4 sm:px-6` — responsive |
| Charts | ⚠️ Low | `h-52` and `h-32` fixed heights — fine on desktop, cramped on mobile |

### 3.4 Other UI Issues

| Issue | Severity | Details |
|---|---|---|
| Duplicate `'use client'` directive | 🟡 Medium | `app/page.tsx` has `'use client';` written twice. Harmless but sloppy. |
| ErrorBoundary exposes raw message | 🟡 Medium | `<pre>{error.message}</pre>` leaks implementation details. Show user-friendly message. No retry button. |
| Footer hardcoded in English | 🟢 Low | `Bid Supply — Real-time transparency...` isn't in `messages.json` keys. |
| No `<meta>` viewport check | ✅ OK | Tailwind v4 handles this via `@import "tailwindcss"` |
| No font loading | 🟢 Low | `globals.css` references `'Inter'` but it's never loaded. Falls back to system-ui. Should add `next/font` or `<link>` to Google Fonts. |

---

## 4. Code Quality & Structure

| Issue | Severity | Details |
|---|---|---|
| `page.tsx` is entirely client-side | 🟡 Medium | With `use client` at top, zero SSR. Defeats Next.js SEO/static benefits. OK for dashboard, but should be acknowledged. |
| Stray `page.dynamic.tsx.temp` | 🟢 Low | Not functional. Delete it. |
| `public/index.html` orphaned | 🟢 Low | Not used by Next.js App Router. Remnant from a different setup. |
| No ESLint warnings addressed | 🟢 Low | `npm run lint` should be run and warnings fixed. |
| `LanguageContext` hydration mismatch risk | 🟡 Medium | `useState('am')` then `useEffect` reads localStorage. Next.js SSR renders `am`, client hydrates to match (since default is `am`) — OK for am users, but `en`-preferring users get a flash. |

---

## Prioritized Fix List

### 🔴 Critical

1. **N+1 query in SupplierLeaderboard** — Replace per-supplier queries with a single aggregated SQL query or `rpc` call joining `dc_bids` and `dc_suppliers`. Current approach fires 1 query per supplier (e.g., 50+ queries).
2. **Color contrast failures** — `text-indigo-400`, `text-cyan-400`, `text-amber-400` on white fail WCAG AA. Upgrade to `*-600` or add backgrounds.
3. **No ARIA labels on interactive elements** — Add `aria-label` to product dropdown, language toggle, and marquee ticker. Add `aria-live="polite"` to live data sections.

### 🟠 High

4. **Silent error handling across all components** — Every `if (error || !data) return` swallows errors. Add visible error states (reuse ErrorBoundary pattern or add inline error messages).
5. **HTML `lang` hardcoded to `am`** — Make `lang` dynamic in `layout.tsx` based on user's language preference.
6. **No `<label>` for product `<select>` in PriceCharts** — Add `aria-label="Select product"` or wrap in `<label>`.

### 🟡 Medium

7. **Loading state for all 5 dashboard components** — Add `isLoading` state and show skeleton/spinner during data fetch.
8. **No polling/real-time refresh on TodaySummary** — Add Supabase realtime or periodic polling to keep stats fresh.
9. **Duplicate `'use client'` in page.tsx** — Remove the duplicate directive.
10. **ErrorBoundary shows raw error message** — Show user-friendly text + add retry button.
11. **`<style jsx>` in LiveTicker** — Replace with inline Tailwind or CSS-in-JS consistent with the rest.
12. **LanguageContext hydration flicker** — Use `getLang()` directly in `useState` initializer on client, or detect SSR properly.
13. **Fixed-height charts on mobile** — Make `h-52` and `h-32` responsive (e.g., `h-40 md:h-52`).

### 🟢 Low

14. **Delete `app/page.dynamic.tsx.temp`** — Stray file, not functional.
15. **Delete `public/index.html`** — Orphaned asset, not used.
16. **Add Next.js `metadata` to layout** — Title, description, Open Graph.
17. **Load Inter font** — Add `next/font/google` import for the `'Inter'` font referenced in CSS.
18. **Translate footer text** — Footer is hardcoded in English; add to `messages.json`.
19. **Date grouping year collision risk** — Handle year boundary in PriceCharts date grouping.
20. **WinnerFeed race on rapid realtime events** — Add debounce or query abort.

---

## Summary by Component

| Component | Critical | High | Medium | Low |
|---|---|---|---|---|
| TodaySummary | — | 1 | 1 | — |
| PriceCharts | — | 2 | 1 | 1 |
| ActiveCycles | — | 1 | 1 | — |
| WinnerFeed | — | 1 | 1 | 1 |
| SupplierLeaderboard | 1 | 1 | 1 | — |
| LiveTicker | — | — | 1 | — |
| Layout / Global | 2 | 1 | — | 3 |
| **Total** | **3** | **6** | **6** | **5** |

---

*Generated by QA Subagent • 2026-04-03*
