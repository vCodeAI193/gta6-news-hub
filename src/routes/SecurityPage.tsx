import { useState } from 'react';
import { PasswordStrength } from '../components/PasswordStrength';
import { exportUserData, deleteUserData, getAuditLog } from '../services/moderationService';

export function SecurityPage() {
  const [password, setPassword] = useState('');
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [userId, setUserId] = useState('user-1');
  const [exported, setExported] = useState<object | null>(null);
  const [auditLog] = useState(() => getAuditLog().slice(-10).reverse());
  const [sessions] = useState([
    { id: 'sess-1', device: 'Chrome / Windows', location: 'Frankfurt, DE', lastActive: Date.now() - 60000 },
    { id: 'sess-2', device: 'Firefox / macOS', location: 'Berlin, DE', lastActive: Date.now() - 3600000 },
  ]);
  const [activeSessions, setActiveSessions] = useState(sessions);

  const handleExport = () => {
    const data = exportUserData(userId);
    setExported(data);
  };

  const handleDelete = () => {
    if (confirm(`Alle Daten für User ${userId} wirklich löschen?`)) {
      deleteUserData(userId);
      alert('Daten gelöscht.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1>Sicherheits-Einstellungen</h1>

      <section style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 8, marginBottom: '1.5rem' }}>
        <h2>Zwei-Faktor-Authentifizierung</h2>
        {totpEnabled ? (
          <div>
            <p style={{ color: '#38a169' }}>2FA ist aktiviert</p>
            <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 4, marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ width: 128, height: 128, background: 'var(--text-muted)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                QR-Code Platzhalter
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Scanne mit Google Authenticator oder Authy
              </p>
            </div>
            <button className="btn btn--ghost" onClick={() => setTotpEnabled(false)}>2FA deaktivieren</button>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-muted)' }}>2FA ist nicht aktiviert. Schütze dein Konto mit TOTP.</p>
            <button className="btn" onClick={() => setTotpEnabled(true)}>2FA aktivieren</button>
          </div>
        )}
      </section>

      <section style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 8, marginBottom: '1.5rem' }}>
        <h2>Passwort-Sicherheits-Check</h2>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Passwort testen..."
          style={{ width: '100%', padding: '0.5rem', background: 'var(--bg)', border: '1px solid var(--text-muted)', borderRadius: 4, color: 'inherit', marginBottom: '0.5rem' }}
        />
        <PasswordStrength password={password} />
      </section>

      <section style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 8, marginBottom: '1.5rem' }}>
        <h2>Aktive Sitzungen</h2>
        {activeSessions.map(session => (
          <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--bg)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{session.device}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {session.location} · Zuletzt aktiv: {new Date(session.lastActive).toLocaleString('de-DE')}
              </div>
            </div>
            <button className="btn btn--ghost" onClick={() => setActiveSessions(s => s.filter(ss => ss.id !== session.id))}>
              Beenden
            </button>
          </div>
        ))}
        {activeSessions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Keine aktiven Sitzungen.</p>}
      </section>

      <section style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 8, marginBottom: '1.5rem' }}>
        <h2>DSGVO-Tools</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
          <input
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="User-ID"
            style={{ padding: '0.5rem', background: 'var(--bg)', border: '1px solid var(--text-muted)', borderRadius: 4, color: 'inherit' }}
          />
          <button className="btn" onClick={handleExport}>Daten exportieren</button>
          <button className="btn btn--ghost" onClick={handleDelete}>Daten löschen</button>
        </div>
        {exported && (
          <pre style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 4, overflow: 'auto', fontSize: '0.8rem' }}>
            {JSON.stringify(exported, null, 2)}
          </pre>
        )}
      </section>

      <section style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 8, marginBottom: '1.5rem' }}>
        <h2>Audit-Log (letzte 10 Einträge)</h2>
        {auditLog.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Keine Audit-Einträge.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Aktion</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>User</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Details</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Zeit</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--bg)' }}>
                  <td style={{ padding: '0.5rem' }}><code>{entry.action}</code></td>
                  <td style={{ padding: '0.5rem' }}>{entry.userId}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{entry.details}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{new Date(entry.timestamp).toLocaleString('de-DE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
