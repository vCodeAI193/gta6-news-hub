/** Geschätzte Lesezeit in Minuten (≈ 200 Wörter/Minute, min. 1). */
export function readingTimeMinutes(text: string, wpm = 200): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / wpm))
}

export function readingTimeLabel(text: string): string {
  return `${readingTimeMinutes(text)} Min. Lesezeit`
}
