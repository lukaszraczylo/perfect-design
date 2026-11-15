/**
 * Pure helpers of Treemap: tolerant tree normalisation and the squarified layout (Bruls, Huizing, van Wijk).
 * No Vue, no DOM, no randomness: the same input always gives the same boxes.
 */
import { isFiniteNumber, r2 } from '../_chart/chartMath'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface TreeNode {
  /** Index path joined with dots, e.g. `0.2.1`. Unique inside one tree. */
  key: string
  label: string
  /** Own value for a leaf, the sum of the children for a group. Always finite and > 0. */
  value: number
  /** 1 for a top-level node. */
  depth: number
  /** Labels from the top-level node down to this one. */
  path: string[]
  children: TreeNode[]
  /** Index of the top-level node this node belongs to in the input (colours stay put when values change). */
  branch: number
}

export interface NormalizedTree {
  roots: TreeNode[]
  total: number
  /** Entries that were dropped: not an object, repeated object, or a leaf value that is not a positive finite number. */
  ignored: number
  leaves: number
  /** Deepest level that was kept. */
  depth: number
}

export const MAX_DEPTH = 8
/** Upper bound of the nodes visited when a collapsed subtree is summed, so a huge input cannot stall the page. */
const VISIT_BUDGET = 200_000

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Integer depth limit in 1..MAX_DEPTH (non-finite input gives the default 4). */
export function normalizeDepth(v: unknown, fallback = 4): number {
  return isFiniteNumber(v) ? Math.min(MAX_DEPTH, Math.max(1, Math.floor(v))) : fallback
}

const addSafe = (a: number, b: number) => {
  const s = a + b
  return Number.isFinite(s) ? s : Number.MAX_VALUE
}

/** Sum of every positive finite leaf value below `root` (iterative: a 100000-level chain cannot overflow the stack). */
function sumLeaves(root: Record<string, unknown>, seen: WeakSet<object>, state: { ignored: number; visits: number }): { sum: number; leaves: number } {
  let sum = 0
  let leaves = 0
  const stack: Record<string, unknown>[] = [root]
  while (stack.length > 0 && state.visits < VISIT_BUDGET) {
    const node = stack.pop()!
    state.visits++
    const kids = Array.isArray(node.children) ? node.children : []
    let counted = false
    for (const kid of kids) {
      if (!isRecord(kid) || seen.has(kid)) {
        state.ignored++
        continue
      }
      seen.add(kid)
      stack.push(kid)
      counted = true
    }
    if (!counted && node !== root) {
      if (isFiniteNumber(node.value) && node.value > 0) {
        sum = addSafe(sum, node.value)
        leaves++
      } else state.ignored++
    }
  }
  return { sum, leaves }
}

/**
 * Tolerant normalisation of `{ label, value?, children? }` data. A node with usable children takes the sum of them as
 * its value (its own `value` is ignored); a node without children needs a positive finite `value`. Levels below `maxDepth`
 * are folded into the node at `maxDepth`. Siblings are sorted by value, largest first (stable).
 */
export function normalizeTree(data: unknown, maxDepth: number): NormalizedTree {
  const limit = normalizeDepth(maxDepth)
  const seen = new WeakSet<object>()
  const state = { ignored: 0, visits: 0 }
  let leaves = 0
  let deepest = 0

  const build = (raw: unknown, index: number, depth: number, parentPath: string[], parentKey: string, branch: number): TreeNode | null => {
    if (!isRecord(raw) || seen.has(raw)) {
      state.ignored++
      return null
    }
    seen.add(raw)
    const label = typeof raw.label === 'string' && raw.label.trim() !== '' ? raw.label : isFiniteNumber(raw.label) ? String(raw.label) : `Item ${index + 1}`
    const key = parentKey === '' ? String(index) : `${parentKey}.${index}`
    const path = [...parentPath, label]
    const hasKids = Array.isArray(raw.children) && raw.children.length > 0
    if (hasKids && depth < limit) {
      const children: TreeNode[] = []
      ;(raw.children as unknown[]).forEach((c, i) => {
        const n = build(c, i, depth + 1, path, key, branch)
        if (n) children.push(n)
      })
      if (children.length > 0) {
        children.sort((a, b) => b.value - a.value)
        const value = children.reduce((acc, c) => addSafe(acc, c.value), 0)
        deepest = Math.max(deepest, depth)
        return { key, label, value, depth, path, children, branch }
      }
      return finishLeaf(raw, key, label, depth, path, branch)
    }
    if (hasKids) {
      const { sum, leaves: n } = sumLeaves(raw, seen, state)
      if (sum > 0) {
        leaves += n
        deepest = Math.max(deepest, depth)
        return { key, label, value: sum, depth, path, children: [], branch }
      }
    }
    return finishLeaf(raw, key, label, depth, path, branch)
  }

  const finishLeaf = (raw: Record<string, unknown>, key: string, label: string, depth: number, path: string[], branch: number): TreeNode | null => {
    if (!isFiniteNumber(raw.value) || raw.value <= 0) {
      state.ignored++
      return null
    }
    leaves++
    deepest = Math.max(deepest, depth)
    return { key, label, value: raw.value, depth, path, children: [], branch }
  }

  const roots: TreeNode[] = []
  const list = Array.isArray(data) ? data : []
  list.forEach((raw, i) => {
    const n = build(raw, i, 1, [], '', i)
    if (n) roots.push(n)
  })
  roots.sort((a, b) => b.value - a.value)
  const total = roots.reduce((acc, n) => addSafe(acc, n.value), 0)
  return { roots, total, ignored: state.ignored, leaves, depth: deepest }
}

