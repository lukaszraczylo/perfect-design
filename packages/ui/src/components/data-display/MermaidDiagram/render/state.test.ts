import { describe, expect, it } from 'vitest'
import { parseMermaid } from '../parse'
import { renderModel } from '../render'
import type { RenderModel, RenderOptions, RShape, RText, RPath } from '../../_diagram/types'

const draw = (src: string, opts: RenderOptions = {}): RenderModel => {
  const p = parseMermaid(src)
  if (!p.ok) throw new Error(JSON.stringify(p.errors))
  const r = renderModel(p.ast, opts)
  if (!r.ok) throw new Error(JSON.stringify(r.error))
  return r.model
}
const fails = (src: string, opts: RenderOptions = {}) => {
  const p = parseMermaid(src)
  if (!p.ok) throw new Error(JSON.stringify(p.errors))
  const r = renderModel(p.ast, opts)
  if (r.ok) throw new Error('expected a render error')
  return r.error
}

interface Bbox { x0: number; y0: number; x1: number; y1: number }
/** Bounding box of a path made of absolute M L H V A C Q Z commands. */
function bbox(d: string): Bbox {
  const b: Bbox = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
  let cx = 0
  let cy = 0
  const add = (x: number, y: number) => {
    b.x0 = Math.min(b.x0, x)
    b.y0 = Math.min(b.y0, y)
    b.x1 = Math.max(b.x1, x)
    b.y1 = Math.max(b.y1, y)
  }
  for (const m of d.matchAll(/([MLHVCQAZ])([^MLHVCQAZ]*)/g)) {
    const n = (m[2]!.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
    switch (m[1]) {
      case 'M': case 'L': cx = n[0]!; cy = n[1]!; add(cx, cy); break
      case 'H': cx = n[0]!; add(cx, cy); break
      case 'V': cy = n[0]!; add(cx, cy); break
      case 'A': {
        // half ellipses (circle outlines) reach rx/ry beyond the chord; corner arcs stay inside their end points
        const [rx, ry, , , , ex, ey] = n as [number, number, number, number, number, number, number]
        if (Math.abs(ey - cy) < 0.01 && Math.abs(Math.abs(ex - cx) - 2 * rx) < 0.05) {
          add((ex + cx) / 2, cy - ry)
          add((ex + cx) / 2, cy + ry)
        }
        cx = ex; cy = ey; add(cx, cy); break
      }
      case 'C': for (let i = 0; i < n.length; i += 2) add(n[i]!, n[i + 1]!); cx = n[n.length - 2]!; cy = n[n.length - 1]!; break
      case 'Q': for (let i = 0; i < n.length; i += 2) add(n[i]!, n[i + 1]!); cx = n[n.length - 2]!; cy = n[n.length - 1]!; break
    }
  }
  return b
}
const shapes = (m: RenderModel) => m.items.filter((i): i is RShape => i.kind === 'shape')
const paths = (m: RenderModel) => m.items.filter((i): i is RPath => i.kind === 'path')
const texts = (m: RenderModel) => m.items.filter((i): i is RText => i.kind === 'text')
const NODE_ROLES = ['node', 'start', 'end', 'choice', 'bar', 'note']
const nodeBoxes = (m: RenderModel) => shapes(m).filter((s) => NODE_ROLES.includes(s.role)).map((s) => ({ s, b: bbox(s.d) }))
const byId = (m: RenderModel, id: string) => shapes(m).find((s) => s.id === id)!
const inside = (p: { x: number; y: number }, b: Bbox, tol = 2) => p.x >= b.x0 - tol && p.x <= b.x1 + tol && p.y >= b.y0 - tol && p.y <= b.y1 + tol
const ends = (d: string) => {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  return { start: { x: n[0]!, y: n[1]! }, end: { x: n[n.length - 2]!, y: n[n.length - 1]! } }
}

const MACHINE = `stateDiagram-v2
  [*] --> Idle
  Idle --> Active : start
  state Active {
    [*] --> Running
    Running --> Paused : pause
    Paused --> Running : resume
    Running --> [*]
  }
  Active --> Idle : stop
  Active --> [*]`

const RICH = `stateDiagram-v2
  [*] --> Draft
  state "Waiting for review" as Review
  Review : assigned to a reviewer
  Review : due in two days
  Draft --> Review : submit
  state gate <<choice>>
  Review --> gate
  gate --> Published : approved
  gate --> Draft : rejected
  state fork1 <<fork>>
  state join1 <<join>>
  Published --> fork1
  fork1 --> Indexed
  fork1 --> Mailed
  Indexed --> join1
  Mailed --> join1
  join1 --> [*]
  note left of Draft : created by the author
  note right of Published
    visible to everyone
    cached for an hour
  end note
  classDef hot stroke-width:3px,stroke:#f00
  class Mailed hot`

const check = (m: RenderModel) => {
  for (const it of m.items) {
    const strings = it.kind === 'text' ? it.lines : [it.d]
    for (const s of strings) {
      expect(s).not.toMatch(/NaN|undefined|Infinity/)
    }
    if (it.kind === 'text') {
      expect(it.x).toBeGreaterThanOrEqual(0)
      expect(it.x).toBeLessThanOrEqual(m.width)
      expect(it.y).toBeGreaterThanOrEqual(0)
      expect(it.y).toBeLessThanOrEqual(m.height)
      expect(it.size).toBeGreaterThanOrEqual(m.fontSize)
    } else {
      const b = bbox(it.d)
      expect(b.x0).toBeGreaterThanOrEqual(-0.5)
      expect(b.y0).toBeGreaterThanOrEqual(-0.5)
      expect(b.x1).toBeLessThanOrEqual(m.width + 0.5)
      expect(b.y1).toBeLessThanOrEqual(m.height + 0.5)
    }
  }
  const boxes = nodeBoxes(m)
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!.b
      const c = boxes[j]!.b
      const overlap = a.x0 < c.x1 - 0.5 && c.x0 < a.x1 - 0.5 && a.y0 < c.y1 - 0.5 && c.y0 < a.y1 - 0.5
      expect(overlap, `${boxes[i]!.s.role}:${boxes[i]!.s.id} overlaps ${boxes[j]!.s.role}:${boxes[j]!.s.id}`).toBe(false)
    }
  }
}

