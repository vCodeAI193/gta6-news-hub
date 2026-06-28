import { useState } from 'react'
import { generateChaptersFromTranscript, type TranscriptSegment, type Chapter } from '../lib/media'

interface Props {
  segments: TranscriptSegment[]
  onChaptersGenerated?: (chapters: Chapter[]) => void
  onChapterSelect?: (chapter: Chapter) => void
}

export function ChapterGenerator({ segments, onChaptersGenerated, onChapterSelect }: Props) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleGenerateChapters = async () => {
    setIsGenerating(true)
    try {
      const generated = generateChaptersFromTranscript(segments)
      setChapters(generated)
      onChaptersGenerated?.(generated)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditChapter = (chapter: Chapter) => {
    setEditingId(chapter.id)
    setEditTitle(chapter.title)
  }

  const handleSaveEdit = (chapterId: string) => {
    const updated = chapters.map(ch =>
      ch.id === chapterId ? { ...ch, title: editTitle } : ch
    )
    setChapters(updated)
    setEditingId(null)
  }

  const handleDeleteChapter = (chapterId: string) => {
    const updated = chapters.filter(ch => ch.id !== chapterId)
    setChapters(updated)
  }

  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      title: 'New Chapter',
      startTime: 0,
      confidence: 0.5,
    }
    setChapters([...chapters, newChapter])
  }

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h > 0 ? h + ':' : ''}${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="chapter-generator">
      <div className="chapter-generator__header">
        <h3 className="chapter-generator__title">Video Chapters</h3>
        <button
          onClick={handleGenerateChapters}
          disabled={isGenerating || segments.length === 0}
          className="btn btn--primary"
        >
          {isGenerating ? 'Generating...' : 'Generate from Transcript'}
        </button>
      </div>

      {chapters.length === 0 && !isGenerating && (
        <p className="chapter-generator__empty">
          No chapters yet. Generate them from your transcript or add them manually.
        </p>
      )}

      {chapters.length > 0 && (
        <div className="chapter-generator__list">
          {chapters.map(chapter => (
            <div key={chapter.id} className="chapter-generator__item">
              <div className="chapter-generator__timestamp">
                {formatTime(chapter.startTime)}
              </div>

              {editingId === chapter.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="chapter-generator__input"
                />
              ) : (
                <div className="chapter-generator__content">
                  <button
                    className="chapter-generator__title-btn"
                    onClick={() => onChapterSelect?.(chapter)}
                  >
                    {chapter.title}
                  </button>
                  {chapter.description && (
                    <p className="chapter-generator__description">
                      {chapter.description}
                    </p>
                  )}
                  <div className="chapter-generator__confidence">
                    Confidence: {(chapter.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )}

              <div className="chapter-generator__actions">
                {editingId === chapter.id ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(chapter.id)}
                      className="btn btn--sm btn--primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn btn--sm btn--ghost"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditChapter(chapter)}
                      className="btn btn--sm btn--ghost"
                      title="Edit chapter title"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="btn btn--sm btn--ghost"
                      title="Delete chapter"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {chapters.length > 0 && (
        <button onClick={handleAddChapter} className="btn btn--ghost chapter-generator__add-btn">
          + Add Manual Chapter
        </button>
      )}

      <style jsx>{`
        .chapter-generator {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: 8px;
        }

        .chapter-generator__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .chapter-generator__title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .chapter-generator__empty {
          text-align: center;
          color: var(--text-muted);
          padding: 2rem 1rem;
          margin: 0;
        }

        .chapter-generator__list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 500px;
          overflow-y: auto;
        }

        .chapter-generator__item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--background);
          border-radius: 6px;
          align-items: flex-start;
        }

        .chapter-generator__timestamp {
          font-weight: 600;
          color: var(--primary-color);
          min-width: 60px;
          font-size: 0.875rem;
        }

        .chapter-generator__content {
          flex: 1;
          min-width: 0;
        }

        .chapter-generator__input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 1rem;
        }

        .chapter-generator__title-btn {
          background: none;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          padding: 0;
          font-weight: 600;
          text-align: left;
          font-size: 1rem;
        }

        .chapter-generator__title-btn:hover {
          color: var(--primary-color);
        }

        .chapter-generator__description {
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .chapter-generator__confidence {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .chapter-generator__actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .chapter-generator__add-btn {
          align-self: flex-start;
        }
      `}</style>
    </div>
  )
}
