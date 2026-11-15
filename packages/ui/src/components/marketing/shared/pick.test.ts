import { describe, expect, it } from 'vitest'
import { headingTag, oneOf } from './pick'

describe('marketing pick helpers', () => {
  it('oneOf returns allowed values and falls back otherwise', () => {
    const list = ['a', 'b'] as const
    expect(oneOf('a', list, 'b')).toBe('a')
    expect(oneOf('z', list, 'b')).toBe('b')
    for (const bad of [undefined, null, 1, {}, ['a']]) expect(oneOf(bad, list, 'b')).toBe('b')
  })
  it('headingTag accepts 1-6 only', () => {
    expect(headingTag(3)).toBe('h3')
    expect(headingTag(0)).toBe('h2')
    expect(headingTag(7, 'h1')).toBe('h1')
    expect(headingTag(2.5)).toBe('h2')
    expect(headingTag('2')).toBe('h2')
  })
})
