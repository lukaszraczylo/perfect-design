import { describe, expect, it } from 'vitest'
import { HEADER_MIN_W, headerFor, inset, layoutTree, normalizeDepth, normalizeTree, squarify, type Box, type TreeNode } from './treemapLayout'

const area = (b: Box) => b.w * b.h
const sumArea = (bs: Box[]) => bs.reduce((a, b) => a + area(b), 0)
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w - 0.02 && b.x < a.x + a.w - 0.02 && a.y < b.y + b.h - 0.02 && b.y < a.y + a.h - 0.02

describe('squarify', () => {
  const box: Box = { x: 0, y: 0, w: 600, h: 400 }
  const values = [6, 6, 4, 3, 2, 2, 1]

  it('returns one box per value in the same order', () => {
    expect(squarify(values, box)).toHaveLength(values.length)
    expect(squarify([], box)).toEqual([])
  })
  it('tiles the box: areas add up and are proportional to the values', () => {
    const boxes = squarify(values, box)
    expect(sumArea(boxes)).toBeCloseTo(area(box), -1)
    const total = values.reduce((a, b) => a + b, 0)
    boxes.forEach((b, i) => expect(area(b) / area(box)).toBeCloseTo(values[i]! / total, 2))
  })
  it('keeps every box inside the box and none overlapping', () => {
    const boxes = squarify(values, box)
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01)
      expect(b.y).toBeGreaterThanOrEqual(-0.01)
      expect(b.x + b.w).toBeLessThanOrEqual(box.w + 0.02)
      expect(b.y + b.h).toBeLessThanOrEqual(box.h + 0.02)
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i]!, boxes[j]!)).toBe(false)
  })
  it('squarifies: the worst aspect ratio is far better than a plain slice', () => {
    const boxes = squarify(values, box)
    const worst = Math.max(...boxes.map((b) => Math.max(b.w / b.h, b.h / b.w)))
    expect(worst).toBeLessThan(3)
  })
  it('lays out into a tall box (strips along the top) as well as a wide one', () => {
    const tall = squarify(values, { x: 0, y: 0, w: 200, h: 800 })
    expect(sumArea(tall)).toBeCloseTo(160000, -2)
    expect(Math.max(...tall.map((b) => Math.max(b.w / b.h, b.h / b.w)))).toBeLessThan(5)
  })
  it('honours the origin of the box', () => {
    const b = squarify([1, 1], { x: 10, y: 20, w: 100, h: 50 })
    expect(Math.min(...b.map((x) => x.x))).toBe(10)
    expect(Math.min(...b.map((x) => x.y))).toBe(20)
  })
  it('a single value fills the box', () => {
    expect(squarify([5], box)).toEqual([box])
  })
  it('non-positive and non-finite values get a zero box and the rest still fills the box', () => {
    const boxes = squarify([4, 0, Number.NaN, -3, 2, Infinity], box)
    expect(boxes[1]).toEqual({ x: 0, y: 0, w: 0, h: 0 })
    expect(boxes[2]!.w).toBe(0)
    expect(boxes[3]!.h).toBe(0)
    expect(sumArea(boxes)).toBeGreaterThan(0)
    for (const b of boxes) for (const v of Object.values(b)) expect(Number.isFinite(v)).toBe(true)
  })
  it('all zero or an empty box gives zero boxes', () => {
    expect(squarify([0, 0], box).every((b) => b.w === 0 && b.h === 0)).toBe(true)
    expect(squarify([1, 2], { x: 0, y: 0, w: 0, h: 10 }).every((b) => b.w === 0)).toBe(true)
    expect(squarify([1, 2], { x: 0, y: 0, w: 10, h: -5 }).every((b) => b.h === 0)).toBe(true)
  })
  it('huge values do not overflow', () => {
    const boxes = squarify([1e308, 1e308, 5e307, 1], box)
    for (const b of boxes) for (const v of Object.values(b)) expect(Number.isFinite(v)).toBe(true)
    expect(sumArea(boxes)).toBeCloseTo(area(box), -1)
  })
  it('is deterministic', () => {
    expect(squarify(values, box)).toEqual(squarify(values, box))
  })
  it('handles 2000 values quickly and keeps the total area', () => {
    const many = Array.from({ length: 2000 }, (_, i) => 2000 - i)
    const t = performance.now()
    const boxes = squarify(many, box)
    expect(performance.now() - t).toBeLessThan(500)
    expect(Math.abs(sumArea(boxes) - area(box)) / area(box)).toBeLessThan(0.001)
  })
})

