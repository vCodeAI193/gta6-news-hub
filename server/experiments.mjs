/**
 * A/B-Testing-Framework. Experimente sind statisch definiert; die Zuweisung
 * erfolgt deterministisch über einen Hash der Client-ID, sodass derselbe Client
 * stets dieselbe Variante sieht.
 */
export const experiments = {
  'home-hero-cta': {
    id: 'home-hero-cta',
    description: 'Beschriftung des Hero-CTA auf der Startseite',
    variants: ['Jetzt entdecken', 'Alle News ansehen'],
  },
}

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministische Varianten-Zuweisung für einen Client. */
export function assignVariant(experimentId, clientId) {
  const exp = experiments[experimentId]
  if (!exp) return null
  const idx = hash(`${experimentId}:${clientId}`) % exp.variants.length
  return exp.variants[idx]
}
