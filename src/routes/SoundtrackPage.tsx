import { useState } from 'react'
import { Seo } from '../components/Seo'
import { MOCK_AUDIO_TRACKS, setNowPlaying } from '../services/mediaService'

export function SoundtrackPage() {
  const [station, setStation] = useState('')
  const stations = [...new Set(MOCK_AUDIO_TRACKS.map(t => t.radioStation))]
  const filtered = station ? MOCK_AUDIO_TRACKS.filter(t => t.radioStation === station) : MOCK_AUDIO_TRACKS

  return (
    <>
      <Seo title="Soundtrack-Explorer" description="GTA 6 Radiosender und Tracks entdecken." path="/soundtrack" />
      <header className="page-head">
        <h1 className="page-head__title">🎵 Soundtrack-Explorer</h1>
        <p className="page-head__desc">Radiosender und Tracks für GTA 6 (bestätigte + spekulierte Trackliste).</p>
      </header>

      <div className="facet__chips" style={{ marginBottom: '1.5rem' }}>
        <button className={`chip${!station ? ' chip--active' : ''}`} onClick={() => setStation('')}>Alle Sender</button>
        {stations.map(s => (
          <button key={s} className={`chip${station === s ? ' chip--active' : ''}`} onClick={() => setStation(s)}>{s}</button>
        ))}
      </div>

      <ul className="hitlist">
        {filtered.map(t => (
          <li key={t.id} className="hit">
            <div className="hit__meta">
              <span className="badge badge--muted">📻 {t.radioStation}</span>
              <span className="hit__min">⏱ {Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, '0')}</span>
            </div>
            <strong className="hit__title">{t.title}</strong>
            <p className="hit__snippet">{t.artist}</p>
            <button
              className="btn btn--ghost"
              onClick={() => setNowPlaying(t)}
            >
              ▶ Abspielen
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
