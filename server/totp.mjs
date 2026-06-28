import { createHmac, randomBytes } from 'node:crypto'

/**
 * TOTP (RFC 6238) ohne externe Abhängigkeiten — für 2-Faktor-Authentifizierung.
 * Kompatibel mit Authenticator-Apps (Google Authenticator, Authy, …).
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateSecret(bytes = 20) {
  return base32Encode(randomBytes(bytes))
}

function base32Encode(buf) {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(str) {
  const clean = str.toUpperCase().replace(/=+$/, '').replace(/\s/g, '')
  let bits = 0
  let value = 0
  const out = []
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

/** Berechnet den 6-stelligen TOTP-Code für ein Zeitfenster. */
export function totpCode(secret, counter) {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(bin % 1_000_000).padStart(6, '0')
}

/** Prüft einen Code gegen das aktuelle Zeitfenster (±1 für Drift). */
export function verifyTotp(secret, token, now = Date.now()) {
  if (!/^\d{6}$/.test(String(token ?? ''))) return false
  const counter = Math.floor(now / 1000 / 30)
  for (let w = -1; w <= 1; w++) {
    if (totpCode(secret, counter + w) === String(token)) return true
  }
  return false
}

export function otpauthUrl(secret, account, issuer = 'GTA6 News Hub') {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
}
