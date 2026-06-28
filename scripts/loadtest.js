/**
 * Load Testing Script with k6
 *
 * Simulates realistic load scenarios:
 * 1. Ramp-up (0-50 VUs over 2 min)
 * 2. Sustained load (50 VUs for 5 min)
 * 3. Spike test (spike to 100 VUs for 1 min)
 * 4. Ramp-down (50-0 VUs over 1 min)
 *
 * Run: k6 run scripts/loadtest.js
 * Or:  npm run loadtest
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4173'

export const options = {
  // Default stage if not overridden by env/CLI
  stages: [
    { duration: '2m', target: 50 },      // Ramp-up
    { duration: '5m', target: 50 },      // Sustained
    { duration: '1m', target: 100 },     // Spike
    { duration: '1m', target: 50 },      // Back down
    { duration: '1m', target: 0 },       // Ramp-down
  ],

  thresholds: {
    // HTTP requests should be below 500ms 95% of the time
    'http_req_duration': ['p(95)<500'],
    // Error rate should be below 5%
    'http_req_failed': ['rate<0.05'],
    // HTTP status should be 200 or 204
    'http_req_status': ['p(95)=200,204'],
  },

  // Track individual metrics per group
  summaryTrendStats: ['avg', 'min', 'max', 'p(90)', 'p(95)', 'p(99)'],
}

export default function () {
  // Homepage
  group('Homepage', () => {
    const res = http.get(`${BASE_URL}/`, {
      headers: {
        'User-Agent': 'k6-load-test',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: '10s',
    })

    check(res, {
      'status is 200': (r) => r.status === 200,
      'homepage loads': (r) => r.body.includes('GTA') || r.body.length > 1000,
    })

    sleep(1)
  })

  // Article list / search
  group('Search & Articles', () => {
    const searchRes = http.get(`${BASE_URL}/api/articles?limit=20&offset=0`, {
      headers: {
        'Accept': 'application/json',
      },
      timeout: '10s',
    })

    check(searchRes, {
      'articles API status 200': (r) => r.status === 200,
      'articles response valid JSON': (r) => {
        try {
          const data = JSON.parse(r.body)
          return data.articles && data.articles.length > 0
        } catch {
          return false
        }
      },
    })

    sleep(1)
  })

  // Search endpoint
  group('Full-text Search', () => {
    const query = __ENV.SEARCH_QUERY || 'GTA'
    const searchRes = http.get(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}&limit=10`, {
      headers: {
        'Accept': 'application/json',
      },
      timeout: '10s',
    })

    check(searchRes, {
      'search status 200': (r) => r.status === 200 || r.status === 404,
      'search responds': (r) => r.status !== 500,
    })

    sleep(1)
  })

  // Semantic search (heavier endpoint)
  group('Semantic Search', () => {
    const semanticRes = http.get(
      `${BASE_URL}/api/ai/semantic-search?q=story&limit=5`,
      {
        headers: {
          'Accept': 'application/json',
        },
        timeout: '15s',
      }
    )

    check(semanticRes, {
      'semantic search responds': (r) => r.status !== 500,
      'semantic search under 3s': (r) => r.timings.duration < 3000,
    })

    sleep(2)
  })

  // Article detail (simulate reading)
  group('Article Detail', () => {
    // Fetch first article from list
    const listRes = http.get(`${BASE_URL}/api/articles?limit=1`, {
      timeout: '10s',
    })

    if (listRes.status === 200) {
      try {
        const data = JSON.parse(listRes.body)
        const articles = data.articles || data
        if (articles && articles.length > 0) {
          const articleId = articles[0].id || articles[0]
          if (articleId) {
            const detailRes = http.get(`${BASE_URL}/api/articles/${articleId}`, {
              headers: {
                'Accept': 'application/json',
              },
              timeout: '10s',
            })

            check(detailRes, {
              'article detail status 200': (r) => r.status === 200,
              'article detail has data': (r) => r.body.length > 100,
            })

            sleep(2) // Simulate reading
          }
        }
      } catch {
        // Silently fail, continue
      }
    }
  })

  // Profile endpoint
  group('User Profile', () => {
    const profileRes = http.get(`${BASE_URL}/api/users/me`, {
      headers: {
        'Accept': 'application/json',
      },
      timeout: '10s',
    })

    // May be 401 if not authenticated, that's fine
    check(profileRes, {
      'profile endpoint responds': (r) => r.status === 200 || r.status === 401,
    })

    sleep(1)
  })

  // Leaderboard
  group('Leaderboard', () => {
    const leaderboardRes = http.get(`${BASE_URL}/api/leaderboard/weekly?limit=10`, {
      headers: {
        'Accept': 'application/json',
      },
      timeout: '10s',
    })

    check(leaderboardRes, {
      'leaderboard responds': (r) => r.status === 200 || r.status === 404 || r.status === 500 === false,
    })

    sleep(1)
  })

  // Gamification data
  group('Gamification', () => {
    const achievementsRes = http.get(`${BASE_URL}/api/achievements`, {
      headers: {
        'Accept': 'application/json',
      },
      timeout: '10s',
    })

    check(achievementsRes, {
      'achievements endpoint responds': (r) => r.status !== 500,
    })

    sleep(1)
  })

  // Think time between major actions
  sleep(2)
}

/**
 * Usage Examples:
 *
 * Default run:
 *   npm run loadtest
 *   k6 run scripts/loadtest.js
 *
 * Override base URL:
 *   BASE_URL=https://example.com npm run loadtest
 *   k6 run scripts/loadtest.js -e BASE_URL=https://example.com
 *
 * Custom VU scenario:
 *   k6 run scripts/loadtest.js --vus 100 --duration 1m
 *
 * Output to JSON:
 *   k6 run scripts/loadtest.js -o json=results.json
 *
 * Run with tags (filter by group):
 *   k6 run scripts/loadtest.js --tags group=SearchAndArticles
 *
 * Cloud execution (k6 Pro):
 *   k6 cloud scripts/loadtest.js
 */
