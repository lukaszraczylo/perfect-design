import { afterEach, describe, expect, it, vi } from 'vitest'
import { clampNumber, initialsOf, linkAttrs, pickColumns, prefersReducedMotion } from './motion'
import { installIntersectionObserver, installRaf, mockMatchMedia } from './testing'

afterEach(() => vi.unstubAllGlobals())

describe('marketing shared helpers', () => {
  it('prefersReducedMotion reflects matchMedia and tolerates its absence', () => {
    mockMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)
    mockMatchMedia(false)
    expect(prefersReducedMotion()).toBe(false)
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })
  it('clampNumber clamps and rejects non-finite or non-number input', () => {
    expect(clampNumber(5, 0, 10, 1)).toBe(5)
    expect(clampNumber(-5, 0, 10, 1)).toBe(0)
    expect(clampNumber(50, 0, 10, 1)).toBe(10)
    for (const bad of [Number.NaN, Infinity, '5', null, undefined]) expect(clampNumber(bad, 0, 10, 7)).toBe(7)
  })
  it('pickColumns accepts only allowed values', () => {
    expect(pickColumns(2, [2, 3] as const, 3)).toBe(2)
    expect(pickColumns('2', [2, 3] as const, 3)).toBe(3)
    expect(pickColumns(9, [2, 3] as const, 3)).toBe(3)
  })
  it('linkAttrs only adds target/rel for external links', () => {
    expect(linkAttrs()).toEqual({})
    expect(linkAttrs(false)).toEqual({})
    expect(linkAttrs(true)).toEqual({ target: '_blank', rel: 'noopener noreferrer' })
  })
  it('initialsOf handles empty, single, multi-word, emoji and extra whitespace', () => {
    expect(initialsOf(undefined)).toBe('')
    expect(initialsOf('   ')).toBe('')
    expect(initialsOf('ada')).toBe('A')
    expect(initialsOf('Ada  Byron King')).toBe('AK')
    expect(initialsOf('😀 émile')).toBe('😀É')
  })
})

describe('test fakes', () => {
  it('fake IntersectionObserver supports unobserve/takeRecords', () => {
    const list = installIntersectionObserver()
    const o = new IntersectionObserver(() => {})
    const el = document.createElement('div')
    o.observe(el)
    expect(list[0].targets).toEqual([el])
    o.unobserve(el)
    expect(list[0].targets).toEqual([])
    expect(o.takeRecords()).toEqual([])
  })
  it('fake rAF queue flushes and cancels', () => {
    const raf = installRaf()
    const cb = vi.fn()
    const id = requestAnimationFrame(cb)
    cancelAnimationFrame(id)
    raf.flush(1)
    expect(cb).not.toHaveBeenCalled()
    requestAnimationFrame(cb)
    raf.flush(2)
    expect(cb).toHaveBeenCalledWith(2)
  })
  it('mockMatchMedia returns a MediaQueryList-like object', () => {
    mockMatchMedia(true)
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    m.addEventListener('change', () => {})
    m.removeEventListener('change', () => {})
    expect(m.dispatchEvent(new Event('change'))).toBe(false)
    expect(m.matches).toBe(true)
  })
})
