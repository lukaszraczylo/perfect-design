/** Pure sizing maths for ResizablePanels. Sizes are percentages; every result sums to 100. */

export interface PanelConfig {
  defaultSize?: number
  minSize?: number
  maxSize?: number
  collapsible?: boolean
  collapsedSize?: number
}

export interface NormalizedPanelConfig {
  defaultSize: number | undefined
  min: number
  max: number
  collapsible: boolean
  collapsedSize: number
}

const EPS = 1e-9

export function isValidSize(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/** Sanitise raw panel props: NaN / negative / reversed bounds fall back; impossible bound sets are relaxed so a valid layout always exists. */
export function normalizeConfigs(raw: PanelConfig[]): NormalizedPanelConfig[] {
  const out = raw.map((c) => {
    const min = clamp(isValidSize(c.minSize) ? c.minSize : 0, 0, 100)
    const max = clamp(isValidSize(c.maxSize) ? c.maxSize : 100, min, 100)
    const collapsible = !!c.collapsible
    return {
      defaultSize: isValidSize(c.defaultSize) ? clamp(c.defaultSize, 0, 100) : undefined,
      min,
      max,
      collapsible,
      collapsedSize: collapsible ? clamp(isValidSize(c.collapsedSize) ? c.collapsedSize : 0, 0, min) : 0,
    }
  })
  if (out.reduce((s, c) => s + c.min, 0) > 100 + EPS) for (const c of out) c.min = c.collapsedSize = 0
  if (out.reduce((s, c) => s + c.max, 0) < 100 - EPS) for (const c of out) c.max = 100
  return out
}

export function isCollapsedSize(size: number, c: NormalizedPanelConfig): boolean {
  return c.collapsible && c.min > c.collapsedSize && size <= c.collapsedSize + 1e-6
}

/** Snap one size to what the panel allows: clamp to [min, max]; collapsible panels below `min` snap to collapsed or min, whichever is nearer. */
export function constrainSize(size: number, c: NormalizedPanelConfig): number {
  if (c.collapsible && size < c.min) return size < (c.collapsedSize + c.min) / 2 ? c.collapsedSize : c.min
  return clamp(size, c.min, c.max)
}

function redistribute(sizes: number[], bounds: (i: number) => [number, number]): void {
  for (let pass = 0; pass <= sizes.length + 1; pass++) {
    const diff = 100 - sizes.reduce((s, v) => s + v, 0)
    if (Math.abs(diff) < EPS) return
    const open = sizes.map((_, i) => i).filter((i) => (diff > 0 ? sizes[i] < bounds(i)[1] - EPS : sizes[i] > bounds(i)[0] + EPS))
    if (!open.length) return
    const share = diff / open.length
    for (const i of open) {
      const [lo, hi] = bounds(i)
      sizes[i] = clamp(sizes[i] + share, lo, hi)
    }
  }
}

/**
 * Resolve a complete layout. `requested` may hold partial / invalid values (undefined, NaN, negative are "unset" and
 * fall back to the panel's defaultSize, then an equal share of what is left). Result: length = configs.length, each size
 * within its panel's bounds, sum === 100 (0 panels -> [], 1 panel -> [100]).
 */
export function computeLayout(rawConfigs: PanelConfig[], requested?: ArrayLike<unknown> | null): number[] {
  const n = rawConfigs.length
  if (n === 0) return []
  if (n === 1) return [100]
  const cfg = normalizeConfigs(rawConfigs)
  const sizes: (number | undefined)[] = cfg.map((c, i) => {
    const r = requested?.[i]
    return isValidSize(r) ? r : c.defaultSize
  })
  const defined = sizes.reduce<number>((s, v) => s + (v ?? 0), 0)
  const unset = sizes.filter((v) => v === undefined).length
  const filler = unset ? Math.max(100 - defined, 0) / unset : 0
  let out = sizes.map((v) => v ?? filler)
  const total = out.reduce((s, v) => s + v, 0)
  out = total > EPS ? out.map((v) => (v * 100) / total) : out.map(() => 100 / n)
  out = out.map((v, i) => constrainSize(v, cfg[i]))
  // keep collapsed panels collapsed while the others absorb the difference; relax that only if impossible
  redistribute(out, (i) => (isCollapsedSize(out[i], cfg[i]) ? [out[i], out[i]] : [cfg[i].min, cfg[i].max]))
  redistribute(out, (i) => [cfg[i].collapsible ? cfg[i].collapsedSize : cfg[i].min, cfg[i].max])
  return out
}

/** Move the boundary between panel `index` and `index + 1` by `delta` percent. Returns the previous array when nothing can move. */
export function resizePair(sizes: number[], rawConfigs: PanelConfig[], index: number, delta: number): number[] {
  if (index < 0 || index + 1 >= sizes.length || !Number.isFinite(delta)) return sizes
  const cfg = normalizeConfigs(rawConfigs)
  const a = sizes[index]
  const b = sizes[index + 1]
  let nextA = constrainSize(a + delta, cfg[index])
  let nextB = constrainSize(b - (nextA - a), cfg[index + 1])
  nextA = a + (b - nextB)
  if (Math.abs(constrainSize(nextA, cfg[index]) - nextA) > 1e-6) return sizes
  if (Math.abs(nextA - a) < EPS) return sizes
  const out = sizes.slice()
  out[index] = nextA
  out[index + 1] = nextB
  return out
}

/** The range panel `index` can take when only the boundary with its next sibling moves (for aria-valuemin / aria-valuemax). */
export function pairRange(sizes: number[], rawConfigs: PanelConfig[], index: number): [number, number] {
  const cfg = normalizeConfigs(rawConfigs)
  const a = sizes[index]
  const b = sizes[index + 1]
  const total = a + b
  const aLo = cfg[index].collapsible ? cfg[index].collapsedSize : cfg[index].min
  const bLo = cfg[index + 1].collapsible ? cfg[index + 1].collapsedSize : cfg[index + 1].min
  return [Math.max(aLo, total - cfg[index + 1].max), Math.min(cfg[index].max, total - bLo)]
}

export function roundSize(v: number): number {
  return Math.round(v * 100) / 100
}
