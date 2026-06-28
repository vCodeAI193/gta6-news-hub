import { useState } from 'react'
import { Seo } from '../components/Seo'
import { VEHICLES, WEAPONS, EDITIONS, searchVehicles, searchWeapons } from '../lib/interactiveTools'
import { TIMELINE_ENTRIES, filterTimeline } from '../lib/interactiveTools'
import { HypeMeter } from '../components/HypeMeter'
import {
  GTA_CHARACTERS,
  GTA_LOCATIONS,
  EASTER_EGGS,
  GLOSSARY,
  LEAKERS,
  OFFICIAL_STATEMENTS,
} from '../lib/gtaDatabase'
import type { GtaGlossaryEntry } from '../lib/gtaDatabase'

type DbTab =
  | 'vehicles'
  | 'weapons'
  | 'editions'
  | 'timeline'
  | 'characters'
  | 'locations'
  | 'easter_eggs'
  | 'glossary'
  | 'leakers'
  | 'statements'

const TAB_LABELS: Record<DbTab, string> = {
  vehicles: 'Fahrzeuge',
  weapons: 'Waffen',
  editions: 'Editionen',
  timeline: 'Timeline',
  characters: 'Charaktere',
  locations: 'Orte',
  easter_eggs: 'Easter Eggs',
  glossary: 'Glossar',
  leakers: 'Leaker',
  statements: 'Offizielle Statements',
}

const ALL_TABS: DbTab[] = [
  'vehicles',
  'weapons',
  'editions',
  'timeline',
  'characters',
  'locations',
  'easter_eggs',
  'glossary',
  'leakers',
  'statements',
]

const GLOSSARY_CATEGORIES: Array<GtaGlossaryEntry['category'] | ''> = [
  '',
  'gameplay',
  'lore',
  'slang',
  'technical',
]

const CATEGORY_LABELS: Record<string, string> = {
  '': 'Alle',
  gameplay: 'Gameplay',
  lore: 'Lore',
  slang: 'Slang',
  technical: 'Technisch',
}

