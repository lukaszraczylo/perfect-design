import { describe, expect, it } from 'vitest'
import type { RenderModel, RenderOptions, RPath, RShape, RText } from '../../_diagram/types'
import { parseMermaid } from '../parse'
import { renderModel } from '.'

function model(source: string, opts: RenderOptions = {}): RenderModel {
  const p = parseMermaid(source)
  if (!p.ok) throw new Error(p.errors[0]!.message)
  const r = renderModel(p.ast, opts)
  if (!r.ok) throw new Error(`${r.error.code}: ${r.error.message}`)
  return r.model
}

function failure(source: string, opts: RenderOptions = {}) {
  const p = parseMermaid(source)
  if (!p.ok) throw new Error(p.errors[0]!.message)
  const r = renderModel(p.ast, opts)
  if (r.ok) throw new Error('expected a render error')
  return r.error
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Bounding box and end points of an absolute path made of M, L, H, V, A, C and Z commands (half circles are included). */
function walk(d: string): { box: Box; start: [number, number]; end: [number, number] } {
  const tokens = d.match(/[MLHVACZ]|-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? []
  const pts: [number, number][] = []
  let cmd = ''
  let cx = 0
  let cy = 0
  let i = 0
  const num = () => Number(tokens[i++])
  while (i < tokens.length) {
    if (/[A-Z]/.test(tokens[i]!)) cmd = tokens[i++]!
    if (cmd === 'Z') continue
    if (cmd === 'M' || cmd === 'L') {
      cx = num()
      cy = num()
    } else if (cmd === 'H') cx = num()
    else if (cmd === 'V') cy = num()
    else if (cmd === 'A') {
      const rx = num()
      const ry = num()
      i += 3
      const nx = num()
      const ny = num()
      if (Math.abs(Math.abs(nx - cx) - 2 * rx) < 0.02 && Math.abs(ny - cy) < 0.02) pts.push([(nx + cx) / 2, cy - ry], [(nx + cx) / 2, cy + ry])
      cx = nx
      cy = ny
    } else if (cmd === 'C') {
      for (let k = 0; k < 2; k++) pts.push([num(), num()])
      cx = num()
      cy = num()
    }
    pts.push([cx, cy])
  }
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { box: { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }, start: pts[0]!, end: pts[pts.length - 1]! }
}

const shapes = (m: RenderModel) => m.items.filter((i): i is RShape => i.kind === 'shape')
const edges = (m: RenderModel) => m.items.filter((i): i is RPath => i.kind === 'path')
const labels = (m: RenderModel) => m.items.filter((i): i is RText => i.kind === 'text')
const boxes = (m: RenderModel) => shapes(m).map((s) => walk(s.d).box)

const PLAN = `mindmap
  root((Kestrel Freight))
    Origins
      Long history
      Popularisation
        British author
    Research
      On effectiveness<br/>and features
      Industry
    Tools
      Pen and paper
      Software`

const ALL_SHAPES = `mindmap
  root
    a[Square]
    b(Rounded)
    c((Circle))
    d))Bang((
    e)Cloud(
    f{{Hexagon}}
    Plain`

const everyValue = (m: RenderModel) => JSON.stringify(m)

describe('mindmap render', () => {
  it('produces a sane model', () => {
    const m = model(PLAN)
    expect(m.type).toBe('mindmap')
    expect(m.nodes).toBe(11)
    expect(m.edges).toBe(10)
    expect(m.fontSize).toBe(14)
    expect(m.summary).toBe('Mind map with 11 nodes in 4 levels, root "Kestrel Freight"')
    expect(everyValue(m)).not.toMatch(/NaN|undefined|Infinity/)
    expect(shapes(m)).toHaveLength(11)
    expect(edges(m)).toHaveLength(10)
    for (const it of m.items) {
      if (it.kind === 'text') {
        expect(it.size).toBeGreaterThanOrEqual(m.fontSize)
        expect(it.x).toBeGreaterThan(0)
        expect(it.x).toBeLessThan(m.width)
        expect(it.y).toBeGreaterThan(0)
        expect(it.y).toBeLessThan(m.height)
      } else {
        const { box } = walk(it.d)
        expect(box.x).toBeGreaterThanOrEqual(15.99)
        expect(box.y).toBeGreaterThanOrEqual(15.99)
        expect(box.x + box.w).toBeLessThanOrEqual(m.width - 15.99)
        expect(box.y + box.h).toBeLessThanOrEqual(m.height - 15.99)
      }
    }
  })

  it('hugs the drawing with the margin on every side', () => {
    const m = model(PLAN)
    const b = boxes(m)
    expect(Math.min(...b.map((x) => x.x))).toBeCloseTo(16, 1)
    expect(Math.min(...b.map((x) => x.y))).toBeCloseTo(16, 0)
    for (const gap of [m.width - Math.max(...b.map((x) => x.x + x.w)), m.height - Math.max(...b.map((x) => x.y + x.h))]) {
      expect(gap).toBeGreaterThanOrEqual(15.99)
      expect(gap).toBeLessThan(17.01)
    }
  })

  it('never overlaps node boxes, also for shapes of all kinds', () => {
    for (const src of [PLAN, ALL_SHAPES, `mindmap\n  root\n${Array.from({ length: 40 }, (_, i) => `    n${i}\n${'      leaf\n'.repeat(i % 4)}`).join('')}`]) {
      const b = boxes(model(src))
      for (let i = 0; i < b.length; i++) {
        for (let j = i + 1; j < b.length; j++) {
          const p = b[i]!
          const q = b[j]!
          const apart = p.x + p.w <= q.x + 0.01 || q.x + q.w <= p.x + 0.01 || p.y + p.h <= q.y + 0.01 || q.y + q.h <= p.y + 0.01
          expect(apart, `${i} vs ${j}`).toBe(true)
        }
      }
    }
  })

  it('grows to the right: every child starts right of its parent and connectors join the two', () => {
    const m = model(PLAN)
    const b = boxes(m)
    const parents = [-1, 0, 1, 1, 3, 0, 5, 5, 0, 8, 8]
    const lines = edges(m)
    expect(lines).toHaveLength(10)
    lines.forEach((line, k) => {
      const child = k + 1
      const parent = parents[child]!
      const w = walk(line.d)
      expect(w.start[0]).toBeCloseTo(b[parent]!.x + b[parent]!.w, 1)
      expect(w.start[1]).toBeCloseTo(b[parent]!.y + b[parent]!.h / 2, 1)
      expect(w.end[0]).toBeCloseTo(b[child]!.x, 1)
      expect(w.end[1]).toBeCloseTo(b[child]!.y + b[child]!.h / 2, 1)
      expect(b[child]!.x).toBeGreaterThan(b[parent]!.x + b[parent]!.w)
    })
  })

  it('stacks siblings in source order and centres a parent on its children', () => {
    const b = boxes(model(PLAN))
    const cy = (i: number) => b[i]!.y + b[i]!.h / 2
    // children of Origins (1): 2, 3 ; of Research (5): 6, 7 ; of Tools (8): 9, 10
    expect(cy(2)).toBeLessThan(cy(3))
    expect(cy(1)).toBeCloseTo((cy(2) + cy(3)) / 2, 1)
    expect(cy(5)).toBeCloseTo((cy(6) + cy(7)) / 2, 1)
    expect(cy(8)).toBeCloseTo((cy(9) + cy(10)) / 2, 1)
    expect(cy(0)).toBeCloseTo((cy(1) + cy(8)) / 2, 1)
    expect(cy(1)).toBeLessThan(cy(5))
    expect(cy(5)).toBeLessThan(cy(8))
  })

  it('shows depth by weight, outline and size and not by colour', () => {
    const m = model(PLAN)
    const s = shapes(m)
    expect(s.map((x) => x.paint.stroke)).toEqual(['thick', 'normal', 'thin', 'thin', 'thin', 'normal', 'thin', 'thin', 'normal', 'thin', 'thin'])
    expect(s.every((x) => x.paint.fill === 'surface' && x.paint.tone === 'neutral')).toBe(true)
    const t = labels(m)
    expect(t[0]).toMatchObject({ bold: true, size: 17 })
    expect(t[1]).toMatchObject({ bold: true, size: 14 })
    expect(t[2]!.bold).toBeUndefined()
    expect(t[2]!.size).toBe(14)
    // the connectors to level 1 are thick, the rest is not
    expect(edges(m).map((e) => !!e.thick)).toEqual([true, false, false, false, true, false, false, true, false, false])
    expect(edges(m).every((e) => e.style === 'solid' && !e.markerStart && !e.markerEnd)).toBe(true)
    const b = boxes(m)
    expect(b[0]!.h).toBeGreaterThan(b[1]!.h)
  })

  it('draws a different outline for every node form', () => {
    const m = model(ALL_SHAPES)
    const d = shapes(m).map((x) => x.d)
    // root (default shape) is a stadium, plain is a rectangle with the corner radius, square the same
    expect(new Set(d.slice(1).map((x) => x.replace(/[-\d.]+/g, '#'))).size).toBe(4)
    const [, square, rounded, circle, bang, cloud, hexagon, plain] = d as [string, string, string, string, string, string, string, string]
    expect(square.replace(/[-\d.]+/g, '#')).toBe(plain.replace(/[-\d.]+/g, '#'))
    expect(rounded).toContain('A10,10')
    expect(square).toContain('A8,8')
    expect(circle.match(/A/g)).toHaveLength(2)
    expect(hexagon.match(/L/g)).toHaveLength(5)
    expect(bang.match(/L/g)).toHaveLength(4)
    expect(cloud).toMatch(/A18,18/)
    const c = walk(circle).box
    expect(c.w).toBeCloseTo(c.h, 1)
  })

  it('connects to the notch of a bang shape', () => {
    const m = model('mindmap\n  root\n    d))Bang((')
    const b = boxes(m)
    const w = walk(edges(m)[0]!.d)
    expect(w.end[0]).toBeGreaterThan(b[1]!.x)
    expect(w.end[1]).toBeCloseTo(b[1]!.y + b[1]!.h / 2, 1)
  })

  it('honours the rounded option for squares', () => {
    const none = model('mindmap\n  root\n    a[Square]', { rounded: 'none' })
    expect(shapes(none)[1]!.d).not.toContain('A')
    expect(shapes(model('mindmap\n  root\n    a[Square]', { rounded: 'full' }))[1]!.d).toContain('A')
  })

  it('uses the tone option and class names that are tones', () => {
    const m = model('mindmap\n  root\n    a\n    :::danger\n    b\n    c:::other\n    d\n    :::success large', { tone: 'primary' })
    expect(shapes(m).map((s) => s.paint.tone)).toEqual(['primary', 'danger', 'primary', 'primary', 'success'])
    expect(shapes(model(PLAN, { tone: 'info' })).every((s) => s.paint.tone === 'info')).toBe(true)
  })

  it('changes connector paths with the edge style and nothing else', () => {
    const curved = model(PLAN, { edgeStyle: 'curved' })
    const straight = model(PLAN, { edgeStyle: 'straight' })
    const ortho = model(PLAN, { edgeStyle: 'orthogonal' })
    expect(edges(curved)[0]!.d).toContain('C')
    expect(edges(straight)[0]!.d).toMatch(/^M[\d.,]+L[\d.,]+$/)
    expect(edges(ortho)[0]!.d).toMatch(/^M[\d.,]+H[\d.]+V[\d.]+H[\d.]+$/)
    expect(JSON.stringify(shapes(curved))).toBe(JSON.stringify(shapes(straight)))
    expect(JSON.stringify(shapes(curved))).toBe(JSON.stringify(shapes(ortho)))
    for (const m of [curved, straight, ortho]) expect(everyValue(m)).not.toMatch(/NaN|undefined|Infinity/)
  })

  it('is deterministic and independent of the line ending', () => {
    expect(JSON.stringify(model(PLAN))).toBe(JSON.stringify(model(PLAN)))
    expect(JSON.stringify(model(PLAN.replace(/\n/g, '\r\n')))).toBe(JSON.stringify(model(PLAN)))
  })

  it('ignores the direction option (the tree always grows to the right)', () => {
    expect(JSON.stringify(model(PLAN, { direction: 'LR' }))).toBe(JSON.stringify(model(PLAN, { direction: 'TB' })))
  })

  it('scales with size and density', () => {
    const md = model(PLAN)
    expect(model(PLAN, { size: 'lg' }).width).toBeGreaterThan(md.width)
    expect(model(PLAN, { size: 'sm' }).width).toBeLessThan(md.width)
    expect(model(PLAN, { size: 'lg' }).fontSize).toBe(16)
    expect(model(PLAN, { density: 'spacious' }).height).toBeGreaterThan(model(PLAN, { density: 'compact' }).height)
    expect(model(PLAN, { density: 'spacious' }).width).toBeGreaterThan(model(PLAN, { density: 'compact' }).width)
  })

  it('writes the outline in depth first order with the level of each node', () => {
    const m = model(PLAN)
    expect(m.alt.sections).toHaveLength(1)
    expect(m.alt.sections[0]).toMatchObject({ title: 'Outline', ordered: true })
    expect(m.alt.sections[0]!.items).toEqual([
      'Level 1: Kestrel Freight',
      'Level 2: Origins',
      'Level 3: Long history',
      'Level 3: Popularisation',
      'Level 4: British author',
      'Level 2: Research',
      'Level 3: On effectiveness and features',
      'Level 3: Industry',
      'Level 2: Tools',
      'Level 3: Pen and paper',
      'Level 3: Software',
    ])
  })

  it('handles a single node', () => {
    const m = model('mindmap\n  Only topic')
    expect(m).toMatchObject({ nodes: 1, edges: 0, summary: 'Mind map with 1 node in 1 level, root "Only topic"' })
    expect(edges(m)).toHaveLength(0)
    expect(shapes(m)).toHaveLength(1)
  })

  it('passes the front matter title to the model and never draws it', () => {
    const m = model('---\ntitle: Orchard Mill plan\n---\nmindmap\n  root\n    a')
    expect(m.title).toBe('Orchard Mill plan')
    expect(labels(m).some((t) => t.lines.join(' ').includes('Orchard Mill plan'))).toBe(false)
  })

  it('breaks lines on <br/>, strips markdown and decodes entity codes', () => {
    const m = model('mindmap\n  root\n    a[One<br/>two<br>three]\n    b["`**Bold** and *italic*`"]\n    c[Say #quot;hi#quot; &amp; bye]\n    d[<b>tag</b> kept <x>]\n    snake_case_name')
    const t = labels(m)
    expect(t[1]!.lines).toEqual(['One', 'two', 'three'])
    expect(t[2]!.lines).toEqual(['Bold and italic'])
    expect(t[3]!.lines).toEqual(['Say "hi" & bye'])
    expect(t[4]!.lines).toEqual(['tag kept <x>'])
    expect(t[5]!.lines).toEqual(['snake_case_name'])
  })

  it('wraps long text and keeps the node wide enough for its lines', () => {
    const long = 'Kestrel Freight quarterly planning notes for the northern region '.repeat(3).trim()
    const m = model(`mindmap\n  root\n    a[${long}]\n    b[${'x'.repeat(300)}]`)
    const t = labels(m)
    expect(t[1]!.lines.length).toBeGreaterThan(2)
    expect(t[2]!.lines.length).toBeGreaterThan(1)
    const b = boxes(m)
    expect(b[1]!.w).toBeLessThan(14 * 13 + 100)
    expect(b[2]!.w).toBeLessThan(14 * 13 + 100)
    expect(b[1]!.h).toBeGreaterThan(b[0]!.h * 0.5)
    expect(everyValue(m)).not.toMatch(/NaN|undefined|Infinity/)
  })

  it('handles unicode text', () => {
    const m = model('mindmap\n  корень((根 😀))\n    Ünï')
    expect(labels(m).map((t) => t.lines[0])).toEqual(['根 😀', 'Ünï'])
  })

  it('keeps hostile text inert', () => {
    const m = model('mindmap\n  root\n    <script>alert(1)</script>\n    "><img src=x onerror=alert(1)>\n    javascript:alert(1)')
    const text = labels(m).flatMap((t) => t.lines).join('\n')
    expect(text).toContain('<script>alert(1)</script>')
    expect(text).toContain('onerror=alert(1)')
    expect(text).toContain('javascript:alert(1)')
    for (const it of m.items) if (it.kind !== 'text') expect(it.d).toMatch(/^[MLHVACZ0-9eE.,\s-]+$/)
  })

  it('draws no colours or markup in paths', () => {
    expect(everyValue(model(PLAN))).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|url\(/i)
  })

  it('renders 1000 nodes quickly when the limit allows it', () => {
    const rows = Array.from({ length: 999 }, (_, i) => `${i % 9 === 0 ? '    ' : '      '}node ${i}`)
    const p = parseMermaid(`mindmap\n  root\n${rows.join('\n')}`)
    if (!p.ok) throw new Error('parse')
    const t = performance.now()
    const r = renderModel(p.ast, { maxNodes: 2000, maxEdges: 2000 })
    expect(performance.now() - t).toBeLessThan(1000)
    expect(r.ok && r.model.nodes).toBe(1000)
  })

  it('renders a deep chain', () => {
    const rows = Array.from({ length: 60 }, (_, i) => `${' '.repeat(i + 3)}n${i}`)
    const m = model(`mindmap\n  root\n${rows.join('\n')}`)
    expect(m.alt.sections[0]!.items).toHaveLength(61)
    expect(m.summary).toContain('61 levels')
    expect(everyValue(m)).not.toMatch(/NaN|undefined|Infinity/)
  })
})

describe('mindmap render errors', () => {
  it('reports an empty mind map', () => {
    expect(failure('mindmap')).toMatchObject({ code: 'empty', diagramType: 'mindmap' })
    expect(failure('mindmap\n  %% only a comment').message).toContain('no nodes')
  })

  it('enforces the node limit', () => {
    expect(failure(PLAN, { maxNodes: 10 })).toMatchObject({ code: 'limit', message: expect.stringContaining('11 nodes') })
    expect(failure(PLAN, { maxEdges: 9 })).toMatchObject({ code: 'limit', message: expect.stringContaining('10 connections') })
    expect(model(PLAN, { maxNodes: 11, maxEdges: 10 }).nodes).toBe(11)
  })
})
