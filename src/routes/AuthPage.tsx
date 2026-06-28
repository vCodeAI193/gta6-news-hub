import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ApiError } from '../services/api'

type Mode = 'login' | 'register'

export function AuthPage() {
  const { login, register, enabled } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState('')
  const [need2fa, setNeed2fa] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password, code || undefined)
      else await register(email, password, displayName)
      notify('Willkommen! 🎉', 'success')
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && /2fa/i.test(err.message)) {
        setNeed2fa(true)
        notify('Bitte 2FA-Code aus deiner Authenticator-App eingeben.', 'info')
      } else {
        notify(err instanceof ApiError ? err.message : 'Etwas ist schiefgelaufen', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <Seo title={mode === 'login' ? 'Anmelden' : 'Registrieren'} path="/login" />
      <div className="auth-card">
        <h1 className="auth-card__title">{mode === 'login' ? 'Anmelden' : 'Konto erstellen'}</h1>

        {!enabled && (
          <p className="auth-card__notice">
            Hinweis: Es ist kein Backend konfiguriert (`VITE_API_URL`). Anmeldung ist nur mit
            laufendem Server möglich — die App funktioniert ansonsten lokal weiter.
          </p>
        )}

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Anzeigename
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="nickname" />
            </label>
          )}
          <label>
            E-Mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>
            Passwort
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {mode === 'login' && need2fa && (
            <label>
              2FA-Code (Authenticator-App)
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                autoComplete="one-time-code"
              />
            </label>
          )}
          <button type="submit" className="btn" disabled={busy || !enabled}>
            {busy ? '…' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>

        <p className="auth-card__switch">
          {mode === 'login' ? (
            <>
              Noch kein Konto?{' '}
              <button type="button" className="linkbtn" onClick={() => setMode('register')}>
                Registrieren
              </button>
            </>
          ) : (
            <>
              Schon registriert?{' '}
              <button type="button" className="linkbtn" onClick={() => setMode('login')}>
                Anmelden
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
