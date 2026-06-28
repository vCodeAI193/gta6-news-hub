import { useState } from 'react'
import { Seo } from '../components/Seo'
import { getExperiments, toggleExperiment, getTimeCapsules, sealTimeCapsule, voteTimeCapsule, isSealed, getAvatarConfig, saveAvatarConfig, AVATAR_OPTIONS } from '../services/experimentService'

export function ExperimentsPage() {
  const [tab, setTab] = useState<'lab' | 'capsule' | 'avatar'>('lab')
  const [experiments, setExperiments] = useState(getExperiments)
  const [capsules, setCapsules] = useState(getTimeCapsules)
  const [avatar, setAvatar] = useState(getAvatarConfig)
  const [capsuleForm, setCapsuleForm] = useState({ prediction: '', authorName: '', topic: '', days: '30' })
  const [capsuleSubmitted, setCapsuleSubmitted] = useState(false)
  const [avatarSaved, setAvatarSaved] = useState(false)

  function handleToggle(id: string) {
    toggleExperiment(id)
    setExperiments(getExperiments())
  }

  function handleSealCapsule(e: React.FormEvent) {
    e.preventDefault()
    if (!capsuleForm.prediction.trim() || !capsuleForm.authorName.trim()) return
    sealTimeCapsule(capsuleForm.prediction, capsuleForm.authorName, capsuleForm.topic || 'Allgemein', parseInt(capsuleForm.days))
    setCapsules(getTimeCapsules())
    setCapsuleSubmitted(true)
  }

  function handleVoteCapsule(id: string) {
    voteTimeCapsule(id)
    setCapsules(getTimeCapsules())
  }

  function handleAvatarSave() {
    saveAvatarConfig(avatar)
    setAvatarSaved(true)
    setTimeout(() => setAvatarSaved(false), 2000)
  }

  const categoryIcon = (cat: string) => ({ ui: '🎨', feature: '✨', performance: '⚡', ai: '🤖' }[cat] ?? '🔬')

  return (
    <>
      <Seo title="Experimentier-Labor" description="Beta-Features testen, Vorhersagen versiegeln und deinen Avatar gestalten." path="/experimente" />
      <header className="page-head">
        <h1 className="page-head__title">🔬 Experimentier-Labor</h1>
        <p className="page-head__desc">Teste Beta-Features, versiegle Vorhersagen und gestalte deinen Avatar.</p>
      </header>

      <div className="searchpage__tabs" role="tablist">
        {(['lab', 'capsule', 'avatar'] as const).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab${tab === t ? ' tab--active' : ''}`} onClick={() => setTab(t)}>
            {t === 'lab' ? '🧪 Beta-Features' : t === 'capsule' ? '⏳ Zeitkapsel' : '👤 Avatar'}
          </button>
        ))}
      </div>

      {tab === 'lab' && (
        <div className="grid">
          {experiments.map(exp => (
            <div key={exp.id} className="card">
              <div className="card__body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <h3 className="card__title">{categoryIcon(exp.category)} {exp.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{exp.description}</p>
                    <p style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                      <span className="badge">{exp.category}</span>
                      <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>{exp.feedbackCount} Rückmeldungen</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`btn${exp.optedIn ? '' : ' btn--ghost'}`}
                    onClick={() => handleToggle(exp.id)}
                    disabled={exp.status === 'draft'}
                  >
                    {exp.status === 'draft' ? 'Demnächst' : exp.optedIn ? '✓ Aktiv' : 'Aktivieren'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'capsule' && (
        <>
          <div className="card" style={{ maxWidth: 560, marginBottom: '2rem' }}>
            <div className="card__body">
              <h3 className="card__title">⏳ Vorhersage versiegeln</h3>
              {capsuleSubmitted ? (
                <>
                  <p className="empty">✅ Deine Zeitkapsel wurde versiegelt!</p>
                  <button type="button" className="btn" onClick={() => setCapsuleSubmitted(false)}>Weitere versiegeln</button>
                </>
              ) : (
                <form onSubmit={handleSealCapsule}>
                  <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Dein Name</span>
                    <input className="chat__input" value={capsuleForm.authorName} onChange={e => setCapsuleForm(f => ({ ...f, authorName: e.target.value }))} placeholder="Alias..." style={{ width: '100%' }} required />
                  </label>
                  <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Thema</span>
                    <input className="chat__input" value={capsuleForm.topic} onChange={e => setCapsuleForm(f => ({ ...f, topic: e.target.value }))} placeholder="z.B. Story, Gameplay, Release..." style={{ width: '100%' }} />
                  </label>
                  <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                    <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Vorhersage</span>
                    <textarea className="chat__input" value={capsuleForm.prediction} onChange={e => setCapsuleForm(f => ({ ...f, prediction: e.target.value }))} placeholder="Was glaubst du, wird passieren?" rows={3} style={{ width: '100%', display: 'block' }} required />
                  </label>
                  <label style={{ display: 'block', marginBottom: '1rem' }}>
                    <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Versiegelt bis (Tage)</span>
                    <input type="number" className="chat__input" value={capsuleForm.days} onChange={e => setCapsuleForm(f => ({ ...f, days: e.target.value }))} min="1" max="3650" style={{ width: 120 }} />
                  </label>
                  <button type="submit" className="btn">🔒 Versiegeln</button>
                </form>
              )}
            </div>
          </div>
          <h3>Versiegelte Kapseln ({capsules.length})</h3>
          <ul className="hitlist">
            {capsules.map(cap => (
              <li key={cap.id} className="hit">
                <div className="hit__meta">
                  <span className="badge">{cap.topic}</span>
                  <span className="hit__min">{cap.authorName}</span>
                  {isSealed(cap) ? (
                    <span className="badge">🔒 Versiegelt bis {new Date(cap.sealedUntil).toLocaleDateString('de-DE')}</span>
                  ) : (
                    <span className="badge badge--accent">🔓 Geöffnet</span>
                  )}
                </div>
                <strong className="hit__title">{isSealed(cap) ? '🔒 Vorhersage verborgen' : cap.prediction}</strong>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" className="chip" onClick={() => handleVoteCapsule(cap.id)}>👍 {cap.votes}</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'avatar' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <div className="card__body">
            <h3 className="card__title">👤 Avatar gestalten</h3>
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '4rem' }}>🕶️</div>
              <div style={{ fontWeight: 700, marginTop: '0.5rem' }}>{avatar.name || 'Dein Avatar'}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {avatar.hair} · {avatar.skin} · {avatar.outfit} · {avatar.accessory}
              </div>
            </div>
            {Object.entries(AVATAR_OPTIONS).map(([key, opts]) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                <div className="facet__chips">
                  {opts.map(opt => (
                    <button key={opt} type="button" className={`chip${avatar[key as keyof typeof avatar] === opt ? ' chip--active' : ''}`} onClick={() => setAvatar(a => ({ ...a, [key]: opt }))}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Name</span>
              <input className="chat__input" value={avatar.name} onChange={e => setAvatar(a => ({ ...a, name: e.target.value }))} placeholder="Dein Avatar-Name" style={{ width: '100%' }} />
            </label>
            <button type="button" className="btn" onClick={handleAvatarSave}>
              {avatarSaved ? '✓ Gespeichert!' : 'Speichern'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