const ZERO = (b: Box): Box => ({ x: r2(b.x), y: r2(b.y), w: 0, h: 0 })

/**
 * Squarified treemap of `values` (largest first, as `normalizeTree` returns them) inside `box`. Returns one box per
 * value in the same order; a value that is not positive gets a zero-size box. The boxes tile `box` exactly.
 */
export function squarify(values: readonly number[], box: Box): Box[] {
  const n = values.length
  if (n === 0) return []
  let top = 0
  for (const v of values) if (isFiniteNumber(v) && v > top) top = v
  const ok = top > 0 && box.w > 0 && box.h > 0
  if (!ok) return values.map(() => ZERO(box))
  const rel = values.map((v) => (isFiniteNumber(v) && v > 0 ? v / top : 0))
  const sum = rel.reduce((a, b) => a + b, 0)
  const scale = (box.w * box.h) / sum
  const areas = rel.map((v) => v * scale)
  const out: Box[] = values.map(() => ZERO(box))

  let { x, y, w, h } = box
  let i = 0
  while (i < n && areas[i]! > 0) {
    const side = Math.min(w, h)
    let end = i + 1
    let rowSum = areas[i]!
    let worst = worstRatio(rowSum, areas[i]!, areas[i]!, side)
    while (end < n && areas[end]! > 0) {
      const nextSum = rowSum + areas[end]!
      const next = worstRatio(nextSum, areas[i]!, areas[end]!, side)
      if (next > worst) break
      rowSum = nextSum
      worst = next
      end++
    }
    const last = end >= n || areas[end]! <= 0
    if (w >= h) {
      const strip = last ? w : Math.min(w, rowSum / h)
      let cy = y
      for (let k = i; k < end; k++) {
        const ch = last && k === end - 1 ? y + h - cy : (areas[k]! / rowSum) * h
        out[k] = { x: r2(x), y: r2(cy), w: r2(strip), h: r2(ch) }
        cy += ch
      }
      x += strip
      w -= strip
    } else {
      const strip = last ? h : Math.min(h, rowSum / w)
      let cx = x
      for (let k = i; k < end; k++) {
        const cw = last && k === end - 1 ? x + w - cx : (areas[k]! / rowSum) * w
        out[k] = { x: r2(cx), y: r2(y), w: r2(cw), h: r2(strip) }
        cx += cw
      }
      y += strip
      h -= strip
    }
    i = end
  }
  return out
}

/** Worst aspect ratio of a row with total area `sum`, largest item `max`, smallest item `min`, laid along `side`. */
function worstRatio(sum: number, max: number, min: number, side: number): number {
  const s2 = side * side
  const t2 = sum * sum
  return Math.max((s2 * max) / t2, t2 / (s2 * min))
}

export interface Placed {
  node: TreeNode
  box: Box
  leaf: boolean
}

export interface LayoutOptions {
  /** Draw groups as containers: children are laid out inside the group, below its header strip. */
  nested: boolean
  /** Padding inside a container (px). */
  pad: number
  /** Height of the label strip of a container (px). */
  header: number
}

/** Smallest box that still gets a header strip. */
export const HEADER_MIN_W = 48

/** Height of the header strip a nested group of size `b` gets: `header`, or 0 when the box is too small for one. */
export function headerFor(b: Box, header: number): number {
  return b.w >= HEADER_MIN_W && b.h >= header + 24 ? header : 0
}

/** Lays out the whole tree depth first: groups come before their children, siblings in value order. */
export function layoutTree(roots: readonly TreeNode[], box: Box, opts: LayoutOptions): Placed[] {
  const out: Placed[] = []
  const place = (nodes: readonly TreeNode[], area: Box) => {
    const boxes = squarify(nodes.map((n) => n.value), area)
    nodes.forEach((node, i) => {
      const b = boxes[i]!
      const leaf = node.children.length === 0
      out.push({ node, box: b, leaf })
      if (leaf) return
      if (!opts.nested) return place(node.children, b)
      const header = headerFor(b, opts.header)
      place(node.children, {
        x: b.x + opts.pad,
        y: b.y + opts.pad + header,
        w: Math.max(0, b.w - 2 * opts.pad),
        h: Math.max(0, b.h - 2 * opts.pad - header),
      })
    })
  }
  place(roots, box)
  return out
}

/** `box` shrunk by `by` on every side (never below zero size). */
export function inset(box: Box, by: number): Box {
  const w = Math.max(0, box.w - 2 * by)
  const h = Math.max(0, box.h - 2 * by)
  return { x: r2(box.x + (box.w - w) / 2), y: r2(box.y + (box.h - h) / 2), w: r2(w), h: r2(h) }
}
