import { useState, useEffect } from 'react'
import type { SessionLocation } from '../services/accountSecurityService'

interface Props {
  userId: string
}

export function SessionSecurityPanel({ userId }: Props) {
  const [locations, setLocations] = useState<SessionLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLocations()
  }, [userId])

  const loadLocations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/login-locations`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Failed to load locations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeLocation = async (location: SessionLocation) => {
    try {
      await fetch(`/api/users/${userId}/login-locations/${location.timestamp}`, {
        method: 'DELETE',
      })
      setLocations(locations.filter(l => l.timestamp !== location.timestamp))
    } catch (error) {
      console.error('Failed to revoke location:', error)
    }
  }

  const handleReportUnusual = async (location: SessionLocation) => {
    try {
      await fetch(`/api/users/${userId}/security/report-unusual-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, reportedAt: Date.now() }),
      })
      alert('Thank you for reporting. We recommend changing your password.')
    } catch (error) {
      console.error('Failed to report:', error)
    }
  }

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTrustIcon = (trust: SessionLocation['trustLevel']): string => {
    switch (trust) {
      case 'trusted':
        return '✓'
      case 'known':
        return '◆'
      case 'new':
        return '⚠'
      default:
        return '?'
    }
  }

  return (
    <div className="session-security-panel">
      <div className="session-security-panel__header">
        <h3 className="session-security-panel__title">Active Sessions & Login Locations</h3>
        <p className="session-security-panel__description">
          Monitor where your account is being accessed from
        </p>
      </div>

      {isLoading ? (
        <div className="session-security-panel__loading">Loading login locations...</div>
      ) : locations.length === 0 ? (
        <p className="session-security-panel__empty">No login locations recorded</p>
      ) : (
        <div className="session-security-panel__list">
          {locations.map(location => (
            <div
              key={location.timestamp}
              className={`session-security-panel__item session-security-panel__item--${location.trustLevel}`}
            >
              <div className="session-security-panel__icon">
                {getTrustIcon(location.trustLevel)}
              </div>

              <div className="session-security-panel__info">
                <div className="session-security-panel__location">
                  {location.city}, {location.country}
                </div>
                <div className="session-security-panel__ip">{location.ip}</div>
                <div className="session-security-panel__time">
                  {formatTime(location.timestamp)}
                </div>
              </div>

              <div className="session-security-panel__actions">
                {location.trustLevel === 'new' && (
                  <button
                    onClick={() => handleReportUnusual(location)}
                    className="btn btn--sm btn--ghost"
                    title="Report unusual activity"
                  >
                    Report
                  </button>
                )}
                <button
                  onClick={() => handleRevokeLocation(location)}
                  className="btn btn--sm btn--ghost"
                  title="Revoke this session"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .session-security-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: 8px;
        }

        .session-security-panel__header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .session-security-panel__title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .session-security-panel__description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .session-security-panel__loading {
          text-align: center;
          color: var(--text-muted);
          padding: 1rem 0;
        }

        .session-security-panel__empty {
          text-align: center;
          color: var(--text-muted);
          padding: 1rem 0;
          margin: 0;
        }

        .session-security-panel__list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .session-security-panel__item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--background);
          border-left: 3px solid var(--border-color);
          border-radius: 6px;
        }

        .session-security-panel__item--new {
          border-left-color: #ff6b6b;
          background: rgba(255, 107, 107, 0.05);
        }

        .session-security-panel__item--known {
          border-left-color: var(--primary-color);
        }

        .session-security-panel__item--trusted {
          border-left-color: #51cf66;
        }

        .session-security-panel__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface);
          font-weight: 600;
        }

        .session-security-panel__item--new .session-security-panel__icon {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
        }

        .session-security-panel__item--known .session-security-panel__icon {
          background: rgba(74, 144, 226, 0.2);
          color: var(--primary-color);
        }

        .session-security-panel__item--trusted .session-security-panel__icon {
          background: rgba(81, 207, 102, 0.2);
          color: #51cf66;
        }

        .session-security-panel__info {
          flex: 1;
        }

        .session-security-panel__location {
          font-weight: 600;
          font-size: 0.975rem;
        }

        .session-security-panel__ip {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: monospace;
        }

        .session-security-panel__time {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .session-security-panel__actions {
          display: flex;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  )
}
