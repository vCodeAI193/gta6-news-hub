// Generiert einen ausgehenden RSS-Feed (feed.xml) aus den Artikel-Daten.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const BASE = process.env.SITE_URL ?? 'https://gta6-news-hub.example'

const data = readFileSync(join(root, 'src/data/articles.ts'), 'utf8')

// Sehr einfacher Extraktor für Titel/Teaser/Datum/ID (Seed-Daten sind statisch).
const blocks = data.split(/\n  \{\n/).slice(1)
const items = blocks
  .map((b) => {
    const id = b.match(/id:\s*'([^']+)'/)?.[1]
    const title = b.match(/title:\s*\n?\s*'([^']+)'|title:\s*'([^']+)'/)?.slice(1).find(Boolean)
    const excerpt = b.match(/excerpt:\s*\n?\s*'([^']+)'/)?.[1] ?? ''
    const date = b.match(/date:\s*'([^']+)'/)?.[1]
    return id && title && date ? { id, title, excerpt, date } : null
  })
  .filter(Boolean)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>GTA 6 News Hub</title>
  <link>${BASE}</link>
  <description>News, Trailer, Leaks und Release-Infos zu GTA 6.</description>
  <language>de</language>
${items
  .map(
    (i) => `  <item>
    <title>${esc(i.title)}</title>
    <link>${BASE}/news/${i.id}</link>
    <guid>${BASE}/news/${i.id}</guid>
    <description>${esc(i.excerpt)}</description>
    <pubDate>${new Date(i.date).toUTCString()}</pubDate>
  </item>`,
  )
  .join('\n')}
</channel></rss>
`

writeFileSync(join(root, 'public/feed.xml'), xml)
if (existsSync(join(root, 'dist'))) writeFileSync(join(root, 'dist/feed.xml'), xml)
console.log(`feed.xml: ${items.length} Items`)
