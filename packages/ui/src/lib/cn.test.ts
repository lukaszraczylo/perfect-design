import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins strings, arrays and objects and drops falsy values', () => {
    expect(cn('a', ['b', ['c']], { d: true, e: false }, null, undefined, false, 0)).toBe('a b c d')
  })
  it('lets later Tailwind utilities win', () => {
    expect(cn('px-2 bg-primary', 'px-4 bg-red-500')).toBe('px-4 bg-red-500')
  })
  it('returns an empty string for no input', () => expect(cn()).toBe(''))
  it('keeps unrelated and arbitrary classes', () => expect(cn('custom-x', 'size-[3px]')).toBe('custom-x size-[3px]'))
  it('stringifies numbers (edge)', () => expect(cn(1 as never, 'a')).toBe('1 a'))
})
