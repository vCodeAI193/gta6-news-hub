#!/usr/bin/env node

/**
 * Track Bundle Size Over Time
 *
 * Analyzes the production build and logs metrics to docs/performance/bundle-history.json
 * Compares against Phase 1 baseline and previous commit
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';
import { resolve } from 'path';
import { basename } from 'path';

const HISTORY_FILE = 'docs/performance/bundle-history.json';
const DIST_DIR = 'dist';

// Phase 1 Baselines (gzipped)
const PHASE1_BASELINES = {
  main_js: 180000,      // 180 KB
  vendor: 80000,        // 80 KB
  main_css: 25000,      // 25 KB
  total: 280000,        // 280 KB (total gzipped)
  lcp: 2000,            // 2.0s
  fcp: 1500,            // 1.5s
  cls: 0.1,             // 0.1
};

const BUDGET = {
  main_js: 1.05,        // +5%
  vendor: 1.10,         // +10%
  main_css: 1.05,       // +5%
  total: 1.04,          // +4%
};

function getFileSize(filePath) {
  try {
    const content = readFileSync(filePath);
    const gzipped = gzipSync(content);
    return {
      raw: content.length,
      gzip: gzipped.length,
    };
  } catch (error) {
    console.warn(`⚠️ Could not read file: ${filePath}`);
    return { raw: 0, gzip: 0 };
  }
}

function findFiles(pattern) {
  try {
    const files = execSync(`find ${DIST_DIR} -name "${pattern}" -type f 2>/dev/null || true`, {
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean);
    return files;
  } catch {
    return [];
  }
}

function analyzeBundle() {
  console.log('📦 Analyzing Bundle Size...\n');

  // Find main bundle files
  const mainJsFiles = findFiles('main*.js');
  const vendorFiles = findFiles('vendor*.js');
  const cssFiles = findFiles('*.css');

  let metrics = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    commit: getCommitHash(),
    branch: getBranchName(),
  };

  // Main JS bundle
  let mainJsSize = { raw: 0, gzip: 0 };
  mainJsFiles.forEach(file => {
    const size = getFileSize(file);
    mainJsSize.raw += size.raw;
    mainJsSize.gzip += size.gzip;
  });
  metrics.main_js_raw = mainJsSize.raw;
  metrics.main_js = mainJsSize.gzip;

  // Vendor bundle
  let vendorSize = { raw: 0, gzip: 0 };
  vendorFiles.forEach(file => {
    const size = getFileSize(file);
    vendorSize.raw += size.raw;
    vendorSize.gzip += size.gzip;
  });
  metrics.vendor_raw = vendorSize.raw;
  metrics.vendor = vendorSize.gzip;

  // CSS
  let cssSize = { raw: 0, gzip: 0 };
  cssFiles.forEach(file => {
    const size = getFileSize(file);
    cssSize.raw += size.raw;
    cssSize.gzip += size.gzip;
  });
  metrics.main_css_raw = cssSize.raw;
  metrics.main_css = cssSize.gzip;

  // Total
  metrics.total_raw = mainJsSize.raw + vendorSize.raw + cssSize.raw;
  metrics.total = mainJsSize.gzip + vendorSize.gzip + cssSize.gzip;

  return metrics;
}

function getCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getBranchName() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function loadHistory() {
  if (existsSync(HISTORY_FILE)) {
    try {
      return JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveHistory(history) {
  const dir = resolve(HISTORY_FILE).split('/').slice(0, -1).join('/');
  execSync(`mkdir -p ${dir}`);
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function compareToBaseline(current) {
  const comparisons = {};

  const metrics = ['main_js', 'vendor', 'main_css', 'total'];
  metrics.forEach(metric => {
    const baseline = PHASE1_BASELINES[metric];
    const budget = BUDGET[metric] || 1.05;
    const currentValue = current[metric];
    const budgeted = Math.floor(baseline * budget);
    const change = currentValue - baseline;
    const percentChange = ((change / baseline) * 100).toFixed(1);

    comparisons[metric] = {
      baseline,
      budgeted,
      current: currentValue,
      change: change > 0 ? `+${change}` : `${change}`,
      percent: `${percentChange}%`,
      status: currentValue > budgeted ? 'error' : currentValue > baseline ? 'warning' : 'ok',
    };
  });

  return comparisons;
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function printReport(current, comparisons, history) {
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📊 BUNDLE SIZE REPORT\n');

  console.log('Current Build Metrics (Gzipped):\n');
  console.log(`  main.js     ${formatBytes(current.main_js)}`);
  console.log(`  vendor      ${formatBytes(current.vendor)}`);
  console.log(`  main.css    ${formatBytes(current.main_css)}`);
  console.log(`  ───────────────────────`);
  console.log(`  TOTAL       ${formatBytes(current.total)}\n`);

  console.log('Comparison vs Phase 1 Baseline:\n');
  console.log('Metric      Baseline    Current    Change      Status');
  console.log('───────────────────────────────────────────────────────');

  Object.entries(comparisons).forEach(([metric, comp]) => {
    const icon = comp.status === 'error' ? '❌' : comp.status === 'warning' ? '⚠️' : '✅';
    console.log(
      `${icon} ${metric.padEnd(10)} ${formatBytes(comp.baseline).padEnd(10)} ${formatBytes(comp.current).padEnd(10)} ${comp.change.padEnd(8)} (${comp.percent})`
    );
  });

  if (history.length > 1) {
    const previous = history[history.length - 2];
    console.log('\nComparison vs Previous Commit:\n');
    console.log('Metric      Previous    Current    Change');
    console.log('────────────────────────────────────────────');

    const metrics = ['main_js', 'vendor', 'main_css', 'total'];
    metrics.forEach(metric => {
      const prev = previous[metric] || 0;
      const curr = current[metric];
      const diff = curr - prev;
      const icon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      console.log(
        `${icon} ${metric.padEnd(10)} ${formatBytes(prev).padEnd(10)} ${formatBytes(curr).padEnd(10)} ${diff > 0 ? '+' : ''}${formatBytes(diff)}`
      );
    });
  }

  console.log('\nBudget Status:\n');
  Object.entries(comparisons).forEach(([metric, comp]) => {
    const budgetValue = comp.budgeted;
    const isBudgeted = comp.current <= budgetValue;
    const icon = isBudgeted ? '✅' : '❌';
    console.log(
      `${icon} ${metric.padEnd(10)} Budget: ${formatBytes(budgetValue).padEnd(10)} / Current: ${formatBytes(comp.current)}`
    );
  });

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

function checkBudget(comparisons) {
  const errors = Object.entries(comparisons)
    .filter(([_, comp]) => comp.status === 'error')
    .map(([metric, comp]) => `${metric}: ${formatBytes(comp.current)} exceeds budget ${formatBytes(comp.budgeted)}`)
    .join('\n  ');

  if (errors) {
    console.error('\n❌ BUDGET EXCEEDED:\n  ' + errors);
    process.env.BUNDLE_SIZE_EXCEEDED = 'true';
  }
}

// Main execution
function main() {
  try {
    const current = analyzeBundle();
    const comparisons = compareToBaseline(current);
    const history = loadHistory();

    // Add current metrics to history
    history.push(current);

    // Save history
    saveHistory(history);

    // Print report
    printReport(current, comparisons, history);

    // Check budget
    checkBudget(comparisons);

    // Exit with code if budget exceeded (will fail CI)
    if (process.env.BUNDLE_SIZE_EXCEEDED === 'true') {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error tracking bundle size:', error.message);
    process.exit(1);
  }
}

main();
