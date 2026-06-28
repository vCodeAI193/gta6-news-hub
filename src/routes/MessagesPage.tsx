import { useState } from 'react'
import { Seo } from '../components/Seo'
import {
  getConversations,
  getMessages,
  sendMessage,
  type DirectMessage,
} from '../services/socialService'

function timeStr(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function MessageThread({ partner }: { partner: string }) {
  const [messages, setMessages] = useState<DirectMessage[]>(() => getMessages(partner))
  const [text, setText] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(partner, text.trim())
    setMessages(getMessages(partner))
    setText('')
  }

  return (
    <div className="messages__thread">
      <header className="messages__thread-header">
        <div className="messages__avatar">{partner.slice(0, 2).toUpperCase()}</div>
        <strong>{partner}</strong>
      </header>

      <div className="messages__body">
        {messages.length === 0 ? (
          <p className="messages__empty">Noch keine Nachrichten. Schreib als Erster!</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`messages__msg${m.from === 'ich' ? ' messages__msg--mine' : ''}`}
            >
              <span className="messages__bubble">{m.text}</span>
              <span className="messages__time">{timeStr(m.timestamp)}</span>
            </div>
          ))
        )}
      </div>

      <form className="messages__form" onSubmit={submit}>
        <input
          className="messages__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Nachricht an ${partner}…`}
          ref={(el) => el?.focus()}
        />
        <button type="submit" className="btn" disabled={!text.trim()}>
          Senden
        </button>
      </form>
    </div>
  )
}

export function MessagesPage() {
  const [conversations] = useState(() => getConversations())
  const [active, setActive] = useState<string | null>(conversations[0] ?? null)

  return (
    <>
      <Seo title="Direktnachrichten" path="/nachrichten" />

      <header className="page-head">
        <h1 className="page-head__title">💬 Direktnachrichten</h1>
        <p className="page-head__desc">Private 1:1-Chats mit Community-Mitgliedern.</p>
      </header>

      <div className="messages__layout">
        <aside className="messages__sidebar">
          <h2 className="messages__sidebar-title">Gespräche</h2>
          {conversations.length === 0 ? (
            <p className="messages__empty">Noch keine Gespräche.</p>
          ) : (
            <ul className="messages__list">
              {conversations.map((partner) => (
                <li key={partner}>
                  <button
                    type="button"
                    className={`messages__convo${active === partner ? ' messages__convo--active' : ''}`}
                    onClick={() => setActive(partner)}
                  >
                    <span className="messages__avatar messages__avatar--sm">
                      {partner.slice(0, 2).toUpperCase()}
                    </span>
                    <span>{partner}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="messages__main">
          {active ? (
            <MessageThread key={active} partner={active} />
          ) : (
            <div className="messages__placeholder">
              <p>Wähle ein Gespräch aus der Liste links.</p>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
