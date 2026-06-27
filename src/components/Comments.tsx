import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addComment, getComments, removeComment } from '../services/commentsRepo'
import type { Comment } from '../services/commentsService'
import { ApiError, isApiEnabled } from '../services/api'
import { usePreferences } from '../context/PreferencesContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useRealtime } from '../context/RealtimeContext'
import { useI18n } from '../i18n/I18nContext'
import { timeAgo } from '../lib/filterArticles'

interface CommentsProps {
  articleId: string
  /** „Live"-Variante kennzeichnet den Thread als simulierte Live-Diskussion. */
  live?: boolean
}

export function Comments({ articleId, live = false }: CommentsProps) {
  const { t } = useI18n()
  const { prefs, update } = usePreferences()
  const { user } = useAuth()
  const { notify } = useToast()
  const { subscribe } = useRealtime()
  const [comments, setComments] = useState<Comment[]>([])
  const [name, setName] = useState(prefs.displayName)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)

  // Im Backend-Modus muss man angemeldet sein, um zu kommentieren.
  const needsLogin = isApiEnabled() && !user

  const refresh = () => getComments(articleId).then(setComments)
  useEffect(() => {
    refresh()
    // Live: bei neuen/freigegebenen Kommentaren dieses Artikels neu laden.
    const unsub = subscribe('comment', (msg) => {
      if (msg.articleId === articleId) refresh()
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  const tree = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId)
    const childrenOf = (id: string) => comments.filter((c) => c.parentId === id)
    return { roots, childrenOf }
  }, [comments])

  const submit = async (e: React.FormEvent, parentId: string | null) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!isApiEnabled() && name.trim() && name !== prefs.displayName) update({ displayName: name.trim() })
    try {
      const res = await addComment(articleId, isApiEnabled() ? user!.displayName : name, text, parentId)
      setText('')
      setReplyTo(null)
      if (res.moderation) notify('Dein Kommentar wird geprüft. 🛡️', 'info')
      await refresh()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Kommentar fehlgeschlagen', 'error')
    }
  }

  const del = async (id: string) => {
    try {
      await removeComment(id)
      await refresh()
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Löschen nicht möglich', 'error')
    }
  }

  const form = (parentId: string | null, compact = false) => (
    <form className={`comment-form${compact ? ' comment-form--reply' : ''}`} onSubmit={(e) => submit(e, parentId)}>
      {!isApiEnabled() && !compact && (
        <input
          className="comment-form__name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Name"
          aria-label="Dein Name"
        />
      )}
      <textarea
        className="comment-form__text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('comments.placeholder')}
        aria-label={t('comments.placeholder')}
        rows={compact ? 2 : 3}
      />
      <button type="submit" className={compact ? 'btn btn--small' : 'btn'}>
        {t('comments.submit')}
      </button>
    </form>
  )

  const renderComment = (c: Comment, depth = 0) => (
    <li key={c.id} className="comment" style={{ marginLeft: depth * 16 }}>
      <div className="comment__head">
        <span className="comment__author">{c.author}</span>
        <time className="comment__time" dateTime={c.createdAt}>
          {timeAgo(c.createdAt)}
        </time>
      </div>
      <p className="comment__text">{c.text}</p>
      <div className="comment__actions">
        {!needsLogin && (
          <button type="button" className="linkbtn" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
            {t('comments.reply')}
          </button>
        )}
        <button type="button" className="linkbtn linkbtn--danger" onClick={() => del(c.id)}>
          {t('common.delete')}
        </button>
      </div>
      {replyTo === c.id && form(c.id, true)}
      {tree.childrenOf(c.id).map((child) => renderComment(child, depth + 1))}
    </li>
  )

  return (
    <section className="comments" aria-label={t('comments.title')}>
      <h3 className="comments__title">
        {live ? '🔴 Live-Diskussion' : t('comments.title')} ({comments.length})
        {live && <span className="comments__sim"> · {isApiEnabled() ? 'live' : 'simuliert (lokal)'}</span>}
      </h3>

      {needsLogin ? (
        <p className="comments__empty">
          Bitte <Link to="/login" className="linkbtn">melde dich an</Link>, um mitzudiskutieren.
        </p>
      ) : (
        replyTo === null && form(null)
      )}

      {comments.length === 0 ? (
        <p className="comments__empty">{t('comments.empty')}</p>
      ) : (
        <ul className="comment-list">{tree.roots.map((c) => renderComment(c))}</ul>
      )}
    </section>
  )
}
