import { useRef, useState } from 'react'
import type { VideoChapter } from '../services/mediaService'

interface Props {
  src: string
  title?: string
  chapters?: VideoChapter[]
  transcript?: string
}

export function VideoPlayer({ src, title, chapters = [], transcript }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  function seekTo(time: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      videoRef.current.play()
    }
  }

  return (
    <div className="video-player">
      {title && <h3 className="video-player__title">{title}</h3>}
      <video
        ref={videoRef}
        src={src}
        controls
        className="video-player__video"
        crossOrigin="anonymous"
      >
        <track kind="captions" src="" label="Keine Untertitel" default />
      </video>
      {chapters.length > 0 && (
        <div className="video-player__chapters">
          <h4 className="video-player__chapters-title">Kapitel</h4>
          <ul className="video-player__chapter-list">
            {chapters.map((ch, i) => (
              <li key={i}>
                <button className="linkbtn" onClick={() => seekTo(ch.time)}>
                  {formatTime(ch.time)} — {ch.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {transcript && (
        <div className="video-player__transcript-wrap">
          <button className="btn btn--ghost" onClick={() => setShowTranscript(s => !s)}>
            📝 {showTranscript ? 'Transkript ausblenden' : 'Transkript anzeigen'}
          </button>
          {showTranscript && (
            <div className="video-player__transcript">{transcript}</div>
          )}
        </div>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
