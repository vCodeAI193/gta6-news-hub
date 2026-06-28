import { useState } from 'react'
import { Seo } from '../components/Seo'
import { getLiveEvents, getLivePosts, addLivePost, reactToPost, downloadIcal, type LiveEvent } from '../services/liveBlogService'
import { getOrCreateRoom, sendMessage, getMessages } from '../services/liveChatService'

function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(iso))
}

function getTimezone(iso: string): string {
  const now = Date.now()
  const diff = new Date(iso).getTime() - now
  if (diff < 0) return 'Vergangen'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `in ${days}T ${hours}h`
  if (hours > 0) return `in ${hours}h`
  return 'Bald!'
}

export function EventsPage() {
  const [events] = useState(getLiveEvents)
  const [selected, setSelected] = useState<LiveEvent | null>(null)
  const [posts, setPosts] = useState(() => selected ? getLivePosts(selected.id) : [])
  const [chatInput, setChatInput] = useState('')
  const [postContent, setPostContent] = useState('')
  const [activeTab, setActiveTab] = useState<'blog' | 'chat'>('blog')

  function selectEvent(ev: LiveEvent) {
    setSelected(ev)
    setPosts(getLivePosts(ev.id))
  }

  function handlePostSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !postContent.trim()) return
    addLivePost({ eventId: selected.id, author: 'Ich', content: postContent, type: 'update', pinned: false })
    setPostContent('')
    setPosts(getLivePosts(selected.id))
  }

  function handleChatSend(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !chatInput.trim()) return
    const room = getOrCreateRoom(selected.id)
    sendMessage(room.id, 'local_user', 'Gast', chatInput)
    setChatInput('')
  }

  const chatMessages = selected ? getMessages(getOrCreateRoom(selected.id).id) : []

  return (
    <>
      <Seo title="Events & Live" description="Anstehende GTA VI Events und Live-Berichterstattung." path="/events" />
      <header className="page-head">
        <h1 className="page-head__title">📅 Events & Live</h1>
        <p className="page-head__desc">Anstehende GTA VI Termine, Live-Blogs und Echtzeit-Diskussionen.</p>
      </header>

      <div className="grid">
        {events.map(ev => (
          <div key={ev.id} className={`card${ev.live ? ' card--live' : ''}`}>
            <div className="card__body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 className="card__title">{ev.title}</h3>
                {ev.live && <span className="badge badge--accent">🔴 LIVE</span>}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{ev.description}</p>
              <p style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                {formatEventDate(ev.startAt)} — <strong>{getTimezone(ev.startAt)}</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn--ghost" onClick={() => selectEvent(ev)}>
                  {ev.live ? 'Live-Blog öffnen' : 'Details'}
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => downloadIcal(ev)} title="In Kalender speichern">
                  📅 .ics
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card__body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="card__title">{selected.title}</h2>
              <button type="button" className="btn btn--ghost" onClick={() => setSelected(null)}>✕ Schließen</button>
            </div>

            <div className="searchpage__tabs" role="tablist">
              <button role="tab" aria-selected={activeTab === 'blog'} className={`tab${activeTab === 'blog' ? ' tab--active' : ''}`} onClick={() => setActiveTab('blog')}>Live-Blog</button>
              <button role="tab" aria-selected={activeTab === 'chat'} className={`tab${activeTab === 'chat' ? ' tab--active' : ''}`} onClick={() => setActiveTab('chat')}>Live-Chat</button>
            </div>

            {activeTab === 'blog' && (
              <div>
                <form onSubmit={handlePostSubmit} style={{ marginBottom: '1rem' }}>
                  <textarea
                    className="chat__input"
                    placeholder="Update hinzufügen..."
                    value={postContent}
                    onChange={e => setPostContent(e.target.value)}
                    rows={2}
                    style={{ width: '100%', display: 'block', marginBottom: '0.5rem' }}
                  />
                  <button type="submit" className="btn" disabled={!postContent.trim()}>Posten</button>
                </form>
                <ul className="hitlist">
                  {[...posts].reverse().map(post => (
                    <li key={post.id} className="hit">
                      <div className="hit__meta">
                        <span className="hit__min">{new Date(post.timestamp).toLocaleTimeString('de-DE')}</span>
                        <span className="badge">{post.author}</span>
                        {post.pinned && <span className="badge badge--accent">📌 Gepinnt</span>}
                      </div>
                      <p className="hit__title">{post.content}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {['👍','🔥','😮','❤️'].map(emoji => (
                          <button key={emoji} type="button" className="chip" style={{ fontSize: '1rem' }} onClick={() => reactToPost(post.id, emoji)}>
                            {emoji} {post.reactions[emoji] || ''}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
                {posts.length === 0 && <p className="empty">Noch keine Live-Updates. Sei der Erste!</p>}
              </div>
            )}

            {activeTab === 'chat' && (
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Slow-Mode aktiv (30s zwischen Nachrichten)
                </p>
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: '0.75rem', background: 'var(--bg)', borderRadius: 8, padding: '0.5rem' }}>
                  {chatMessages.length === 0 && <p className="empty" style={{ fontSize: '0.875rem' }}>Noch keine Nachrichten.</p>}
                  {chatMessages.map(msg => (
                    <div key={msg.id} style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.8125rem' }}>{msg.username}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{new Date(msg.timestamp).toLocaleTimeString('de-DE')}</span>
                      <p style={{ margin: '0.125rem 0 0', fontSize: '0.875rem' }}>{msg.text}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleChatSend} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="chat__input"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Nachricht eingeben..."
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn" disabled={!chatInput.trim()}>Senden</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
