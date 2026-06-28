export interface TocEntry {
  level: number;
  text: string;
  anchor: string;
}

export function generateToc(markdown: string): TocEntry[] {
  const lines = markdown.split('\n');
  const entries: TocEntry[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const anchor = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      entries.push({ level, text, anchor });
    }
  }
  return entries;
}

export interface SeoAnalysis {
  score: number;
  suggestions: string[];
}

export function analyzeSeo(title: string, body: string, tags: string[]): SeoAnalysis {
  const suggestions: string[] = [];
  let score = 100;

  if (!title || title.length < 10) {
    suggestions.push('Titel ist zu kurz (mindestens 10 Zeichen)');
    score -= 20;
  }
  if (title && title.length > 60) {
    suggestions.push('Titel ist zu lang für SEO (max. 60 Zeichen)');
    score -= 10;
  }
  if (!body || body.length < 300) {
    suggestions.push('Inhalt zu kurz (mindestens 300 Zeichen empfohlen)');
    score -= 25;
  }
  if (tags.length === 0) {
    suggestions.push('Keine Tags vergeben — Tags verbessern die Auffindbarkeit');
    score -= 15;
  }
  if (tags.length > 10) {
    suggestions.push('Zu viele Tags (max. 10 empfohlen)');
    score -= 5;
  }
  if (body && !body.includes('\n#') && !body.startsWith('#')) {
    suggestions.push('Keine Überschriften im Inhalt — füge H2/H3 Strukturen hinzu');
    score -= 10;
  }
  const wordCount = body ? body.split(/\s+/).length : 0;
  if (wordCount < 100) {
    suggestions.push(`Wortanzahl zu niedrig (${wordCount} Wörter, 100+ empfohlen)`);
    score -= 15;
  }

  return { score: Math.max(0, score), suggestions };
}

export function duplicateScore(a: string, b: string): number {
  if (!a || !b) return 0;
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  wordsA.forEach(w => { if (wordsB.has(w)) intersection++; });
  return intersection / Math.sqrt(wordsA.size * wordsB.size);
}

export const ARTICLE_TEMPLATES: Array<{ id: string; name: string; body: string }> = [
  {
    id: 'news',
    name: 'News-Artikel',
    body: `## Zusammenfassung\n\n[Kurze Zusammenfassung hier]\n\n## Details\n\n[Detaillierte Informationen]\n\n## Reaktionen\n\n[Community-Reaktionen]\n\n## Quellen\n\n- [Quelle 1](https://example.com)`,
  },
  {
    id: 'leak',
    name: 'Leak-Bericht',
    body: `## Unbestätigter Leak\n\n> **Hinweis:** Diese Informationen sind noch nicht offiziell bestätigt.\n\n## Was wurde geleakt?\n\n[Beschreibung des Leaks]\n\n## Glaubwürdigkeit\n\n[Einschätzung der Quelle]\n\n## Was bedeutet das?\n\n[Analyse]`,
  },
  {
    id: 'analysis',
    name: 'Analyse/Meinung',
    body: `## Einleitung\n\n[Kontext und Hintergrund]\n\n## These\n\n[Hauptargument]\n\n## Argumente\n\n### Pro\n- Punkt 1\n- Punkt 2\n\n### Contra\n- Punkt 1\n- Punkt 2\n\n## Fazit\n\n[Schlussfolgerung]`,
  },
  {
    id: 'review',
    name: 'Review',
    body: `## Überblick\n\n| Kategorie | Bewertung |\n|-----------|----------|\n| Grafik | Sehr gut |\n| Gameplay | Gut |\n| Story | Sehr gut |\n\n## Im Detail\n\n### Was gut ist\n[Positives]\n\n### Was verbessert werden könnte\n[Negatives]\n\n## Fazit\n\n**Wertung: X/10**`,
  },
  {
    id: 'guide',
    name: 'Guide/Tutorial',
    body: `## Was du brauchst\n\n- Voraussetzung 1\n- Voraussetzung 2\n\n## Schritt-für-Schritt\n\n### Schritt 1: [Titel]\n\n[Anleitung]\n\n### Schritt 2: [Titel]\n\n[Anleitung]\n\n## Tipps & Tricks\n\n- Tipp 1\n- Tipp 2`,
  },
];

export interface InfoboxField {
  label: string;
  value: string;
}

export function renderInfobox(title: string, fields: InfoboxField[]): string {
  const rows = fields.map(f => `| **${f.label}** | ${f.value} |`).join('\n');
  return `\n> ### ${title}\n>\n> | Eigenschaft | Wert |\n> |-------------|------|\n> ${rows.replace(/\n/g, '\n> ')}\n`;
}

const GTA6_TOPICS: Record<string, string[]> = {
  release: ['GTA 6 Erscheinungsdatum', 'Release in 2025 erwartet', 'Rockstar Games Ankündigung'],
  gameplay: ['Open World Mechaniken', 'Neue Spielmechaniken in GTA 6', 'Lucia als Protagonistin'],
  graphics: ['Unreal Engine 5 Gerüchte', 'GTA 6 Grafik auf PS5', 'Ray Tracing Support'],
  map: ['Vice City Karte', 'Florida-inspirierte Map', 'Größte GTA-Karte aller Zeiten'],
  multiplayer: ['GTA Online Nachfolger', 'Multiplayer-Features', 'Co-op Modus'],
};

export function writingSuggestions(partial: string): string[] {
  const lower = partial.toLowerCase();
  for (const [key, suggestions] of Object.entries(GTA6_TOPICS)) {
    if (lower.includes(key)) return suggestions;
  }
  // Default suggestions based on partial text
  const words = partial.split(/\s+/).slice(-3).join(' ');
  return [
    `${words} — weitere Details`,
    `Was wir über ${words} wissen`,
    `${words}: Analyse und Einschätzung`,
  ];
}

/** Simple markdown-to-HTML converter for live preview (no external deps). */
export function markdownToHtml(md: string): string {
  if (!md) return '';
  return md
    .split('\n')
    .map(line => {
      if (/^######\s+/.test(line)) return `<h6>${line.replace(/^######\s+/, '')}</h6>`;
      if (/^#####\s+/.test(line)) return `<h5>${line.replace(/^#####\s+/, '')}</h5>`;
      if (/^####\s+/.test(line)) return `<h4>${line.replace(/^####\s+/, '')}</h4>`;
      if (/^###\s+/.test(line)) return `<h3>${line.replace(/^###\s+/, '')}</h3>`;
      if (/^##\s+/.test(line)) return `<h2>${line.replace(/^##\s+/, '')}</h2>`;
      if (/^#\s+/.test(line)) return `<h1>${line.replace(/^#\s+/, '')}</h1>`;
      if (/^>\s+/.test(line)) return `<blockquote>${line.replace(/^>\s+/, '')}</blockquote>`;
      if (/^-\s+/.test(line)) return `<li>${line.replace(/^-\s+/, '')}</li>`;
      if (/^\d+\.\s+/.test(line)) return `<li>${line.replace(/^\d+\.\s+/, '')}</li>`;
      if (line.trim() === '') return '<br/>';
      // Inline: bold, italic, code
      const out = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>');
      return `<p>${out}</p>`;
    })
    .join('');
}
