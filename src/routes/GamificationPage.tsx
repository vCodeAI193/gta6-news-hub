import { useState } from 'react'
import { Seo } from '../components/Seo'
import { DailyQuests } from '../components/DailyQuests'
import { QuizGame } from '../components/QuizGame'
import { BingoCard } from '../components/BingoCard'
import { Leaderboard } from '../components/Leaderboard'
import { XpBar } from '../components/XpBar'
import {
  getUserStats,
  getSeasonTiers,
  getSeasonProgress,
  ACHIEVEMENTS,
  COLLECTIBLES,
  getUserCollectibles,
  openLootbox,
  type Collectible,
} from '../services/gamificationService'

function BattlePassSection() {
  const tiers = getSeasonTiers()
  const progress = getSeasonProgress()

  return (
    <div className="battlepass">
      <h3 className="battlepass__title">🎖️ Season 1 Battle Pass</h3>
      <p className="battlepass__progress">
        Tier {progress.level} · {progress.xp}/{progress.nextLevelXp} XP
      </p>
      <div className="battlepass__track">
        <div
          className="battlepass__fill"
          style={{ width: `${Math.round((progress.xp / progress.nextLevelXp) * 100)}%` }}
        />
      </div>
      <ol className="battlepass__tiers">
        {tiers.map((tier) => (
          <li
            key={tier.level}
            className={`battlepass__tier${tier.unlocked ? ' battlepass__tier--unlocked' : ''}`}
          >
            <span className="battlepass__tier-num">{tier.level}</span>
            <span className="battlepass__reward">{tier.reward}</span>
            {tier.unlocked && <span className="battlepass__check">✓</span>}
          </li>
        ))}
      </ol>
    </div>
  )
}

function CollectiblesSection() {
  const ownedIds = getUserCollectibles()
  const [lastWon, setLastWon] = useState<Collectible | null>(null)
  const [opening, setOpening] = useState(false)

  const open = () => {
    setOpening(true)
    setTimeout(() => {
      const won = openLootbox()
      setLastWon(won)
      setOpening(false)
    }, 600)
  }

  return (
    <div className="collectibles">
      <h3 className="collectibles__title">🃏 Sammelkarten</h3>
      {lastWon && (
        <div className={`collectibles__won collectibles__won--${lastWon.rarity}`}>
          Du hast erhalten: {lastWon.icon} <strong>{lastWon.name}</strong>
          <span className="chip chip--active">{lastWon.rarity}</span>
        </div>
      )}
      <button
        type="button"
        className="btn"
        onClick={open}
        disabled={opening}
        style={{ marginBottom: '1rem' }}
      >
        {opening ? '⏳ Öffne…' : '🎁 Lootbox öffnen'}
      </button>
      <div className="collectibles__grid">
        {COLLECTIBLES.map((c) => {
          const owned = ownedIds.includes(c.id)
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
    </div>
  )
}

type Tab = 'quests' | 'battlepass' | 'quiz' | 'bingo' | 'leaderboard' | 'collectibles'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'quests', label: '📋 Quests' },
  { id: 'battlepass', label: '🎖️ Battle Pass' },
  { id: 'quiz', label: '🧠 Quiz' },
  { id: 'bingo', label: '🎯 Bingo' },
  { id: 'leaderboard', label: '🏆 Rangliste' },
  { id: 'collectibles', label: '🃏 Karten' },
]

export function GamificationPage() {
  const stats = getUserStats()
  const [activeTab, setActiveTab] = useState<Tab>('quests')

  return (
    <>
      <Seo title="Spielen & Verdienen" path="/spielen" />

      <header className="page-head">
        <h1 className="page-head__title">🎮 Spielen & Verdienen</h1>
        <p className="page-head__desc">Quests, Quiz, Battle Pass und mehr — sammle XP und steige auf!</p>
      </header>

      <div className="gamification__stats">
        <XpBar xp={stats.xp} />
        <div className="gamification__quick">
          <span>🔥 {stats.streak} Tage Streak</span>
          <span>🏅 {stats.achievements.length}/{ACHIEVEMENTS.length} Achievements</span>
          <span>✅ {stats.questsCompleted} Quests erledigt</span>
        </div>
      </div>

      <div className="gamification__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab${activeTab === t.id ? ' tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="gamification__content">
        {activeTab === 'quests' && <DailyQuests />}
        {activeTab === 'battlepass' && <BattlePassSection />}
        {activeTab === 'quiz' && <QuizGame />}
        {activeTab === 'bingo' && <BingoCard />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'collectibles' && <CollectiblesSection />}
      </div>
    </>
  )
}
