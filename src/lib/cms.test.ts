import { describe, it, expect } from 'vitest';
import {
  generateToc,
  analyzeSeo,
  duplicateScore,
  ARTICLE_TEMPLATES,
  writingSuggestions,
  renderInfobox,
  markdownToHtml,
} from './cms';

describe('generateToc', () => {
  it('returns empty array for empty string', () => {
    expect(generateToc('')).toEqual([]);
  });

  it('parses H2 headings', () => {
    const md = '## Hello World\nsome text\n## Another Heading';
    const toc = generateToc(md);
    expect(toc).toHaveLength(2);
    expect(toc[0]).toMatchObject({ level: 2, text: 'Hello World', anchor: 'hello-world' });
    expect(toc[1]).toMatchObject({ level: 2, text: 'Another Heading', anchor: 'another-heading' });
  });

  it('parses mixed heading levels', () => {
    const md = '# H1\n## H2\n### H3\n#### H4';
    const toc = generateToc(md);
    expect(toc).toHaveLength(4);
    expect(toc[0].level).toBe(1);
    expect(toc[1].level).toBe(2);
    expect(toc[2].level).toBe(3);
    expect(toc[3].level).toBe(4);
  });

  it('generates anchors from heading text', () => {
    const md = '## GTA 6: Release Date!';
    const [entry] = generateToc(md);
    expect(entry.anchor).toBe('gta-6-release-date');
  });

  it('ignores non-heading lines', () => {
    const md = 'Normal paragraph\n- list item\n> blockquote';
    expect(generateToc(md)).toHaveLength(0);
  });
});

describe('analyzeSeo', () => {
  it('returns score 100 for perfect content', () => {
    const body = '## Intro\n' + 'word '.repeat(110);
    const result = analyzeSeo('GTA 6 Release Date Confirmed', body, ['gta6', 'release']);
    expect(result.score).toBe(100);
    expect(result.suggestions).toHaveLength(0);
  });

  it('deducts for short title', () => {
    const body = '## Intro\n' + 'word '.repeat(110);
    const result = analyzeSeo('Short', body, ['gta']);
    expect(result.score).toBeLessThan(100);
    expect(result.suggestions.some(s => s.includes('Titel'))).toBe(true);
  });

  it('deducts for long title (>60 chars)', () => {
    const longTitle = 'A'.repeat(65);
    const body = '## Intro\n' + 'word '.repeat(110);
    const result = analyzeSeo(longTitle, body, ['gta']);
    expect(result.suggestions.some(s => s.includes('lang'))).toBe(true);
  });

  it('deducts for short body (<300 chars)', () => {
    const result = analyzeSeo('GTA 6 Release Date News', 'Short body.', ['gta6']);
    expect(result.suggestions.some(s => s.includes('kurz'))).toBe(true);
  });

  it('deducts for no tags', () => {
    const body = '## Intro\n' + 'word '.repeat(110);
    const result = analyzeSeo('GTA 6 Release Date Confirmed', body, []);
    expect(result.suggestions.some(s => s.includes('Tags'))).toBe(true);
  });

  it('deducts for too many tags (>10)', () => {
    const body = '## Intro\n' + 'word '.repeat(110);
    const tags = Array.from({ length: 12 }, (_, i) => `tag${i}`);
    const result = analyzeSeo('GTA 6 Release Date Confirmed', body, tags);
    expect(result.suggestions.some(s => s.includes('viele Tags'))).toBe(true);
  });

  it('score never goes below 0', () => {
    const result = analyzeSeo('', '', []);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe('duplicateScore', () => {
  it('returns 0 for empty strings', () => {
    expect(duplicateScore('', '')).toBe(0);
    expect(duplicateScore('hello world', '')).toBe(0);
  });

  it('returns high score for identical texts', () => {
    const text = 'this is a test about gta six release date confirmed';
    expect(duplicateScore(text, text)).toBeGreaterThan(0.9);
  });

  it('returns 0 for completely different texts', () => {
    const a = 'apple orange banana grape fruit salad';
    const b = 'cat dog bird fish lizard reptile mammal';
    expect(duplicateScore(a, b)).toBe(0);
  });

  it('returns partial score for partially similar texts', () => {
    const a = 'gta six release date confirmed news';
    const b = 'gta six release date rumored source claims';
    const score = duplicateScore(a, b);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});

describe('ARTICLE_TEMPLATES', () => {
  it('has 5 templates', () => {
    expect(ARTICLE_TEMPLATES).toHaveLength(5);
  });

  it('all templates have id, name, body', () => {
    for (const t of ARTICLE_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.body).toBeTruthy();
    }
  });

  it('includes news, leak, analysis, review, guide templates', () => {
    const ids = ARTICLE_TEMPLATES.map(t => t.id);
    expect(ids).toContain('news');
    expect(ids).toContain('leak');
    expect(ids).toContain('analysis');
    expect(ids).toContain('review');
    expect(ids).toContain('guide');
  });
});

describe('writingSuggestions', () => {
  it('returns suggestions for known topic keywords', () => {
    const suggestions = writingSuggestions('GTA 6 release date news');
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]).toContain('GTA 6');
  });

  it('returns suggestions for gameplay topic', () => {
    const suggestions = writingSuggestions('gameplay mechanics in GTA 6');
    expect(suggestions.some(s => s.toLowerCase().includes('gameplay') || s.toLowerCase().includes('lucia'))).toBe(true);
  });

  it('returns default suggestions for unknown topic', () => {
    const suggestions = writingSuggestions('something completely random');
    expect(suggestions).toHaveLength(3);
  });
});

describe('renderInfobox', () => {
  it('renders markdown infobox with title and fields', () => {
    const result = renderInfobox('GTA 6 Facts', [
      { label: 'Developer', value: 'Rockstar Games' },
      { label: 'Platform', value: 'PS5' },
    ]);
    expect(result).toContain('GTA 6 Facts');
    expect(result).toContain('Developer');
    expect(result).toContain('Rockstar Games');
    expect(result).toContain('Platform');
    expect(result).toContain('PS5');
  });
});

describe('markdownToHtml', () => {
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
  });

  it('converts H2 headings', () => {
    expect(markdownToHtml('## Hello')).toContain('<h2>Hello</h2>');
  });

  it('converts H1 headings', () => {
    expect(markdownToHtml('# Title')).toContain('<h1>Title</h1>');
  });

  it('converts bold text', () => {
    expect(markdownToHtml('**bold text**')).toContain('<strong>bold text</strong>');
  });

  it('converts italic text', () => {
    expect(markdownToHtml('*italic text*')).toContain('<em>italic text</em>');
  });

  it('converts inline code', () => {
    expect(markdownToHtml('`code here`')).toContain('<code>code here</code>');
  });

  it('converts list items', () => {
    expect(markdownToHtml('- list item')).toContain('<li>list item</li>');
  });
});
