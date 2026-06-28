import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateSecret, totpCode, verifyTotp } from './totp.mjs'

describe('TOTP', () => {
  it('erzeugt 6-stellige Codes', () => {
    const secret = generateSecret()
    const code = totpCode(secret, 1)
    assert.match(code, /^\d{6}$/)
  })

  it('verifiziert den aktuellen Code', () => {
    const secret = generateSecret()
    const now = 1_700_000_000_000
    const counter = Math.floor(now / 1000 / 30)
    const code = totpCode(secret, counter)
    assert.equal(verifyTotp(secret, code, now), true)
  })

  it('akzeptiert Drift von ±1 Fenster', () => {
    const secret = generateSecret()
    const now = 1_700_000_000_000
    const prev = totpCode(secret, Math.floor(now / 1000 / 30) - 1)
    assert.equal(verifyTotp(secret, prev, now), true)
  })

  it('lehnt falsche Codes ab', () => {
    const secret = generateSecret()
    assert.equal(verifyTotp(secret, '000000', 1_700_000_000_000), false)
    assert.equal(verifyTotp(secret, 'abc'), false)
  })

  it('RFC-6238-Referenzvektor (SHA1, Secret "12345678901234567890")', () => {
    // Base32 von ASCII "12345678901234567890"
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
    // T=59s → Counter 1 → bekannter Code 94287082
    assert.equal(totpCode(secret, 1), '287082')
  })
})