describe('state render: model', () => {
  it('draws a small machine and counts states and transitions', () => {
    const m = draw(MACHINE)
    expect(m.type).toBe('state')
    expect(m.nodes).toBe(4)
    expect(m.edges).toBe(8)
    expect(m.fontSize).toBe(14)
    expect(m.summary).toBe('State diagram with 4 states and 8 transitions, with 1 composite state, top to bottom')
    check(m)
    expect(m.width).toBeGreaterThan(100)
    expect(m.height).toBeGreaterThan(100)
  })

  it('has no overlaps or bad numbers in a diagram that uses every feature', () => {
    for (const direction of ['TB', 'BT', 'LR', 'RL'] as const) {
      const m = draw(RICH, { direction })
      check(m)
      expect(m.nodes).toBe(5)
      expect(m.edges).toBe(11)
    }
  })

  it('keeps start and end visually distinct and draws pseudo states as shapes', () => {
    const m = draw('stateDiagram-v2\n[*] --> A\nA --> [*]')
    const start = shapes(m).find((s) => s.role === 'start')!
    const end = shapes(m).find((s) => s.role === 'end')!
    const dot = shapes(m).find((s) => s.role === 'end-dot')!
    expect(start.paint).toMatchObject({ fill: 'solid', stroke: 'none' })
    expect(end.paint).toMatchObject({ fill: 'surface', stroke: 'normal' })
    expect(dot.paint.fill).toBe('solid')
    const bs = bbox(start.d)
    const be = bbox(end.d)
    expect(be.x1 - be.x0).toBeGreaterThan(bs.x1 - bs.x0)
    const bd = bbox(dot.d)
    expect(bd.x0).toBeGreaterThan(be.x0)
    expect(bd.x1).toBeLessThan(be.x1)
  })

  it('draws a choice as a diamond and fork and join as bars across the flow', () => {
    const src = 'stateDiagram-v2\nstate c <<choice>>\nstate f <<fork>>\nA --> f\nf --> c\nc --> B'
    const tb = draw(src)
    const choice = bbox(byId(tb, 'c').d)
    expect(choice.x1 - choice.x0).toBeCloseTo(choice.y1 - choice.y0, 1)
    expect(byId(tb, 'c').d).toMatch(/^M[\d.,]+L[\d.,]+L[\d.,]+L[\d.,]+Z$/)
    const barTb = bbox(byId(tb, 'f').d)
    expect(barTb.x1 - barTb.x0).toBeGreaterThan(3 * (barTb.y1 - barTb.y0))
    expect(byId(tb, 'f').paint.fill).toBe('solid')
    const lr = draw(src, { direction: 'LR' })
    const barLr = bbox(byId(lr, 'f').d)
    expect(barLr.y1 - barLr.y0).toBeGreaterThan(3 * (barLr.x1 - barLr.x0))
  })

  it('draws states as rounded rectangles that follow the rounded prop', () => {
    const src = 'stateDiagram-v2\nA --> B'
    const round = byId(draw(src, { rounded: 'md' }), 'A').d
    const square = byId(draw(src, { rounded: 'none' }), 'A').d
    expect(round).toContain('A8,8')
    expect(square).not.toContain('A')
  })

  it('draws a state with descriptions as title, hairline and left aligned lines', () => {
    const m = draw('stateDiagram-v2\nstate "Review" as R\nR : line one\nR : line two\nR --> Done')
    const title = texts(m).find((t) => t.role === 'node-label' && t.lines[0] === 'Review')!
    const desc = texts(m).find((t) => t.role === 'node-description')!
    expect(title.bold).toBe(true)
    expect(desc.lines).toEqual(['line one', 'line two'])
    expect(desc.anchor).toBe('start')
    const rule = paths(m).find((p) => p.role === 'node-divider')!
    expect(rule.faint).toBe(true)
    const box = bbox(byId(m, 'R').d)
    const rb = bbox(rule.d)
    expect(rb.y0).toBeGreaterThan(title.y)
    expect(rb.y0).toBeLessThan(desc.y - 10)
    expect(rb.x0).toBeCloseTo(box.x0, 1)
    expect(rb.x1).toBeCloseTo(box.x1, 1)
    expect(desc.x).toBeGreaterThan(box.x0)
    // plain states are not bold
    expect(texts(draw('stateDiagram-v2\nA --> B')).find((t) => t.lines[0] === 'A')!.bold).toBeUndefined()
  })

  it('makes a state wide enough for long text and wraps very long words', () => {
    const m = draw(`stateDiagram-v2\nA --> B\nB : ${'word '.repeat(80)}\nA : ${'x'.repeat(300)}`)
    check(m)
    expect(texts(m).find((t) => t.role === 'node-description')!.lines.length).toBeGreaterThan(5)
  })

  it('draws composites as clusters titled with their own name, nesting inside each other', () => {
    const m = draw('stateDiagram-v2\nstate "Outer title" as O {\n  state I {\n    A --> B\n  }\n}\nO --> Z')
    const clusters = shapes(m).filter((s) => s.role === 'cluster')
    expect(clusters.map((c) => c.id)).toEqual(['s:O', 's:I'])
    const outer = bbox(clusters[0]!.d)
    const inner = bbox(clusters[1]!.d)
    expect(inner.x0).toBeGreaterThan(outer.x0)
    expect(inner.x1).toBeLessThan(outer.x1)
    expect(inner.y0).toBeGreaterThan(outer.y0)
    expect(inner.y1).toBeLessThan(outer.y1)
    expect(texts(m).filter((t) => t.role === 'cluster-title').map((t) => t.lines[0])).toEqual(['Outer title', 'I'])
    expect(clusters[0]!.paint.dash).toBeUndefined()
    for (const id of ['A', 'B']) {
      const b = bbox(byId(m, id).d)
      expect(b.x0).toBeGreaterThan(inner.x0)
      expect(b.x1).toBeLessThan(inner.x1)
      expect(b.y0).toBeGreaterThan(inner.y0)
      expect(b.y1).toBeLessThan(inner.y1)
    }
  })

  it('draws an empty composite', () => {
    const m = draw('stateDiagram-v2\nstate P {\n}\nP --> A')
    check(m)
    expect(shapes(m).some((s) => s.role === 'cluster' && s.id === 's:P')).toBe(true)
  })

  it('attaches transitions to the composite box', () => {
    const m = draw(MACHINE)
    const cluster = bbox(shapes(m).find((s) => s.role === 'cluster')!.d)
    const idle = bbox(byId(m, 'Idle').d)
    const edge = paths(m).find((p) => p.id === 't1')!
    expect(inside(ends(edge.d).start, idle)).toBe(true)
    expect(inside(ends(edge.d).end, cluster)).toBe(true)
  })

  it('connects every transition between its two shapes', () => {
    const p = parseMermaid(RICH)
    if (!p.ok) throw new Error('parse')
    const m = draw(RICH)
    const ast = p.ast as { states: { id: string }[]; transitions: { index: number; from: string; to: string }[] }
    const box = (id: string) => bbox(shapes(m).find((s) => s.id === id || s.id === `s:${id}`)!.d)
    for (const t of ast.transitions) {
      const path = paths(m).find((x) => x.id === `t${t.index}`)!
      expect(path.markerEnd).toBe('arrow')
      expect(inside(ends(path.d).start, box(t.from)), `start of ${t.from}->${t.to}`).toBe(true)
      expect(inside(ends(path.d).end, box(t.to)), `end of ${t.from}->${t.to}`).toBe(true)
    }
  })

  it('draws a self transition as a loop', () => {
    const m = draw('stateDiagram-v2\nA --> A : retry\nA --> B')
    check(m)
    const loop = paths(m).find((p) => p.id === 't0')!
    expect(loop.d).toContain('C')
    expect(texts(m).some((t) => t.role === 'edge-label' && t.lines[0] === 'retry')).toBe(true)
  })

  it('draws labels on plates and never draws the diagram title in the SVG', () => {
    const m = draw('---\ntitle: Pickup flow\n---\nstateDiagram-v2\nA --> B : go')
    expect(m.title).toBe('Pickup flow')
    expect(texts(m).some((t) => t.lines.join(' ').includes('Pickup'))).toBe(false)
    expect(shapes(m).some((s) => s.role === 'edge-label-plate' && s.paint.fill === 'canvas')).toBe(true)
  })

  it('draws notes beside their state as folded boxes with a dotted connector, without a visible group', () => {
    const m = draw('stateDiagram-v2\nA --> B\nnote left of B : on the left\nnote right of B : on the right')
    check(m)
    expect(shapes(m).filter((s) => s.role === 'note')).toHaveLength(2)
    expect(shapes(m).some((s) => s.role === 'cluster')).toBe(false)
    expect(texts(m).some((t) => t.role === 'cluster-title')).toBe(false)
    expect(paths(m).filter((p) => p.style === 'dotted')).toHaveLength(2)
    expect(paths(m).filter((p) => p.role === 'note-fold')).toHaveLength(2)
    const left = texts(m).find((t) => t.lines[0] === 'on the left')!
    const right = texts(m).find((t) => t.lines[0] === 'on the right')!
    const b = bbox(byId(m, 'B').d)
    expect(left.x).toBeLessThan(b.x0)
    expect(right.x).toBeGreaterThan(b.x1)
    // across the flow in TB; in LR the notes sit above and below instead
    const lr = draw('stateDiagram-v2\nA --> B\nnote left of B : on the left\nnote right of B : on the right', { direction: 'LR' })
    check(lr)
    const lb = bbox(byId(lr, 'B').d)
    expect(texts(lr).find((t) => t.lines[0] === 'on the left')!.y).toBeLessThan(lb.y0)
    expect(texts(lr).find((t) => t.lines[0] === 'on the right')!.y).toBeGreaterThan(lb.y1)
  })

  it('puts a note on a composite state and on states inside composites', () => {
    const m = draw('stateDiagram-v2\nstate P {\n  A --> B\n  note right of A : inner\n}\nnote left of P : outer\nP --> C')
    check(m)
    expect(shapes(m).filter((s) => s.role === 'note')).toHaveLength(2)
    const p = bbox(byId(m, 's:P').d)
    const inner = texts(m).find((t) => t.lines[0] === 'inner')!
    expect(inside({ x: inner.x, y: inner.y }, p, 0)).toBe(true)
    const outer = texts(m).find((t) => t.lines[0] === 'outer')!
    expect(outer.x).toBeLessThan(p.x0)
  })

  it('maps classes to tone, dashed and thick, and honours the tone option', () => {
    const src = 'stateDiagram-v2\nclassDef bad stroke:#f00,stroke-width:3px\nclassDef soft stroke-dasharray:4\nA --> B\nA --> C\nclass A bad\nclass B soft\nclass C success'
    const m = draw(src)
    expect(byId(m, 'A').paint).toMatchObject({ tone: 'danger', stroke: 'thick' })
    expect(byId(m, 'B').paint).toMatchObject({ dash: 'dashed', stroke: 'normal' })
    expect(byId(m, 'C').paint.tone).toBe('success')
    expect(byId(draw('stateDiagram-v2\nA --> B', { tone: 'info' }), 'A').paint.tone).toBe('info')
    const comp = draw('stateDiagram-v2\nclassDef hot stroke:#f00\nstate P:::hot {\n  A --> B\n}')
    expect(shapes(comp).find((s) => s.role === 'cluster')!.paint.tone).toBe('danger')
    const styled = draw('stateDiagram-v2\nclassDef x stroke-width:3px,stroke-dasharray:4\nstate P {\n  A --> B\n}\nclass P x')
    expect(shapes(styled).find((s) => s.role === 'cluster')!.paint).toMatchObject({ stroke: 'normal', dash: 'dashed' })
    const bar = draw('stateDiagram-v2\nstate f <<fork>>\nA --> f\nclass f success')
    expect(byId(bar, 'f').paint.tone).toBe('success')
  })

  it('never emits colours, html or markup', () => {
    const m = draw(RICH)
    const json = JSON.stringify(m.items)
    expect(json).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|<svg|<div|style=/i)
  })

  it('is deterministic', () => {
    expect(draw(RICH)).toEqual(draw(RICH))
    expect(draw(MACHINE, { direction: 'LR', edgeStyle: 'orthogonal' })).toEqual(draw(MACHINE, { direction: 'LR', edgeStyle: 'orthogonal' }))
  })
})

