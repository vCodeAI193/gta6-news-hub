import { useState } from 'react'
import { MOCK_AUDIO_TRACKS, getNowPlaying, setNowPlaying, type AudioTrack } from '../services/mediaService'

export function AudioPlayer() {
  const [track, setTrack] = useState<AudioTrack | null>(() => getNowPlaying())
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)

  function play(t: AudioTrack) {
    setTrack(t)
    setNowPlaying(t)
    setPlaying(true)
  }

  function toggle() {
    setPlaying(p => !p)
  }

  function stop() {
    setPlaying(false)
    setTrack(null)
    setNowPlaying(null)
  }

  if (!expanded && !track) {
    return (
      <button className="audio-player__open btn btn--ghost" onClick={() => setExpanded(true)}>
        🎵 Musik
      </button>
    )
  }

  return (
    <div className="audio-player">
      <div className="audio-player__bar">
        {track ? (
          <>
            <span className="audio-player__icon">{playing ? '▶' : '⏸'}</span>
            <div className="audio-player__info">
              <strong>{track.title}</strong>
              <span className="audio-player__sub">{track.artist} · {track.radioStation}</span>
            </div>
            <button className="btn btn--ghost" onClick={toggle}>{playing ? 'Pause' : 'Play'}</button>
            <button className="btn btn--ghost" onClick={stop}>✕</button>
          </>
        ) : (
          <span className="audio-player__prompt">Wähle einen Track:</span>
        )}
        <button className="btn btn--ghost" onClick={() => setExpanded(e => !e)}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>
      {expanded && (
        <ul className="audio-player__list">
          {MOCK_AUDIO_TRACKS.map(t => (
            <li key={t.id}>
              <button
                type="button"
                className={`audio-player__track${track?.id === t.id ? ' audio-player__track--active' : ''}`}
                onClick={() => play(t)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', justifyContent: 'space-between' }}
              >
              <span className="audio-player__track-name">{t.title}</span>
              <span className="audio-player__track-meta">{t.artist} · {t.radioStation}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
