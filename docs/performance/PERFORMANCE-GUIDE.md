# Performance Testing & Monitoring Framework
## GTA 6 News Hub — Wave 6 Phase 3+

---

## Table of Contents

1. [Overview](#overview)
2. [Baseline Metrics (Phase 1)](#baseline-metrics-phase-1)
3. [Performance Budget](#performance-budget)
4. [Local Testing](#local-testing)
5. [CI/CD Integration](#cicd-integration)
6. [Monitoring & Dashboards](#monitoring--dashboards)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide sets up **continuous performance monitoring** for the GTA 6 News Hub. The framework tracks:

- **Core Web Vitals** (LCP, FID, CLS)
- **Bundle size** (JS, CSS, total)
- **Load time** metrics (DOMContentLoaded, Page Load)
- **Custom metrics** (API response time, semantic search delay)
- **Lighthouse scores** (Perf, Accessibility, Best Practices, SEO)

**Goal:** Catch regressions before they ship, maintain <3s FCP and <2s LCP.

---

## Baseline Metrics (Phase 1)

Reference performance targets set at the end of Phase 1 (feature 50):

### Core Web Vitals (Chrome UX Report style)
| Metric | Target | Warning | Error |
|--------|--------|---------|-------|
| **LCP** (Largest Contentful Paint) | ≤2.0s | >2.2s | >2.5s |
| **FCP** (First Contentful Paint) | ≤1.5s | >1.8s | >2.0s |
| **FID** (First Input Delay) | ≤100ms | >130ms | >200ms |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | >0.12 | >0.25 |
| **TTFB** (Time to First Byte) | ≤400ms | >500ms | >800ms |

### Bundle Size (Gzipped)
| Asset | Phase 1 Baseline | Budget | Warning |
|-------|------------------|--------|---------|
| **Main JS** | 180 KB | +5% | 190 KB |
| **React + Router** | 120 KB | +3% | 124 KB |
| **Vendor** | 80 KB | +10% | 88 KB |
| **Total (gzip)** | 280 KB | +4% | 292 KB |
| **CSS** | 25 KB | +5% | 26 KB |

### Page Load Times
| Page | Target | Warning | Error |
|------|--------|---------|-------|
| **Home** | 1800ms | 2200ms | 2500ms |
| **Article Detail** | 1500ms | 1800ms | 2100ms |
| **Search Results** | 1200ms | 1500ms | 1800ms |
| **Profile** | 1300ms | 1600ms | 2000ms |

### API Response Times
| Endpoint | Target | Warning | Error |
|----------|--------|---------|-------|
| `/api/articles` | ≤300ms | >350ms | >500ms |
| `/api/search` | ≤400ms | >500ms | >800ms |
| `/api/ai/ask` (RAG) | ≤2000ms | >2500ms | >4000ms |
| `/api/ai/semantic-search` | ≤800ms | >1000ms | >1500ms |

---

## Performance Budget

### Phase 3 Allowances
After Phase 2 (50 new features), the following changes are acceptable:

**JS Size:** +2% additional per feature (avg 2.5 KB gzipped)
**CSS Size:** +0.5% additional per feature
**LCP:** +200ms acceptable if feature requires heavy computation
**Interaction delay:** +50ms for complex features (like editor)

#### Critical No-Growth Categories
- ✅ **FCP** (First Contentful Paint) — must improve or stay same
- ✅ **TTFB** (Time to First Byte) — server-side metric, should be optimized
- ✅ **CLS** — must stay ≤0.15 (visual stability non-negotiable)

---

## Local Testing

### Prerequisites
```bash
# Install dependencies (already in package.json)
npm install

# Build the project
npm run build
```

### 1. Lighthouse CI Locally

```bash
# Global install (one-time)
npm install -g @lhci/cli@latest

# Run Lighthouse audit locally
lhci autorun --upload.target=temporary-public-storage

# Or just generate reports
lhci collect
```

**Output:** `.lighthouseci/` folder with JSON & HTML reports

### 2. Bundle Size Analysis

```bash
# Analyze bundle with visualizer
npm run analyze

# Output: dist/stats.html (open in browser)

# Track bundle size across commits
npm run track:bundle
```

### 3. Web Vitals Monitoring

Run the app and open browser DevTools:

```bash
npm run dev
```

**Check Core Web Vitals:**
- Open DevTools → Performance tab
- Check "Experience" section
- Compare against baselines in table above

**Programmatic check:**
```typescript
// In your app, import web-vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 4. API Response Times

```bash
# Local server
npm run server:dev

# In another terminal, test endpoints
curl -w "@scripts/curl-timing.txt" -o /dev/null -s http://localhost:3000/api/articles

# Or use ab (ApacheBench)
ab -n 100 -c 10 http://localhost:3000/api/articles
```

### 5. Load Testing with k6

```bash
# Already configured in scripts/loadtest.js
npm run loadtest

# Or with custom scenarios
k6 run scripts/loadtest.js --vus 50 --duration 30s
```

**Output:** Terminal output + metrics export to JSON

---

## CI/CD Integration

### GitHub Actions Workflow

The file `.github/workflows/lighthouse-ci.yml` runs on every PR:

```yaml
# Trigger: Pull Request, Push to main
# Jobs:
# 1. Lighthouse CI (performance audit)
# 2. Bundle Size Check (js, css, total)
# 3. Load Testing (k6 basic scenarios)
# 4. Publish results (artifacts + comment on PR)
```

**What happens:**

1. Build production bundle
2. Run 3x Lighthouse audits (mobile, desktop, throttled)
3. Compare against baseline (stored in `.lighthouseci/`)
4. Check bundle size against budget
5. Run load test (100 concurrent users, 2 min)
6. Post results as PR comment
7. Fail if:
   - LCP increases by >5%
   - Bundle size grows >2.5%
   - CLS degrades
   - Lighthouse score drops >5 points

### Manual Trigger

```bash
# From CLI (requires GitHub CLI)
gh workflow run lighthouse-ci.yml --ref your-branch

# Check status
gh workflow view lighthouse-ci.yml
gh run list --workflow=lighthouse-ci.yml
```

---

## Monitoring & Dashboards

### 1. Real-time Metrics (Production)

Set up Google Analytics 4 + Web Vitals extension:

```typescript
// In src/main.tsx (already configured)
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const reportWebVitals = (metric) => {
  // Send to analytics
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    event_category: 'web_vitals',
    event_label: metric.id,
  });
};

getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

**Dashboard:** Google Analytics > Engagement > Web Vitals

### 2. Bundle Size Tracking

`.github/scripts/track-bundle-size.js` logs bundle metrics to `docs/performance/bundle-history.json`:

```json
[
  {
    "date": "2025-06-28",
    "commit": "abc123",
    "main_js": 180240,
    "main_css": 25100,
    "vendor": 81500,
    "total_gzip": 287340,
    "lcp": 1950,
    "fcp": 1400,
    "cls": 0.08
  }
]
```

**View trends:**
```bash
# Generate CSV for Excel/Sheets
node .github/scripts/bundle-to-csv.js > bundle-trends.csv
```

### 3. Regression Detection

Script: `.github/scripts/detect-regressions.js`

Runs automatically in CI, compares:
- Current metrics vs. baseline
- Current vs. previous commit
- Current vs. rolling 7-day average

**Outputs:** `regressions.json`

```json
{
  "regressions": [
    {
      "metric": "main_js",
      "previous": 180240,
      "current": 184150,
      "change": "+3.9 KB",
      "status": "warning"
    }
  ]
}
```

---

## Troubleshooting

### LCP > Target

**Cause:** Large images, unoptimized fonts, slow API

**Fix:**
```bash
# 1. Check what's slow
npm run analyze  # see bundle breakdown

# 2. Check DevTools Performance tab
# Look for: network waterfall, main thread blocking

# 3. Optimize images
# Use WebP/AVIF, compress, lazy load

# 4. Defer non-critical JS
# Use async/defer on <script> tags, dynamic imports
```

### CLS Issues

**Cause:** Ads, web fonts loading, layout shifts

**Fix:**
- Reserve space for ads (set width/height)
- Preload web fonts
- Use `content-visibility` CSS
- Avoid font-weight changes on load

### Bundle Too Large

**Cause:** Large dependencies, unused code

**Fix:**
```bash
# Find largest dependencies
npm run analyze

# Remove unused imports/libraries
# Use tree-shaking: check vite.config.ts

# Code split by route
# Use React.lazy() for route components
```

### API Slow

**Cause:** Unoptimized queries, no caching

**Fix:**
- Add query indexes (SQLite)
- Cache with Redis (if using)
- Pagination for list endpoints
- Use EXPLAIN QUERY PLAN to check queries

---

## Success Metrics for Phase 3

### Week 1-2 (Setup)
- ✅ All monitoring tools configured
- ✅ CI/CD workflows passing
- ✅ Baseline metrics established

### Week 3-4 (Development)
- ✅ New features added with <2% bundle growth
- ✅ Core Web Vitals maintained
- ✅ No new performance regressions

### Week 5-6 (Optimization)
- ✅ LCP improved to <1.8s
- ✅ FCP <1.3s
- ✅ Bundle size optimized (target: -2% vs Phase 1)

---

## Links & References

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Vite Performance Guide](https://vitejs.dev/guide/features.html)
- [React Performance](https://react.dev/reference/react/lazy)
- [Bundle Analysis](https://www.npmjs.com/package/rollup-plugin-visualizer)
