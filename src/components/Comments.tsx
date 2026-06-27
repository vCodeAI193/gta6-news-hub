import { useMemo, useState } from 'react'
import {
  addComment,
  getComments,
  removeComment,
  type Comment,
} from '../services/commentsService'
import { usePreferences } from '../context/PreferencesContext'
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
  const [comments, setComments] = useState<Comment[]>(() => getComments(articleId))
  const [name, setName] = useState(prefs.displayName)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)

  const tree = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId)
    const childrenOf = (id: string) => comments.filter((c) => c.parentId === id)
    return { roots, childrenOf }
  }, [comments])

  const refresh = () => setComments(getComments(articleId))

  const submit = (e: React.FormEvent, parentId: string | null) => {
    e.preventDefault()
    if (!text.trim()) return
    if (name.trim() && name !== prefs.displayName) update({ displayName: name.trim() })
    addComment(articleId, name, text, parentId)
    setText('')
    setReplyTo(null)
    refresh()
  }

  const del = (id: string) => {
    removeComment(id)
    refresh()
  }

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
        <button type="button" className="linkbtn" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
          {t('comments.reply')}
        </button>
        <button type="button" className="linkbtn linkbtn--danger" onClick={() => del(c.id)}>
          {t('common.delete')}
        </button>
      </div>
      {replyTo === c.id && (
        <form className="comment-form comment-form--reply" onSubmit={(e) => submit(e, c.id)}>
          <textarea
            className="comment-form__text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('comments.placeholder')}
            rows={2}
          />
          <button type="submit" className="btn btn--small">
            {t('comments.submit')}
          </button>
        </form>
      )}
      {tree.childrenOf(c.id).map((child) => renderComment(child, depth + 1))}
    </li>
  )

  return (
    <section className="comments" aria-label={t('comments.title')}>
      <h3 className="comments__title">
        {live ? '🔴 Live-Diskussion' : t('comments.title')} ({comments.length})
        {live && <span className="comments__sim"> · simuliert (lokal)</span>}
      </h3>

      {replyTo === null && (
        <form className="comment-form" onSubmit={(e) => submit(e, null)}>
          <input
            className="comment-form__name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dein Name"
            aria-label="Dein Name"
          />
          <textarea
            className="comment-form__text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('comments.placeholder')}
            aria-label={t('comments.placeholder')}
            rows={3}
          />
          <button type="submit" className="btn">
            {t('comments.submit')}
          </button>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="comments__empty">{t('comments.empty')}</p>
      ) : (
        <ul className="comment-list">{tree.roots.map((c) => renderComment(c))}</ul>
      )}
    </section>
  )
}
