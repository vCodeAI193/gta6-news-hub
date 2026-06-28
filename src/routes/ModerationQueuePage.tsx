import { useState } from 'react';
import {
  getModerationQueue, addToQueue, resolveEntry, getTransparencyLog,
  getShadowBanned, shadowBan, unban, getSourceBlacklist, addToBlacklist,
  getSourceWhitelist, addToWhitelist,
} from '../services/moderationService';

export function ModerationQueuePage() {
  const [queue, setQueue] = useState(() => getModerationQueue().filter(e => e.status === 'pending'));
  const [log, setLog] = useState(() => getTransparencyLog());
  const [banned, setBanned] = useState(() => getShadowBanned());
  const [blacklist, setBlacklist] = useState(() => getSourceBlacklist());
  const [whitelist, setWhitelist] = useState(() => getSourceWhitelist());
  const [newSource, setNewSource] = useState('');
  const [banUserId, setBanUserId] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'log' | 'bans' | 'sources'>('queue');

  const handleResolve = (id: string, status: 'approved' | 'removed') => {
    resolveEntry(id, status);
    setQueue(getModerationQueue().filter(e => e.status === 'pending'));
    setLog(getTransparencyLog());
  };

  const handleBan = () => {
    if (banUserId.trim()) {
      shadowBan(banUserId.trim());
      setBanned(getShadowBanned());
      setBanUserId('');
    }
  };

  const handleUnban = (userId: string) => {
    unban(userId);
    setBanned(getShadowBanned());
  };

  const handleAddBlacklist = () => {
    if (newSource.trim()) {
      addToBlacklist(newSource.trim());
      setBlacklist(getSourceBlacklist());
      setNewSource('');
    }
  };

  const handleAddWhitelist = () => {
    if (newSource.trim()) {
      addToWhitelist(newSource.trim());
      setWhitelist(getSourceWhitelist());
      setNewSource('');
    }
  };

  return (
    <div className="moderation-page" style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Moderation-Queue &amp; Trust-System</h1>
      <div className="tab-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['queue', 'log', 'bans', 'sources'] as const).map(t => (
          <button key={t} className={`tab ${activeTab === t ? 'tab--active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'queue' ? `Warteschlange (${queue.length})` : t === 'log' ? 'Transparenz-Log' : t === 'bans' ? 'Shadow-Bans' : 'Quellen'}
          </button>
        ))}
      </div>

      {activeTab === 'queue' && (
        <div>
          <h2>Moderations-Queue</h2>
          {queue.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Keine ausstehenden Einträge.</p>
          ) : (
            queue.map(entry => (
              <div key={entry.id} className="moderation-card" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="chip">{entry.type}</span>
                    <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>{entry.reason}</span>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                      ID: {entry.contentId} &middot; {new Date(entry.createdAt).toLocaleString('de-DE')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" onClick={() => handleResolve(entry.id, 'approved')}>Genehmigen</button>
                    <button className="btn btn--ghost" onClick={() => handleResolve(entry.id, 'removed')}>Entfernen</button>
                  </div>
                </div>
              </div>
            ))
          )}
          <button className="btn btn--ghost" style={{ marginTop: '1rem' }} onClick={() => {
            addToQueue({ type: 'comment', contentId: 'test-1', reason: 'Spam', status: 'pending' });
            setQueue(getModerationQueue().filter(e => e.status === 'pending'));
          }}>
            + Test-Eintrag hinzufügen
          </button>
        </div>
      )}

      {activeTab === 'log' && (
        <div>
          <h2>Transparenz-Log</h2>
          {log.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Keine abgeschlossenen Moderationsaktionen.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface)' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Typ</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Grund</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Datum</th>
                </tr>
              </thead>
              <tbody>
                {log.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--bg)' }}>
                    <td style={{ padding: '0.5rem' }}><span className="chip">{entry.type}</span></td>
                    <td style={{ padding: '0.5rem' }}>{entry.reason}</td>
                    <td style={{ padding: '0.5rem' }}><span className={`chip${entry.status === 'approved' ? ' chip--active' : ''}`}>{entry.status}</span></td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{new Date(entry.createdAt).toLocaleDateString('de-DE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'bans' && (
        <div>
          <h2>Shadow-Ban-Verwaltung</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              className="input"
              style={{ flex: 1, padding: '0.5rem', background: 'var(--surface)', border: '1px solid var(--text-muted)', borderRadius: 4, color: 'inherit' }}
              value={banUserId}
              onChange={e => setBanUserId(e.target.value)}
              placeholder="User-ID eingeben..."
            />
            <button className="btn" onClick={handleBan}>Shadow-Ban</button>
          </div>
          {banned.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Keine gesperrten Nutzer.</p>
          ) : (
            banned.map(userId => (
              <div key={userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--surface)', borderRadius: 4, marginBottom: '0.5rem' }}>
                <span>{userId}</span>
                <button className="btn btn--ghost" onClick={() => handleUnban(userId)}>Entsperren</button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'sources' && (
        <div>
          <h2>Quellen-Verwaltung</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              className="input"
              style={{ flex: 1, padding: '0.5rem', background: 'var(--surface)', border: '1px solid var(--text-muted)', borderRadius: 4, color: 'inherit' }}
              value={newSource}
              onChange={e => setNewSource(e.target.value)}
              placeholder="Domain eingeben (z.B. rockstargames.com)"
            />
            <button className="btn" onClick={handleAddWhitelist}>Whitelist</button>
            <button className="btn btn--ghost" onClick={handleAddBlacklist}>Blacklist</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <h3>Whitelist</h3>
              {whitelist.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Leer</p> : whitelist.map(s => <div key={s} className="chip chip--active" style={{ margin: '0.25rem 0', display: 'block' }}>{s}</div>)}
            </div>
            <div>
              <h3>Blacklist</h3>
              {blacklist.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Leer</p> : blacklist.map(s => <div key={s} className="chip" style={{ margin: '0.25rem 0', display: 'block' }}>{s}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
