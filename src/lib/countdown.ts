/** GTA 6 worldwide release. */
export const RELEASE_DATE = new Date('2026-11-19T00:00:00Z')

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Pure helper so the countdown maths can be unit-tested without timers. */
export function getTimeLeft(target: Date, now: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - now.getTime())
  const seconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  }
}
