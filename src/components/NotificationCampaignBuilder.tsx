import { useState } from 'react'
import { smartNotificationService, type NotificationVariant, type NotificationCampaign } from '../services/smartNotificationService'

interface Props {
  onCampaignCreated?: (campaign: NotificationCampaign) => void
}

export function NotificationCampaignBuilder({ onCampaignCreated }: Props) {
  const [title, setTitle] = useState('')
  const [variants, setVariants] = useState<NotificationVariant[]>([
    { id: 'control', title: '', body: '', isControl: true },
    { id: 'variant-1', title: '', body: '', isControl: false },
  ])
  const [controlGroupPct, setControlGroupPct] = useState(50)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addVariant = () => {
    const newVariant: NotificationVariant = {
      id: `variant-${variants.length}`,
      title: '',
      body: '',
      isControl: false,
    }
    setVariants([...variants, newVariant])
  }

  const removeVariant = (id: string) => {
    if (variants.length > 2) {
      setVariants(variants.filter(v => v.id !== id))
    }
  }

  const updateVariant = (id: string, updates: Partial<NotificationVariant>) => {
    setVariants(variants.map(v => (v.id === id ? { ...v, ...updates } : v)))
  }

  const handleCreateCampaign = async () => {
    if (!title.trim()) {
      setError('Campaign title is required')
      return
    }

    if (variants.some(v => !v.title.trim() || !v.body.trim())) {
      setError('All variants must have title and body')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const campaign = await smartNotificationService.createCampaign({
        title,
        audience: 'all',
        variants,
        controlGroupPct,
        startTime: Date.now(),
        status: 'draft',
      })

      setTitle('')
      setVariants([
        { id: 'control', title: '', body: '', isControl: true },
        { id: 'variant-1', title: '', body: '', isControl: false },
      ])
      setControlGroupPct(50)

      onCampaignCreated?.(campaign)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create campaign'
      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="notification-campaign-builder">
      <div className="notification-campaign-builder__header">
        <h3 className="notification-campaign-builder__title">Create A/B Test Campaign</h3>
      </div>

      <div className="notification-campaign-builder__section">
        <label htmlFor="campaign-title" className="notification-campaign-builder__label">
          Campaign Title
        </label>
        <input
          id="campaign-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Friday Evening Push Test"
          className="notification-campaign-builder__input"
          disabled={isCreating}
        />
      </div>

      <div className="notification-campaign-builder__section">
        <label className="notification-campaign-builder__label">
          Control Group: {controlGroupPct}%
        </label>
        <input
          type="range"
          min="20"
          max="80"
          value={controlGroupPct}
          onChange={e => setControlGroupPct(parseInt(e.target.value))}
          className="notification-campaign-builder__slider"
          disabled={isCreating}
        />
        <p className="notification-campaign-builder__help-text">
          Control group gets the baseline message, {100 - controlGroupPct}% gets variant(s)
        </p>
      </div>

      <div className="notification-campaign-builder__variants">
        <div className="notification-campaign-builder__variants-title">
          Message Variants
        </div>

        {variants.map((variant, idx) => (
          <div key={variant.id} className="notification-campaign-builder__variant">
            <div className="notification-campaign-builder__variant-header">
              <h4 className="notification-campaign-builder__variant-name">
                {variant.isControl ? 'Control (Baseline)' : `Variant ${idx}`}
              </h4>
              {!variant.isControl && variants.length > 2 && (
                <button
                  onClick={() => removeVariant(variant.id)}
                  className="btn btn--sm btn--ghost"
                  disabled={isCreating}
                >
                  Remove
                </button>
              )}
            </div>

            <input
              type="text"
              value={variant.title}
              onChange={e => updateVariant(variant.id, { title: e.target.value })}
              placeholder="Notification title"
              className="notification-campaign-builder__variant-input"
              maxLength={65}
              disabled={isCreating}
            />
            <span className="notification-campaign-builder__char-count">
              {variant.title.length}/65
            </span>

            <textarea
              value={variant.body}
              onChange={e => updateVariant(variant.id, { body: e.target.value })}
              placeholder="Notification body"
              className="notification-campaign-builder__variant-textarea"
              maxLength={240}
              rows={3}
              disabled={isCreating}
            />
            <span className="notification-campaign-builder__char-count">
              {variant.body.length}/240
            </span>

            <input
              type="text"
              value={variant.actionUrl || ''}
              onChange={e => updateVariant(variant.id, { actionUrl: e.target.value })}
              placeholder="Action URL (optional)"
              className="notification-campaign-builder__variant-input"
              disabled={isCreating}
            />
          </div>
        ))}

        <button
          onClick={addVariant}
          className="btn btn--secondary"
          disabled={isCreating}
        >
          + Add Another Variant
        </button>
      </div>

      {error && (
        <p className="notification-campaign-builder__error">{error}</p>
      )}

      <button
        onClick={handleCreateCampaign}
        className="btn btn--primary"
        disabled={isCreating}
      >
        {isCreating ? 'Creating Campaign...' : 'Create Campaign'}
      </button>

      <style jsx>{`
        .notification-campaign-builder {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: 8px;
        }

        .notification-campaign-builder__header {
          margin-bottom: 0.5rem;
        }

        .notification-campaign-builder__title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .notification-campaign-builder__section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .notification-campaign-builder__label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .notification-campaign-builder__input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 1rem;
        }

        .notification-campaign-builder__input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .notification-campaign-builder__slider {
          width: 100%;
          cursor: pointer;
        }

        .notification-campaign-builder__help-text {
          margin: 0;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .notification-campaign-builder__variants {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--background);
          border-radius: 6px;
        }

        .notification-campaign-builder__variants-title {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .notification-campaign-builder__variant {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
        }

        .notification-campaign-builder__variant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification-campaign-builder__variant-name {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .notification-campaign-builder__variant-input {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .notification-campaign-builder__variant-textarea {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.875rem;
          resize: vertical;
        }

        .notification-campaign-builder__char-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: right;
        }

        .notification-campaign-builder__error {
          padding: 0.75rem;
          background: #ffe0e0;
          border-left: 3px solid #ff4444;
          border-radius: 4px;
          color: #c00;
          font-size: 0.875rem;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
