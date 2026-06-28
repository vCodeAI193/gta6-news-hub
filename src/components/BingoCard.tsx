import { useState } from 'react'
import { addXp, unlockAchievement } from '../services/gamificationService'

const BINGO_ITEMS = [
  'Lucia zu sehen',
  'Jason zu sehen',
  'Miami Beach',
  'Polizei-Verfolgung',
  'Helikopter',
  'Nachtclub',
  'Schnellboot',
  'Explosionen',
  'Easter Egg',
  'Neues Fahrzeug',
  'Tier-Easter-Egg',
  'Sonnenuntergang',
  'Hinterhalt',
  'Geldtransport',
  'Freie Szene',
  'Cameo-Charakter',
]

const SIZE = 4

function bingoCheck(marked: boolean[][]): boolean {
  // Rows
  for (let r = 0; r < SIZE; r++) {
    if (marked[r].every(Boolean)) return true
  }
  // Cols
  for (let c = 0; c < SIZE; c++) {
    if (marked.every((row) => row[c])) return true
  }
  // Diag
  if (marked.every((row, i) => row[i])) return true
  if (marked.every((row, i) => row[SIZE - 1 - i])) return true
  return false
}

export function BingoCard() {
  const [marked, setMarked] = useState<boolean[][]>(() =>
    Array.from({ length: SIZE }, () => Array(SIZE).fill(false)),
  )
  const [bingo, setBingo] = useState(false)
  const [celebrated, setCelebrated] = useState(false)

  const toggle = (r: number, c: number) => {
    const next = marked.map((row, ri) => row.map((v, ci) => (ri === r && ci === c ? !v : v)))
    setMarked(next)
    if (!bingo && bingoCheck(next)) {
      setBingo(true)
      if (!celebrated) {
        setCelebrated(true)
        addXp(30, 'Bingo!')
        unlockAchievement('ach-bingo')
      }
    }
  }

  const reset = () => {
    setMarked(Array.from({ length: SIZE }, () => Array(SIZE).fill(false)))
    setBingo(false)
  }

  return (
    <div className="bingo">
      <h3 className="bingo__title">Trailer-Bingo</h3>
      <p className="bingo__desc">Markiere, was du im nächsten Trailer siehst!</p>

      {bingo && (
        <div className="bingo__win">🎉 BINGO! +30 XP</div>
      )}

      <div className="bingo__grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
        {Array.from({ length: SIZE }, (_, r) =>
          Array.from({ length: SIZE }, (_, c) => {
            const item = BINGO_ITEMS[r * SIZE + c]
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                className={`bingo__cell${marked[r][c] ? ' bingo__cell--marked' : ''}`}
                onClick={() => toggle(r, c)}
              >
                {item}
              </button>
            )
          }),
        )}
      </div>

      <button type="button" className="btn btn--ghost" onClick={reset} style={{ marginTop: '0.8rem' }}>
        Zurücksetzen
      </button>
    </div>
  )
}
