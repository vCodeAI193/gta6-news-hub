/**
 * Feature-Flags zum gezielten Aus-/Einrollen von Funktionen.
 * Defaults via Code, überschreibbar per FEATURE_FLAGS-Env ("media=false,community=true"),
 * zur Laufzeit per Admin-Endpunkt umschaltbar (in-memory).
 */
const DEFAULTS = {
  community: true, // Rangliste, Profile, Einreichungen
  media: true, // Karte, Timeline, Galerie, Lore
  realtime: true, // WebSocket-Liveupdates
  breaking: true, // Eilmeldungs-Banner
}

function parseEnv(raw) {
  const out = {}
  for (const pair of (raw ?? '').split(',')) {
    const [k, v] = pair.split('=').map((x) => x?.trim())
    if (k && v != null) out[k] = v === 'true'
  }
  return out
}

export function createFlags(env = process.env.FEATURE_FLAGS) {
  const flags = { ...DEFAULTS, ...parseEnv(env) }
  return {
    all: () => ({ ...flags }),
    set: (key, value) => {
      if (!(key in flags)) return null
      flags[key] = Boolean(value)
      return { ...flags }
    },
  }
}
