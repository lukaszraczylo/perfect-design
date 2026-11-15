import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useVirtualWindow } from './useVirtualWindow'

describe('useVirtualWindow fixed height', () => {
  it('computes the window, spacers and total from arithmetic', () => {
    const w = useVirtualWindow({ count: () => 1000, rowHeight: () => 20, viewport: () => 100, overscan: 2 })
    expect(w.total.value).toBe(20000)
    expect(w.range.value).toEqual({ start: 0, end: 8 })
    w.scrollTop.value = 2000
    expect(w.range.value).toEqual({ start: 98, end: 108 })
    expect(w.padTop.value).toBe(98 * 20)
    expect(w.padBottom.value).toBe(20000 - 108 * 20)
    expect(w.indexAt(2000)).toBe(100)
    expect(w.indexAt(-5)).toBe(0)
    expect(w.indexAt(1e9)).toBe(999)
    expect(w.offsetOf(5)).toBe(100)
    expect(w.offsetOf(-3)).toBe(0)
    expect(w.offsetOf(5000)).toBe(20000)
  })
  it('handles zero rows, a zero viewport and bad numbers', () => {
    const n = ref(0)
    const w = useVirtualWindow({ count: () => n.value, rowHeight: () => 20, viewport: () => 0 })
    expect(w.range.value).toEqual({ start: 0, end: 0 })
    expect(w.indexAt(10)).toBe(0)
    n.value = 50
    expect(w.range.value.end).toBeGreaterThan(0)
    const nan = useVirtualWindow({ count: () => Number.NaN, rowHeight: () => 20, viewport: () => 50 })
    expect(nan.total.value).toBe(0)
  })
  it('does nothing in measure()', () => {
    const w = useVirtualWindow({ count: () => 3, rowHeight: () => 20, viewport: () => 50 })
    expect(w.measure(document.createElement('div'))).toBe(false)
    expect(w.measure(null)).toBe(false)
  })
})

describe('useVirtualWindow variable height', () => {
  const make = (n = 100) => useVirtualWindow({ count: () => n, rowHeight: () => undefined, estimate: (i) => (i % 2 ? 40 : 20), viewport: () => 100, overscan: 1 })

  it('uses estimates for offsets and a binary search for indexes', () => {
    const w = make()
    expect(w.total.value).toBe(50 * 60)
    expect(w.offsetOf(2)).toBe(60)
    expect(w.indexAt(59)).toBe(1)
    expect(w.indexAt(60)).toBe(2)
    w.scrollTop.value = 600
    expect(w.range.value.start).toBe(w.indexAt(600) - 1)
    expect(w.padTop.value).toBe(w.offsetOf(w.range.value.start))
  })
  it('falls back to a default estimate', () => {
    const w = useVirtualWindow({ count: () => 10, rowHeight: () => Number.NaN, viewport: () => 48 })
    expect(w.total.value).toBe(240)
  })
  it('measure() corrects heights from the DOM and reset() forgets them', () => {
    const w = make(10)
    const root = document.createElement('div')
    for (const [i, h] of [[0, 30], [1, 40], [2, 0]] as const) {
      const el = document.createElement('div')
      el.dataset.index = String(i)
      el.getBoundingClientRect = () => ({ height: h }) as DOMRect
      root.appendChild(el)
    }
    const junk = document.createElement('div')
    junk.dataset.index = 'x'
    junk.getBoundingClientRect = () => ({ height: 30 }) as DOMRect
    root.appendChild(junk)
    const before = w.total.value
    expect(w.measure(root)).toBe(true)
    expect(w.total.value).toBe(before + 10)
    expect(w.measure(root)).toBe(false)
    w.reset()
    expect(w.total.value).toBe(before)
  })
  it('stays fast for 50k rows', () => {
    const w = useVirtualWindow({ count: () => 50000, rowHeight: () => undefined, estimate: () => 24, viewport: () => 600 })
    const t = performance.now()
    w.scrollTop.value = 600000
    expect(w.range.value.end - w.range.value.start).toBeLessThan(60)
    for (let i = 0; i < 200; i++) w.indexAt(i * 5000)
    expect(performance.now() - t).toBeLessThan(1500)
    vi.restoreAllMocks()
  })
})
