import { useEffect, useState } from 'react'
import { getTimeLeft, RELEASE_DATE, type TimeLeft } from '../lib/countdown'

const UNITS: Array<{ key: keyof TimeLeft; label: string }> = [
  { key: 'days', label: 'Tage' },
  { key: 'hours', label: 'Std' },
  { key: 'minutes', label: 'Min' },
  { key: 'seconds', label: 'Sek' },
]

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    getTimeLeft(RELEASE_DATE, new Date()),
  )

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(getTimeLeft(RELEASE_DATE, new Date()))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="countdown"
      role="timer"
      aria-label="Countdown bis zum Release von GTA 6"
    >
      {UNITS.map((unit) => (
        <div className="countdown__unit" key={unit.key}>
          <span className="countdown__num">
            {String(timeLeft[unit.key]).padStart(2, '0')}
          </span>
          <span className="countdown__label">{unit.label}</span>
        </div>
      ))}
    </div>
  )
}