describe('state render: options', () => {
  it('changes the layout with the direction option and the direction line', () => {
    const src = 'stateDiagram-v2\nA --> B\nB --> C\nC --> D'
    const tb = draw(src)
    const lr = draw(src, { direction: 'LR' })
    expect(tb.height).toBeGreaterThan(tb.width)
    expect(lr.width).toBeGreaterThan(lr.height)
    expect(draw(`stateDiagram-v2\ndirection LR\nA --> B\nB --> C\nC --> D`)).toEqual(lr)
    expect(draw(src, { direction: 'TB' })).toEqual(draw('stateDiagram-v2\ndirection LR\nA --> B\nB --> C\nC --> D', { direction: 'TB' }))
    const bt = draw(src, { direction: 'BT' })
    expect(bbox(byId(bt, 'A').d).y0).toBeGreaterThan(bbox(byId(bt, 'D').d).y0)
    const rl = draw(src, { direction: 'RL' })
    expect(bbox(byId(rl, 'A').d).x0).toBeGreaterThan(bbox(byId(rl, 'D').d).x0)
    expect(lr.summary).toContain('left to right')
    expect(bt.summary).toContain('bottom to top')
    expect(rl.summary).toContain('right to left')
  })

  it('lets a composite choose its own direction', () => {
    const m = draw('stateDiagram-v2\nstate P {\n  direction LR\n  A --> B\n  B --> C\n}')
    const a = bbox(byId(m, 'A').d)
    const c = bbox(byId(m, 'C').d)
    expect(c.x0).toBeGreaterThan(a.x1)
    expect(Math.abs(c.y0 - a.y0)).toBeLessThan(1)
  })

  it('changes the paths with the edge style', () => {
    const src = 'stateDiagram-v2\nA --> B\nA --> C\nB --> D\nC --> D\nA --> D'
    const curved = paths(draw(src, { edgeStyle: 'curved' })).map((p) => p.d)
    const straight = paths(draw(src, { edgeStyle: 'straight' })).map((p) => p.d)
    const ortho = paths(draw(src, { edgeStyle: 'orthogonal' })).map((p) => p.d)
    expect(curved).not.toEqual(straight)
    expect(curved).not.toEqual(ortho)
    expect(straight).not.toEqual(ortho)
    expect(straight.every((d) => !d.includes('C'))).toBe(true)
    expect(curved.some((d) => d.includes('C'))).toBe(true)
  })

  it('scales with size and density', () => {
    const src = 'stateDiagram-v2\nA --> B'
    const base = draw(src)
    const large = draw(src, { size: 'lg' })
    expect(large.fontSize).toBe(16)
    expect(large.width).toBeGreaterThan(base.width)
    expect(draw(src, { size: 'sm' }).fontSize).toBe(12)
    expect(draw('stateDiagram-v2\nA --> B\nA --> C', { density: 'spacious' }).width).toBeGreaterThan(draw('stateDiagram-v2\nA --> B\nA --> C', { density: 'compact' }).width)
    for (const size of ['sm', 'md', 'lg'] as const) check(draw(RICH, { size, density: 'compact', rounded: 'full' }))
  })
})

