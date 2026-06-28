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

/** Web-Speech-API-Typen (vom TS-DOM-Lib nicht überall abgedeckt). */
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}
function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function SearchBar({ value, onChange, suggestions = [], onSubmit }: SearchBarProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [listening, setListening] = useState(false)
  const [voiceSupported] = useState(() => Boolean(getRecognition()))
  const ref = useRef<HTMLDivElement>(null)

  // Sprachsuche (FEATURES-3 #5) via Web Speech API.
  const startVoice = () => {
    const rec = getRecognition()
    if (!rec) return
    rec.lang = 'de-DE'
    rec.interimResults = false
    setListening(true)
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? ''
      if (transcript) {
        onChange(transcript)
        onSubmit?.(transcript)
      }
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.start()
  }

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
      {voiceSupported && (
        <button
          type="button"
          className={`search__voice${listening ? ' search__voice--on' : ''}`}
          onClick={startVoice}
          aria-label="Sprachsuche starten"
          title="Sprachsuche"
        >
          {listening ? '🔴' : '🎤'}
        </button>
      )}
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
