import { useState, useRef } from 'react'
import { parseVTT, generateVTT, validateSubtitles, type Subtitle } from '../lib/media'

interface Props {
  videoId?: string
  onSubtitlesSave?: (subtitles: Subtitle[]) => void
}

export function SubtitleEditor({ videoId, onSubtitlesSave }: Props) {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'vtt'>('editor')
  const [vttContent, setVttContent] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleVTTImport = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    setVttContent(content)

    if (content.trim()) {
      const imported = parseVTT(content)
      const validationErrors = validateSubtitles(imported)

      if (validationErrors.length === 0) {
        setSubtitles(imported)
        setErrors([])
      } else {
        setErrors(validationErrors)
      }
    }
  }

  const handleVTTExport = () => {
    const vtt = generateVTT(subtitles)
    const blob = new Blob([vtt], { type: 'text/vtt' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subtitles-${videoId || 'export'}.vtt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      const content = event.target?.result as string
      setVttContent(content)
      const imported = parseVTT(content)
      const validationErrors = validateSubtitles(imported)

      if (validationErrors.length === 0) {
        setSubtitles(imported)
        setErrors([])
      } else {
        setErrors(validationErrors)
      }
    }
    reader.readAsText(file)
  }

  const handleAddSubtitle = () => {
    const newSubtitle: Subtitle = {
      id: `sub-${Date.now()}`,
      startTime: subtitles.length > 0 ? subtitles[subtitles.length - 1].endTime : 0,
      endTime: subtitles.length > 0 ? subtitles[subtitles.length - 1].endTime + 5 : 5,
      text: 'New subtitle text',
    }
    setSubtitles([...subtitles, newSubtitle])
  }

  const handleUpdateSubtitle = (id: string, updates: Partial<Subtitle>) => {
    setSubtitles(subtitles.map(sub =>
      sub.id === id ? { ...sub, ...updates } : sub
    ))
  }

  const handleDeleteSubtitle = (id: string) => {
    setSubtitles(subtitles.filter(sub => sub.id !== id))
  }

  const handleSave = () => {
    const validationErrors = validateSubtitles(subtitles)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    onSubtitlesSave?.(subtitles)
  }

  const formatInputTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const parseTimeInput = (timeStr: string): number => {
    const parts = timeStr.split(':').map(p => parseFloat(p))
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return 0
  }

  return (
    <div className="subtitle-editor">
      <div className="subtitle-editor__header">
        <h3 className="subtitle-editor__title">Subtitle Editor</h3>
        <div className="subtitle-editor__actions">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn--ghost"
          >
            Import VTT
          </button>
          <button
            onClick={handleVTTExport}
            disabled={subtitles.length === 0}
            className="btn btn--ghost"
          >
            Export VTT
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".vtt"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {errors.length > 0 && (
        <div className="subtitle-editor__errors">
          {errors.map((error, idx) => (
            <p key={idx} className="subtitle-editor__error">
              ⚠️ {error}
            </p>
          ))}
        </div>
      )}

      <div className="subtitle-editor__tabs">
        <button
          className={`subtitle-editor__tab ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          Editor
        </button>
        <button
          className={`subtitle-editor__tab ${activeTab === 'vtt' ? 'active' : ''}`}
          onClick={() => setActiveTab('vtt')}
        >
          VTT Format
        </button>
      </div>

      {activeTab === 'editor' && (
        <div className="subtitle-editor__editor">
          {subtitles.length === 0 ? (
            <p className="subtitle-editor__empty">No subtitles yet</p>
          ) : (
            <div className="subtitle-editor__list">
              {subtitles.map((sub) => (
                <div key={sub.id} className="subtitle-editor__item">
                  <div className="subtitle-editor__times">
                    <input
                      type="text"
                      value={formatInputTime(sub.startTime)}
                      onChange={e => handleUpdateSubtitle(sub.id, {
                        startTime: parseTimeInput(e.target.value),
                      })}
                      className="subtitle-editor__time-input"
                      placeholder="HH:MM:SS"
                    />
                    <span className="subtitle-editor__separator">→</span>
                    <input
                      type="text"
                      value={formatInputTime(sub.endTime)}
                      onChange={e => handleUpdateSubtitle(sub.id, {
                        endTime: parseTimeInput(e.target.value),
                      })}
                      className="subtitle-editor__time-input"
                      placeholder="HH:MM:SS"
                    />
                  </div>
                  <textarea
                    value={sub.text}
                    onChange={e => handleUpdateSubtitle(sub.id, { text: e.target.value })}
                    className="subtitle-editor__textarea"
                    placeholder="Subtitle text"
                    rows={2}
                  />
                  <button
                    onClick={() => handleDeleteSubtitle(sub.id)}
                    className="btn btn--sm btn--ghost subtitle-editor__delete-btn"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleAddSubtitle} className="btn btn--primary subtitle-editor__add-btn">
            + Add Subtitle
          </button>
        </div>
      )}

      {activeTab === 'vtt' && (
        <div className="subtitle-editor__vtt">
          <textarea
            value={vttContent || generateVTT(subtitles)}
            onChange={handleVTTImport}
            className="subtitle-editor__vtt-textarea"
            placeholder="Paste VTT format here..."
            rows={15}
          />
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={subtitles.length === 0}
        className="btn btn--primary subtitle-editor__save-btn"
      >
        Save Subtitles
      </button>

      <style jsx>{`
        .subtitle-editor {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: 8px;
        }

        .subtitle-editor__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .subtitle-editor__title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .subtitle-editor__actions {
          display: flex;
          gap: 0.5rem;
        }

        .subtitle-editor__errors {
          padding: 1rem;
          background: #ffe0e0;
          border-left: 3px solid #ff4444;
          border-radius: 4px;
        }

        .subtitle-editor__error {
          margin: 0.5rem 0;
          color: #c00;
          font-size: 0.875rem;
        }

        .subtitle-editor__tabs {
          display: flex;
          gap: 0;
          border-bottom: 2px solid var(--border-color);
        }

        .subtitle-editor__tab {
          background: none;
          border: none;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
          border-bottom: 2px solid transparent;
          font-weight: 500;
          transition: all 0.2s;
        }

        .subtitle-editor__tab.active {
          color: var(--primary-color);
          border-bottom-color: var(--primary-color);
        }

        .subtitle-editor__editor {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .subtitle-editor__empty {
          text-align: center;
          color: var(--text-muted);
          padding: 2rem 1rem;
          margin: 0;
        }

        .subtitle-editor__list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 500px;
          overflow-y: auto;
        }

        .subtitle-editor__item {
          padding: 1rem;
          background: var(--background);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .subtitle-editor__times {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          font-size: 0.875rem;
        }

        .subtitle-editor__time-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.875rem;
          font-family: monospace;
        }

        .subtitle-editor__separator {
          color: var(--text-muted);
          font-weight: 600;
        }

        .subtitle-editor__textarea {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.875rem;
          resize: vertical;
        }

        .subtitle-editor__delete-btn {
          align-self: flex-start;
        }

        .subtitle-editor__vtt {
          display: flex;
          flex-direction: column;
        }

        .subtitle-editor__vtt-textarea {
          padding: 1rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.875rem;
          resize: vertical;
        }

        .subtitle-editor__add-btn {
          align-self: flex-start;
        }

        .subtitle-editor__save-btn {
          align-self: flex-start;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  )
}
