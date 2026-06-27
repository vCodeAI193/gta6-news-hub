import { useEffect, useState } from 'react'
import { Seo } from '../components/Seo'
import { api, isApiEnabled } from '../services/api'

interface OpenApi {
  info: { title: string; version: string; description: string }
  paths: Record<string, Record<string, { tags?: string[]; summary?: string }>>
}

const METHOD_COLORS: Record<string, string> = {
  get: 'var(--green)',
  post: 'var(--cyan)',
  put: 'var(--amber)',
  patch: 'var(--amber)',
  delete: 'var(--red)',
}

export function ApiDocsPage() {
  const [spec, setSpec] = useState<OpenApi | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isApiEnabled()) {
      setError(true)
      return
    }
    api<OpenApi>('/api/openapi.json', { auth: false }).then(setSpec, () => setError(true))
  }, [])

  // Endpunkte nach Tag gruppieren.
  const grouped: Record<string, Array<{ method: string; path: string; summary?: string }>> = {}
  if (spec) {
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        const tag = op.tags?.[0] ?? 'Sonstige'
        ;(grouped[tag] ??= []).push({ method, path, summary: op.summary })
      }
    }
  }

  return (
    <>
      <Seo title="API-Dokumentation" path="/api-docs" />
      <header className="page-head">
        <h1 className="page-head__title">🔌 API-Dokumentation</h1>
        <p className="page-head__desc">
          OpenAPI-3-Spezifikation der REST-API. Roh unter <code>/api/openapi.json</code>.
        </p>
      </header>

      {error ? (
        <div className="empty">
          <p className="empty__title">Backend erforderlich</p>
          <p>Die API-Doku ist nur mit laufendem Server verfügbar.</p>
        </div>
      ) : !spec ? (
        <p className="comments__empty">Lade…</p>
      ) : (
        <>
          <p className="feed__count">{spec.info.title} · v{spec.info.version}</p>
          {Object.entries(grouped).map(([tag, ops]) => (
            <section key={tag} className="apidocs">
              <h2 className="section-title">{tag}</h2>
              <ul className="apidocs__list">
                {ops.map((op) => (
                  <li key={`${op.method}-${op.path}`} className="apidocs__row">
                    <span className="apidocs__method" style={{ color: METHOD_COLORS[op.method] ?? 'var(--text)' }}>
                      {op.method.toUpperCase()}
                    </span>
                    <code className="apidocs__path">{op.path}</code>
                    <span className="apidocs__summary">{op.summary}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </>
  )
}
