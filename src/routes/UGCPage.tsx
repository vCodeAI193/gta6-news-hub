import { useState } from 'react'
import { Seo } from '../components/Seo'
import { getAllUgc, submitUgc, voteUgc, getTopCreators, type UgcType } from '../services/ugcService'

const TYPE_LABELS: Record<UgcType, string> = {
  article: 'Artikel', theory: 'Theorie', guide: 'Guide', review: 'Review',
  fanart: 'Fan-Art', suggestion: 'Vorschlag', translation: 'Übersetzung',
  meme: 'Meme', mapPoi: 'Karten-POI',
}

export function UGCPage() {
  const [tab, setTab] = useState<'browse' | 'submit' | 'creators'>('browse')
  const [typeFilter, setTypeFilter] = useState<UgcType | undefined>()
  const [items, setItems] = useState(() => getAllUgc(undefined, 'approved'))
  const [form, setForm] = useState({ title: '', content: '', type: 'theory' as UgcType, authorName: '', tags: '' })
  const [submitted, setSubmitted] = useState(false)
  const creators = getTopCreators()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim() || !form.authorName.trim()) return
    submitUgc({
      type: form.type,
      title: form.title,
      content: form.content,
      authorId: 'local_user',
      authorName: form.authorName,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      licenseType: 'personal',
    })
    setSubmitted(true)
  }

  function handleVote(id: string, dir: 1 | -1) {
    voteUgc(id, 'local_user', dir)
    setItems(getAllUgc(typeFilter, 'approved'))
  }

  const filtered = typeFilter ? items.filter(i => i.type === typeFilter) : items

  const tierEmoji = (tier: string) => ({ platinum: '🏆', gold: '🥇', silver: '🥈', bronze: '🥉' }[tier] ?? '🏅')

  return (
    <>
      <Seo title="Community-Inhalte" description="Nutzerartikel, Theorien, Guides und Fan-Inhalte." path="/community-ugc" />
      <header className="page-head">
        <h1 className="page-head__title">✍️ Community-Inhalte</h1>
        <p className="page-head__desc">Artikel, Theorien, Guides und Fan-Inhalte von der Community.</p>
      </header>

      <div className="searchpage__tabs" role="tablist">
        {(['browse', 'submit', 'creators'] as const).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'browse' ? 'Stöbern' : t === 'submit' ? 'Einreichen' : 'Top-Creator'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          <div className="facet__chips" style={{ marginBottom: '1rem' }}>
            <button type="button" className={`chip${!typeFilter ? ' chip--active' : ''}`} onClick={() => setTypeFilter(undefined)}>Alle</button>
            {(Object.keys(TYPE_LABELS) as UgcType[]).map(t => (
              <button key={t} type="button" className={`chip${typeFilter === t ? ' chip--active' : ''}`} onClick={() => setTypeFilter(t)}>{TYPE_LABELS[t]}</button>
            ))}
          </div>
          {filtered.length === 0 && <p className="empty">Keine Inhalte gefunden.</p>}
          <ul className="hitlist">
            {filtered.map(item => (
              <li key={item.id} className="hit">
                <div className="hit__meta">
                  <span className="badge">{TYPE_LABELS[item.type]}</span>
                  <span className="hit__min">{item.authorName}</span>
                  <span className="hit__min">{new Date(item.createdAt).toLocaleDateString('de-DE')}</span>
                </div>
                <strong className="hit__title">{item.title}</strong>
                <p className="hit__snippet" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{item.content.slice(0, 120)}…</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                  <button type="button" className="chip" onClick={() => handleVote(item.id, 1)}>👍 {item.votes}</button>
                  <button type="button" className="chip" onClick={() => handleVote(item.id, -1)}>👎</button>
                  {item.tags.map(tag => <span key={tag} className="badge badge--muted">#{tag}</span>)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'submit' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card__body">
            {submitted ? (
              <>
                <p className="empty">✅ Dein Beitrag wurde eingereicht und wird geprüft!</p>
                <button type="button" className="btn" onClick={() => setSubmitted(false)}>Weiteren Beitrag einreichen</button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="card__title">Beitrag einreichen</h3>
                <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                  <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Typ</span>
                  <select className="chat__input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as UgcType }))} style={{ width: '100%' }}>
                    {(Object.keys(TYPE_LABELS) as UgcType[]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                  <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Dein Name</span>
                  <input className="chat__input" value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))} placeholder="Nutzername" style={{ width: '100%' }} required />
                </label>
                <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                  <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Titel</span>
                  <input className="chat__input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titel des Beitrags" style={{ width: '100%' }} required />
                </label>
                <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                  <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Inhalt</span>
                  <textarea className="chat__input" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Dein Inhalt..." rows={5} style={{ width: '100%', display: 'block' }} required />
                </label>
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Tags (kommagetrennt)</span>
                  <input className="chat__input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2, tag3" style={{ width: '100%' }} />
                </label>
                <button type="submit" className="btn">Einreichen zur Prüfung</button>
              </form>
            )}
          </div>
        </div>
      )}

      {tab === 'creators' && (
        <>
          <h3>Top Creator-Programm</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Erstelle qualitativ hochwertige Inhalte und steige im Tier auf. Bronze → Silber → Gold → Platin.
          </p>
          {creators.length === 0 ? <p className="empty">Noch keine Top-Creator.</p> : (
            <ul className="hitlist">
              {creators.map((c, i) => (
                <li key={c.userId} className="hit">
                  <div className="hit__meta">
                    <span className="hit__min">#{i + 1}</span>
                    <span className="badge badge--accent">{tierEmoji(c.tier)} {c.tier.charAt(0).toUpperCase() + c.tier.slice(1)}</span>
                  </div>
                  <strong className="hit__title">{c.userId}</strong>
                  <p className="hit__snippet" style={{ fontSize: '0.8125rem' }}>{c.approved} genehmigte Beiträge · {c.totalVotes} Stimmen · {c.rewardPoints} Punkte</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
