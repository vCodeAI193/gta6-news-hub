/**
 * Gamification-Logik: Reputation vergeben, Level und Abzeichen ableiten.
 * Bewusst rein/funktional, damit sie leicht testbar ist.
 */

export const POINTS = {
  comment: 2, // Kommentar verfasst
  upvoteReceived: 1, // erhaltener Upvote
  submissionApproved: 10, // eingereichte News freigegeben
}

const LEVELS = [
  { level: 1, min: 0, name: 'Rookie' },
  { level: 2, min: 50, name: 'Insider' },
  { level: 3, min: 150, name: 'Reporter' },
  { level: 4, min: 400, name: 'Veteran' },
  { level: 5, min: 1000, name: 'Legende' },
]

export function levelFor(reputation) {
  let current = LEVELS[0]
  for (const l of LEVELS) if (reputation >= l.min) current = l
  const next = LEVELS.find((l) => l.min > reputation) ?? null
  return {
    level: current.level,
    name: current.name,
    next: next ? { name: next.name, at: next.min, remaining: next.min - reputation } : null,
  }
}

/** Leitet Abzeichen aus den Aktivitätszahlen ab. */
export function badgesFor({ reputation = 0, commentCount = 0, submissionsApproved = 0 } = {}) {
  const badges = []
  const add = (id, emoji, label) => badges.push({ id, emoji, label })

  if (commentCount >= 1) add('first-comment', '💬', 'Erster Kommentar')
  if (commentCount >= 10) add('chatty', '🗣️', 'Vielschreiber (10+ Kommentare)')
  if (commentCount >= 50) add('community-voice', '📣', 'Community-Stimme (50+)')
  if (submissionsApproved >= 1) add('contributor', '✍️', 'Mitwirkender (News eingereicht)')
  if (submissionsApproved >= 5) add('insider-source', '🕵️', 'Insider-Quelle (5+ News)')
  if (reputation >= 50) add('rising', '⭐', 'Aufsteiger (50+ Reputation)')
  if (reputation >= 150) add('respected', '🌟', 'Angesehen (150+ Reputation)')
  if (reputation >= 1000) add('legend', '👑', 'Legende (1000+ Reputation)')

  return badges
}

/** Reputation eines Nutzers verändern (kann negativ sein). */
export function awardReputation(db, userId, points) {
  if (!userId || !points) return
  db.prepare('UPDATE users SET reputation = MAX(0, reputation + ?) WHERE id = ?').run(points, userId)
}
