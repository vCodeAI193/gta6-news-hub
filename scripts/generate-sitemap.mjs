// Generiert sitemap.xml aus Routen + Artikeln. Schreibt nach public/ (vor dem Build)
// und nach dist/ (falls vorhanden, nach dem Build).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const BASE = process.env.SITE_URL ?? 'https://gta6-news-hub.example'

// Artikel-IDs grob aus der Datendatei extrahieren (ohne TS-Toolchain).
const data = readFileSync(join(root, 'src/data/articles.ts'), 'utf8')
const ids = [...data.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1])
const slugs = ['offizielle-news', 'trailer', 'leaks', 'release']

const urls = [
  '/',
  '/bookmarks',
  '/about',
  '/datenschutz',
  '/impressum',
  ...slugs.map((s) => `/kategorie/${s}`),
  ...ids.map((id) => `/news/${id}`),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${BASE}${u}</loc></url>`).join('\n')}
</urlset>
`

writeFileSync(join(root, 'public/sitemap.xml'), xml)
if (existsSync(join(root, 'dist'))) writeFileSync(join(root, 'dist/sitemap.xml'), xml)
console.log(`sitemap.xml: ${urls.length} URLs`)
