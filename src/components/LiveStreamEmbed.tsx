import { useState, useEffect } from 'react'
import { generateStreamEmbedUrl, validateStreamChannel, type StreamPlatform } from '../lib/media'

interface Props {
  platform: StreamPlatform
  channelId: string
  title?: string
  height?: number
}

export function LiveStreamEmbed({ platform, channelId, title, height = 400 }: Props) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const valid = validateStreamChannel(platform, channelId)
    setIsValid(valid)

    if (valid) {
      const url = generateStreamEmbedUrl(platform, channelId)
      setEmbedUrl(url)
      setError(null)
    } else {
      setEmbedUrl(null)
      setError(`Invalid ${platform} channel ID: ${channelId}`)
    }
  }, [platform, channelId])

  if (error) {
    return (
      <div className="live-stream-embed live-stream-embed--error">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="live-stream-embed">
      {title && <h3 className="live-stream-embed__title">{title}</h3>}

      {isValid && embedUrl ? (
        <div className="live-stream-embed__container">
          {platform === 'twitch' && (
            <iframe
              src={embedUrl}
              height={height}
              width="100%"
              frameBorder="0"
              allowFullScreen
              scrolling="no"
              allow="autoplay; fullscreen"
              className="live-stream-embed__iframe"
              title={`${platform} stream`}
            />
          )}

          {platform === 'youtube' && (
            <iframe
              src={embedUrl}
              height={height}
              width="100%"
              frameBorder="0"
              allowFullScreen
              scrolling="no"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="live-stream-embed__iframe"
              title={`${platform} stream`}
            />
          )}

          <div className="live-stream-embed__info">
            <span className="live-stream-embed__platform">{platform.toUpperCase()}</span>
            <span className="live-stream-embed__channel">{channelId}</span>
          </div>
        </div>
      ) : (
        <div className="live-stream-embed__loading">
          Loading {platform} stream...
        </div>
      )}

      <style jsx>{`
        .live-stream-embed {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          background: var(--surface);
        }

        .live-stream-embed--error {
          padding: 2rem;
          text-align: center;
          color: #c00;
          background: #ffe0e0;
        }

        .live-stream-embed__title {
          margin: 0;
          padding: 1rem;
          background: var(--background);
          border-bottom: 1px solid var(--border-color);
          font-size: 1rem;
          font-weight: 600;
        }

        .live-stream-embed__container {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
        }

        .live-stream-embed__container.live-stream-embed__container {
          padding-bottom: ${(height / 100) * 56.25}%;
        }

        .live-stream-embed__iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .live-stream-embed__info {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--background);
          border-top: 1px solid var(--border-color);
          font-size: 0.875rem;
        }

        .live-stream-embed__platform {
          font-weight: 600;
          color: var(--primary-color);
        }

        .live-stream-embed__channel {
          color: var(--text-secondary);
        }

        .live-stream-embed__loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: var(--text-muted);
          background: var(--background);
        }
      `}</style>
    </div>
  )
}
