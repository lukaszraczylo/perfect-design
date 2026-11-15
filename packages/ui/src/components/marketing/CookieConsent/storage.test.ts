import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearConsent, readConsent, writeConsent, type ConsentStorage } from './storage'

function memory(initial: Record<string, string> = {}): ConsentStorage & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
  }
}
const throwing = (): ConsentStorage => ({
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('consent storage helpers', () => {
  it('round-trips a choice', () => {
    const s = memory()
    expect(writeConsent('k', { necessary: true, analytics: false }, s)).toBe(true)
    expect(readConsent('k', s)).toEqual({ necessary: true, analytics: false })
  })
  it('uses localStorage by default', () => {
    expect(readConsent('k')).toBeNull()
    expect(writeConsent('k', { a: true })).toBe(true)
    expect(readConsent('k')).toEqual({ a: true })
    expect(clearConsent('k')).toBe(true)
    expect(readConsent('k')).toBeNull()
  })
  it('clears a saved choice', () => {
    const s = memory()
    writeConsent('k', { a: true }, s)
    expect(clearConsent('k', s)).toBe(true)
    expect(s.data).toEqual({})
  })
  it('returns null for missing, corrupt, oversized or wrongly shaped data', () => {
    expect(readConsent('missing', memory())).toBeNull()
    for (const raw of ['{', 'null', '[]', '"x"', '{"v":2,"c":{}}', '{"v":1}', '{"v":1,"c":[]}', '{"v":1,"c":{"a":"yes"}}', '{"v":1,"c":{"a":1}}', 'x'.repeat(20000)]) {
      expect(readConsent('k', memory({ k: raw }))).toBeNull()
    }
  })
  it('keeps a __proto__ key as plain data', () => {
    const out = readConsent('k', memory({ k: '{"v":1,"c":{"__proto__":true}}' }))
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
    expect(Object.keys(out ?? {})).toEqual(['__proto__'])
  })
  it('never throws when storage throws', () => {
    const s = throwing()
    expect(readConsent('k', s)).toBeNull()
    expect(writeConsent('k', { a: true }, s)).toBe(false)
    expect(clearConsent('k', s)).toBe(false)
  })
  it('is safe when localStorage access itself throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(readConsent('k')).toBeNull()
    expect(writeConsent('k', { a: true })).toBe(false)
    expect(clearConsent('k')).toBe(false)
  })
  it('is safe without a window (server)', () => {
    vi.stubGlobal('window', undefined)
    expect(readConsent('k')).toBeNull()
    expect(writeConsent('k', { a: true })).toBe(false)
    expect(clearConsent('k')).toBe(false)
  })
  it('does nothing without storage or with an invalid key', () => {
    expect(readConsent('k', null)).toBeNull()
    expect(writeConsent('k', {}, null)).toBe(false)
    expect(clearConsent('k', null)).toBe(false)
    const s = memory()
    expect(writeConsent('', { a: true }, s)).toBe(false)
    expect(readConsent('', s)).toBeNull()
    expect(clearConsent('', s)).toBe(false)
    expect(readConsent(undefined as unknown as string, s)).toBeNull()
  })
})
