import { describe, expect, it } from 'vitest'
import { pick } from './pick'

describe('pick', () => {
  const sizes = ['sm', 'md', 'lg'] as const
  it('keeps an allowed value', () => expect(pick('lg', sizes, 'md')).toBe('lg'))
  it('falls back for unknown, empty and non-string values', () => {
    expect(pick('xl', sizes, 'md')).toBe('md')
    expect(pick('', sizes, 'md')).toBe('md')
    expect(pick(undefined, sizes, 'md')).toBe('md')
    expect(pick(null, sizes, 'md')).toBe('md')
    expect(pick(3, sizes, 'md')).toBe('md')
    expect(pick('constructor', sizes, 'md')).toBe('md')
  })
})
