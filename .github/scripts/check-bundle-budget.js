#!/usr/bin/env node

/**
 * Check Bundle Size Against Budget
 *
 * Runs as part of CI to fail the build if bundle exceeds limits
 * References: docs/performance/bundle-history.json and Phase 1 baselines
 */

import { readFileSync } from 'fs';

const PHASE1_BASELINES = {
  main_js: 180000,      // 180 KB gzipped
  vendor: 80000,        // 80 KB gzipped
  main_css: 25000,      // 25 KB gzipped
  total: 280000,        // 280 KB total gzipped
};

const BUDGET_MULTIPLIER = {
  main_js: 1.025,       // +2.5%
  vendor: 1.05,         // +5%
  main_css: 1.025,      // +2.5%
  total: 1.02,          // +2%
};

function loadBundleHistory() {
  try {
    return JSON.parse(readFileSync('docs/performance/bundle-history.json', 'utf8'));
  } catch {
    console.log('⚠️ Bundle history file not found, skipping budget check');
    return [];
  }
}

function checkBudgets(history) {
  if (!history || history.length === 0) {
    console.log('⚠️ No bundle history available');
    return { pass: true, violations: [] };
  }

  const latest = history[history.length - 1];
  const violations = [];

  // Check each metric
  Object.entries(PHASE1_BASELINES).forEach(([metric, baseline]) => {
    const budget = Math.floor(baseline * BUDGET_MULTIPLIER[metric]);
    const current = latest[metric];

    if (!current) {
      console.warn(`⚠️ Metric not found in history: ${metric}`);
      return;
    }

    if (current > budget) {
      violations.push({
        metric,
        baseline,
        budget,
        current,
        exceeded: current - budget,
        percent: (((current - budget) / budget) * 100).toFixed(1),
      });
    }
  });

  return {
    pass: violations.length === 0,
    violations,
  };
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function main() {
  const history = loadBundleHistory();
  const result = checkBudgets(history);

  console.log('\n📦 Bundle Budget Check\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (result.pass) {
    console.log('✅ All metrics within budget!\n');
    console.log('Metric      Baseline    Budget      Current     Status');
    console.log('───────────────────────────────────────────────────────');

    Object.entries(PHASE1_BASELINES).forEach(([metric, baseline]) => {
      const budget = Math.floor(baseline * BUDGET_MULTIPLIER[metric]);
      const latest = history[history.length - 1];
      const current = latest[metric];

      console.log(
        `✅ ${metric.padEnd(10)} ${formatBytes(baseline).padEnd(11)} ${formatBytes(budget).padEnd(11)} ${formatBytes(current).padEnd(11)} OK`
      );
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log('❌ Bundle budget violations detected!\n');
    console.log('Metric      Baseline    Budget      Current     Exceeded');
    console.log('───────────────────────────────────────────────────────');

    result.violations.forEach(v => {
      const percentStr = `(+${v.percent}%)`;
      console.log(
        `❌ ${v.metric.padEnd(10)} ${formatBytes(v.baseline).padEnd(11)} ${formatBytes(v.budget).padEnd(11)} ${formatBytes(v.current).padEnd(11)} ${formatBytes(v.exceeded)} ${percentStr}`
      );
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');
    console.log('⚠️  To fix:');
    console.log('   1. Review dist/ folder for large dependencies');
    console.log('   2. Run: npm run analyze');
    console.log('   3. Check for unused imports or unnecessary bundles');
    console.log('   4. Enable tree-shaking in vite.config.ts\n');

    process.exit(1);
  }
}

main();
