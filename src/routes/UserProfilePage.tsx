import { useState } from 'react'
import { Seo } from '../components/Seo'
import { XpBar } from '../components/XpBar'
import { AchievementCard } from '../components/AchievementCard'
import {
  getUserStats,
  ACHIEVEMENTS,
  COLLECTIBLES,
  getUserCollectibles,
} from '../services/gamificationService'
import { readJSON, writeJSON } from '../services/storage'

interface UserProfile {
  displayName: string
  bio: string
  favoriteGta: string
  platform: string
  verified: boolean
  bannerColor: string
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'GTA6-Fan',
  bio: 'Leidenschaftlicher Fan der GTA-Serie seit Vice City.',
  favoriteGta: 'GTA: Vice City',
  platform: 'PS5',
  verified: false,
  bannerColor: '#1a1a2e',
}

const GTA_TITLES = [
  'GTA III', 'GTA: Vice City', 'GTA: San Andreas', 'GTA IV', 'GTA V', 'GTA VI',
]
const PLATFORMS = ['PC', 'PS5', 'Xbox Series X', 'PS4', 'Xbox One', 'Mobile']
const BANNER_COLORS = ['#1a1a2e', '#16213e', '#0f3460', '#1b4332', '#3d0c02', '#2d1b69']

export function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(() =>
    readJSON<UserProfile>('user:profile', DEFAULT_PROFILE),
  )
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const stats = getUserStats()
  const ownedCollectibles = getUserCollectibles()

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    writeJSON('user:profile', draft)
    setProfile(draft)
    setEditing(false)
  }

  const initials = profile.displayName.slice(0, 2).toUpperCase()

  return (
    <>
      <Seo title="Mein Profil" path="/profil" />

      {/* Banner */}
      <div className="user-profile__banner" style={{ background: profile.bannerColor }}>
        <div className="user-profile__avatar">{initials}</div>
      </div>

      <div className="user-profile__body">
        <div className="user-profile__head">
          <div>
            <h1 className="user-profile__name">
              {profile.displayName}
              {profile.verified && <span className="verified-badge" title="Verifiziert">✓</span>}
            </h1>
            <p className="user-profile__meta">
              <span className="chip">🎮 {profile.favoriteGta}</span>
              <span className="chip">🖥️ {profile.platform}</span>
            </p>
            {profile.bio && <p className="user-profile__bio">{profile.bio}</p>}
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => { setDraft(profile); setEditing((v) => !v) }}
          >
            {editing ? '✕ Abbrechen' : '✏️ Bearbeiten'}
          </button>
        </div>

        {editing && (
          <form className="user-profile__form" onSubmit={save}>
            <label className="user-profile__label">
              Anzeigename
              <input
                className="user-profile__input"
                value={draft.displayName}
                onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
                required
              />
            </label>
            <label className="user-profile__label">
              Bio
              <textarea
                className="user-profile__input"
                value={draft.bio}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                rows={3}
              />
            </label>
            <label className="user-profile__label">
              Lieblings-GTA
              <select
                className="user-profile__input"
                value={draft.favoriteGta}
                onChange={(e) => setDraft((d) => ({ ...d, favoriteGta: e.target.value }))}
              >
                {GTA_TITLES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="user-profile__label">
              Plattform
              <select
                className="user-profile__input"
                value={draft.platform}
                onChange={(e) => setDraft((d) => ({ ...d, platform: e.target.value }))}
              >
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="user-profile__label">
              Banner-Farbe
              <div className="user-profile__colors">
                {BANNER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`user-profile__color-swatch${draft.bannerColor === c ? ' user-profile__color-swatch--active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setDraft((d) => ({ ...d, bannerColor: c }))}
                    aria-label={c}
                  />
                ))}
              </div>
            </label>
            <button type="submit" className="btn">Speichern</button>
          </form>
        )}

        {/* XP & Level */}
        <section className="user-profile__section">
          <h2 className="section-title">📊 Fortschritt</h2>
          <XpBar xp={stats.xp} />
          <div className="user-profile__quick-stats">
            <div><strong>{stats.streak}</strong><span>Streak-Tage</span></div>
            <div><strong>{stats.achievements.length}</strong><span>Achievements</span></div>
            <div><strong>{stats.questsCompleted}</strong><span>Quests</span></div>
            <div><strong>{ownedCollectibles.length}</strong><span>Karten</span></div>
          </div>
        </section>

        {/* Achievements */}
        <section className="user-profile__section">
          <h2 className="section-title">🏅 Achievements ({stats.achievements.length}/{ACHIEVEMENTS.length})</h2>
          <div className="achievements-grid">
            {ACHIEVEMENTS.map((a) => (
              <AchievementCard
                key={a.id}
                achievement={a}
                unlocked={stats.achievements.includes(a.id)}
              />
            ))}
          </div>
        </section>

        {/* Collectibles */}
        <section className="user-profile__section">
          <h2 className="section-title">🃏 Sammelkarten ({ownedCollectibles.length}/{COLLECTIBLES.length})</h2>
          <div className="collectibles__grid">
            {COLLECTIBLES.map((c) => {
              const owned = ownedCollectibles.includes(c.id)
              return (
                <div
                  key={c.id}
                  className={`collectible-card collectible-card--${c.rarity}${owned ? ' collectible-card--owned' : ''}`}
                >
                  <span className="collectible-card__icon">{owned ? c.icon : '❓'}</span>
                  <span className="collectible-card__name">{owned ? c.name : '???'}</span>
                  <span className="collectible-card__rarity">{c.rarity}</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
