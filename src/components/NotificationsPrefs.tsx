import { useState } from 'react'
import { getNotifPrefs, updateNotifPrefs, type NotifPrefs } from '../services/notificationsService'
import { useToast } from '../context/ToastContext'

export function NotificationsPrefs() {
  const { notify } = useToast()
  const [prefs, setPrefs] = useState<NotifPrefs>(getNotifPrefs)

  function toggle(key: keyof NotifPrefs) {
    const updated = updateNotifPrefs({ [key]: !prefs[key as keyof NotifPrefs] })
    setPrefs(updated)
    notify('Gespeichert', 'success')
  }

  function updateHour(key: 'quietHoursStart' | 'quietHoursEnd', val: number) {
    const updated = updateNotifPrefs({ [key]: val })
    setPrefs(updated)
  }

  const boolKeys: Array<{ key: keyof NotifPrefs; label: string }> = [
    { key: 'breakingNews', label: 'Eilmeldungen' },
    { key: 'comments', label: 'Kommentar-Antworten' },
    { key: 'reactions', label: 'Reaktionen' },
    { key: 'mentions', label: '@Erwähnungen' },
    { key: 'weeklyDigest', label: 'Wöchentlicher Digest' },
    { key: 'countdownMilestones', label: 'Release-Meilensteine' },
  ]

  return (
    <div className="notif-prefs">
      <h3 className="facet__title">Benachrichtigungen</h3>
      <div className="notif-prefs__list">
        {boolKeys.map(({ key, label }) => (
          <label key={key} className="notif-prefs__row">
            <input
              type="checkbox"
              checked={!!prefs[key]}
              onChange={() => toggle(key)}
            />
            {label}
          </label>
        ))}
      </div>
      <div className="notif-prefs__quiet">
        <h4>Nicht stören</h4>
        <label>
          Von{' '}
          <input
            type="number"
            min={0} max={23}
            value={prefs.quietHoursStart}
            onChange={e => updateHour('quietHoursStart', Number(e.target.value))}
            className="notif-prefs__hour"
          />
          {' '}Uhr bis{' '}
          <input
            type="number"
            min={0} max={23}
            value={prefs.quietHoursEnd}
            onChange={e => updateHour('quietHoursEnd', Number(e.target.value))}
            className="notif-prefs__hour"
          />
          {' '}Uhr
        </label>
      </div>
    </div>
  )
}
