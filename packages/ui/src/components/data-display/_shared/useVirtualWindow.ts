/**
 * Windowing maths shared by the log and diff viewers. Rows either have one fixed height (`rowHeight` returns a number: pure
 * arithmetic, nothing stored) or a variable one (`rowHeight` returns undefined: heights start from `estimate(index)` and are
 * corrected from the DOM with `measure()`, so wrapped text and touch-sized rows still land where the scroll bar says).
 * The caller renders rows `range.start..range.end` between `padTop` and `padBottom` pixels of spacer.
 */
import { computed, ref, type ComputedRef, type Ref } from 'vue'

export interface VirtualWindowOptions {
  /** Number of rows. */
  count: () => number
  /** Fixed row height in px, or undefined when heights vary. */
  rowHeight: () => number | undefined
  /** First guess for a row height when `rowHeight` is undefined (default 24). */
  estimate?: (index: number) => number
  /** Visible height of the scroll container in px. 0 renders only the overscan rows. */
  viewport: () => number
  /** Extra rows above and below the viewport (default 8). */
  overscan?: number
}

export interface VirtualWindow {
  scrollTop: Ref<number>
  range: ComputedRef<{ start: number; end: number }>
  padTop: ComputedRef<number>
  padBottom: ComputedRef<number>
  total: ComputedRef<number>
  /** Pixel offset of the top of row `index` (clamped to 0..count). */
  offsetOf(index: number): number
  /** Index of the row that contains the pixel offset `y` (clamped to 0..count-1). */
  indexAt(y: number): number
  /** Read the real height of every rendered `[data-index]` element under `root`; true when an estimate changed. */
  measure(root: ParentNode | null | undefined): boolean
  /** Forget measured heights (width change, new data). */
  reset(): void
}

const FALLBACK = 24

export function useVirtualWindow(options: VirtualWindowOptions): VirtualWindow {
  const scrollTop = ref(0)
  const version = ref(0)
  const measured = new Map<number, number>()
  const overscan = Math.max(0, Math.floor(options.overscan ?? 8))
  const estimate = options.estimate ?? (() => FALLBACK)
  const fixed = computed(() => {
    const h = options.rowHeight()
    return typeof h === 'number' && Number.isFinite(h) && h > 0 ? h : undefined
  })
  const count = computed(() => Math.max(0, Math.floor(options.count()) || 0))

  const offsets = computed<Float64Array | null>(() => {
    void version.value
    if (fixed.value !== undefined) return null
    const n = count.value
    const out = new Float64Array(n + 1)
    for (let i = 0; i < n; i++) out[i + 1] = out[i] + (measured.get(i) ?? Math.max(1, estimate(i)))
    return out
  })

  const offsetOf = (index: number): number => {
    const i = Math.min(count.value, Math.max(0, Math.floor(index) || 0))
    const table = offsets.value
    return table ? table[i] : i * (fixed.value as number)
  }
  const total = computed(() => offsetOf(count.value))

  function indexAt(y: number): number {
    const n = count.value
    if (n === 0) return 0
    const target = Math.max(0, y)
    const table = offsets.value
    if (!table) return Math.min(n - 1, Math.floor(target / (fixed.value as number)))
    let lo = 0
    let hi = n - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (table[mid] <= target) lo = mid
      else hi = mid - 1
    }
    return lo
  }

  const range = computed(() => {
    const n = count.value
    if (n === 0) return { start: 0, end: 0 }
    const top = scrollTop.value
    const first = indexAt(top)
    const last = indexAt(top + Math.max(0, options.viewport())) + 1
    return { start: Math.max(0, first - overscan), end: Math.min(n, Math.max(first + 1, last) + overscan) }
  })
  const padTop = computed(() => offsetOf(range.value.start))
  const padBottom = computed(() => total.value - offsetOf(range.value.end))

  function measure(root: ParentNode | null | undefined): boolean {
    if (!root || fixed.value !== undefined) return false
    let changed = false
    for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-index]'))) {
      const i = Number(el.dataset.index)
      const h = el.getBoundingClientRect().height
      if (!Number.isInteger(i) || !(h > 0)) continue
      const known = measured.get(i) ?? Math.max(1, estimate(i))
      if (Math.abs(known - h) > 0.5) {
        measured.set(i, h)
        changed = true
      }
    }
    if (changed) version.value++
    return changed
  }
  function reset() {
    measured.clear()
    version.value++
  }

  return { scrollTop, range, padTop, padBottom, total, offsetOf, indexAt, measure, reset }
}
