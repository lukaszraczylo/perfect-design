import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_INTERVAL, MIN_INTERVAL, clockStats, normalizeInterval, subscribeClock } from './clock'

beforeEach(() => vi.useFakeTimers({ now: 1_000_000 }))
afterEach(() => {
  expect(clockStats()).toEqual({ subscribers: 0, period: 0, active: false })
  vi.useRealTimers()
})

describe('normalizeInterval', () => {
  it.each([
    [1000, 1000],
    [1000.9, 1000],
    ['2000', 2000],
    [MIN_INTERVAL, MIN_INTERVAL],
    [1, MIN_INTERVAL],
    [249, MIN_INTERVAL],
    [1e12, MAX_INTERVAL],
    [Number.MAX_VALUE, MAX_INTERVAL],
    [0, 0],
    [-5, 0],
    [NaN, 0],
    [Infinity, 0],
    [-Infinity, 0],
    ['', 0],
    ['  ', 0],
    ['abc', 0],
    [null, 0],
    [undefined, 0],
    [true, 0],
    [{}, 0],
  ])('%s becomes %s', (input, out) => expect(normalizeInterval(input)).toBe(out))
})

describe('subscribeClock', () => {
  it('owns no timer until someone subscribes', () => {
    expect(vi.getTimerCount()).toBe(0)
    expect(clockStats().active).toBe(false)
  })

  it('calls back with the current time on every period and stops on unsubscribe', () => {
    const cb = vi.fn()
    const off = subscribeClock(1000, cb)
    expect(clockStats()).toEqual({ subscribers: 1, period: 1000, active: true })
    vi.advanceTimersByTime(3000)
    expect(cb).toHaveBeenCalledTimes(3)
    expect(cb).toHaveBeenLastCalledWith(1_003_000)
    off()
    vi.advanceTimersByTime(5000)
    expect(cb).toHaveBeenCalledTimes(3)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('shares ONE timer between many subscribers', () => {
    const offs = Array.from({ length: 50 }, () => subscribeClock(1000, () => {}))
    expect(vi.getTimerCount()).toBe(1)
    expect(clockStats().subscribers).toBe(50)
    offs.slice(0, 49).forEach((o) => o())
    expect(vi.getTimerCount()).toBe(1)
    offs[49]()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('runs at the smallest period and throttles slower subscribers to their own period', () => {
    const fast = vi.fn()
    const slow = vi.fn()
    const offSlow = subscribeClock(3000, slow)
    expect(clockStats().period).toBe(3000)
    const offFast = subscribeClock(1000, fast)
    expect(clockStats().period).toBe(1000)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(6000)
    expect(fast).toHaveBeenCalledTimes(6)
    expect(slow).toHaveBeenCalledTimes(2)
    offFast()
    expect(clockStats().period).toBe(3000)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(3000)
    expect(slow).toHaveBeenCalledTimes(3)
    offSlow()
  })

  it('does not restart the timer when a subscriber leaves and the period stays', () => {
    const a = subscribeClock(1000, () => {})
    const b = subscribeClock(1000, () => {})
    a()
    expect(clockStats()).toEqual({ subscribers: 1, period: 1000, active: true })
    b()
  })

  it('unsubscribing twice is harmless', () => {
    const keep = subscribeClock(1000, () => {})
    const off = subscribeClock(1000, () => {})
    off()
    off()
    expect(clockStats().subscribers).toBe(1)
    keep()
  })

  it('a callback may unsubscribe itself while the timer runs', () => {
    let off = () => {}
    const cb = vi.fn(() => off())
    off = subscribeClock(1000, cb)
    vi.advanceTimersByTime(3000)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it.each([0, -1, NaN, Infinity, 'x', null, undefined])('interval %s is a no-op', (interval) => {
    const cb = vi.fn()
    const off = subscribeClock(interval as number, cb)
    expect(clockStats().subscribers).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(10_000)
    expect(cb).not.toHaveBeenCalled()
    off()
  })

  it('clamps a tiny interval to the minimum and a huge one to the setInterval limit', () => {
    const a = subscribeClock(1, () => {})
    expect(clockStats().period).toBe(MIN_INTERVAL)
    a()
    const b = subscribeClock(1e15, () => {})
    expect(clockStats().period).toBe(MAX_INTERVAL)
    b()
  })
})
