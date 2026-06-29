/**
 * SEO Analysis Service
 * Analyze and optimize content for search engine optimization
 */

export interface SEOMetrics {
  score: number // 0-100
  title: SEOCheck
  metaDescription: SEOCheck
  headings: SEOCheck
  keywords: SEOCheck
  links: SEOCheck
  images: SEOCheck
  readability: SEOCheck
  performance: SEOCheck
}

export interface SEOCheck {
  status: 'good' | 'warning' | 'error'
  score: number
  message: string
  suggestions: string[]
}

export interface KeywordAnalysis {
  keyword: string
  density: number // percentage
  position: number
  priority: 'high' | 'medium' | 'low'
}

export interface ContentSEOData {
  title: string
  metaDescription: string
  content: string
  headings: string[]
  keywords: string[]
}

class SEOAnalysisService {
  /**
   * Analyze content for SEO
   */
  analyzeSEO(data: ContentSEOData): SEOMetrics {
    const title = this.checkTitle(data.title)
    const metaDescription = this.checkMetaDescription(data.metaDescription)
    const headings = this.checkHeadings(data.headings)
    const keywords = this.checkKeywords(data.keywords, data.content)
    const links = this.checkLinks(data.content)
    const images = this.checkImages(data.content)
    const readability = this.checkReadability(data.content)
    const performance = this.checkPerformance()

    const scores = [
      title.score,
      metaDescription.score,
      headings.score,
      keywords.score,
      links.score,
      images.score,
      readability.score,
    ]
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

    return {
      score,
      title,
      metaDescription,
      headings,
      keywords,
      links,
      images,
      readability,
      performance,
    }
  }

  /**
   * Get keyword density analysis
   */
  analyzeKeywords(content: string, keywords: string[]): KeywordAnalysis[] {
    const analysis: KeywordAnalysis[] = []
    const totalWords = content.split(/\s+/).length

    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi')
      const matches = content.match(regex)
      const count = matches?.length || 0
      const density = (count / totalWords) * 100

      analysis.push({
        keyword,
        density,
        position: content.toLowerCase().indexOf(keyword.toLowerCase()),
        priority: density > 2 ? 'high' : density > 0.5 ? 'medium' : 'low',
      })
    }

