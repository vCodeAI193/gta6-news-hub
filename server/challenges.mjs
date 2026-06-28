/**
 * Wöchentliche Community-Challenge. Fortschritt wird aus den Aktivitäten der
 * laufenden ISO-Woche berechnet; bei Erreichen gibt es Reputation (einmalig).
 */
export const weeklyChallenge = {
  id: 'week-comments',
  title: 'Woche der Diskussion',
  description: 'Schreibe diese Woche 3 Kommentare.',
  goal: 3,
  reward: 5,
}

/** Beginn der aktuellen ISO-Woche (Montag 00:00 UTC) als ISO-String. */
export function startOfWeek(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = (d.getUTCDay() + 6) % 7 // Montag = 0
  d.setUTCDate(d.getUTCDate() - day)
  return d.toISOString()
}
