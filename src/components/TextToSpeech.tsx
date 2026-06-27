import { useEffect, useState } from 'react'

interface TextToSpeechProps {
  /** Vorzulesender Text (Markdown wird grob bereinigt). */
  text: string
  lang?: string
}

function stripMarkdown(md: string): string {
  return md
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** „Vorlesen"-Button auf Basis der Web-Speech-API (kein externer Dienst). */
export function TextToSpeech({ text, lang = 'de-DE' }: TextToSpeechProps) {
  const [speaking, setSpeaking] = useState(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  if (!supported) return null

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text))
    utterance.lang = lang
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  return (
    <button
      type="button"
      className={`btn btn--small${speaking ? '' : ' btn--ghost'}`}
      onClick={toggle}
      aria-pressed={speaking}
    >
      {speaking ? '⏹ Stopp' : '🔊 Vorlesen'}
    </button>
  )
}
