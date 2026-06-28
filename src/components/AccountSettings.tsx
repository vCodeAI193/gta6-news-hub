import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isApiEnabled, ApiError } from '../services/api'
import { accountApi } from '../services/accountApi'
import { getFavorites, getReadLater } from '../services/userDataService'
import { readJSON, writeJSON } from '../services/storage'

/** Konto-Verwaltung (nur mit Backend & Login sichtbar). */
export function AccountSettings() {
  const { user, logout, loading } = useAuth()
  const { notify } = useToast()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')

  if (loading || !isApiEnabled() || !user) return null

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      notify(ok, 'success')
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Aktion fehlgeschlagen', 'error')
    }
  }

  const saveProfile = () => run(() => accountApi.updateProfile({ displayName, email }), 'Profil gespeichert')
  const changePassword = () =>
    run(async () => {
      await accountApi.changePassword(currentPw, newPw)
      setCurrentPw('')
      setNewPw('')
    }, 'Passwort geändert')

  const pushSync = () =>
    run(async () => {
      await accountApi.putSync({
        bookmarks: [...getFavorites()],
        readLater: [...getReadLater()],
        preferences: readJSON('preferences', {}),
      })
    }, 'Daten ins Konto synchronisiert')

  const pullSync = () =>
    run(async () => {
      const { data } = await accountApi.getSync()
      if (Array.isArray(data.bookmarks)) writeJSON('userdata:favorites', data.bookmarks)
      if (Array.isArray(data.readLater)) writeJSON('userdata:readlater', data.readLater)
      if (data.preferences) writeJSON('preferences', data.preferences)
      notify('Daten vom Konto geladen — Seite wird neu geladen…', 'success')
      setTimeout(() => window.location.reload(), 800)
    }, 'Geladen')

  const deleteAccount = () => {
    if (!window.confirm('Konto und alle zugehörigen Daten unwiderruflich löschen?')) return
    run(async () => {
      await accountApi.deleteAccount()
      await logout()
      window.location.href = '/'
    }, 'Konto gelöscht')
  }

  return (
    <section className="settings__group">
      <h2>Konto & Daten</h2>

      <label className="settings__row">
        <span>Anzeigename</span>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </label>
      <label className="settings__row">
        <span>E-Mail</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button type="button" className="btn btn--small" onClick={saveProfile}>
        Profil speichern
      </button>

      <h3 className="settings__subhead">Passwort ändern</h3>
      <label className="settings__row">
        <span>Aktuelles Passwort</span>
        <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
      </label>
      <label className="settings__row">
        <span>Neues Passwort</span>
        <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" minLength={8} />
      </label>
      <button type="button" className="btn btn--small" onClick={changePassword} disabled={!currentPw || newPw.length < 8}>
        Passwort ändern
      </button>

      <h3 className="settings__subhead">Geräteübergreifende Sync</h3>
      <p className="settings__hint">Lesezeichen & Einstellungen mit deinem Konto abgleichen.</p>
      <div className="settings__btnrow">
        <button type="button" className="btn btn--small btn--ghost" onClick={pushSync}>↥ Hochladen</button>
        <button type="button" className="btn btn--small btn--ghost" onClick={pullSync}>↧ Laden</button>
      </div>

      <h3 className="settings__subhead">Datenschutz (DSGVO)</h3>
      <div className="settings__btnrow">
        <button type="button" className="btn btn--small btn--ghost" onClick={() => accountApi.exportData()}>
          ⤓ Meine Daten exportieren
        </button>
        <button type="button" className="btn btn--small btn--ghost btn--danger" onClick={deleteAccount}>
          Konto löschen
        </button>
      </div>
    </section>
  )
}
