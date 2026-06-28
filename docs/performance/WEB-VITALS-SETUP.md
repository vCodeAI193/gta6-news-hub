# Web Vitals Setup & Monitoring
## GTA 6 News Hub

---

## Overview

This document explains how to set up real-time Web Vitals monitoring for both development and production environments.

---

## 1. Development Environment (Local)

### Browser DevTools

#### Chrome/Edge DevTools Lighthouse

```bash
npm run dev
# Open http://localhost:5173 in Chrome
# DevTools → Lighthouse (right panel)
# Run audit → View report
```

**Key metrics to check:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)
- Speed Index (SI)

#### Console Logging (Real-time)

Add to `src/main.tsx`:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

if (import.meta.env.DEV) {
  getCLS(metric => console.log('CLS:', metric.value));
  getFID(metric => console.log('FID:', metric.value));
  getFCP(metric => console.log('FCP:', metric.value));
  getLCP(metric => console.log('LCP:', metric.value));
  getTTFB(metric => console.log('TTFB:', metric.value));
}
```

**Output in DevTools Console:**
```
FCP: 1245
LCP: 1876
CLS: 0.08
FID: 45
TTFB: 320
```

### Network Throttling

Simulate real-world conditions:

**Chrome DevTools → Network tab:**
1. Click "No throttling" dropdown
2. Select "Slow 4G" or custom (e.g., 4G: 4Mbps down, 2.5Mbps up)
3. Check "Disable cache"
4. Reload page
5. Check Lighthouse audit with throttling

**Expected vs Unthrottled:**
- FCP: ~2-3x slower
- LCP: ~2-2.5x slower
- Same CLS (layout shifts are device-independent)

---

## 2. Production Monitoring

### Setup Google Analytics 4

#### Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Create new property (or use existing)
3. Get **Measurement ID** (format: `G-XXXXXXXXXX`)

#### Step 2: Add GA4 Tracking

Create `src/lib/analytics.ts`:

```typescript
// Initialize GA4
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function initGoogleAnalytics(measurementId: string) {
  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];

  function gtag(...args: unknown[]) {
    window.dataLayer?.push(arguments);
  }

  gtag('js', new Date());
  gtag('config', measurementId);
  gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  return gtag;
}

export function reportWebVitals(metric: {
  name: string;
  value: number;
  id: string;
  rating?: string;
  delta?: number;
}) {
  if (!window.gtag) return;

  // Send as custom event
  window.gtag('event', 'page_view_web_vitals', {
    event_category: 'web_vitals',
    event_label: metric.name,
    value: Math.round(metric.value),
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta,
    metric_rating: metric.rating,
  });
}
```

#### Step 3: Wire Up in App

Update `src/main.tsx`:

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { initGoogleAnalytics, reportWebVitals } from './lib/analytics';

// Init GA4
if (import.meta.env.PROD) {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId) {
    initGoogleAnalytics(measurementId);

    // Report Web Vitals
    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getFCP(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
  }
}
```

#### Step 4: Set Environment Variable

Create `.env.production`:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Access GA4 Dashboard

**Google Analytics → Reports → Engagement:**

1. Go to `Events` section
2. Filter by event name: `page_view_web_vitals`
3. View dimensions:
   - `event_label` = metric name (LCP, FCP, etc.)
   - `value` = metric value in ms
   - `metric_rating` = "good", "needs improvement", "poor"

**Create Custom Report:**

1. Explore → Create blank
2. Dimensions: `date`, `metric_label`
3. Metrics: `event_count`, average of `value`
4. Filter: event_name = "page_view_web_vitals"
5. Sort by date descending

---

## 3. Real User Monitoring (RUM)

### Chrome UX Report (CrUX)

Google automatically aggregates real user data:

**Dashboard:** [CrUX Dashboard](https://developers.google.com/web/tools/chrome-user-experience-report)

1. Enter domain: `yourdomain.com`
2. View real-world metrics from 28 days of data
3. Compare device types (mobile, desktop, tablet)
4. See percentile distributions (75th, 90th, etc.)

**Update frequency:** Monthly (new data every 4 weeks)

---

## 4. Continuous Performance Testing

### Automated Alerts

Set up in GitHub Actions to fail PRs:

**`.github/workflows/lighthouse-ci.yml`** (already configured):
- Runs Lighthouse on every PR
- Compares against baseline
- Fails if LCP > +200ms or CLS > 0.15
- Posts results as PR comment

### Manual Local Testing

```bash
# Full audit with DevTools
npm run dev
# Open Chrome DevTools → Lighthouse
# Run audit 3x, take average

# Production build test
npm run build
npm run preview
# DevTools → Lighthouse → Run audit
```

---

## 5. Performance Dashboard

### Create Google Sheets Dashboard

**Template:**

| Date | Page | FCP (ms) | LCP (ms) | CLS | Users | Traffic |
|------|------|----------|----------|-----|-------|---------|
| 2025-06-28 | / | 1200 | 1800 | 0.08 | 2,340 | 45 KB/s |
| 2025-06-28 | /article | 1100 | 1600 | 0.05 | 1,240 | 52 KB/s |

**Populate from:**
1. GA4 custom events
2. Lighthouse CI reports
3. Bundle size tracking

**Visualizations:**
- Line chart: FCP/LCP trend over time
- Heatmap: Metrics by page
- Scorecard: Current vs baseline

---

## 6. Testing Checklist

### Weekly Performance Review

- [ ] Check GA4 Web Vitals metrics
- [ ] Review Lighthouse CI results on main branch
- [ ] Check CrUX data (monthly)
- [ ] Review bundle size trend
- [ ] Identify top 3 pages to optimize
- [ ] Create tickets for regressions

### Before Release

- [ ] Run Lighthouse audit (3x) on production build
- [ ] Check all metrics vs baselines
- [ ] Load test with k6 (100 VUs, 5 min)
- [ ] Test on slow network (Slow 4G)
- [ ] Test on low-end device (Moto G4)
- [ ] Check mobile Performance score ≥80
- [ ] Check desktop Performance score ≥85

---

## 7. Troubleshooting

### LCP Too High (>2.5s)

**Causes:**
- Large unoptimized images
- Slow font loading
- Render-blocking JS/CSS
- Slow network (TTFB >600ms)

**Fix:**
1. Check DevTools Performance tab
2. Look for slow network waterfall
3. Compress images (WebP/AVIF)
4. Preload critical fonts
5. Defer non-critical CSS/JS

### FCP Too High (>2s)

**Causes:**
- Heavy JS parsing
- Blocking fonts
- Inline styles in HTML

**Fix:**
1. Split code: dynamic imports for routes
2. Preload fonts with `<link rel="preload">`
3. Use system fonts as fallback
4. Move inline styles to CSS file

### CLS Too High (>0.25)

**Causes:**
- Images without dimensions
- Ads/embeds (YouTube, etc.)
- Web fonts loading
- Injected content

**Fix:**
1. Set width/height on images
2. Reserve space for ads
3. Use `font-display: swap`
4. Avoid DOM mutations after load

### TTFB Too High (>800ms)

**Causes:**
- Slow server
- Long database queries
- No caching

**Fix:**
1. Check server logs for slow requests
2. Add CDN caching headers
3. Optimize API endpoints
4. Cache responses

---

## 8. References

- [Web Vitals Guide](https://web.dev/vitals/)
- [Google Analytics 4 Events](https://support.google.com/analytics/answer/9322688)
- [Chrome UX Report API](https://developers.google.com/web/tools/chrome-user-experience-report/api)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [React Performance](https://react.dev/reference/react/useMemo)
