# Performance Testing — Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Run Lighthouse Audit (Local)

```bash
# Build production bundle
npm run build

# Install Lighthouse CLI (one-time)
npm install -g @lhci/cli@latest

# Run audit
lhci collect

# View results
open .lighthouseci/latest.html  # macOS
# or
start .lighthouseci/latest.html  # Windows
```

**What to look for:**
- Performance score (target: ≥85)
- LCP < 2.0s
- FCP < 1.5s
- CLS < 0.1

---

### 2. Analyze Bundle Size

```bash
# Visualize bundle
npm run analyze

# Opens dist/stats.html in browser
# Zoom in on large dependencies
# Check for unused imports
```

---

### 3. Load Test (Simulate Traffic)

```bash
# Install k6 (one-time)
# macOS: brew install k6
# or download from https://k6.io/docs/get-started/installation/

# Start preview server
npm run preview

# In another terminal, run load test
k6 run scripts/loadtest.js

# Output: metrics by endpoint + pass/fail
```

---

### 4. Check Web Vitals (DevTools)

```bash
npm run dev
# Open Chrome DevTools → Performance tab
# Refresh page
# Check metrics in DevTools console:
#   - CLS: measure in console
#   - LCP: find largest paint event
#   - FCP: first paint event
```

---

## 📊 Key Metrics Reference

| Metric | Target | Good | Needs Work | Poor |
|--------|--------|------|-----------|------|
| **LCP** | ≤2.0s | ≤2.5s | 2.5-4s | >4s |
| **FCP** | ≤1.5s | ≤1.8s | 1.8-3s | >3s |
| **CLS** | ≤0.1 | ≤0.1 | 0.1-0.25 | >0.25 |
| **FID** | ≤100ms | ≤100ms | 100-300ms | >300ms |
| **JS Bundle** | ≤180KB | ≤185KB | 185-200KB | >200KB |

---

## 🔍 Debug Performance Issues

### LCP > 2.5s?

1. Open DevTools → Performance tab
2. Scroll to "Largest Contentful Paint" section
3. Click to highlight element
4. Check in DevTools:
   - Is it an image? → Optimize/compress
   - Is it text? → Check font loading
   - Is it a component? → Check render time

**Fix:** Compress images, preload fonts, defer non-critical JS

### Bundle Too Large?

```bash
npm run analyze
# In stats.html, look for:
# - Red = your code
# - Blue = dependencies
# - Green = duplicate modules

# Find largest:
# 1. Remove unused libraries
# 2. Use dynamic imports for routes
# 3. Check for duplicate deps
```

### API Slow?

```bash
# Check endpoint response time
curl -w "@.github/scripts/curl-timing.txt" \
  -o /dev/null -s \
  http://localhost:3000/api/articles

# Look for:
# - time_connect: network latency
# - time_starttransfer: server processing
# - time_total: total time
```

---

## 🚦 CI/CD Performance Checks

Performance checks run automatically on:
- ✅ Every PR (Lighthouse, bundle size, regression detection)
- ✅ Merge to main (full audit suite)
- ✅ Schedule: Daily at 2 AM UTC

**View Results:**
1. Go to PR → "Checks" tab
2. Click "Lighthouse CI & Performance"
3. Expand job to see results
4. PR comment shows regression summary

**Fail Criteria:**
- ❌ LCP increases >5%
- ❌ Bundle size >2.5%
- ❌ CLS degrades >0.05
- ❌ Lighthouse score -5 points

---

## 📈 Track Trends

### View Bundle History

```bash
cat docs/performance/bundle-history.json | jq '.'
# Shows all bundle measurements

# Compare Phase 1 baseline:
jq '.[-1]' docs/performance/bundle-history.json
# Latest entry
```

### Create Dashboard

1. Open Google Sheets
2. Import data from bundle-history.json
3. Create charts:
   - Line: bundle size over time
   - Bar: metric comparison
   - Gauge: current vs budget

---

## 🔧 Common Commands

```bash
# Full performance check
npm run build && lhci collect && npm run analyze

# Quick bundle check
npm run build && node .github/scripts/track-bundle-size.js

# Load test (10 VUs, 30 sec)
k6 run scripts/loadtest.js --vus 10 --duration 30s

# Check against budget
node .github/scripts/check-bundle-budget.js

# Parse Lighthouse results
node .github/scripts/parse-lighthouse.js
```

---

## 🆘 Need Help?

See full guides:
- 📖 [Performance Guide](./PERFORMANCE-GUIDE.md) — Deep dive
- 🔍 [Web Vitals Setup](./WEB-VITALS-SETUP.md) — Monitoring
- 📊 [Bundle Analysis](https://rollup-plugin-visualizer.npmjs.com/) — Deps breakdown

---

## ✅ Pre-Release Checklist

Before shipping Phase 3:

- [ ] LCP < 2.0s (desktop), < 2.5s (mobile)
- [ ] FCP < 1.5s
- [ ] CLS < 0.1
- [ ] JS Bundle ≤ 190KB (gzipped)
- [ ] Lighthouse Performance ≥85
- [ ] Load test: 100 VUs ≤500ms p95
- [ ] No critical regressions vs baseline
- [ ] Mobile score ≥80

---

## 📚 Further Reading

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/reference/react/lazy)
- [Vite Optimization](https://vitejs.dev/guide/features.html#code-splitting)
- [k6 Load Testing](https://k6.io/docs/)
