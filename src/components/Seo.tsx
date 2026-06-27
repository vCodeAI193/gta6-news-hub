import { Helmet } from 'react-helmet-async'
import type { Article } from '../types'

const SITE = 'GTA 6 News Hub'
const BASE_URL = 'https://gta6-news-hub.example'

interface SeoProps {
  title?: string
  description?: string
  path?: string
  image?: string
  /** Wenn gesetzt, wird JSON-LD vom Typ NewsArticle ausgegeben. */
  article?: Article
}

/**
 * Zentrales Head-Management: Title, Meta-Description, OpenGraph, Twitter-Cards,
 * Canonical und (für Artikel) strukturierte Daten nach schema.org.
 */
export function Seo({ title, description, path = '/', image, article }: SeoProps) {
  const fullTitle = title ? `${title} · ${SITE}` : `${SITE} — Alles zu GTA 6`
  const desc =
    description ??
    'Offizielle News, Trailer, Leaks und Release-Infos rund um Grand Theft Auto VI. Release: 19. November 2026.'
  const url = `${BASE_URL}${path}`
  const ogImage = image ?? `${BASE_URL}/favicon.svg`

  const jsonLd = article
    ? {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.excerpt,
        datePublished: article.date,
        dateModified: article.updatedDate ?? article.date,
        author: { '@type': 'Organization', name: article.author ?? SITE },
        publisher: { '@type': 'Organization', name: SITE },
        image: article.image,
        mainEntityOfPage: url,
      }
    : null

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:site_name" content={SITE} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}
