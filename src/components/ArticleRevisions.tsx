import { useState } from 'react';
import { readJSON, writeJSON } from '../services/storage';

export interface Revision {
  id: string;
  articleId: string;
  title: string;
  body: string;
  savedAt: number;
}

interface Props {
  articleId: string;
  onRestore?: (revision: Revision) => void;
}

export function saveRevision(articleId: string, title: string, body: string): void {
  const revisions = readJSON<Revision[]>('article_revisions', []);
  const newRevision: Revision = {
    id: crypto.randomUUID(),
    articleId,
    title,
    body,
    savedAt: Date.now(),
  };
  // Keep last 10 revisions per article
  const filtered = revisions.filter(r => r.articleId === articleId).slice(-9);
  const others = revisions.filter(r => r.articleId !== articleId);
  writeJSON('article_revisions', [...others, ...filtered, newRevision]);
}

export function getRevisions(articleId: string): Revision[] {
  return readJSON<Revision[]>('article_revisions', [])
    .filter(r => r.articleId === articleId)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export function ArticleRevisions({ articleId, onRestore }: Props) {
  const [revisions, setRevisions] = useState(() => getRevisions(articleId));

  if (revisions.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Keine Revisionen gespeichert.</p>;
  }

  return (
    <div className="article-revisions">
      {revisions.map(rev => (
        <div key={rev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--bg)' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{rev.title || 'Unbenannt'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date(rev.savedAt).toLocaleString('de-DE')}
            </div>
          </div>
          <button className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => {
            if (onRestore) onRestore(rev);
            setRevisions(getRevisions(articleId));
          }}>
            Wiederherstellen
          </button>
        </div>
      ))}
    </div>
  );
}
