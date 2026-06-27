import { Seo } from '../components/Seo'
import { FontSizeControl } from '../components/FontSizeControl'
import { categories } from '../data/categories'
import { useTheme, type ThemeMode } from '../context/ThemeContext'
import { usePreferences } from '../context/PreferencesContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'
import { type Locale } from '../i18n/translations'
import { getSubscriptions, toggleSubscription } from '../services/userDataService'
import { useState } from 'react'
import type { CategoryId } from '../types'

export function SettingsPage() {
  const { mode, setMode } = useTheme()
  const { locale, setLocale } = useI18n()
  const { prefs, update } = usePreferences()
  const { notify } = useToast()
  const [subs, setSubs] = useState<CategoryId[]>(() => getSubscriptions())

  const themeModes: ThemeMode[] = ['dark', 'light', 'system']

  const onToggleSub = (cat: CategoryId) => {
    toggleSubscription(cat)
    setSubs(getSubscriptions())
  }

  const requestPush = async () => {
    if (!('Notification' in window)) {
      notify('Benachrichtigungen werden nicht unterstützt', 'error')
      return
    }
    const result = await Notification.requestPermission()
    if (result === 'granted') {
      new Notification('GTA 6 News Hub', { body: 'Benachrichtigungen aktiviert! 🎉' })
      notify('Benachrichtigungen aktiviert', 'success')
    } else {
      notify('Benachrichtigungen abgelehnt', 'info')
    }
  }

  const clearData = () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('gta6hub:'))
      .forEach((k) => localStorage.removeItem(k))
    notify('Lokale Daten gelöscht. Seite wird neu geladen…', 'success')
    setTimeout(() => window.location.reload(), 800)
  }

  return (
    <>
      <Seo title="Einstellungen" path="/settings" />
      <header className="page-head">
        <h1 className="page-head__title">Einstellungen</h1>
      </header>

      <div className="settings">
        <section className="settings__group">
          <h2>Darstellung</h2>
          <label className="settings__row">
            <span>Theme</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as ThemeMode)}>
              {themeModes.map((m) => (
                <option key={m} value={m}>
                  {m === 'dark' ? 'Dunkel' : m === 'light' ? 'Hell' : 'System'}
                </option>
              ))}
            </select>
          </label>
          <div className="settings__row">
            <span>Schriftgröße</span>
            <FontSizeControl />
          </div>
          <label className="settings__row">
            <span>Sprache</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="settings__row settings__row--switch">
            <span>Bewegung reduzieren</span>
            <input
              type="checkbox"
              checked={prefs.reduceMotion}
              onChange={(e) => update({ reduceMotion: e.target.checked })}
            />
          </label>
        </section>

        <section className="settings__group">
          <h2>Profil</h2>
          <label className="settings__row">
            <span>Anzeigename (für Kommentare)</span>
            <input
              type="text"
              value={prefs.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              placeholder="z. B. ViceCityFan"
            />
          </label>
        </section>

        <section className="settings__group">
          <h2>Themen-Abos & Benachrichtigungen</h2>
          <div className="filters">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip"
                aria-pressed={subs.includes(c.id)}
                onClick={() => onToggleSub(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--ghost" onClick={requestPush}>
            🔔 Browser-Benachrichtigungen aktivieren
          </button>
          <p className="settings__hint">
            Hinweis: Echte Push-Nachrichten erfordern einen Server. Hier werden lokale
            Browser-Benachrichtigungen genutzt.
          </p>
        </section>

        <section className="settings__group">
          <h2>Datenschutz</h2>
          <label className="settings__row settings__row--switch">
            <span>Statistik (anonym) erlauben</span>
            <input
              type="checkbox"
              checked={prefs.consent === true}
              onChange={(e) => update({ consent: e.target.checked })}
            />
          </label>
          <button type="button" className="btn btn--ghost btn--danger" onClick={clearData}>
            Alle lokalen Daten löschen
          </button>
        </section>
      </div>
    </>
  )
}
