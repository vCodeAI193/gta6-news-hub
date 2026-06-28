#!/usr/bin/env node

/**
 * Check Coverage Thresholds
 *
 * Validates that test coverage meets Wave 6 targets.
 * Run as: node check-coverage-thresholds.js coverage-summary.json
 */

const fs = require('fs')
const path = require('path')

const THRESHOLDS = {
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80,
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node check-coverage-thresholds.js <coverage-summary-json>')
  process.exit(1)
}

const coveragePath = args[0]

if (!fs.existsSync(coveragePath)) {
  console.error(`Coverage file not found: ${coveragePath}`)
  process.exit(1)
}

let coverage
try {
  const content = fs.readFileSync(coveragePath, 'utf8')
  coverage = JSON.parse(content)
} catch (error) {
  console.error('Failed to parse coverage file:', error.message)
  process.exit(1)
}

// Extract coverage summary
const summary = coverage.total || {}

console.log('\n📊 Wave 6 Test Coverage Report')
console.log('=' .repeat(50))

let hasFailed = false

Object.entries(THRESHOLDS).forEach(([metric, threshold]) => {
  const actual = summary[metric]?.pct || 0
  const status = actual >= threshold ? '✅' : '❌'
  const difference = actual - threshold

  console.log(`${status} ${metric.padEnd(12)}: ${actual.toFixed(2)}% (target: ${threshold}%)`)

  if (actual < threshold) {
    hasFailed = true
    console.log(`   └─ Missing: ${Math.abs(difference).toFixed(2)}%`)
  }
})

console.log('=' .repeat(50))

if (hasFailed) {
  console.log('\n❌ Coverage thresholds not met')
  console.log('Please add more tests to improve coverage.\n')
  process.exit(1)
} else {
  console.log('\n✅ All coverage thresholds met!\n')
  process.exit(0)
}
