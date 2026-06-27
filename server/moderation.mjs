/**
 * Spam-/Blocklist-Heuristik für Kommentare.
 *
 * Liefert einen Status:
 *  - 'rejected' : enthält gesperrte Begriffe → wird abgewiesen
 *  - 'pending'  : verdächtig (zu viele Links/Wiederholungen) → Moderations-Queue
 *  - 'visible'  : unauffällig → sofort sichtbar
 */
const DEFAULT_BLOCKLIST = ['viagra', 'casino', 'crypto-pump', 'free-money', 'nutten']

function blocklist() {
  const extra = (process.env.COMMENT_BLOCKLIST || '')
    .split(',')
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
  return [...DEFAULT_BLOCKLIST, ...extra]
}

export function classifyComment(text) {
  const lower = text.toLowerCase()

  if (blocklist().some((word) => lower.includes(word))) {
    return { status: 'rejected', reason: 'Gesperrter Begriff' }
  }

  const linkCount = (text.match(/https?:\/\//g) || []).length
  const shouty = /(.)\1{6,}/.test(text) // 7+ gleiche Zeichen in Folge
  const allCaps = text.length > 20 && text === text.toUpperCase()

  if (linkCount >= 3 || shouty || allCaps) {
    return { status: 'pending', reason: 'Zur Prüfung markiert' }
  }

  return { status: 'visible', reason: null }
}