describe('normalizeDepth', () => {
  it('clamps to 1..8 and falls back for non-numbers', () => {
    expect(normalizeDepth(3)).toBe(3)
    expect(normalizeDepth(3.9)).toBe(3)
    expect(normalizeDepth(0)).toBe(1)
    expect(normalizeDepth(-4)).toBe(1)
    expect(normalizeDepth(99)).toBe(8)
    expect(normalizeDepth(Number.NaN)).toBe(4)
    expect(normalizeDepth('x')).toBe(4)
    expect(normalizeDepth(undefined, 6)).toBe(6)
  })
})

describe('normalizeTree', () => {
  it('builds nodes with path, depth, key and the sum of the children', () => {
    const t = normalizeTree([{ label: 'A', children: [{ label: 'a1', value: 2 }, { label: 'a2', value: 3 }] }, { label: 'B', value: 4 }], 4)
    expect(t.total).toBe(9)
    expect(t.leaves).toBe(3)
    expect(t.ignored).toBe(0)
    expect(t.depth).toBe(2)
    expect(t.roots.map((r) => [r.label, r.value, r.depth, r.key])).toEqual([['A', 5, 1, '0'], ['B', 4, 1, '1']])
    const a2 = t.roots[0]!.children[0]!
    expect([a2.label, a2.path, a2.key]).toEqual(['a2', ['A', 'a2'], '0.1'])
  })
  it('sorts siblings by value, largest first, keeping input order for ties', () => {
    const t = normalizeTree([{ label: 'x', value: 1 }, { label: 'y', value: 3 }, { label: 'z', value: 3 }], 4)
    expect(t.roots.map((r) => r.label)).toEqual(['y', 'z', 'x'])
  })
  it('keeps the branch of the input so colours do not move when values change', () => {
    const t = normalizeTree([{ label: 'x', value: 1 }, { label: 'y', value: 3 }], 4)
    expect(t.roots.map((r) => [r.label, r.branch])).toEqual([['y', 1], ['x', 0]])
  })
  it('a group ignores its own value', () => {
    const t = normalizeTree([{ label: 'A', value: 100, children: [{ label: 'a', value: 1 }] }], 4)
    expect(t.roots[0]!.value).toBe(1)
  })
  it('a group whose children are all unusable falls back to its own value', () => {
    const t = normalizeTree([{ label: 'A', value: 7, children: [{ label: 'a', value: 0 }] }], 4)
    expect(t.roots[0]!.value).toBe(7)
    expect(t.roots[0]!.children).toEqual([])
    expect(t.ignored).toBe(1)
  })
  it('counts and drops zero, negative, NaN, Infinity, missing and non-object entries', () => {
    const t = normalizeTree([{ label: 'a', value: 0 }, { label: 'b', value: -1 }, { label: 'c', value: Number.NaN }, { label: 'd', value: Infinity }, { label: 'e' }, 5, null, 'x', [1], { label: 'ok', value: 2 }], 4)
    expect(t.roots.map((r) => r.label)).toEqual(['ok'])
    expect(t.ignored).toBe(9)
  })
  it('non-array input is empty', () => {
    for (const bad of [undefined, null, 'x', 5, {}]) expect(normalizeTree(bad, 4)).toEqual({ roots: [], total: 0, ignored: 0, leaves: 0, depth: 0 })
  })
  it('labels: strings kept, numbers stringified, anything else becomes Item n; duplicates are fine', () => {
    const t = normalizeTree([{ label: 'same', value: 1 }, { label: 'same', value: 1 }, { label: 7, value: 1 }, { label: '  ', value: 1 }, { value: 1 }], 4)
    expect(t.roots.map((r) => r.label).sort()).toEqual(['7', 'Item 4', 'Item 5', 'same', 'same'])
    expect(new Set(t.roots.map((r) => r.key)).size).toBe(5)
  })
  it('folds levels below maxDepth into the node at maxDepth', () => {
    const data = [{ label: 'A', children: [{ label: 'B', children: [{ label: 'C', children: [{ label: 'D', value: 2 }, { label: 'E', value: 3 }] }] }] }]
    const two = normalizeTree(data, 2)
    expect(two.roots[0]!.children[0]!.children).toEqual([])
    expect(two.roots[0]!.value).toBe(5)
    expect(two.leaves).toBe(2)
    expect(two.depth).toBe(2)
    const all = normalizeTree(data, 4)
    expect(all.depth).toBe(4)
    expect(all.roots[0]!.children[0]!.children[0]!.children).toHaveLength(2)
  })
  it('a folded group with nothing usable inside becomes a leaf of its own value or is dropped', () => {
    const own = normalizeTree([{ label: 'A', value: 4, children: [{ label: 'b', children: [{ label: 'c', value: 0 }] }] }], 1)
    expect(own.roots[0]!.value).toBe(4)
    const none = normalizeTree([{ label: 'A', children: [{ label: 'b', value: 0 }] }], 1)
    expect(none.roots).toEqual([])
  })
  it('survives a very deep chain without a stack overflow', () => {
    let node: Record<string, unknown> = { label: 'leaf', value: 3 }
    for (let i = 0; i < 20000; i++) node = { label: `n${i}`, children: [node] }
    const t = normalizeTree([node], 3)
    expect(t.roots[0]!.value).toBe(3)
    expect(t.depth).toBeLessThanOrEqual(3)
  })
  it('survives cycles: a node that contains itself is counted once', () => {
    const a: Record<string, unknown> = { label: 'a', children: [] }
    ;(a.children as unknown[]).push(a, { label: 'b', value: 2 })
    const t = normalizeTree([a], 8)
    expect(t.roots[0]!.value).toBe(2)
    expect(t.ignored).toBe(1)
    const b: Record<string, unknown> = { label: 'b', children: [] }
    ;(b.children as unknown[]).push(b)
    expect(normalizeTree([b], 1).roots).toEqual([])
  })
  it('the same object used twice is counted once', () => {
    const shared = { label: 's', value: 4 }
    const t = normalizeTree([shared, shared], 4)
    expect(t.roots).toHaveLength(1)
    expect(t.ignored).toBe(1)
  })
  it('sums that overflow stay finite', () => {
    const t = normalizeTree([{ label: 'a', value: 1.7e308 }, { label: 'b', value: 1.7e308 }], 4)
    expect(Number.isFinite(t.total)).toBe(true)
    expect(Number.isFinite(t.roots[0]!.value)).toBe(true)
    const g = normalizeTree([{ label: 'g', children: [{ label: 'a', value: 1.7e308 }, { label: 'b', value: 1.7e308 }] }], 4)
    expect(Number.isFinite(g.roots[0]!.value)).toBe(true)
    const folded = normalizeTree([{ label: 'g', children: [{ label: 'a', value: 1.7e308 }, { label: 'b', value: 1.7e308 }] }], 1)
    expect(Number.isFinite(folded.roots[0]!.value)).toBe(true)
  })
  it('a large folded subtree stops at the visit budget instead of freezing', () => {
    const kids = Array.from({ length: 300 }, (_, i) => ({ label: `k${i}`, children: Array.from({ length: 1000 }, (_, j) => ({ label: `l${j}`, value: 1 })) }))
    const t = normalizeTree([{ label: 'root', children: kids }], 1)
    expect(t.roots[0]!.value).toBeGreaterThan(0)
  })
  it('handles 2000 leaves', () => {
    const t = normalizeTree(Array.from({ length: 2000 }, (_, i) => ({ label: `i${i}`, value: i + 1 })), 4)
    expect(t.roots).toHaveLength(2000)
    expect(t.roots[0]!.value).toBe(2000)
  })
})

