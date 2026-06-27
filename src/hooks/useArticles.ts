import { useEffect, useState } from 'react'
import { fetchArticles } from '../services/articlesRepo'
import type { Article } from '../types'

interface ArticlesState {
  articles: Article[]
  loading: boolean
  error: string | null
}

/** Lädt veröffentlichte Artikel über die (Mock-)Service-Schicht. */
export function useArticles(): ArticlesState & { reload: () => void } {
  const [state, setState] = useState<ArticlesState>({
    articles: [],
    loading: true,
    error: null,
  })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true }))
    fetchArticles()
      .then((articles) => {
        if (active) setState({ articles, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (active)
          setState({ articles: [], loading: false, error: String(err) })
      })
    return () => {
      active = false
    }
  }, [nonce])

  return { ...state, reload: () => setNonce((n) => n + 1) }
}
