#!/usr/bin/env node

/**
 * Performance Regression Detection
 *
 * Compares current build metrics against:
 * 1. Phase 1 baseline
 * 2. Previous commit
 * 3. 7-day rolling average
 *
 * Outputs regressions.json for CI/PR comment
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const PHASE1_BASELINES = {
  main_js: 180000,
  vendor: 80000,
  main_css: 25000,
  total: 280000,
  lcp: 2000,
  fcp: 1500,
  cls: 0.1,
};

const REGRESSION_THRESHOLDS = {
  main_js: 0.05,        // 5% growth is warning
  vendor: 0.05,         // 5% growth is warning
  main_css: 0.05,       // 5% growth is warning
  total: 0.03,          // 3% growth is warning
  lcp: 0.1,             // 10% slower is warning
  fcp: 0.1,             // 10% slower is warning
  cls: 0.2,             // 20% worse is warning
};

const CRITICAL_THRESHOLDS = {
  main_js: 0.10,        // 10% is critical error
  vendor: 0.10,
  main_css: 0.10,
  total: 0.07,          // 7% is critical
  lcp: 0.25,            // 25% slower is critical
  fcp: 0.25,
  cls: 0.5,             // 50% worse is critical
};

function loadBundleHistory() {
  if (existsSync('docs/performance/bundle-history.json')) {
    try {
      return JSON.parse(readFileSync('docs/performance/bundle-history.json', 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function getLighthouseScore() {
  try {
    if (existsSync('.lighthouseci/latest.json')) {
      const data = JSON.parse(readFileSync('.lighthouseci/latest.json', 'utf8'));
      return data.scores?.performance || null;
    }
  } catch {
    return null;
  }
  return null;
}

function detectRegressions(history) {
  if (!history || history.length === 0) {
    return { regressions: [], warning: 'No history available' };
  }

  const current = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const sevenDaysAgo = history.filter(
    h => new Date(h.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const average7d =
    sevenDaysAgo.length > 0
      ? {
          main_js: Math.round(
            sevenDaysAgo.reduce((sum, h) => sum + (h.main_js || 0), 0) /
              sevenDaysAgo.length
          ),
          vendor: Math.round(
            sevenDaysAgo.reduce((sum, h) => sum + (h.vendor || 0), 0) /
              sevenDaysAgo.length
          ),
          main_css: Math.round(
            sevenDaysAgo.reduce((sum, h) => sum + (h.main_css || 0), 0) /
              sevenDaysAgo.length
          ),
          total: Math.round(
            sevenDaysAgo.reduce((sum, h) => sum + (h.total || 0), 0) /
              sevenDaysAgo.length
          ),
        }
      : null;

  const regressions = [];

  // Check each metric
  const metrics = ['main_js', 'vendor', 'main_css', 'total', 'lcp', 'fcp', 'cls'];

  metrics.forEach(metric => {
    const baseline = PHASE1_BASELINES[metric];
    const currentValue = current[metric];

    if (!currentValue && currentValue !== 0) {
      return;
    }

    // Check vs baseline
    const changeFromBaseline = (currentValue - baseline) / baseline;
    const warningThreshold = REGRESSION_THRESHOLDS[metric] || 0.05;
    const criticalThreshold = CRITICAL_THRESHOLDS[metric] || 0.10;

    if (Math.abs(changeFromBaseline) > criticalThreshold) {
      regressions.push({
        metric,
        baseline,
        previous: previous ? previous[metric] : null,
        current: currentValue,
        change: currentValue - baseline,
        percent: (changeFromBaseline * 100).toFixed(1),
        status: 'error',
        comparison: 'vs baseline',
        threshold: criticalThreshold,
      });
    } else if (Math.abs(changeFromBaseline) > warningThreshold) {
      regressions.push({
        metric,
        baseline,
        previous: previous ? previous[metric] : null,
        current: currentValue,
        change: currentValue - baseline,
        percent: (changeFromBaseline * 100).toFixed(1),
        status: 'warning',
        comparison: 'vs baseline',
        threshold: warningThreshold,
      });
    }

    // Check vs previous commit
    if (previous && previous[metric]) {
      const changeFromPrevious = (currentValue - previous[metric]) / previous[metric];
      const prevWarningThreshold = 0.02; // 2% for previous
      const prevCriticalThreshold = 0.05; // 5% for previous

      if (changeFromPrevious > prevCriticalThreshold) {
        regressions.push({
          metric,
          baseline: previous[metric],
          previous: previous[metric],
          current: currentValue,
          change: currentValue - previous[metric],
          percent: (changeFromPrevious * 100).toFixed(1),
          status: 'warning',
          comparison: 'vs previous commit',
          threshold: prevWarningThreshold,
        });
      }
    }

    // Check vs 7-day average
    if (average7d && average7d[metric]) {
      const changeFrom7d = (currentValue - average7d[metric]) / average7d[metric];

      if (changeFrom7d > 0.08) {
        regressions.push({
          metric,
          baseline: average7d[metric],
          previous: average7d[metric],
          current: currentValue,
          change: currentValue - average7d[metric],
          percent: (changeFrom7d * 100).toFixed(1),
          status: 'warning',
          comparison: 'vs 7-day average',
          threshold: 0.08,
        });
      }
    }
  });

  return { regressions, current, lighthouse_score: getLighthouseScore() };
}

function formatBytes(bytes) {
  if (typeof bytes !== 'number') return 'N/A';
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function main() {
  const history = loadBundleHistory();
  const analysis = detectRegressions(history);

  console.log('\n📊 Performance Regression Analysis\n');

  if (analysis.regressions.length === 0) {
    console.log('✅ No regressions detected!\n');
  } else {
    console.log(`⚠️  ${analysis.regressions.length} regression(s) detected:\n`);

    // Group by status
    const errors = analysis.regressions.filter(r => r.status === 'error');
    const warnings = analysis.regressions.filter(r => r.status === 'warning');

    if (errors.length > 0) {
      console.log('❌ CRITICAL:');
      errors.forEach(r => {
        console.log(
          `   ${r.metric.padEnd(12)} ${r.comparison.padEnd(20)} ${formatBytes(r.current).padEnd(12)} (${r.percent}%)`
        );
      });
      console.log();
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNING:');
      warnings.forEach(r => {
        console.log(
          `   ${r.metric.padEnd(12)} ${r.comparison.padEnd(20)} ${formatBytes(r.current).padEnd(12)} (${r.percent}%)`
        );
      });
      console.log();
    }
  }

  // Output JSON for CI
  const output = {
    timestamp: new Date().toISOString(),
    regressions: analysis.regressions,
    lighthouse_score: analysis.lighthouse_score,
    summary: {
      total_issues: analysis.regressions.length,
      critical: analysis.regressions.filter(r => r.status === 'error').length,
      warnings: analysis.regressions.filter(r => r.status === 'warning').length,
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
