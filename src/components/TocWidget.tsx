import type { TocEntry } from '../lib/cms';

interface Props {
  entries: TocEntry[];
}

export function TocWidget({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <nav className="toc-widget" aria-label="Inhaltsverzeichnis" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 8, minWidth: 180 }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Inhaltsverzeichnis</h4>
      <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {entries.map((entry, i) => (
          <li key={i} style={{ paddingLeft: `${(entry.level - 1) * 0.75}rem`, marginBottom: '0.25rem' }}>
            <a href={`#${entry.anchor}`} style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none' }}>
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
