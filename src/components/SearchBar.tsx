import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { getSearchHistory } from '../services/miscServices'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  /** Vorschläge (Autocomplete) aus Titeln/Tags. */
  suggestions?: string[]
  onSubmit?: (value: string) => void
}

export function SearchBar({ value, onChange, suggestions = [], onSubmit }: SearchBarProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const items = value.trim() ? suggestions : history
  const label = value.trim() ? 'Vorschläge' : 'Zuletzt gesucht'

  const choose = (term: string) => {
    onChange(term)
    onSubmit?.(term)
    setOpen(false)
  }

  return (
    <div className="search" ref={ref}>
      <svg className="search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        className="search__input"
        type="search"
        role="searchbox"
        placeholder={t('search.placeholder')}
        aria-label={t('search.label')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setHistory(getSearchHistory())
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSubmit?.(value)
            setOpen(false)
          }
        }}
      />
      {open && items.length > 0 && (
        <ul className="search__suggestions" role="listbox" aria-label={label}>
          <li className="search__suggestions-label" aria-hidden="true">
            {label}
          </li>
          {items.map((item) => (
            <li key={item}>
              <button type="button" className="search__suggestion" role="option" aria-selected={false} onClick={() => choose(item)}>
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
