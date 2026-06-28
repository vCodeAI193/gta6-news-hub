#!/usr/bin/env node

/**
 * Fail CI if Critical Performance Regressions Detected
 *
 * This script checks regression-report.json and exits with code 1
 * if any critical regressions are found (>10% degradation)
 */

import { readFileSync, existsSync } from 'fs';

function main() {
  if (!existsSync('regression-report.json')) {
    console.log('⚠️  No regression report found, skipping check');
    process.exit(0);
  }

  let report;
  try {
    report = JSON.parse(readFileSync('regression-report.json', 'utf8'));
  } catch (error) {
    console.error('❌ Failed to parse regression report:', error.message);
    process.exit(1);
  }

  // Check for critical regressions
  const critical = report.regressions?.filter(r => r.status === 'error') || [];

  if (critical.length > 0) {
    console.log('\n❌ CRITICAL PERFORMANCE REGRESSIONS DETECTED\n');
    console.log(`${critical.length} metric(s) exceeded critical thresholds:\n`);

    critical.forEach(r => {
      const percent = parseFloat(r.percent);
      console.log(`   ❌ ${r.metric}`);
      console.log(`      Baseline: ${r.baseline}`);
      console.log(`      Current:  ${r.current}`);
      console.log(`      Change:   +${percent}% (${r.comparison})`);
      console.log();
    });

    console.log('To proceed, either:');
    console.log('1. Optimize the code to reduce metrics');
    console.log('2. Update Phase 1 baselines in PERFORMANCE-GUIDE.md if intentional');
    console.log('3. Run with --force flag to override (CI only)\n');

    process.exit(1);
  }

  const warnings = report.regressions?.filter(r => r.status === 'warning') || [];

  if (warnings.length > 0) {
    console.log('\n⚠️  PERFORMANCE WARNINGS (non-critical)\n');
    console.log(`${warnings.length} metric(s) show degradation:\n`);

    warnings.forEach(w => {
      const percent = parseFloat(w.percent);
      console.log(`   ⚠️  ${w.metric}: +${percent}% vs ${w.comparison}`);
    });

    console.log(
      '\n✅ Build continues (warnings only). Consider optimizing if recurring.\n'
    );

    // Exit 0 for warnings (non-blocking)
    process.exit(0);
  }

  console.log('\n✅ No performance regressions detected!\n');
  process.exit(0);
}

main();
