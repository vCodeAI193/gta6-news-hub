import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  title?: string
}

export function PictureInPictureVideo({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [pipActive, setPipActive] = useState(false)
  const supported = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document

  async function togglePip() {
    if (!videoRef.current) return
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
      setPipActive(false)
    } else {
      await videoRef.current.requestPictureInPicture()
      setPipActive(true)
    }
  }

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const handler = () => setPipActive(false)
    el.addEventListener('leavepictureinpicture', handler)
    return () => el.removeEventListener('leavepictureinpicture', handler)
  }, [])

  return (
    <div className="pip-container">
      <video
        ref={videoRef}
        src={src}
        controls
        style={{ width: '100%', borderRadius: 8 }}
      >
        <track kind="captions" src="" label="Keine Untertitel" default />
      </video>
      {supported && (
        <button
          type="button"
          className={`btn btn--ghost pip-btn${pipActive ? ' pip-btn--active' : ''}`}
          onClick={togglePip}
          title={pipActive ? 'PiP beenden' : 'Picture-in-Picture'}
        >
          {pipActive ? '⊟ PiP beenden' : '⊞ Picture-in-Picture'}
        </button>
      )}
    </div>
  )
}
