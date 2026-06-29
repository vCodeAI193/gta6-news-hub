import { useState, useRef, useCallback, useEffect } from 'react'
import { cmsEditorService, type EditorState } from '../services/cmsEditorService'

interface Props {
  initialContent?: string
  onSave?: (content: string) => void
  onContentChange?: (content: string) => void
  readOnly?: boolean
}

export function CMSEditor({
  initialContent = '',
  onSave,
  onContentChange,
  readOnly = false,
}: Props) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [state, setState] = useState<EditorState>({
    content: initialContent,
    cursorPosition: 0,
    selectionStart: 0,
    selectionEnd: 0,
    formatting: {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      heading: 'p',
      list: 'none',
    },
    history: [],
    historyIndex: 0,
  })

  const [showPreview, setShowPreview] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [characterCount, setCharacterCount] = useState(0)
  const [outline, setOutline] = useState<Array<{ level: number; text: string; position: number }>>([])

  useEffect(() => {
    const words = cmsEditorService.getWordCount(state.content)
    const chars = cmsEditorService.getCharacterCount(state.content)
    const headings = cmsEditorService.getOutline(state.content)

    setWordCount(words)
    setCharacterCount(chars)
    setOutline(headings)
    onContentChange?.(state.content)
  }, [state.content, onContentChange])

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget
      const newContent = textarea.value
      const cursorPos = textarea.selectionStart

      const newState = state.content.length < newContent.length
        ? cmsEditorService.insertText(state, newContent[cursorPos - 1]!, cursorPos - 1)
        : cmsEditorService.deleteText(state, cursorPos, state.cursorPosition)

      setState({ ...newState, cursorPosition: cursorPos })
    },
    [state]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault()
          setState(cmsEditorService.undo(state))
        } else if (e.key === 'y') {
          e.preventDefault()
          setState(cmsEditorService.redo(state))
        } else if (e.key === 's') {
          e.preventDefault()
          onSave?.(state.content)
        }
      }
    },
    [state, onSave]
  )

  const handleSave = useCallback(() => {
    onSave?.(state.content)
  }, [state.content, onSave])

  const toggleFormatting = useCallback(
    (format: keyof typeof state.formatting, value?: string) => {
      const newState = cmsEditorService.applyFormatting(state, format, value)
      setState(newState)
    },
    [state]
  )

  return (
    <div className="cms-editor">
      <div className="cms-editor__toolbar">
        <div className="cms-editor__toolbar-group">
          <button
            className={`cms-editor__button ${state.formatting.bold ? 'active' : ''}`}
            onClick={() => toggleFormatting('bold')}
            disabled={readOnly}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            className={`cms-editor__button ${state.formatting.italic ? 'active' : ''}`}
            onClick={() => toggleFormatting('italic')}
            disabled={readOnly}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            className={`cms-editor__button ${state.formatting.underline ? 'active' : ''}`}
            onClick={() => toggleFormatting('underline')}
            disabled={readOnly}
            title="Underline"
          >
            <u>U</u>
          </button>
        </div>

        <div className="cms-editor__toolbar-group">
          <select
            className="cms-editor__select"
            value={state.formatting.heading}
            onChange={e => toggleFormatting('heading', e.target.value)}
            disabled={readOnly}
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <select
            className="cms-editor__select"
            value={state.formatting.list}
            onChange={e => toggleFormatting('list', e.target.value)}
            disabled={readOnly}
          >
            <option value="none">No list</option>
            <option value="ul">Bullet list</option>
            <option value="ol">Numbered list</option>
          </select>
        </div>

        <div className="cms-editor__toolbar-group cms-editor__spacer">
          <button
            className="cms-editor__button"
            onClick={() => setState(cmsEditorService.undo(state))}
            disabled={readOnly || state.historyIndex === 0}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            className="cms-editor__button"
            onClick={() => setState(cmsEditorService.redo(state))}
            disabled={readOnly || state.historyIndex >= state.history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </div>

        <div className="cms-editor__toolbar-group cms-editor__spacer">
          <button
            className={`cms-editor__button ${showPreview ? 'active' : ''}`}
            onClick={() => setShowPreview(!showPreview)}
            title="Toggle preview"
          >
            👁 Preview
          </button>
        </div>

        {!readOnly && (
          <button
            className="cms-editor__save-button"
            onClick={handleSave}
            title="Save (Ctrl+S)"
          >
            Save
          </button>
        )}
      </div>

      <div className="cms-editor__stats">
        <span className="cms-editor__stat">{wordCount} words</span>
        <span className="cms-editor__stat">{characterCount} characters</span>
      </div>

      <div className="cms-editor__content">
        <textarea
          ref={editorRef}
          className="cms-editor__textarea"
          value={state.content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          placeholder="Start typing..."
          spellCheck="true"
        />

        {showPreview && (
          <div className="cms-editor__preview">
            <div className="cms-editor__preview-content">
              {state.content.split('\n').map((line, idx) => (
                <p key={idx}>{line || <br />}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {outline.length > 0 && (
        <div className="cms-editor__outline">
          <h4 className="cms-editor__outline-title">Outline</h4>
          <ul className="cms-editor__outline-list">
            {outline.map((heading, idx) => (
              <li
                key={idx}
                className={`cms-editor__outline-item level-${heading.level}`}
                style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}
              >
                <button
                  className="cms-editor__outline-link"
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.setSelectionRange(heading.position, heading.position)
                      editorRef.current.focus()
                    }
                  }}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .cms-editor {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .cms-editor__toolbar {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          align-items: center;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .cms-editor__toolbar-group {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .cms-editor__spacer {
          margin-left: auto;
        }

        .cms-editor__button {
          padding: 0.5rem 0.75rem;
          background: var(--background);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .cms-editor__button:hover:not(:disabled) {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .cms-editor__button.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .cms-editor__button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cms-editor__select {
          padding: 0.5rem;
          background: var(--background);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .cms-editor__save-button {
          padding: 0.5rem 1rem;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .cms-editor__save-button:hover {
          opacity: 0.9;
        }

        .cms-editor__stats {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .cms-editor__stat {
          display: flex;
          align-items: center;
        }

        .cms-editor__content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          min-height: 400px;
        }

        .cms-editor__textarea {
          padding: 1rem;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.95rem;
          line-height: 1.6;
          resize: vertical;
          min-height: 400px;
          color: var(--text-primary);
        }

        .cms-editor__textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
        }

        .cms-editor__textarea:read-only {
          background: var(--background);
          color: var(--text-muted);
        }

        .cms-editor__preview {
          padding: 1rem;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          overflow-y: auto;
          max-height: 400px;
        }

        .cms-editor__preview-content p {
          margin: 0.5rem 0;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .cms-editor__outline {
          padding: 1rem;
          background: var(--background);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .cms-editor__outline-title {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .cms-editor__outline-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .cms-editor__outline-item {
          display: flex;
          margin: 0.25rem 0;
        }

        .cms-editor__outline-link {
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          text-align: left;
          padding: 0;
          font-size: 0.875rem;
        }

        .cms-editor__outline-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .cms-editor__content {
            min-height: 300px;
          }

          .cms-editor__textarea {
            min-height: 300px;
          }

          .cms-editor__preview {
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  )
}
