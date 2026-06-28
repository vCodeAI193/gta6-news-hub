import { useState } from 'react'
import { Seo } from '../components/Seo'
import {
  getGroups,
  getJoinedGroups,
  joinGroup,
  leaveGroup,
  createGroup,
  getEvents,
  getVotes,
  castVote,
  getUserVote,
  getSpotlightMember,
  getDailyHighlights,
  getCollabLists,
  addToCollabList,
  type Group,
  type CommunityEvent,
  type CommunityVote,
} from '../services/socialService'

function EventTypeIcon({ type }: { type: CommunityEvent['type'] }) {
  if (type === 'watchparty') return <span title="Watch Party">🎬</span>
  if (type === 'ama') return <span title="AMA">🎤</span>
  return <span title="Stream">📡</span>
}

function VoteSection() {
  const [votes, setVotes] = useState(() => getVotes())
  const [userVotes, setUserVotes] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {}
    for (const v of getVotes()) {
      const uv = getUserVote(v.id)
      if (uv) result[v.id] = uv
    }
    return result
  })

  const vote = (voteId: string, option: string) => {
    castVote(voteId, option)
    setUserVotes((prev) => ({ ...prev, [voteId]: option }))
    setVotes(getVotes())
  }

  return (
    <section className="community__section">
      <h2 className="section-title">🗳️ Community-Abstimmungen</h2>
      {votes.map((v: CommunityVote) => {
        const totalVotes = Object.values(v.votes).reduce((a, b) => a + b, 0)
        const myVote = userVotes[v.id]
        return (
          <div key={v.id} className="vote-card">
            <h3 className="vote-card__question">{v.question}</h3>
            <ul className="vote-card__options">
              {v.options.map((opt) => {
                const count = v.votes[opt] ?? 0
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                const isMyVote = myVote === opt
                return (
                  <li key={opt} className="vote-card__option">
                    <button
                      type="button"
                      className={`vote-card__btn${isMyVote ? ' vote-card__btn--voted' : ''}`}
                      onClick={() => !myVote && vote(v.id, opt)}
                      disabled={!!myVote}
                    >
                      <span>{opt}</span>
                      {myVote && (
                        <span className="vote-card__pct">{pct}% ({count})</span>
                      )}
                      {myVote && (
                        <div className="vote-card__bar">
                          <div className="vote-card__fill" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </button>
                    {isMyVote && <span className="vote-card__check">✓ Deine Stimme</span>}
                  </li>
                )
              })}
            </ul>
            <p className="vote-card__total">{totalVotes} Stimmen gesamt</p>
          </div>
        )
      })}
    </section>
  )
}

function GroupsSection() {
  const [groups, setGroups] = useState(() => getGroups())
  const [joined, setJoined] = useState(() => getJoinedGroups())
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const toggle = (g: Group) => {
    if (joined.includes(g.id)) {
      leaveGroup(g.id)
      setJoined(getJoinedGroups())
    } else {
      joinGroup(g.id)
      setJoined(getJoinedGroups())
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createGroup(name.trim(), desc.trim())
    setGroups(getGroups())
    setJoined(getJoinedGroups())
    setCreating(false)
    setName('')
    setDesc('')
  }

  return (
    <section className="community__section">
      <div className="community__section-head">
        <h2 className="section-title">👥 Gruppen & Clans</h2>
        <button type="button" className="btn btn--ghost" onClick={() => setCreating((v) => !v)}>
          {creating ? '✕ Abbrechen' : '+ Neue Gruppe'}
        </button>
      </div>

      {creating && (
        <form className="group-form" onSubmit={submit}>
          <input
            className="group-form__input"
            placeholder="Gruppenname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="group-form__input"
            placeholder="Beschreibung (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button type="submit" className="btn">Erstellen</button>
        </form>
      )}

      <ul className="groups-list">
        {groups.map((g: Group) => {
          const isJoined = joined.includes(g.id)
          return (
            <li key={g.id} className="group-card">
              <div className="group-card__body">
                <strong className="group-card__name">{g.name}</strong>
                <p className="group-card__desc">{g.description}</p>
                <div className="group-card__tags">
                  {g.tags.map((t) => (
                    <span key={t} className="chip">#{t}</span>
                  ))}
                </div>
                <span className="group-card__members">👥 {g.memberCount} Mitglieder</span>
              </div>
              <button
                type="button"
                className={`btn${isJoined ? ' btn--ghost' : ''}`}
                onClick={() => toggle(g)}
              >
                {isJoined ? '✓ Beigetreten' : 'Beitreten'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function CommunityPage() {
  const spotlight = getSpotlightMember()
  const highlights = getDailyHighlights()
  const events = getEvents()
  const collabLists = getCollabLists()
  const [collabInput, setCollabInput] = useState<Record<string, string>>({})

  const addItem = (listId: string) => {
    const text = collabInput[listId]?.trim()
    if (!text) return
    addToCollabList(listId, text)
    setCollabInput((prev) => ({ ...prev, [listId]: '' }))
  }

  return (
    <>
      <Seo title="Community" path="/community" />

      <header className="page-head">
        <h1 className="page-head__title">👥 Community</h1>
        <p className="page-head__desc">Dein Vice City Treffpunkt — Gruppen, Events, Abstimmungen und mehr.</p>
      </header>

      <div className="community__layout">
        <div className="community__main">
          <GroupsSection />
          <VoteSection />

          {/* Collaborative Lists */}
          <section className="community__section">
            <h2 className="section-title">📝 Kollaborative Listen</h2>
            {collabLists.map((list) => (
              <div key={list.id} className="collab-card">
                <h3 className="collab-card__title">
                  {list.type === 'wishlist' ? '🌟' : '🔍'} {list.title}
                </h3>
                <p className="collab-card__contributors">
                  Von: {list.contributors.join(', ')}
                </p>
                <ul className="collab-card__items">
                  {list.items.map((item, i) => (
                    <li key={i} className="collab-card__item">• {item}</li>
                  ))}
                </ul>
                <div className="collab-card__add">
                  <input
                    className="group-form__input"
                    placeholder="Idee hinzufügen…"
                    value={collabInput[list.id] ?? ''}
                    onChange={(e) => setCollabInput((prev) => ({ ...prev, [list.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addItem(list.id)}
                  />
                  <button type="button" className="btn btn--ghost" onClick={() => addItem(list.id)}>
                    +
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>

        <aside className="community__sidebar">
          {/* Spotlight */}
          <div className="spotlight-card">
            <h3 className="spotlight-card__title">✨ Mitglied der Woche</h3>
            <div className="spotlight-card__avatar">{spotlight.name.slice(0, 2).toUpperCase()}</div>
            <strong className="spotlight-card__name">{spotlight.name}</strong>
            <span className="chip">{spotlight.title}</span>
            <p className="spotlight-card__bio">{spotlight.bio}</p>
          </div>

          {/* Events */}
          <div className="events-card">
            <h3 className="events-card__title">📅 Community-Events</h3>
            <ul className="events-list">
              {events.map((ev) => (
                <li key={ev.id} className="events-list__item">
                  <div className="events-list__type">
                    <EventTypeIcon type={ev.type} />
                    <span>{ev.date}</span>
                  </div>
                  <strong>{ev.title}</strong>
                  <p className="events-list__desc">{ev.description}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Best Comments */}
          <div className="highlights-card">
            <h3 className="highlights-card__title">💬 Beste Kommentare</h3>
            {highlights.map((h) => (
              <div key={h.id} className="highlight-comment">
                <div className="highlight-comment__header">
                  <strong>{h.author}</strong>
                  <span className="highlight-comment__reactions">❤️ {h.reactions}</span>
                </div>
                <p className="highlight-comment__text">"{h.text}"</p>
                <span className="highlight-comment__article">{h.articleTitle}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  )
}
