import { api, isApiEnabled } from './api'
import { fetchArticles } from './articlesRepo'
import * as local from '../lib/aiLocal'
import type { RagSource } from '../lib/aiLocal'

/**
 * KI-Client (FEATURES-3 Kategorie 1). Mit aktivem Backend (`VITE_API_URL`)
 * laufen die Anfragen serverseitig (heuristisch oder via Anthropic, falls ein
 * Key gesetzt ist). Ohne Backend greifen die lokalen Heuristiken aus
 * `lib/aiLocal`, sodass die Features auch offline funktionieren.
 */

export interface AiStatus {
  available: boolean
  provider: 'anthropic' | 'heuristic'
  model: string
}

export interface AskResult {
  answer: string
  sources: RagSource[]
  provider?: string
}

async function docsForRag() {
  const arts = await fetchArticles()
  return arts.map((a) => ({ id: a.id, title: a.title, text: a.body || a.excerpt || '' }))
}

export const aiApi = {
  async status(): Promise<AiStatus> {
    if (isApiEnabled()) {
      try {
        return await api<AiStatus>('/api/ai/status', { auth: false })
      } catch {
        /* Fallback unten */
      }
    }
    return { available: false, provider: 'heuristic', model: 'lokal/heuristisch' }
  },

  async summarize(text: string, sentences = 2): Promise<{ summary: string; provider: string }> {
    if (isApiEnabled()) {
      try {
        return await api('/api/ai/summarize', { method: 'POST', body: { text, sentences }, auth: false })
      } catch {
        /* Fallback unten */
      }
    }
    return { summary: local.summarize(text, sentences), provider: 'heuristic' }
  },

  async ask(question: string): Promise<AskResult> {
    if (isApiEnabled()) {
      try {
        return await api<AskResult>('/api/ai/ask', { method: 'POST', body: { question }, auth: false })
      } catch {
        /* Fallback unten */
      }
    }
    const docs = await docsForRag()
    return { ...local.ragAnswer(question, docs), provider: 'heuristic' }
  },

  async readability(text: string) {
    if (isApiEnabled()) {
      try {
        return await api<ReturnType<typeof local.readability>>('/api/ai/readability', {
          method: 'POST',
          body: { text },
          auth: false,
        })
      } catch {
        /* Fallback unten */
      }
    }
    return local.readability(text)
  },
}
