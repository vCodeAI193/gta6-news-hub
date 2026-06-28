// Extended SEO utilities: OG images, structured data, internal linking

import type { Article } from '../types'

// Dynamic OG image URL generator (points to a build-time or on-the-fly endpoint)
export function ogImageUrl(article: Article, baseUrl = ''): string {
  const params = new URLSearchParams({
    title: article.title,
    category: article.category,
    date: article.date,
  })
  return `${baseUrl}/api/og-image?${params.toString()}`
}

// JSON-LD for BreadcrumbList
export function breadcrumbSchema(crumbs: Array<{ name: string; url: string }>): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  })
}

// JSON-LD for FAQPage
export function faqSchema(faqs: Array<{ q: string; a: string }>): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  })
}

// JSON-LD for VideoObject
export function videoSchema(video: { name: string; description: string; thumbnailUrl: string; uploadDate: string; url: string }): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    ...video,
  })
}

// Hreflang link generation
export function hreflangLinks(currentPath: string, baseUrl: string, locales: string[]): Array<{ lang: string; href: string }> {
  return [
    ...locales.map(lang => ({ lang, href: `${baseUrl}/${lang}${currentPath}` })),
    { lang: 'x-default', href: `${baseUrl}${currentPath}` },
  ]
}

// Auto internal linking: find relevant article links for a body of text
export function autoInternalLinks(
  text: string,
  articles: Article[],
  currentId?: string,
  maxLinks = 3
): Array<{ phrase: string; articleId: string; title: string }> {
  const lower = text.toLowerCase()
  const results: Array<{ phrase: string; articleId: string; title: string; score: number }> = []
  for (const a of articles) {
    if (a.id === currentId) continue
    const title = a.title.toLowerCase()
    const words = title.split(/\s+/).filter(w => w.length > 4)
    for (const word of words) {
      if (lower.includes(word)) {
        results.push({ phrase: word, articleId: a.id, title: a.title, score: word.length })
        break
      }
    }
  }
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLinks)
    .map(({ phrase, articleId, title }) => ({ phrase, articleId, title }))
}

// SEO audit: find articles with common issues
export interface SeoIssue {
  articleId: string
  title: string
  issues: string[]
}

export function auditArticles(articles: Article[]): SeoIssue[] {
  const issues: SeoIssue[] = []
  for (const a of articles) {
    const articleIssues: string[] = []
    if (!a.title || a.title.length < 20) articleIssues.push('Titel zu kurz (< 20 Zeichen)')
    if (!a.title || a.title.length > 70) articleIssues.push('Titel zu lang (> 70 Zeichen)')
    if (!a.excerpt || a.excerpt.length < 50) articleIssues.push('Excerpt zu kurz')
    if (!a.tags || a.tags.length < 2) articleIssues.push('Zu wenige Tags (< 2)')
    if (!a.image) articleIssues.push('Kein Bild gesetzt')
    if (articleIssues.length) {
      issues.push({ articleId: a.id, title: a.title, issues: articleIssues })
    }
  }
  return issues
}

// Google News sitemap entry format
export interface NewsSitemapEntry {
  url: string
  title: string
  publicationDate: string
  keywords: string[]
}

export function toNewsSitemapEntry(article: Article, baseUrl: string): NewsSitemapEntry {
  return {
    url: `${baseUrl}/news/${article.id}`,
    title: article.title,
    publicationDate: new Date(article.date).toISOString(),
    keywords: article.tags ?? [],
  }
}