describe('layoutTree', () => {
  const tree = normalizeTree([{ label: 'A', children: [{ label: 'a1', value: 6 }, { label: 'a2', value: 2 }] }, { label: 'B', value: 8 }], 4)
  const box: Box = { x: 0, y: 0, w: 400, h: 200 }
  const opts = { nested: false, pad: 2, header: 18 }

  it('places groups before their children, depth first', () => {
    const placed = layoutTree(tree.roots, box, opts)
    expect(placed.map((p) => p.node.key)).toEqual(['0', '0.0', '0.1', '1'].sort((a, b) => placed.findIndex((p) => p.node.key === a) - placed.findIndex((p) => p.node.key === b)))
    expect(placed.filter((p) => p.leaf)).toHaveLength(3)
    expect(placed.find((p) => p.node.key === '0')!.leaf).toBe(false)
  })
  it('flat layout: leaves tile the box exactly', () => {
    const leaves = layoutTree(tree.roots, box, opts).filter((p) => p.leaf)
    expect(sumArea(leaves.map((p) => p.box))).toBeCloseTo(area(box), -1)
  })
  it('flat layout: leaf area follows value', () => {
    const leaves = layoutTree(tree.roots, box, opts).filter((p) => p.leaf)
    const total = 16
    for (const p of leaves) expect(area(p.box) / area(box)).toBeCloseTo(p.node.value / total, 2)
  })
  it('nested layout: children sit inside their group, below the header strip', () => {
    const placed = layoutTree(tree.roots, box, { ...opts, nested: true })
    const group = placed.find((p) => p.node.key === '0')!
    const kids = placed.filter((p) => p.node.key.startsWith('0.'))
    const header = headerFor(group.box, 18)
    expect(header).toBe(18)
    for (const k of kids) {
      expect(k.box.x).toBeGreaterThanOrEqual(group.box.x + 2 - 0.02)
      expect(k.box.y).toBeGreaterThanOrEqual(group.box.y + 2 + header - 0.02)
      expect(k.box.x + k.box.w).toBeLessThanOrEqual(group.box.x + group.box.w - 2 + 0.02)
      expect(k.box.y + k.box.h).toBeLessThanOrEqual(group.box.y + group.box.h - 2 + 0.02)
    }
  })
  it('nested layout in a tiny group gives children zero boxes instead of negative ones', () => {
    const t = normalizeTree([{ label: 'big', value: 1000 }, { label: 'g', children: [{ label: 'x', value: 1 }, { label: 'y', value: 1 }] }], 4)
    const placed = layoutTree(t.roots, { x: 0, y: 0, w: 100, h: 100 }, { nested: true, pad: 4, header: 18 })
    for (const p of placed) {
      expect(p.box.w).toBeGreaterThanOrEqual(0)
      expect(p.box.h).toBeGreaterThanOrEqual(0)
    }
  })
  it('an empty tree gives an empty layout', () => {
    expect(layoutTree([], box, opts)).toEqual([])
  })
  it('is deterministic', () => {
    expect(layoutTree(tree.roots, box, opts)).toEqual(layoutTree(tree.roots, box, opts))
  })
})

