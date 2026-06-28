import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isApiEnabled, ApiError } from '../services/api'
import { accountApi } from '../services/accountApi'
import { getFavorites, getReadLater } from '../services/userDataService'
import { readJSON, writeJSON } from '../services/storage'

/** Konto-Verwaltung (nur mit Backend & Login sichtbar). */
export function AccountSettings() {
  const { user, logout, loading, refresh } = useAuth()
  const { notify } = useToast()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [setup, setSetup] = useState<{ secret: string; otpauth: string } | null>(null)
  const [code, setCode] = useState('')

  if (loading || !isApiEnabled() || !user) return null

  const startSetup = () => run(async () => setSetup(await accountApi.twofaSetup()), '2FA-Setup gestartet')
  const enable2fa = () =>
    run(async () => {
      await accountApi.twofaEnable(code)
      setSetup(null)
      setCode('')
      await refresh()
    }, '2FA aktiviert ✅')
  const disable2fa = () =>
    run(async () => {
      await accountApi.twofaDisable(code)
      setCode('')
      await refresh()
    }, '2FA deaktiviert')

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

      <h3 className="settings__subhead">Zwei-Faktor-Authentifizierung (2FA)</h3>
      {user.twoFactorEnabled ? (
        <div className="twofa">
          <p className="settings__hint">✅ 2FA ist aktiv.</p>
          <div className="settings__btnrow">
            <input type="text" inputMode="numeric" placeholder="Code zum Deaktivieren" value={code} onChange={(e) => setCode(e.target.value)} />
            <button type="button" className="btn btn--small btn--ghost btn--danger" onClick={disable2fa}>Deaktivieren</button>
          </div>
        </div>
      ) : setup ? (
        <div className="twofa">
          <p className="settings__hint">
            Füge dieses Geheimnis in deiner Authenticator-App hinzu und gib den 6-stelligen Code ein:
          </p>
          <code className="twofa__secret">{setup.secret}</code>
          <details>
            <summary>otpauth-URI</summary>
            <code className="twofa__uri">{setup.otpauth}</code>
          </details>
          <div className="settings__btnrow">
            <input type="text" inputMode="numeric" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
            <button type="button" className="btn btn--small" onClick={enable2fa} disabled={code.length !== 6}>Aktivieren</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn--small btn--ghost" onClick={startSetup}>2FA einrichten</button>
      )}

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
