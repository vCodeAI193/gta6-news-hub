import { useTheme } from '../context/ThemeContext'

/** A− / A+ Regler für die Schriftgröße (Leseansicht). */
export function FontSizeControl() {
  const { fontScale, setFontScale } = useTheme()

  return (
    <div className="fontsize" role="group" aria-label="Schriftgröße anpassen">
      <button
        type="button"
        className="icon-btn"
        onClick={() => setFontScale(fontScale - 0.1)}
        aria-label="Schrift verkleinern"
      >
        A−
      </button>
      <span className="fontsize__value" aria-live="polite">
        {Math.round(fontScale * 100)}%
      </span>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setFontScale(fontScale + 0.1)}
        aria-label="Schrift vergrößern"
      >
        A+
      </button>
    </div>
  )
}
