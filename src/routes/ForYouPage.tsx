import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { ForYouFeed } from '../components/ForYouFeed'
import { ReadingStreak } from '../components/ReadingStreak'
import { WeeklyDigest } from '../components/WeeklyDigest'
import { HiddenTopicsSettings } from '../components/HiddenTopicsSettings'
import { usePreferences } from '../context/PreferencesContext'
import { getHistory } from '../services/readingHistoryService'
import { getGoal, getProgress, getStreak } from '../services/readingGoalsService'

export function ForYouPage() {
  const { prefs } = usePreferences()
  const history = useMemo(() => getHistory(), [])

  const streak = getStreak(history)
  const dailyGoal = getGoal('daily')
  const dailyProgress = getProgress('daily', history)

  const hasInterests = prefs.interests.length > 0

  return (
    <div className="page-transition for-you-page">
      <Seo title="Für dich — GTA 6 News Hub" description="Dein personalisierter News-Feed" path="/fuer-dich" />

      <h1 className="for-you-page__title">Für dich</h1>

      {!hasInterests && (
        <div className="for-you-page__onboarding">
          <p>
            Du hast noch keine Interessen ausgewählt. Wähle deine Lieblingsthemen
            in den <Link to="/settings">Einstellungen</Link>, um einen
            personalisierten Feed zu erhalten.
          </p>
        </div>
      )}

      <div className="for-you-page__layout">
        <main className="for-you-page__main">
          <ForYouFeed />
        </main>

        <aside className="for-you-page__sidebar">
          <ReadingStreak streak={streak} dailyGoal={dailyGoal} dailyProgress={dailyProgress} />
          <WeeklyDigest />
          <HiddenTopicsSettings />
        </aside>
      </div>
    </div>
  )
}
