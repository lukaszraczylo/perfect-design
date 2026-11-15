import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { MAX_TOASTS, useToastStore } from './toast'

beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
})
afterEach(() => vi.useRealTimers())

describe('useToastStore', () => {
  it('pushes a toast with defaults and returns its id', () => {
    const s = useToastStore()
    const id = s.push({ title: 'Saved' })
    expect(s.toasts).toHaveLength(1)
    expect(s.toasts[0]).toMatchObject({ id, title: 'Saved', variant: 'default', duration: 5000 })
  })

  it('auto-dismisses after the duration', () => {
    const s = useToastStore()
    s.push({ title: 'x', duration: 1000 })
    vi.advanceTimersByTime(999)
    expect(s.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(s.toasts).toHaveLength(0)
  })

  it.each([0, Infinity])('duration %s is sticky', (duration) => {
    const s = useToastStore()
    s.push({ title: 'sticky', duration })
    vi.advanceTimersByTime(60_000)
    expect(s.toasts).toHaveLength(1)
  })

  it('dismiss removes one and cancels its timer; unknown id is a no-op', () => {
    const s = useToastStore()
    const a = s.push({ title: 'a' })
    s.push({ title: 'b' })
    s.dismiss(a)
    s.dismiss('nope')
    expect(s.toasts.map((t) => t.title)).toEqual(['b'])
  })

  it('rejects empty / whitespace titles (bad input)', () => {
    const s = useToastStore()
    expect(() => s.push({ title: '' })).toThrow()
    expect(() => s.push({ title: '   ' })).toThrow()
    expect(s.toasts).toHaveLength(0)
  })

  it('caps the queue at MAX_TOASTS, dropping the oldest', () => {
    const s = useToastStore()
    for (let i = 0; i < MAX_TOASTS + 2; i++) s.push({ title: `t${i}` })
    expect(s.toasts).toHaveLength(MAX_TOASTS)
    expect(s.toasts[0].title).toBe('t2')
  })

  it('dedupes by key', () => {
    const s = useToastStore()
    s.push({ title: 'one', key: 'k' })
    s.push({ title: 'two', key: 'k' })
    expect(s.toasts.map((t) => t.title)).toEqual(['two'])
  })

  it('helpers set variants', () => {
    const s = useToastStore()
    s.success('a')
    s.error('b', 'desc')
    s.warning('c')
    s.info('d')
    expect(s.toasts.map((t) => t.variant)).toEqual(['success', 'danger', 'warning', 'info'])
    expect(s.toasts[1].description).toBe('desc')
  })

  it('clear removes everything and stops timers', () => {
    const s = useToastStore()
    s.push({ title: 'a' })
    s.push({ title: 'b' })
    s.clear()
    expect(s.toasts).toHaveLength(0)
    vi.advanceTimersByTime(10_000)
    expect(s.toasts).toHaveLength(0)
  })
})
