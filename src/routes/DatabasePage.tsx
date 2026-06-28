import { useState } from 'react'
import { Seo } from '../components/Seo'
import { VEHICLES, WEAPONS, EDITIONS, searchVehicles, searchWeapons } from '../lib/interactiveTools'
import { TIMELINE_ENTRIES, filterTimeline } from '../lib/interactiveTools'
import { HypeMeter } from '../components/HypeMeter'

type DbTab = 'vehicles' | 'weapons' | 'editions' | 'timeline'

export function DatabasePage() {
  const [tab, setTab] = useState<DbTab>('vehicles')
  const [q, setQ] = useState('')
  const [timelineType, setTimelineType] = useState('')

  const vehicles = q ? searchVehicles(q) : VEHICLES
  const weapons = q ? searchWeapons(q) : WEAPONS
  const timeline = filterTimeline(TIMELINE_ENTRIES, timelineType || undefined)

  return (
    <>
      <Seo title="Datenbanken" description="Fahrzeuge, Waffen, Editionen und Timeline für GTA 6." path="/datenbank" />
      <header className="page-head">
        <h1 className="page-head__title">📚 GTA 6 Datenbanken</h1>
        <HypeMeter />
      </header>

      <div className="searchpage__tabs" role="tablist">
        {(['vehicles', 'weapons', 'editions', 'timeline'] as DbTab[]).map(t => (
          <button key={t} type="button" role="tab" aria-selected={tab === t}
            className={`tab${tab === t ? ' tab--active' : ''}`}
            onClick={() => { setTab(t); setQ('') }}>
            {t === 'vehicles' ? '🚗 Fahrzeuge' : t === 'weapons' ? '🔫 Waffen' : t === 'editions' ? '📦 Editionen' : '📅 Timeline'}
          </button>
        ))}
      </div>

      {(tab === 'vehicles' || tab === 'weapons') && (
        <div className="searchpage__form">
          <input
            type="search"
            className="chat__input"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={tab === 'vehicles' ? 'Fahrzeug suchen…' : 'Waffe suchen…'}
          />
        </div>
      )}

      {tab === 'vehicles' && (
        <ul className="hitlist">
          {vehicles.map(v => (
            <li key={v.id} className="hit">
              <div className="hit__meta">
                <span className="chip">{v.type}</span>
                <span className="chip">{v.manufacturer}</span>
                {v.confirmed && <span className="badge badge--muted">✅ Bestätigt</span>}
              </div>
              <strong className="hit__title">{v.name}</strong>
              <p className="hit__snippet">{v.description}</p>
              <div className="hit__meta">
                <span>Top-Speed: {v.topSpeed}</span>
                <span>Handling: {v.handling}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'weapons' && (
        <ul className="hitlist">
          {weapons.map(w => (
            <li key={w.id} className="hit">
              <div className="hit__meta">
                <span className="chip">{w.category}</span>
                {w.confirmed && <span className="badge badge--muted">✅ Bestätigt</span>}
              </div>
              <strong className="hit__title">{w.name}</strong>
              <p className="hit__snippet">{w.description}</p>
              <div className="hit__meta">
                <span>Schaden: {w.damage}</span>
                <span>Reichweite: {w.range}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === 'editions' && (
        <div className="grid">
          {EDITIONS.map(ed => (
            <div key={ed.id} className="card">
              <div className="card__body">
                <h3 className="card__title">{ed.name}</h3>
                <p className="card__meta">💰 {ed.price} € · {ed.platform.join(', ')}</p>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                  {ed.includes.map((inc, i) => <li key={i}>{inc}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'timeline' && (
        <>
          <div className="searchpage__form">
            <select className="facet__select" value={timelineType} onChange={e => setTimelineType(e.target.value)}>
              <option value="">Alle Typen</option>
              <option value="trailer">Trailer</option>
              <option value="announcement">Ankündigungen</option>
              <option value="leak">Leaks</option>
              <option value="milestone">Meilensteine</option>
            </select>
          </div>
          <ul className="hitlist">
            {timeline.map(e => (
              <li key={e.id} className="hit">
                <div className="hit__meta">
                  <span className="chip">{e.type}</span>
                  <span className="hit__min">{'★'.repeat(e.importance)}</span>
                </div>
                <strong className="hit__title">{e.date} — {e.title}</strong>
                <p className="hit__snippet">{e.description}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