describe('state render: text alternative', () => {
  it('lists states with membership, types and markers', () => {
    const m = draw(MACHINE)
    const states = m.alt.sections.find((s) => s.title === 'States')!
    expect(states.ordered).toBe(true)
    expect([...states.items].sort()).toEqual(
      ['Start', 'Idle', 'Active (composite state)', 'Start (inside Active)', 'Running (inside Active)', 'Paused (inside Active)', 'End (inside Active)', 'End'].sort(),
    )
  })

  it('lists states in flow order, composite members after their composite', () => {
    const m = draw('stateDiagram-v2\n[*] --> First\nFirst --> P\nstate P {\n  [*] --> In1\n  In1 --> In2\n  In2 --> [*]\n}\nP --> [*]')
    expect(m.alt.sections[0]!.items).toEqual(['Start', 'First', 'P (composite state)', 'Start (inside P)', 'In1 (inside P)', 'In2 (inside P)', 'End (inside P)', 'End'])
  })

  it('lists transitions with their labels and scoped markers', () => {
    const m = draw(MACHINE)
    expect(m.alt.sections.find((s) => s.title === 'Transitions')!.items).toEqual([
      'Start to Idle',
      'Idle to Active: start',
      'Start of Active to Running',
      'Running to Paused: pause',
      'Paused to Running: resume',
      'Running to End of Active',
      'Active to Idle: stop',
      'Active to End',
    ])
  })

  it('describes types, descriptions and notes in order', () => {
    const m = draw(RICH)
    const states = m.alt.sections.find((s) => s.title === 'States')!.items
    expect(states[0]).toBe('Start')
    expect(states.indexOf('Draft')).toBeLessThan(states.indexOf('Waiting for review: assigned to a reviewer; due in two days'))
    expect(states).toContain('gate (choice)')
    expect(states).toContain('fork1 (fork)')
    expect(states).toContain('join1 (join)')
    expect(states.length).toBe(10)
    const notes = m.alt.sections.find((s) => s.title === 'Notes')!
    expect(notes.items).toEqual(['Draft, note on the left: created by the author', 'Published, note on the right: visible to everyone cached for an hour'])
    expect(m.alt.sections.map((s) => s.title)).toEqual(['States', 'Transitions', 'Notes'])
    expect(m.alt.sections.find((s) => s.title === 'Transitions')!.items).toContain('gate to Published: approved')
  })

  it('follows the flow in every direction', () => {
    const m = draw('stateDiagram-v2\nA --> B\nB --> C', { direction: 'BT' })
    expect(m.alt.sections[0]!.items).toEqual(['A', 'B', 'C'])
    const rl = draw('stateDiagram-v2\nA --> B\nB --> C', { direction: 'RL' })
    expect(rl.alt.sections[0]!.items).toEqual(['A', 'B', 'C'])
    const lr = draw('stateDiagram-v2\nA --> B\nB --> C', { direction: 'LR' })
    expect(lr.alt.sections[0]!.items).toEqual(['A', 'B', 'C'])
  })

  it('counts one state and one transition in the singular', () => {
    expect(draw('stateDiagram-v2\nA --> A').summary).toBe('State diagram with 1 state and 1 transition, top to bottom')
  })

  it('keeps hostile text as inert text', () => {
    const m = draw('stateDiagram-v2\nstate "<script>alert(1)</script>" as X\nX --> Y : "><img src=x onerror=alert(1)>\nX : javascript:alert(1)\nnote left of Y : <b onmouseover=alert(1)>hi</b>')
    const all = texts(m).flatMap((t) => t.lines).join('\n')
    expect(all).toContain('javascript:alert(1)')
    expect(JSON.stringify(m.items.filter((i) => i.kind !== 'text'))).not.toMatch(/script|onerror|javascript/)
    expect(m.alt.sections[0]!.items.join('|')).not.toContain('<b')
  })
})