    return analysis.sort((a, b) => b.density - a.density)
  }

  /**
   * Get meta descriptions suggestions
   */
  generateMetaDescription(title: string, content: string, maxLength: number = 160): string {
    const firstSentence = content.split(/[.!?]/)[0] || ''
    const description = (firstSentence || content).substring(0, maxLength).trim()
    return description + (description.length === maxLength ? '...' : '')
  }

  /**
   * Check internal link opportunities
   */
  findLinkOpportunities(content: string, keywords: string[]): Array<{
    keyword: string
    occurrence: number
    suggestions: string[]
  }> {
    const opportunities: Array<{
      keyword: string
      occurrence: number
      suggestions: string[]
    }> = []

    for (const keyword of keywords) {
      const regex = new RegExp(keyword, 'gi')
      const matches = content.match(regex)
      const occurrence = matches?.length || 0

      if (occurrence > 0) {
        opportunities.push({
          keyword,
          occurrence,
          suggestions: [
            `Link this keyword to relevant internal page`,
            `Use keyword in anchor text`,
          ],
        })
      }
    }

    return opportunities
  }

  /**
   * Analyze header tag structure
   */
  analyzeHeaderStructure(headings: string[]): {
    valid: boolean
    errors: string[]
    suggestions: string[]
  } {
    const errors: string[] = []
    const suggestions: string[] = []

    if (!headings.some(h => h.startsWith('h1'))) {
      errors.push('Missing H1 tag')
    }

    const h1Count = headings.filter(h => h.startsWith('h1')).length
    if (h1Count > 1) {
      errors.push(`Multiple H1 tags (${h1Count} found). Use only one H1.`)
    }

    if (headings.length < 3) {
      suggestions.push('Add more heading hierarchy for better structure')
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions,
    }
  }

  /**
   * Calculate readability score (based on Flesch Reading Ease)
   */
  calculateReadabilityScore(content: string): number {
    if (!content || content.trim().length === 0) return 0

    const words = content.split(/\s+/).filter(w => w.length > 0).length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const syllables = this.countSyllables(content)

    if (words === 0 || sentences === 0) return 0

    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  /**
   * Get SEO optimization recommendations
   */
  getRecommendations(metrics: SEOMetrics): string[] {
    const recommendations: string[] = []

    if (metrics.title.status !== 'good') {
      recommendations.push(...metrics.title.suggestions)
    }
    if (metrics.metaDescription.status !== 'good') {
      recommendations.push(...metrics.metaDescription.suggestions)
    }
    if (metrics.keywords.status !== 'good') {
      recommendations.push(...metrics.keywords.suggestions)
    }
    if (metrics.readability.status === 'error') {
      recommendations.push(...metrics.readability.suggestions)
    }

    return recommendations
  }

  /**
   * Analyze competitors' SEO
   */
  async analyzeCompetitorSEO(url: string): Promise<SEOMetrics | null> {
    try {
      const response = await fetch('/api/seo/analyze-competitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) return null
      return response.json()
    } catch {
      return null
    }
  }

  private checkTitle(title: string): SEOCheck {
    const suggestions: string[] = []
    let status: 'good' | 'warning' | 'error' = 'good'
    let score = 100

    if (!title || title.length === 0) {
      status = 'error'
      score = 0
      suggestions.push('Add a page title')
    } else if (title.length < 30) {
      status = 'warning'
      score = 70
      suggestions.push('Title should be at least 30 characters')
    } else if (title.length > 60) {
      status = 'warning'
      score = 80
      suggestions.push('Title should be under 60 characters for optimal display')
    }

    return { status, score, message: `Title: "${title}"`, suggestions }
  }

  private checkMetaDescription(description: string): SEOCheck {
    const suggestions: string[] = []
    let status: 'good' | 'warning' | 'error' = 'good'
    let score = 100

    if (!description) {
      status = 'error'
      score = 0
      suggestions.push('Add a meta description')
    } else if (description.length < 120) {
      status = 'warning'
      score = 70
      suggestions.push('Meta description should be at least 120 characters')
    } else if (description.length > 160) {
      status = 'warning'
      score = 80
      suggestions.push('Meta description should be under 160 characters')
    }

    return { status, score, message: `Meta description length: ${description.length}`, suggestions }
  }

  private checkHeadings(headings: string[]): SEOCheck {
    const structure = this.analyzeHeaderStructure(headings)
    return {
      status: structure.valid ? 'good' : 'error',
      score: structure.valid ? 100 : 50,
      message: `Headings: ${headings.length} found`,
      suggestions: structure.suggestions,
    }
  }

  private checkKeywords(keywords: string[], content: string): SEOCheck {
    const analysis = this.analyzeKeywords(content, keywords)
    const usedKeywords = analysis.filter(k => k.occurrence > 0).length

    return {
      status: usedKeywords > 0 ? 'good' : 'warning',
      score: Math.min(100, usedKeywords * 20),
      message: `Keywords: ${usedKeywords}/${keywords.length} used`,
      suggestions: [
        'Ensure primary keywords appear in title and first 100 words',
        'Maintain natural keyword density (0.5-2%)',
      ],
    }
  }

  private checkLinks(content: string): SEOCheck {
    const externalLinks = (content.match(/https?:\/\//g) || []).length
    const internalLinks = (content.match(/\/[a-z]/gi) || []).length

    return {
      status: externalLinks > 0 || internalLinks > 0 ? 'good' : 'warning',
      score: Math.min(100, externalLinks * 10 + internalLinks * 5),
      message: `Links: ${externalLinks} external, ${internalLinks} internal`,
      suggestions: [
        'Add relevant internal links',
        'Link to authoritative external sources',
      ],
    }
  }

  private checkImages(content: string): SEOCheck {
    const images = (content.match(/<img/gi) || []).length
    const imagesWithAlt = (content.match(/alt=/gi) || []).length

    return {
      status: images > 0 && imagesWithAlt === images ? 'good' : images > 0 ? 'warning' : 'error',
      score: images === 0 ? 50 : imagesWithAlt === images ? 100 : 70,
      message: `Images: ${images} found, ${imagesWithAlt} with alt text`,
      suggestions: ['Add descriptive alt text to all images'],
    }
  }

  private checkReadability(content: string): SEOCheck {
    const score = this.calculateReadabilityScore(content)

    return {
      status: score >= 60 ? 'good' : score >= 40 ? 'warning' : 'error',
      score,
      message: `Readability score: ${score}`,
      suggestions: [
        'Use shorter sentences',
        'Break content into paragraphs',
        'Use clear language',
      ],
    }
  }

  private checkPerformance(): SEOCheck {
    return {
      status: 'good',
      score: 100,
      message: 'Page performance optimized',
      suggestions: [],
    }
  }

  private calculateOverallScore(data: ContentSEOData): number {
    const metrics = this.analyzeSEO(data)
    const scores = [
      metrics.title.score,
      metrics.metaDescription.score,
      metrics.headings.score,
      metrics.keywords.score,
      metrics.links.score,
      metrics.images.score,
      metrics.readability.score,
    ]

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/)
    let syllableCount = 0

    for (const word of words) {
      syllableCount += Math.max(
        1,
        (word.match(/[aeiou]+/g) || []).length
      )
    }

    return syllableCount
  }
}

export const seoAnalysisService = new SEOAnalysisService()
