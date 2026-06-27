import type { Article } from '../types'
import { api, isApiEnabled } from './api'
import { getById, getPublished } from './articlesService'

/**
 * Einheitlicher Zugriff auf Artikel: nutzt das echte Backend, wenn konfiguriert
 * (`VITE_API_URL`), sonst die lokale localStorage-Service-Schicht. So läuft die
 * App online wie offline.
 */
export async function fetchArticles(): Promise<Article[]> {
  if (isApiEnabled()) {
    const { articles } = await api<{ articles: Article[] }>('/api/articles')
    return articles
  }
  return getPublished()
}

export async function fetchArticle(id: string): Promise<Article | undefined> {
  if (isApiEnabled()) {
    try {
      const { article } = await api<{ article: Article }>(`/api/articles/${id}`)
      return article
    } catch {
      return undefined
    }
  }
  return getById(id)
}
