import { useState, useRef, useEffect } from 'react'
import { estimateBandwidth, getRecommendedQuality, type VideoQuality } from '../lib/media'

interface Props {
  videoQualities: VideoQuality[]
  initialQuality?: string
  onQualityChange?: (quality: VideoQuality) => void
  title?: string
}

export function AdaptiveVideoPlayer({
  videoQualities,
  initialQuality,
  onQualityChange,
  title,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>(
    videoQualities.find(q => q.resolution === initialQuality) || videoQualities[0]
  )
  const [estimatedBandwidth, setEstimatedBandwidth] = useState<number | null>(null)
  const [autoQuality, setAutoQuality] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Estimate bandwidth on mount
  useEffect(() => {
    const measureBandwidth = async () => {
      const bandwidth = await estimateBandwidth()
      setEstimatedBandwidth(bandwidth)

      if (autoQuality) {
        const recommended = getRecommendedQuality(bandwidth, videoQualities)
        if (recommended) {
          setCurrentQuality(recommended)
          onQualityChange?.(recommended)
        }
      }
    }

    measureBandwidth()
  }, [autoQuality, videoQualities, onQualityChange])

  // Monitor bandwidth changes
  useEffect(() => {
    if (!autoQuality) return

    const checkBandwidth = async () => {
      const bandwidth = await estimateBandwidth()
      setEstimatedBandwidth(bandwidth)

      const recommended = getRecommendedQuality(bandwidth, videoQualities)
      if (recommended && recommended.resolution !== currentQuality.resolution) {
        setCurrentQuality(recommended)
        onQualityChange?.(recommended)
      }
    }

    const interval = setInterval(checkBandwidth, 5000)
    return () => clearInterval(interval)
  }, [autoQuality, currentQuality, videoQualities, onQualityChange])

  const handleQualityChange = (quality: VideoQuality) => {
    setCurrentQuality(quality)
    setAutoQuality(false)
    onQualityChange?.(quality)

    // Store selection time for video resumption
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime
      // Trigger quality switch in actual video element
      if (videoRef.current.src !== quality.url) {
        setIsLoading(true)
        videoRef.current.src = quality.url
        videoRef.current.currentTime = currentTime
      }
    }
  }

  const handleAutoQuality = () => {
    setAutoQuality(true)
  }

  const formatBandwidth = (bandwidth: number | null): string => {
    if (bandwidth === null) return 'N/A'
    if (bandwidth < 1000) return `${bandwidth.toFixed(0)} kbps`
    return `${(bandwidth / 1000).toFixed(1)} Mbps`
  }

  const getBandwidthProfile = (bandwidth: number): string => {
    if (bandwidth < 500) return 'Poor'
    if (bandwidth < 1500) return 'Fair'
    if (bandwidth < 3500) return 'Good'
    return 'Excellent'
  }

  return (
    <div className="adaptive-video-player">
      {title && <h3 className="adaptive-video-player__title">{title}</h3>}

      <div className="adaptive-video-player__video-container">
        <video
          ref={videoRef}
          src={currentQuality.url}
          controls
          className="adaptive-video-player__video"
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          crossOrigin="anonymous"
        >
          <track kind="captions" srcLang="en" label="English" />
          Your browser does not support the video tag.
        </video>

        {isLoading && (
          <div className="adaptive-video-player__loading">
            <div className="adaptive-video-player__spinner" />
            Switching quality...
          </div>
        )}
      </div>

      <div className="adaptive-video-player__controls">
        <div className="adaptive-video-player__status">
          <div className="adaptive-video-player__status-item">
            <span className="adaptive-video-player__label">Current Quality:</span>
            <span className="adaptive-video-player__value">{currentQuality.resolution}</span>
          </div>

          <div className="adaptive-video-player__status-item">
            <span className="adaptive-video-player__label">Bitrate:</span>
            <span className="adaptive-video-player__value">{currentQuality.bitrate} kbps</span>
          </div>

          <div className="adaptive-video-player__status-item">
            <span className="adaptive-video-player__label">FPS:</span>
            <span className="adaptive-video-player__value">{currentQuality.fps}</span>
          </div>

          {estimatedBandwidth !== null && (
            <>
              <div className="adaptive-video-player__status-item">
                <span className="adaptive-video-player__label">Bandwidth:</span>
                <span className="adaptive-video-player__value">
                  {formatBandwidth(estimatedBandwidth)}
                </span>
              </div>

              <div className="adaptive-video-player__status-item">
                <span className="adaptive-video-player__label">Profile:</span>
                <span className="adaptive-video-player__value">
                  {getBandwidthProfile(estimatedBandwidth)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="adaptive-video-player__quality-selector">
          <button
            onClick={handleAutoQuality}
            className={`adaptive-video-player__auto-btn ${autoQuality ? 'active' : ''}`}
          >
            Auto
          </button>

          {videoQualities.map(quality => (
            <button
              key={quality.resolution}
              onClick={() => handleQualityChange(quality)}
              className={`adaptive-video-player__quality-btn ${
                currentQuality.resolution === quality.resolution ? 'active' : ''
              }`}
              title={`${quality.resolution} @ ${quality.fps}fps`}
            >
              {quality.resolution}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .adaptive-video-player {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: var(--surface);
          border-radius: 8px;
          padding: 1rem;
        }

        .adaptive-video-player__title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .adaptive-video-player__video-container {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          background: var(--background);
          border-radius: 6px;
          overflow: hidden;
        }

        .adaptive-video-player__video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .adaptive-video-player__loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          font-size: 0.875rem;
          gap: 0.5rem;
        }

        .adaptive-video-player__spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .adaptive-video-player__controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--background);
          border-radius: 6px;
        }

        .adaptive-video-player__status {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .adaptive-video-player__status-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .adaptive-video-player__label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }

        .adaptive-video-player__value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .adaptive-video-player__quality-selector {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .adaptive-video-player__auto-btn,
        .adaptive-video-player__quality-btn {
          padding: 0.5rem 1rem;
          border: 2px solid var(--border-color);
          background: var(--surface);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .adaptive-video-player__auto-btn:hover,
        .adaptive-video-player__quality-btn:hover {
          border-color: var(--primary-color);
        }

        .adaptive-video-player__auto-btn.active,
        .adaptive-video-player__quality-btn.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
      `}</style>
    </div>
  )
}
