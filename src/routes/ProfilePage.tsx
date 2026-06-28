import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { SkeletonGrid } from '../components/Skeleton'
import { isApiEnabled } from '../services/api'
import { communityApi, type Profile } from '../services/communityApi'
import { socialApi, type FollowStatus } from '../services/socialApi'
import { useAuth } from '../context/AuthContext'
import { formatDate, timeAgo } from '../lib/filterArticles'
import { NotFoundPage } from './NotFoundPage'

export function ProfilePage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const [follow, setFollow] = useState<FollowStatus | null>(null)

  useEffect(() => {
    if (!isApiEnabled()) {
      setProfile(null)
      return
    }
    let active = true
    setProfile(undefined)
    communityApi.profile(id).then(
      (p) => active && setProfile(p),
      () => active && setProfile(null),
    )
    socialApi.followStatus(id).then(
      (s) => active && setFollow(s),
      () => {},
    )
    return () => {
      active = false
    }
  }, [id])

  const toggleFollow = async () => {
    if (!follow) return
    const next = follow.isFollowing ? await socialApi.unfollow(id) : await socialApi.follow(id)
    setFollow({
      ...follow,
      isFollowing: next.following,
      followers: follow.followers + (next.following ? 1 : -1),
    })
  }

  if (profile === undefined) return <SkeletonGrid count={2} />
  if (profile === null) return <NotFoundPage />

  const progress = profile.next
    ? Math.min(100, Math.round((profile.reputation / profile.next.at) * 100))
    : 100

  return (
    <div className="profile">
      <Seo title={profile.displayName} path={`/u/${profile.id}`} />
      <header className="profile__head">
        <div className="profile__avatar">{profile.displayName.slice(0, 2).toUpperCase()}</div>
        <div>
          <h1 className="profile__name">{profile.displayName}</h1>
          <p className="profile__sub">
            <span className="level-pill">Lvl {profile.level} · {profile.name}</span>
            <span className="authmenu__role">{profile.role}</span>
            <span>Dabei seit {formatDate(profile.joinedAt.slice(0, 10))}</span>
          </p>
        </div>
        <div className="profile__rep">
          <span className="profile__rep-num">{profile.reputation}</span>
          <span className="profile__rep-label">Reputation</span>
        </div>
        {follow && user && user.id !== profile.id && (
          <button
            type="button"
            className={`btn${follow.isFollowing ? ' btn--ghost' : ''}`}
            onClick={toggleFollow}
          >
            {follow.isFollowing ? '✓ Folge ich' : '+ Folgen'}
          </button>
        )}
      </header>

      {follow && (
        <p className="profile__follows">
          <strong>{follow.followers}</strong> Follower · <strong>{follow.following}</strong> gefolgt
        </p>
      )}

      {profile.next && (
        <div className="profile__progress" aria-label="Fortschritt zum nächsten Level">
          <div className="profile__progress-bar" style={{ width: `${progress}%` }} />
          <span className="profile__progress-label">
            Noch {profile.next.remaining} bis „{profile.next.name}"
          </span>
        </div>
      )}

      <section>
        <h2 className="section-title">Abzeichen</h2>
        {profile.badges.length === 0 ? (
          <p className="comments__empty">Noch keine Abzeichen — werde aktiv!</p>
        ) : (
          <ul className="badges">
            {profile.badges.map((b) => (
              <li key={b.id} className="badge-card" title={b.label}>
                <span className="badge-card__emoji" aria-hidden="true">{b.emoji}</span>
                <span>{b.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="profile__stats">
        <div><strong>{profile.stats.commentCount}</strong> Kommentare</div>
        <div><strong>{profile.stats.submissionsApproved}</strong> veröffentlichte Einreichungen</div>
      </section>

      <section>
        <h2 className="section-title">Letzte Kommentare</h2>
        {profile.recentComments.length === 0 ? (
          <p className="comments__empty">Noch keine Kommentare.</p>
        ) : (
          <ul className="comment-list">
            {profile.recentComments.map((c) => (
              <li key={c.id} className="comment">
                <p className="comment__text">{c.text}</p>
                <Link className="related__date" to={`/news/${c.articleId}`}>
                  zum Artikel · {timeAgo(c.createdAt)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
