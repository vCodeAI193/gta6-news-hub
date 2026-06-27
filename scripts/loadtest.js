/**
 * k6-Lasttest für die GTA-6-News-Hub-API.
 * Ausführen (k6 muss installiert sein): `npm run loadtest`
 * Ziel via Env überschreibbar: `BASE_URL=http://localhost:8787 k6 run scripts/loadtest.js`
 */
import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = __ENV.BASE_URL || 'http://localhost:8787'

export const options = {
  stages: [
    { duration: '20s', target: 20 }, // hochfahren
    { duration: '40s', target: 20 }, // halten
    { duration: '10s', target: 0 }, // abbauen
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // < 1% Fehler
    http_req_duration: ['p(95)<400'], // 95% unter 400ms
  },
}

export default function () {
  const health = http.get(`${BASE}/api/health`)
  check(health, { 'health 200': (r) => r.status === 200 })

  const list = http.get(`${BASE}/api/articles`)
  check(list, {
    'articles 200': (r) => r.status === 200,
    'hat Artikel': (r) => JSON.parse(r.body).articles.length > 0,
  })

  sleep(1)
}
