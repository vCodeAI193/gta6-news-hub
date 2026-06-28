#!/usr/bin/env node

/**
 * Parse Lighthouse CI Results
 *
 * Extracts key metrics from Lighthouse audit JSON output
 * and formats for CI/PR comments
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

function getLatestLighthouseReport() {
  try {
    // Find all JSON files in .lighthouseci
    const files = readdirSync('.lighthouseci')
      .filter(f => f.endsWith('.json') && f !== 'latest.json')
      .map(f => ({
        name: f,
        path: `.lighthouseci/${f}`,
        time: require('fs').statSync(`.lighthouseci/${f}`).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      console.log('⚠️ No Lighthouse reports found');
      return null;
    }

    const latest = files[0];
    console.log(`📊 Parsing Lighthouse report: ${latest.name}`);

    return JSON.parse(readFileSync(latest.path, 'utf8'));
  } catch (error) {
    console.warn('⚠️ Could not parse Lighthouse reports:', error.message);
    return null;
  }
}

function extractMetrics(report) {
  if (!report) return null;

  const metrics = {};

  // Lighthouse scores (0-100)
  if (report.categories) {
    Object.entries(report.categories).forEach(([key, value]) => {
      metrics[key] = Math.round(value.score * 100);
    });
  }

  // Core Web Vitals
  if (report.audits) {
    const measurements = report.audits['metrics'];
    if (measurements && measurements.details && measurements.details.items) {
      const items = measurements.details.items[0];
      metrics.lcp = items.largest_contentful_paint_ms;
      metrics.fcp = items.first_contentful_paint_ms;
      metrics.cls = items.cumulative_layout_shift_score;
      metrics.fid = items.first_input_delay_ms;
      metrics.ttfb = items.server_response_time_ms;
    }
  }

  return metrics;
}

function formatMetrics(metrics) {
  if (!metrics) return 'N/A';

  const scores = {
    performance: metrics.performance || 'N/A',
    accessibility: metrics.accessibility || 'N/A',
    'best-practices': metrics['best-practices'] || 'N/A',
    seo: metrics.seo || 'N/A',
    pwa: metrics.pwa || 'N/A',
  };

  const vitals = {
    lcp: metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A',
    fcp: metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A',
    cls: metrics.cls ? `${metrics.cls.toFixed(3)}` : 'N/A',
    fid: metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A',
    ttfb: metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A',
  };

  const output = {
    scores,
    vitals,
    summary: `
**Lighthouse Scores:**
- 🎨 Performance: ${scores.performance}/100
- ♿ Accessibility: ${scores.accessibility}/100
- ✅ Best Practices: ${scores['best-practices']}/100
- 🔍 SEO: ${scores.seo}/100

**Core Web Vitals:**
- ⏱️ LCP: ${vitals.lcp}
- 📄 FCP: ${vitals.fcp}
- 📐 CLS: ${vitals.cls}
- 🖱️ FID: ${vitals.fid}
- 📡 TTFB: ${vitals.ttfb}
    `,
  };

  return output;
}

function main() {
  console.log('\n📊 Lighthouse Report Parser\n');

  const report = getLatestLighthouseReport();
  const metrics = extractMetrics(report);
  const formatted = formatMetrics(metrics);

  console.log(formatted.summary);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Also output JSON for downstream processing
  if (metrics) {
    console.log(JSON.stringify(metrics, null, 2));
  }
}

main();
