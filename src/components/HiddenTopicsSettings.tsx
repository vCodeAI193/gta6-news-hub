import { useState } from 'react'
import {
  getHiddenSources,
  getHiddenTags,
  hideSource,
  hideTag,
  unhide,
} from '../services/hiddenTopicsService'

export function HiddenTopicsSettings() {
  const [hiddenTags, setHiddenTags] = useState<string[]>(getHiddenTags)
  const [hiddenSources, setHiddenSources] = useState<string[]>(getHiddenSources)
  const [newTag, setNewTag] = useState('')
  const [newSource, setNewSource] = useState('')

  const refresh = () => {
    setHiddenTags(getHiddenTags())
    setHiddenSources(getHiddenSources())
  }

  const handleHideTag = () => {
    const tag = newTag.trim()
    if (!tag) return
    hideTag(tag)
    setNewTag('')
    refresh()
  }

  const handleHideSource = () => {
    const source = newSource.trim()
    if (!source) return
    hideSource(source)
    setNewSource('')
    refresh()
  }

  const handleUnhide = (item: string) => {
    unhide(item)
    refresh()
  }

  const allHidden = [
    ...hiddenTags.map((t) => ({ item: t, type: 'Tag' as const })),
    ...hiddenSources.map((s) => ({ item: s, type: 'Quelle' as const })),
  ]

  return (
    <div className="hidden-topics">
      <h3 className="hidden-topics__title">Ausgeblendete Themen & Quellen</h3>

      <div className="hidden-topics__add">
        <div className="hidden-topics__row">
          <input
            className="hidden-topics__input"
            type="text"
            placeholder="Tag ausblenden…"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleHideTag()}
          />
          <button type="button" className="btn btn--ghost" onClick={handleHideTag}>
            Ausblenden
          </button>
        </div>
        <div className="hidden-topics__row">
          <input
            className="hidden-topics__input"
            type="text"
            placeholder="Quelle ausblenden…"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleHideSource()}
          />
          <button type="button" className="btn btn--ghost" onClick={handleHideSource}>
            Ausblenden
          </button>
        </div>
      </div>

      {allHidden.length === 0 ? (
        <p className="hidden-topics__empty">Keine ausgeblendeten Einträge.</p>
      ) : (
        <ul className="hidden-topics__list">
          {allHidden.map(({ item, type }) => (
            <li key={`${type}-${item}`} className="hidden-topics__item">
              <span className="chip">{type}</span>
              <span className="hidden-topics__name">{item}</span>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => handleUnhide(item)}
              >
                Entblenden
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
