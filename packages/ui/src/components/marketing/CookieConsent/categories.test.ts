import { describe, expect, it } from 'vitest'
import { buildChoice, cleanCategories, resolveChoices } from './categories'

const cats = [
  { id: 'necessary', label: 'Necessary', necessary: true },
  { id: 'analytics', label: 'Analytics' },
  { id: 'ads', label: 'Ads' },
]

describe('cleanCategories', () => {
  it('keeps valid entries in order', () => {
    expect(cleanCategories(cats).map((c) => c.id)).toEqual(['necessary', 'analytics', 'ads'])
  })
  it('drops blank, non-string and duplicate ids; first duplicate wins', () => {
    const out = cleanCategories([{ id: '' }, { id: '  ' }, { id: 4 }, { id: 'a', label: 'First' }, { id: 'a', label: 'Second' }])
    expect(out).toEqual([{ id: 'a', label: 'First', description: undefined, necessary: false }])
  })
  it('ignores non-objects and non-arrays without throwing', () => {
    expect(cleanCategories(null)).toEqual([])
    expect(cleanCategories('x')).toEqual([])
    expect(cleanCategories({ id: 'a' })).toEqual([])
    expect(cleanCategories([null, undefined, 3, 'a', [], { id: 'ok' }]).map((c) => c.id)).toEqual(['ok'])
  })
  it('falls back to the id for a missing or blank label, and ignores a non-string description', () => {
    const [a, b] = cleanCategories([{ id: 'a' }, { id: 'b', label: ' ', description: 5 }])
    expect([a.label, b.label, b.description]).toEqual(['a', 'b', undefined])
  })
  it('only `necessary: true` locks a category', () => {
    expect(cleanCategories([{ id: 'a', necessary: 'yes' }])[0].necessary).toBe(false)
  })
  it('handles a hostile id such as __proto__', () => {
    const out = cleanCategories([{ id: '__proto__', label: 'x' }, { id: 'constructor', label: 'y' }])
    expect(out.map((c) => c.id)).toEqual(['__proto__', 'constructor'])
  })
})

describe('resolveChoices', () => {
  it('turns nothing on except necessary categories', () => {
    expect(resolveChoices(cats)).toEqual({ necessary: true, analytics: false, ads: false })
  })
  it('honours only an explicit true; ignores truthy lookalikes and unknown keys', () => {
    expect(resolveChoices(cats, { analytics: true, ads: 'true', other: true, necessary: false })).toEqual({ necessary: true, analytics: true, ads: false })
  })
  it('ignores inherited keys and non-object values', () => {
    expect(resolveChoices(cats, Object.create({ analytics: true }))).toEqual({ necessary: true, analytics: false, ads: false })
    expect(resolveChoices(cats, 'x')).toEqual({ necessary: true, analytics: false, ads: false })
    expect(resolveChoices(cats, null)).toEqual({ necessary: true, analytics: false, ads: false })
  })
  it('creates an own property for __proto__ instead of changing the prototype', () => {
    const out = resolveChoices([{ id: '__proto__', label: 'x' }], JSON.parse('{"__proto__": true}'))
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype)
    expect(Object.keys(out)).toEqual(['__proto__'])
    expect(Object.getOwnPropertyDescriptor(out, '__proto__')?.value).toBe(true)
  })
  it('handles no categories', () => expect(resolveChoices([])).toEqual({}))
})

describe('buildChoice', () => {
  it('accept-all turns everything on', () => {
    expect(buildChoice('accept-all', cats, {})).toEqual({ action: 'accept-all', categories: { necessary: true, analytics: true, ads: true } })
  })
  it('reject-all turns off everything except necessary ones', () => {
    expect(buildChoice('reject-all', cats, { analytics: true, ads: true })).toEqual({ action: 'reject-all', categories: { necessary: true, analytics: false, ads: false } })
  })
  it('save sends the current toggles and still forces necessary on', () => {
    expect(buildChoice('save', cats, { necessary: false, analytics: true })).toEqual({ action: 'save', categories: { necessary: true, analytics: true, ads: false } })
  })
  it('works with no categories', () => expect(buildChoice('accept-all', [], {})).toEqual({ action: 'accept-all', categories: {} }))
})
