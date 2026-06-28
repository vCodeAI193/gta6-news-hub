import { analyzeSeo } from '../lib/cms';

interface Props {
  title: string;
  body: string;
  tags: string[];
}

export function SeoAnalyzer({ title, body, tags }: Props) {
  const analysis = analyzeSeo(title, body, tags);
  const color = analysis.score >= 70 ? '#38a169' : analysis.score >= 40 ? '#dd6b20' : '#e53e3e';

  return (
    <div className="seo-analyzer" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 8 }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>SEO-Analyse</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1, height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${analysis.score}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
        </div>
        <span style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{analysis.score}</span>
      </div>
      {analysis.suggestions.length > 0 ? (
        <ul style={{ margin: 0, padding: '0 0 0 1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      ) : (
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#38a169' }}>Hervorragende SEO!</p>
      )}
    </div>
  );
}
