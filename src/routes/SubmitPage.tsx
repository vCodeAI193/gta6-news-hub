import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { categories } from '../data/categories'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isApiEnabled } from '../services/api'
import { communityApi } from '../services/communityApi'

export function SubmitPage() {
  const { user, loading } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', source: '', sourceUrl: '', category: 'leak', excerpt: '', body: '' })
  const [busy, setBusy] = useState(false)

  if (loading) return null
  if (!isApiEnabled() || !user) return <Navigate to="/login" replace />

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.source.trim()) {
      notify('Titel und Quelle sind Pflicht', 'error')
      return
    }
    setBusy(true)
    try {
      await communityApi.submit(form)
      notify('Danke! Deine Einreichung geht in die Prüfung. 🛡️ (+10 Rep bei Freigabe)', 'success')
      navigate('/')
    } catch {
      notify('Einreichung fehlgeschlagen', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Seo title="News einreichen" path="/einreichen" />
      <header className="page-head">
        <h1 className="page-head__title">✍️ News einreichen</h1>
        <p className="page-head__desc">
          Hast du einen Leak oder eine Meldung? Reiche sie ein — nach Prüfung durch die Redaktion
          wird sie veröffentlicht und du erhältst Reputation.
        </p>
      </header>

      <form className="admin-form" onSubmit={submit}>
        <div className="admin-form__grid">
          <label>
            Titel*
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </label>
          <label>
            Quelle*
            <input value={form.source} onChange={(e) => set('source', e.target.value)} required />
          </label>
          <label>
            Quelle-URL
            <input value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} />
          </label>
          <label>
            Kategorie
            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Teaser
          <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} />
        </label>
        <label>
          Inhalt
          <textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={5} />
        </label>
        <div className="admin-form__actions">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? '…' : 'Einreichen'}
          </button>
        </div>
      </form>
    </>
  )
}
