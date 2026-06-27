import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../i18n/I18nContext'

export function ThemeToggle() {
  const { resolved, toggle } = useTheme()
  const { t } = useI18n()
  const isDark = resolved === 'dark'

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggle}
      aria-label={t('theme.toggle')}
      title={t('theme.toggle')}
    >
      {isDark ? (
        // Sonne
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // Mond
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