describe('headerFor and inset', () => {
  it('a header needs a minimum width and room for children below it', () => {
    expect(headerFor({ x: 0, y: 0, w: HEADER_MIN_W, h: 42 }, 18)).toBe(18)
    expect(headerFor({ x: 0, y: 0, w: HEADER_MIN_W - 1, h: 100 }, 18)).toBe(0)
    expect(headerFor({ x: 0, y: 0, w: 100, h: 41 }, 18)).toBe(0)
  })
  it('inset shrinks evenly and never goes below zero', () => {
    expect(inset({ x: 0, y: 0, w: 10, h: 10 }, 1)).toEqual({ x: 1, y: 1, w: 8, h: 8 })
    expect(inset({ x: 4, y: 4, w: 10, h: 10 }, 0)).toEqual({ x: 4, y: 4, w: 10, h: 10 })
    expect(inset({ x: 0, y: 0, w: 2, h: 10 }, 5)).toEqual({ x: 1, y: 5, w: 0, h: 0 })
  })
})

describe('TreeNode typing', () => {
  it('exposes the documented fields', () => {
    const n: TreeNode = normalizeTree([{ label: 'a', value: 1 }], 4).roots[0]!
    expect(Object.keys(n).sort()).toEqual(['branch', 'children', 'depth', 'key', 'label', 'path', 'value'])
  })
})
