import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

/** Login-Link bzw. Nutzer-Menü mit Logout — nur sichtbar, wenn ein Backend läuft. */
export function AuthMenu() {
  const { enabled, user, logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!enabled) return null

  if (!user) {
    return (
      <NavLink to="/login" className="btn btn--small">
        Anmelden
      </NavLink>
    )
  }

  const initials = user.displayName.slice(0, 2).toUpperCase()

  const doLogout = async () => {
    await logout()
    setOpen(false)
    notify('Abgemeldet', 'info')
    navigate('/')
  }

  return (
    <div className="authmenu">
      <button
        type="button"
        className="authmenu__avatar"
        aria-label="Konto-Menü"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {initials}
      </button>
      {open && (
        <div className="authmenu__panel" role="menu">
          <div className="authmenu__head">
            <strong>{user.displayName}</strong>
            <span className="authmenu__role">{user.role}</span>
          </div>
          <NavLink to="/settings" className="authmenu__item" role="menuitem" onClick={() => setOpen(false)}>
            Einstellungen
          </NavLink>
          <button type="button" className="authmenu__item authmenu__item--danger" role="menuitem" onClick={doLogout}>
            Abmelden
          </button>
        </div>
      )}
    </div>
  )
}