export function DatabasePage() {
  const [tab, setTab] = useState<DbTab>('vehicles')
  const [q, setQ] = useState('')
  const [timelineType, setTimelineType] = useState('')
  const [glossaryCategory, setGlossaryCategory] = useState<GtaGlossaryEntry['category'] | ''>('')

  const vehicles = q ? searchVehicles(q) : VEHICLES
  const weapons = q ? searchWeapons(q) : WEAPONS
  const timeline = filterTimeline(TIMELINE_ENTRIES, timelineType || undefined)

  const filteredGlossary = glossaryCategory
    ? GLOSSARY.filter(g => g.category === glossaryCategory)
    : GLOSSARY

  function handleTabChange(t: DbTab) {
    setTab(t)
    setQ('')
  }

  return (
    <>
      <Seo
        title="Datenbanken"
        description="Fahrzeuge, Waffen, Charaktere, Orte, Easter Eggs, Glossar, Leaker und offizielle Statements zu GTA 6."
        path="/datenbank"
      />
      <header className="page-head">
        <h1 className="page-head__title">GTA 6 Datenbanken</h1>
        <HypeMeter />
      </header>

      <div className="searchpage__tabs" role="tablist">
        {ALL_TABS.map(t => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={`tab${tab === t ? ' tab--active' : ''}`}
            onClick={() => handleTabChange(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Search input for vehicles and weapons */}
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

      {/* Vehicles */}
      {tab === 'vehicles' && (
        <ul className="hitlist">
          {vehicles.map(v => (
            <li key={v.id} className="hit">
              <div className="hit__meta">
                <span className="chip">{v.type}</span>
                <span className="chip">{v.manufacturer}</span>
                {v.confirmed && <span className="badge badge--muted">Bestaetigt</span>}
              </div>
              <strong className="hit__title">{v.name}</strong>
              <p className="hit__snippet">{v.description}</p>
              <div className="hit__meta">
                <span>Top-Speed: {v.topSpeed}</span>
                <span>Handling: {v.handling}</span>
              </div>
            </li>
          ))}
          {vehicles.length === 0 && (
            <li className="empty">Keine Fahrzeuge gefunden.</li>
          )}
        </ul>
      )}

      {/* Weapons */}
      {tab === 'weapons' && (
        <ul className="hitlist">
          {weapons.map(w => (
            <li key={w.id} className="hit">
              <div className="hit__meta">
                <span className="chip">{w.category}</span>
                {w.confirmed && <span className="badge badge--muted">Bestaetigt</span>}
              </div>
              <strong className="hit__title">{w.name}</strong>
              <p className="hit__snippet">{w.description}</p>
              <div className="hit__meta">
                <span>Schaden: {w.damage}</span>
                <span>Reichweite: {w.range}</span>
              </div>
            </li>
          ))}
          {weapons.length === 0 && (
            <li className="empty">Keine Waffen gefunden.</li>
          )}
        </ul>
      )}

      {/* Editions */}
      {tab === 'editions' && (
        <div className="grid">
          {EDITIONS.map(ed => (
            <div key={ed.id} className="card">
              <div className="card__body">
                <h3 className="card__title">{ed.name}</h3>
                <p className="card__meta">{ed.price} Euro &middot; {ed.platform.join(', ')}</p>
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                  {ed.includes.map((inc, i) => <li key={i}>{inc}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {tab === 'timeline' && (
        <>
          <div className="searchpage__form">
            <select
              className="facet__select"
              value={timelineType}
              onChange={e => setTimelineType(e.target.value)}
            >
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
                  <span className="hit__min">{'*'.repeat(e.importance)}</span>
                </div>
                <strong className="hit__title">{e.date} &mdash; {e.title}</strong>
                <p className="hit__snippet">{e.description}</p>
              </li>
            ))}
            {timeline.length === 0 && (
              <li className="empty">Keine Einträge gefunden.</li>
            )}
          </ul>
        </>
      )}

      {/* Characters */}
      {tab === 'characters' && (
        <div className="grid">
          {GTA_CHARACTERS.map(c => (
            <div key={c.id} className="card">
              <div className="card__body">
                <h3 className="card__title">{c.name}</h3>
                <div className="hit__meta" style={{ marginBottom: '0.5rem' }}>
                  <span className="chip">{c.role}</span>
                  {c.traits.map(trait => (
                    <span key={trait} className="chip">{trait}</span>
                  ))}
                </div>
                <p style={{ margin: '0 0 0.5rem' }}>{c.description}</p>
                <p className="hit__meta">
                  <span>Zuerst gesehen: {c.firstSeen}</span>
                </p>
                {c.voiceActor && (
                  <p className="hit__meta">
                    <span>Sprecher: {c.voiceActor}</span>
                  </p>
                )}
                {c.relationships.length > 0 && (
                  <p className="hit__meta">
                    {c.relationships.map(r => (
                      <span key={r.characterId} className="chip chip--active">
                        {r.type}: {r.characterId}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Locations */}
      {tab === 'locations' && (
        <ul className="hitlist">
          {GTA_LOCATIONS.map(loc => (
            <li key={loc.id} className="hit">
              <div className="hit__meta">
                <span className="chip">{loc.type}</span>
                <span className="chip">{loc.district}</span>
                {loc.seenInTrailer && (
                  <span className="badge badge--muted">Im Trailer</span>
                )}
              </div>
              <strong className="hit__title">{loc.name}</strong>
              <p className="hit__snippet">{loc.description}</p>
              {loc.inspiredBy && (
                <div className="hit__meta">
                  <span>Inspiriert von: {loc.inspiredBy}</span>
                </div>
              )}
              {loc.coordinates && (
                <div className="hit__meta">
                  <span>Koordinaten: {loc.coordinates.lat.toFixed(2)}, {loc.coordinates.lng.toFixed(2)}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Easter Eggs */}
      {tab === 'easter_eggs' && (
        <ul className="hitlist">
          {EASTER_EGGS.map(egg => (
            <li key={egg.id} className="hit">
              <div className="hit__meta">
                <span className="chip">{egg.type}</span>
                {egg.verified && (
                  <span className="badge badge--muted">Verifiziert</span>
                )}
              </div>
              <strong className="hit__title">{egg.title}</strong>
              <p className="hit__snippet">{egg.description}</p>
              <div className="hit__meta">
                <span>Fundort: {egg.location}</span>
              </div>
              <div className="hit__meta">
                <span>Entdeckt von: {egg.discoveredBy}</span>
                <span className="hit__min">{egg.confirmedAt}</span>
              </div>
            </li>
          ))}
          {EASTER_EGGS.length === 0 && (
            <li className="empty">Keine Easter Eggs eingetragen.</li>
          )}
        </ul>
      )}

      {/* Glossary */}
      {tab === 'glossary' && (
        <>
          <div className="searchpage__form">
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {GLOSSARY_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`chip${glossaryCategory === cat ? ' chip--active' : ''}`}
                  onClick={() => setGlossaryCategory(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
          <ul className="hitlist">
            {filteredGlossary.map(entry => (
              <li key={entry.term} className="hit">
                <div className="hit__meta">
                  <span className="chip">{CATEGORY_LABELS[entry.category]}</span>
                </div>
                <strong className="hit__title">{entry.term}</strong>
                <p className="hit__snippet">{entry.definition}</p>
              </li>
            ))}
            {filteredGlossary.length === 0 && (
              <li className="empty">Keine Einträge in dieser Kategorie.</li>
            )}
          </ul>
        </>
      )}

      {/* Leakers */}
      {tab === 'leakers' && (
        <ul className="hitlist">
          {LEAKERS.map(leaker => (
            <li key={leaker.id} className="hit">
              <div className="hit__meta">
                <span className="chip">{leaker.platform}</span>
                <span
                  className={`badge ${leaker.status === 'active' ? 'badge--green' : leaker.status === 'banned' ? 'badge--red' : 'badge--muted'}`}
                >
                  {leaker.status}
                </span>
              </div>
              <strong className="hit__title">{leaker.alias}</strong>
              <div className="hit__meta">
                <span>Genauigkeit: {leaker.accuracy}%</span>
                <span>Leaks: {leaker.confirmedLeaks} / {leaker.totalLeaks} bestaetigt</span>
              </div>
              {leaker.notableLeaks.length > 0 && (
                <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                  {leaker.notableLeaks.map((nl, i) => (
                    <li key={i} className="hit__meta">{nl}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {LEAKERS.length === 0 && (
            <li className="empty">Keine Leaker eingetragen.</li>
          )}
        </ul>
      )}

      {/* Official Statements */}
      {tab === 'statements' && (
        <ul className="hitlist">
          {OFFICIAL_STATEMENTS.map(stmt => (
            <li key={stmt.id} className="hit">
              <div className="hit__meta">
                <span className="chip">{stmt.source}</span>
                {stmt.confirmed && (
                  <span className="badge badge--muted">Bestaetigt</span>
                )}
                <span className="hit__min">{stmt.date}</span>
              </div>
              <strong className="hit__title">{stmt.topic}</strong>
              <blockquote style={{ margin: '0.5rem 0', paddingLeft: '1rem', borderLeft: '3px solid var(--color-accent, #f90)', fontStyle: 'italic' }}>
                &ldquo;{stmt.quote}&rdquo;
              </blockquote>
              {stmt.url && (
                <div className="hit__meta">
                  <a
                    href={stmt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Quelle
                  </a>
                </div>
              )}
            </li>
          ))}
          {OFFICIAL_STATEMENTS.length === 0 && (
            <li className="empty">Keine offiziellen Statements eingetragen.</li>
          )}
        </ul>
      )}
    </>
  )
}
