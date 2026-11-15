import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useClipboard, useDebounceFn, useOnline, useWindowScroll } from './use-helpers'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useDebounceFn', () => {
  it('collapses rapid calls into one with the last args', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const d = useDebounceFn(fn, 100)
    d('a'); d('b'); d('c')
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })
  it('accepts a getter delay, supports cancel, and clears on scope dispose', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const scope = effectScope()
    const d = scope.run(() => useDebounceFn(fn, () => 50))!
    d(1)
    d.cancel()
    vi.advanceTimersByTime(100)
    expect(fn).not.toHaveBeenCalled()
    d(2)
    scope.stop()
    vi.advanceTimersByTime(100)
    expect(fn).not.toHaveBeenCalled()
  })
  it.each([0, -5, NaN])('delay %s runs synchronously', (delay) => {
    const fn = vi.fn()
    useDebounceFn(fn, delay)('x')
    expect(fn).toHaveBeenCalledWith('x')
  })
})

describe('useClipboard', () => {
  it('copies with the async API and resets `copied`', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { copy, copied } = useClipboard({ copiedDuring: 500 })
    expect(await copy('hi')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hi')
    expect(copied.value).toBe(true)
    vi.advanceTimersByTime(500)
    expect(copied.value).toBe(false)
  })
  it('returns false and does not throw when the API rejects and legacy is off', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('no')) }, configurable: true })
    const { copy, copied } = useClipboard()
    expect(await copy('x')).toBe(false)
    expect(copied.value).toBe(false)
  })
  it('falls back to execCommand with legacy: true', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec as never
    const { copy, copied } = useClipboard({ legacy: true })
    expect(await copy('legacy')).toBe(true)
    expect(exec).toHaveBeenCalledWith('copy')
    expect(copied.value).toBe(true)
    expect(document.querySelector('textarea')).toBeNull()
  })
  it('legacy fallback reports failure when execCommand fails or throws', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    document.execCommand = vi.fn().mockReturnValue(false) as never
    expect(await useClipboard({ legacy: true }).copy('a')).toBe(false)
    document.execCommand = vi.fn(() => { throw new Error('x') }) as never
    expect(await useClipboard({ legacy: true }).copy('a')).toBe(false)
  })
})

describe('useOnline', () => {
  it('tracks online/offline events and detaches on dispose', async () => {
    const scope = effectScope()
    const online = scope.run(() => useOnline())!
    window.dispatchEvent(new Event('offline'))
    await nextTick()
    expect(online.value).toBe(false)
    window.dispatchEvent(new Event('online'))
    expect(online.value).toBe(true)
    scope.stop()
    window.dispatchEvent(new Event('offline'))
    expect(online.value).toBe(true)
  })
})

describe('useWindowScroll', () => {
  it('updates x/y on scroll and detaches on dispose', () => {
    const scope = effectScope()
    const s = scope.run(() => useWindowScroll())!
    Object.defineProperty(window, 'scrollY', { value: 120, configurable: true })
    Object.defineProperty(window, 'scrollX', { value: 7, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    expect(s.y.value).toBe(120)
    expect(s.x.value).toBe(7)
    scope.stop()
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true })
    window.dispatchEvent(new Event('scroll'))
    expect(s.y.value).toBe(120)
  })
})
