import { useState } from 'react'

interface SocialEmbedProps {
  /** Anzeigename der Plattform, z. B. "X (Twitter)". */
  platform: string
  author: string
  preview: string
  url: string
}

/**
 * Datenschutzfreundliches Social-Embed mit Klick-Schutz: Es wird erst nach
 * ausdrücklichem Klick eine Verbindung zur Plattform aufgebaut (DSGVO-konform).
 */
export function SocialEmbed({ platform, author, preview, url }: SocialEmbedProps) {
  const [loaded, setLoaded] = useState(false)

  if (loaded) {
    return (
      <div className="social-embed social-embed--loaded">
        <p className="social-embed__meta">{platform} · {author}</p>
        <p>{preview}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="modal__source-link">
          Original auf {platform} öffnen →
        </a>
      </div>
    )
  }

  return (
    <div className="social-embed">
      <p className="social-embed__meta">{platform} · {author}</p>
      <p className="social-embed__shield">
        Eingebetteter Beitrag — beim Laden wird eine Verbindung zu {platform} hergestellt.
      </p>
      <button type="button" className="btn btn--small" onClick={() => setLoaded(true)}>
        Beitrag laden
      </button>
    </div>
  )
}