describe('state render: limits and empty', () => {
  it('reports an empty diagram', () => {
    expect(fails('stateDiagram-v2')).toMatchObject({ code: 'empty', message: 'This state diagram has no states. Add a transition such as "[*] --> Idle".' })
  })

  it('enforces maxNodes and maxEdges, not counting pseudo states', () => {
    const src = 'stateDiagram-v2\n[*] --> A\nA --> B\nB --> C\nC --> [*]'
    expect(fails(src, { maxNodes: 2 })).toMatchObject({ code: 'limit' })
    expect(draw(src, { maxNodes: 3 }).nodes).toBe(3)
    expect(fails(src, { maxEdges: 3 })).toMatchObject({ code: 'limit' })
    expect(draw(src, { maxEdges: 4 }).edges).toBe(4)
  })

  it('draws a large diagram fast', () => {
    const lines = ['stateDiagram-v2']
    for (let i = 0; i < 60; i++) lines.push(`S${i} --> S${i + 1} : e${i}`, `S${i} --> S${(i * 7) % 60}`)
    const t0 = performance.now()
    const m = draw(lines.join('\n'))
    expect(performance.now() - t0).toBeLessThan(1500)
    check(m)
  })
})

describe('state render: concurrent regions', () => {
  /** End points of a divider written as `Mx,yHx2` or `Mx,yVy2`. */
  const seg = (d: string) => {
    const mm = /^M(-?[\d.]+),(-?[\d.]+)([HV])(-?[\d.]+)$/.exec(d)!
    const [x, y, axis, to] = [Number(mm[1]), Number(mm[2]), mm[3], Number(mm[4])]
    return axis === 'H' ? { start: { x, y }, end: { x: to, y } } : { start: { x, y }, end: { x, y: to } }
  }
  const dividers = (m: RenderModel) => paths(m).filter((p) => p.role === 'region-divider')
  const cluster = (m: RenderModel, id: string) => bbox(byId(m, id).d)
  const CONC = (n: number, extra = '') =>
    `stateDiagram-v2\n[*] --> Active\nstate Active {\n${Array.from({ length: n }, (_, k) => `  [*] --> R${k + 1}a\n  R${k + 1}a --> R${k + 1}b`).join('\n  --\n')}\n}\nActive --> [*]\n${extra}`
  const region = (m: RenderModel, k: number) => {
    const bs = [`R${k}a`, `R${k}b`].map((id) => bbox(byId(m, id).d))
    return { x0: Math.min(...bs.map((b) => b.x0)), x1: Math.max(...bs.map((b) => b.x1)), y0: Math.min(...bs.map((b) => b.y0)), y1: Math.max(...bs.map((b) => b.y1)) }
  }

  it('draws no divider and no region frame without a divider', () => {
    const m = draw(MACHINE)
    expect(dividers(m)).toHaveLength(0)
    expect(shapes(m).some((s) => s.id?.startsWith('r:'))).toBe(false)
  })

  it('lays two regions side by side with one dashed faint divider between them', () => {
    const m = draw(CONC(2))
    check(m)
    const [d] = dividers(m)
    expect(dividers(m)).toHaveLength(1)
    expect(d).toMatchObject({ style: 'dashed', faint: true, role: 'region-divider' })
    const r1 = region(m, 1)
    const r2 = region(m, 2)
    expect(r1.x1).toBeLessThan(r2.x0)
    const x = seg(d!.d).start.x
    expect(seg(d!.d).end.x).toBe(x)
    expect(x).toBeGreaterThan(r1.x1)
    expect(x).toBeLessThan(r2.x0)
    // spans from below the title to the bottom edge of the composite, never beyond it
    const box = cluster(m, 's:Active')
    expect(seg(d!.d).end.y).toBeCloseTo(box.y1, 1)
    expect(seg(d!.d).start.y).toBeGreaterThan(box.y0)
    expect(seg(d!.d).start.y).toBeLessThan(r1.y0)
    expect(x).toBeGreaterThan(box.x0)
    expect(x).toBeLessThan(box.x1)
  })

  it('contains every region with padding and keeps regions apart', () => {
    const m = draw(CONC(3))
    check(m)
    const box = cluster(m, 's:Active')
    const rs = [1, 2, 3].map((k) => region(m, k))
    for (const r of rs) {
      expect(r.x0).toBeGreaterThan(box.x0 + 4)
      expect(r.x1).toBeLessThan(box.x1 - 4)
      expect(r.y0).toBeGreaterThan(box.y0 + 4)
      expect(r.y1).toBeLessThan(box.y1 - 4)
    }
    expect(rs[0]!.x1).toBeLessThan(rs[1]!.x0)
    expect(rs[1]!.x1).toBeLessThan(rs[2]!.x0)
    const xs = dividers(m).map((d) => seg(d.d).start.x)
    expect(xs).toHaveLength(2)
    expect(xs[0]!).toBeGreaterThan(rs[0]!.x1)
    expect(xs[0]!).toBeLessThan(rs[1]!.x0)
    expect(xs[1]!).toBeGreaterThan(rs[1]!.x1)
    expect(xs[1]!).toBeLessThan(rs[2]!.x0)
    // no divider before the first or after the last region
    expect(xs.every((x) => x > rs[0]!.x0 && x < rs[2]!.x1)).toBe(true)
  })

  it('paints the dividers after the cluster frames and before edges and nodes', () => {
    const m = draw(CONC(2))
    const roles = m.items.map((i) => i.role)
    const first = roles.indexOf('region-divider')
    expect(roles.slice(0, first).every((r) => r === 'cluster' || r === 'cluster-title')).toBe(true)
    expect(roles.indexOf('edge')).toBeGreaterThan(first)
    expect(roles.indexOf('node')).toBeGreaterThan(first)
  })

  it('stacks the regions top to bottom with horizontal dividers in an LR diagram', () => {
    for (const dir of ['LR', 'RL'] as const) {
      const m = draw(CONC(3), { direction: dir })
      check(m)
      const rs = [1, 2, 3].map((k) => region(m, k))
      expect(rs[0]!.y1).toBeLessThan(rs[1]!.y0)
      expect(rs[1]!.y1).toBeLessThan(rs[2]!.y0)
      const box = cluster(m, 's:Active')
      const ds = dividers(m)
      expect(ds).toHaveLength(2)
      ds.forEach((d, i) => {
        const { start, end } = seg(d.d)
        expect(start.y).toBe(end.y)
        expect(start.y).toBeGreaterThan(rs[i]!.y1)
        expect(start.y).toBeLessThan(rs[i + 1]!.y0)
        expect(start.x).toBeCloseTo(box.x0, 1)
        expect(end.x).toBeCloseTo(box.x1, 1)
        expect(d.style).toBe('dashed')
      })
    }
  })

  it('follows the diagram direction option and the direction of the composite', () => {
    const src = CONC(2)
    expect(draw(src, { direction: 'LR' })).not.toEqual(draw(src))
    expect(draw(`stateDiagram-v2\ndirection LR\n${src.split('\n').slice(1).join('\n')}`, { direction: 'TB' })).toEqual(draw(src))
    // a composite with its own direction stacks its regions even inside a TB diagram
    const own = draw('stateDiagram-v2\nstate P {\n  direction LR\n  A\n  --\n  B\n}')
    check(own)
    expect(bbox(byId(own, 'A').d).y1).toBeLessThan(bbox(byId(own, 'B').d).y0)
    expect(dividers(own).map((d) => seg(d.d).start.y === seg(d.d).end.y)).toEqual([true])
  })

  it('lays out an empty region and still separates it', () => {
    const m = draw('stateDiagram-v2\nstate P {\n  A\n  --\n}\nstate Q {\n  --\n  B\n}')
    check(m)
    expect(dividers(m)).toHaveLength(2)
    const p = cluster(m, 's:P')
    const a = bbox(byId(m, 'A').d)
    const [dp, dq] = dividers(m)
    expect(seg(dp!.d).start.x).toBeGreaterThan(a.x1)
    expect(seg(dp!.d).start.x).toBeLessThan(p.x1)
    expect(seg(dq!.d).start.x).toBeLessThan(bbox(byId(m, 'B').d).x0)
    const none = draw('stateDiagram-v2\nstate P {\n  --\n  --\n}')
    check(none)
    expect(dividers(none)).toHaveLength(2)
  })

  it('nests concurrency inside a plain composite and inside another region', () => {
    const m = draw('stateDiagram-v2\nstate Outer {\n  X --> Y\n  state Inner {\n    A --> B\n    --\n    C\n  }\n  Y --> Inner\n}\nstate Big {\n  P1\n  --\n  state Deep {\n    D1\n    --\n    D2\n  }\n}')
    check(m)
    expect(dividers(m)).toHaveLength(3)
    const inner = cluster(m, 's:Inner')
    const outer = cluster(m, 's:Outer')
    expect(inner.x0).toBeGreaterThan(outer.x0)
    expect(inner.x1).toBeLessThan(outer.x1)
    expect(bbox(byId(m, 'A').d).x1).toBeLessThan(bbox(byId(m, 'C').d).x0)
    const deep = cluster(m, 's:Deep')
    const big = cluster(m, 's:Big')
    expect(deep.x0).toBeGreaterThan(big.x0)
    expect(deep.x1).toBeLessThan(big.x1)
    // Deep lives in region 2 of Big: right of P1 and of the Big divider
    const bigDivider = dividers(m).find((d) => d.id === 'r:Big|2')!
    expect(deep.x0).toBeGreaterThan(seg(bigDivider.d).start.x)
    expect(bbox(byId(m, 'P1').d).x1).toBeLessThan(seg(bigDivider.d).start.x)
    // the nested divider stays inside Deep
    const deepDivider = dividers(m).find((d) => d.id === 'r:Deep|2')!
    expect(seg(deepDivider.d).start.x).toBeGreaterThan(deep.x0)
    expect(seg(deepDivider.d).start.x).toBeLessThan(deep.x1)
  })

  it('still attaches transitions into and out of a concurrent composite to its box', () => {
    const m = draw(CONC(2))
    check(m)
    const box = cluster(m, 's:Active')
    const edgesByEnd = paths(m).filter((p) => p.role === 'edge')
    const into = edgesByEnd.find((p) => p.id === 't0')!
    const out = edgesByEnd.find((p) => p.id === 't5')!
    expect(inside(ends(into.d).end, box, 1.5)).toBe(true)
    expect(inside(ends(out.d).start, box, 1.5)).toBe(true)
    expect(inside(ends(into.d).start, box, -1)).toBe(false)
  })

  it('draws transitions between regions without crashing and keeps the region order', () => {
    const m = draw('stateDiagram-v2\nstate P {\n  A\n  --\n  B\n  --\n  C\n}\nA --> B : go\nC --> A : back\nB --> C\nA --> C')
    check(m)
    expect(paths(m).filter((p) => p.role === 'edge')).toHaveLength(4)
    const a = bbox(byId(m, 'A').d)
    const b = bbox(byId(m, 'B').d)
    const c = bbox(byId(m, 'C').d)
    expect(a.x1).toBeLessThan(b.x0)
    expect(b.x1).toBeLessThan(c.x0)
    expect(dividers(m)).toHaveLength(2)
    check(draw('stateDiagram-v2\nstate P {\n  A\n  --\n  B\n}\nB --> A', { direction: 'LR' }))
  })

  it('puts notes of a state inside its region', () => {
    const m = draw('stateDiagram-v2\nstate P {\n  A\n  --\n  B\n  note right of B : only here\n}')
    check(m)
    const d = seg(dividers(m)[0]!.d).start.x
    const note = bbox(shapes(m).find((s) => s.role === 'note')!.d)
    expect(note.x0).toBeGreaterThan(d)
    expect(bbox(byId(m, 'A').d).x1).toBeLessThan(d)
  })

  it('handles a concurrent composite with a note, a style class, a choice and a fork', () => {
    const m = draw('stateDiagram-v2\nclassDef hot stroke:#f00\nstate P:::hot {\n  state f <<fork>>\n  [*] --> f\n  f --> A\n  --\n  state c <<choice>>\n  c --> B : yes\n}\nnote left of P : composite note')
    check(m)
    expect(dividers(m)).toHaveLength(1)
    expect(shapes(m).find((s) => s.id === 's:P')!.paint.tone).toBe('danger')
    expect(shapes(m).some((s) => s.role === 'note')).toBe(true)
  })

  it('draws no frame for the regions and keeps the number of clusters', () => {
    const m = draw(CONC(3))
    expect(shapes(m).filter((s) => s.role === 'cluster').map((s) => s.id)).toEqual(['s:Active'])
    expect(texts(m).filter((t) => t.role === 'cluster-title').map((t) => t.lines[0])).toEqual(['Active'])
  })

  it('says regions in the text alternative, region by region', () => {
    const m = draw(CONC(2))
    expect(m.alt.sections[0]!.items).toEqual([
      'Start',
      'Active (2 concurrent regions)',
      'Start (inside Active, region 1)',
      'R1a (inside Active, region 1)',
      'R1b (inside Active, region 1)',
      'Start (inside Active, region 2)',
      'R2a (inside Active, region 2)',
      'R2b (inside Active, region 2)',
      'End',
    ])
    const nested = draw('stateDiagram-v2\nstate Outer {\n  state Inner {\n    A\n    --\n    B\n  }\n}')
    expect(nested.alt.sections[0]!.items).toEqual(['Outer (composite state)', 'Inner (2 concurrent regions, inside Outer)', 'A (inside Inner, region 1)', 'B (inside Inner, region 2)'])
    const lr = draw(CONC(2), { direction: 'LR' })
    expect(lr.alt.sections[0]!.items.filter((i) => i.includes('region 2'))).toHaveLength(3)
    // an ordinary composite keeps the old wording
    expect(draw(MACHINE).alt.sections[0]!.items.filter((i) => i.includes('region'))).toEqual([])
  })

  it('names the region of a concurrent composite that sits inside a region', () => {
    const m = draw('stateDiagram-v2\nstate P {\n  A\n  --\n  state Q {\n    B\n    --\n    C\n  }\n}')
    expect(m.alt.sections[0]!.items).toEqual(['P (2 concurrent regions)', 'A (inside P, region 1)', 'Q (2 concurrent regions, inside P, region 2)', 'B (inside Q, region 1)', 'C (inside Q, region 2)'])
  })

  it('mentions composites in the summary and counts only real states', () => {
    const m = draw(CONC(2))
    expect(m.summary).toContain('1 composite state')
    expect(m.nodes).toBe(5)
  })

  it('is deterministic and clean with every option', () => {
    expect(draw(CONC(3))).toEqual(draw(CONC(3)))
    for (const direction of ['TB', 'BT', 'LR', 'RL'] as const) {
      for (const edgeStyle of ['curved', 'straight', 'orthogonal'] as const) {
        const m = draw(CONC(3, 'Active --> Z\nR1a --> R3b : x'), { direction, edgeStyle, size: 'sm', density: 'compact' })
        check(m)
        expect(dividers(m)).toHaveLength(2)
      }
    }
    check(draw(CONC(2), { size: 'lg', density: 'spacious', rounded: 'full' }))
  })

  it('draws a composite with 200 states and regions fast', () => {
    const lines = ['stateDiagram-v2', 'state Big {']
    for (let r = 0; r < 4; r++) {
      if (r) lines.push('  --')
      for (let i = 0; i < 50; i++) lines.push(`  S${r}_${i} --> S${r}_${i + 1}`)
    }
    lines.push('}')
    const t0 = performance.now()
    const m = draw(lines.join('\n'), { maxNodes: 400 })
    expect(performance.now() - t0).toBeLessThan(3000)
    check(m)
    expect(dividers(m)).toHaveLength(3)
    expect(m.nodes).toBeGreaterThanOrEqual(200)
    const flat = ['stateDiagram-v2', 'state Big {', ...Array.from({ length: 200 }, (_, i) => `  N${i}`), '}']
    check(draw(flat.join('\n'), { maxNodes: 400 }))
  })
})
