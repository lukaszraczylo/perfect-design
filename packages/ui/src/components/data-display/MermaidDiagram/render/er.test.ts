import { describe, expect, it } from 'vitest'
import type { RenderItem, RenderModel, RenderOptions, RPath, RShape, RText } from '../../_diagram/types'
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

/** Bounding box and end points of an absolute path made of M, L, H, V, A, C and Z commands. */
function walk(d: string): { pts: [number, number][]; box: Box; start: [number, number]; end: [number, number] } {
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
      i += 5
      cx = num()
      cy = num()
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
  return { pts, box: { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }, start: pts[0]!, end: pts[pts.length - 1]! }
}

const shapes = (m: RenderModel, role: string) => m.items.filter((i): i is RShape => i.kind === 'shape' && i.role === role)
const paths = (m: RenderModel, role: string) => m.items.filter((i): i is RPath => i.kind === 'path' && i.role === role)
const texts = (m: RenderModel, role?: string) => m.items.filter((i): i is RText => i.kind === 'text' && (!role || i.role === role))
const entityBoxes = (m: RenderModel) => new Map(shapes(m, 'entity').map((s) => [s.id!, walk(s.d).box]))

const onBoundary = (p: [number, number], b: Box, tol = 1.5) => {
  const inside = p[0] >= b.x - tol && p[0] <= b.x + b.w + tol && p[1] >= b.y - tol && p[1] <= b.y + b.h + tol
  const near = Math.min(Math.abs(p[0] - b.x), Math.abs(p[0] - b.x - b.w), Math.abs(p[1] - b.y), Math.abs(p[1] - b.y - b.h)) <= tol
  return inside && near
}

const SHOP = `erDiagram
  CUSTOMER {
    int id PK "surrogate key"
    varchar(100) name
    string email UK
  }
  ORDER {
    int id PK
    int customer_id FK
    decimal(10,2) total
  }
  LINE_ITEM {
    int order_id PK, FK
    int qty
  }
  PRODUCT
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  PRODUCT }o..o{ LINE_ITEM : "appears in"`

const everyValue = (m: RenderModel) => JSON.stringify(m)

describe('erDiagram render', () => {
  it('produces a sane model for a realistic diagram', () => {
    const m = model(SHOP)
    expect(m.type).toBe('er')
    expect(m.nodes).toBe(4)
    expect(m.edges).toBe(3)
    expect(m.fontSize).toBe(14)
    expect(m.summary).toBe('Entity relationship diagram with 4 entities and 3 relationships, top to bottom')
    expect(m.width).toBeGreaterThan(0)
    expect(m.height).toBeGreaterThan(0)
    expect(everyValue(m)).not.toMatch(/NaN|undefined|Infinity/)
    for (const it of m.items) {
      if (it.kind === 'text') {
        expect(it.size).toBeGreaterThanOrEqual(m.fontSize)
        expect(it.x).toBeGreaterThanOrEqual(0)
        expect(it.x).toBeLessThanOrEqual(m.width)
        expect(it.y).toBeGreaterThanOrEqual(0)
        expect(it.y).toBeLessThanOrEqual(m.height)
      } else {
        expect(it.d).not.toMatch(/NaN|undefined|Infinity/)
        const { box } = walk(it.d)
        expect(box.x).toBeGreaterThanOrEqual(-0.01)
        expect(box.y).toBeGreaterThanOrEqual(-0.01)
        expect(box.x + box.w).toBeLessThanOrEqual(m.width + 0.01)
        expect(box.y + box.h).toBeLessThanOrEqual(m.height + 0.01)
      }
    }
  })

  it('keeps the margin around the drawing', () => {
    const m = model(SHOP)
    const boxes = [...entityBoxes(m).values()]
    expect(Math.min(...boxes.map((b) => b.x))).toBeGreaterThanOrEqual(16)
    expect(Math.min(...boxes.map((b) => b.y))).toBeGreaterThanOrEqual(16)
    expect(Math.max(...boxes.map((b) => b.x + b.w))).toBeLessThanOrEqual(m.width - 16)
    expect(Math.max(...boxes.map((b) => b.y + b.h))).toBeLessThanOrEqual(m.height - 16)
  })

  it('never overlaps entity boxes and connects every relationship to its two entities', () => {
    const m = model(SHOP)
    const boxes = entityBoxes(m)
    const list = [...boxes.entries()]
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        const p = list[a]![1]
        const q = list[b]![1]
        const apart = p.x + p.w <= q.x || q.x + q.w <= p.x || p.y + p.h <= q.y || q.y + q.h <= p.y
        expect(apart, `${list[a]![0]} vs ${list[b]![0]}`).toBe(true)
      }
    }
    const edges = paths(m, 'edge')
    expect(edges).toHaveLength(3)
    const ends: [string, string][] = [['CUSTOMER', 'ORDER'], ['ORDER', 'LINE_ITEM'], ['PRODUCT', 'LINE_ITEM']]
    edges.forEach((e, i) => {
      const w = walk(e.d)
      expect(onBoundary(w.start, boxes.get(ends[i]![0])!)).toBe(true)
      expect(onBoundary(w.end, boxes.get(ends[i]![1])!)).toBe(true)
    })
  })

  it('puts the cardinality markers on the right ends and dashes non-identifying lines', () => {
    const edges = paths(model(SHOP), 'edge')
    expect(edges.map((e) => [e.markerStart, e.markerEnd, e.style])).toEqual([
      ['exactly-one', 'zero-many', 'solid'],
      ['exactly-one', 'one-many', 'solid'],
      ['zero-many', 'zero-many', 'dashed'],
    ])
    const one = paths(model('erDiagram\n  A |o--o| B : x'), 'edge')[0]!
    expect([one.markerStart, one.markerEnd]).toEqual(['zero-one', 'zero-one'])
  })

  it('only uses allowed markers and never emits colours or markup', () => {
    const m = model(SHOP)
    const text = everyValue(m)
    expect(text).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|<[a-z]/i)
    for (const p of paths(m, 'edge')) {
      for (const k of [p.markerStart, p.markerEnd]) expect(['exactly-one', 'zero-one', 'zero-many', 'one-many']).toContain(k)
    }
  })

  it('draws a table per entity with aligned columns, keys and muted comments', () => {
    const m = model(SHOP)
    const titles = texts(m, 'entity-title')
    expect(titles.map((t) => t.lines.join(' '))).toEqual(['CUSTOMER', 'ORDER', 'LINE_ITEM', 'PRODUCT'])
    expect(titles.every((t) => t.bold && t.anchor === 'middle')).toBe(true)
    const customerBox = entityBoxes(m).get('CUSTOMER')!
    const inCustomer = (t: RText) => t.y > customerBox.y && t.y < customerBox.y + customerBox.h && t.x >= customerBox.x && t.x <= customerBox.x + customerBox.w
    const types = texts(m, 'entity-type').filter(inCustomer)
    const names = texts(m, 'entity-name').filter(inCustomer)
    expect(types.map((t) => t.lines[0])).toEqual(['int', 'varchar(100)', 'string'])
    expect(names.map((t) => t.lines[0])).toEqual(['id', 'name', 'email'])
    expect(new Set(types.map((t) => t.x)).size).toBe(1)
    expect(new Set(names.map((t) => t.x)).size).toBe(1)
    expect(names[0]!.x).toBeGreaterThan(types[0]!.x)
    expect(types.every((t) => t.muted && t.anchor === 'start')).toBe(true)
    expect(texts(m, 'entity-keys').filter(inCustomer).map((t) => [t.lines[0], t.bold])).toEqual([['PK', true], ['UK', true]])
    const comment = texts(m, 'entity-comment')[0]!
    expect(comment).toMatchObject({ lines: ['surrogate key'], muted: true, italic: true })
    // rows are evenly spaced and sit below the title row
    const ys = types.map((t) => t.y)
    expect(ys[1]! - ys[0]!).toBeCloseTo(ys[2]! - ys[1]!, 5)
    expect(ys[0]!).toBeGreaterThan(titles[0]!.y)
    expect(paths(m, 'entity-divider')).toHaveLength(3)
    expect(paths(m, 'entity-divider').every((p) => p.faint)).toBe(true)
    // the entity without attributes has only a title row
    expect(entityBoxes(m).get('PRODUCT')!.h).toBeLessThan(entityBoxes(m).get('LINE_ITEM')!.h)
  })

  it('keeps every cell inside its entity box', () => {
    const m = model(SHOP)
    for (const [, box] of entityBoxes(m)) {
      for (const t of texts(m).filter((x) => x.role.startsWith('entity-') && x.x >= box.x && x.x <= box.x + box.w && x.y >= box.y && x.y <= box.y + box.h)) {
        expect(t.y + t.size / 2).toBeLessThanOrEqual(box.y + box.h)
        expect(t.y - t.size / 2).toBeGreaterThanOrEqual(box.y)
      }
    }
  })

  it('places each column fully inside the box width', () => {
    const m = model('erDiagram\n  A {\n    varchar(255) a_rather_long_attribute_name PK, FK "and a comment that is rather long too"\n  }')
    const box = entityBoxes(m).get('A')!
    const last = texts(m, 'entity-comment')[0]!
    expect(last.x).toBeGreaterThan(box.x)
    expect(last.x + 20).toBeLessThan(box.x + box.w)
  })

  it('labels relationships on a plate', () => {
    const m = model(SHOP)
    expect(texts(m, 'edge-label').map((t) => t.lines.join(' '))).toEqual(['places', 'contains', 'appears in'])
    expect(shapes(m, 'edge-label-plate')).toHaveLength(3)
  })

  it('writes the text alternative in source order', () => {
    const m = model(SHOP)
    const [entities, rels] = m.alt.sections
    expect(entities).toMatchObject({ title: 'Entities', ordered: true })
    expect(entities!.items).toEqual([
      'CUSTOMER: id (int, PK, "surrogate key"), name (varchar(100)), email (string, UK)',
      'ORDER: id (int, PK), customer_id (int, FK), total (decimal(10,2))',
      'LINE_ITEM: order_id (int, PK, FK), qty (int)',
      'PRODUCT: no attributes',
    ])
    expect(rels).toMatchObject({ title: 'Relationships', ordered: false })
    expect(rels!.items).toEqual([
      'CUSTOMER to ORDER: places (one to zero or more, identifying)',
      'ORDER to LINE_ITEM: contains (one to one or more, identifying)',
      'PRODUCT to LINE_ITEM: appears in (zero or more to zero or more, non-identifying)',
    ])
  })

  it('uses display names and omits an empty relationships section', () => {
    const m = model('erDiagram\n  p[Person] {\n    string name\n  }\n  q["Long <br> name"]')
    expect(m.alt.sections).toHaveLength(1)
    expect(m.alt.sections[0]!.items).toEqual(['Person: name (string)', 'Long name: no attributes'])
    expect(texts(m, 'entity-title')[1]!.lines).toEqual(['Long', 'name'])
    expect(m.summary).toBe('Entity relationship diagram with 2 entities and 0 relationships, top to bottom')
  })

  it('describes a relationship without a label', () => {
    const m = model('erDiagram\n  A |o..o| B')
    expect(m.alt.sections[1]!.items).toEqual(['A to B (zero or one to zero or one, non-identifying)'])
    expect(texts(m, 'edge-label')).toHaveLength(0)
  })

  it('uses singular forms in the summary', () => {
    expect(model('erDiagram\n  A ||--o{ A : self').summary).toBe('Entity relationship diagram with 1 entity and 1 relationship, top to bottom')
  })

  it('draws a self relationship', () => {
    const m = model('erDiagram\n  EMPLOYEE {\n    int id PK\n    int manager_id FK\n  }\n  EMPLOYEE ||--o{ EMPLOYEE : manages')
    const edge = paths(m, 'edge')[0]!
    const w = walk(edge.d)
    const box = entityBoxes(m).get('EMPLOYEE')!
    expect(onBoundary(w.start, box)).toBe(true)
    expect(onBoundary(w.end, box)).toBe(true)
    expect(m.alt.sections[1]!.items[0]).toBe('EMPLOYEE to EMPLOYEE: manages (one to zero or more, identifying)')
  })

  it('is deterministic', () => {
    expect(JSON.stringify(model(SHOP))).toBe(JSON.stringify(model(SHOP)))
    expect(JSON.stringify(model(SHOP.replace(/\n/g, '\r\n')))).toBe(JSON.stringify(model(SHOP)))
  })

  it('lets the option override the direction in the source', () => {
    const tb = model(SHOP)
    const lr = model(SHOP, { direction: 'LR' })
    const fromSource = model(`erDiagram\n  direction LR\n${SHOP.split('\n').slice(1).join('\n')}`)
    expect(lr.width).toBeGreaterThan(tb.width)
    expect(lr.height).toBeLessThan(tb.height)
    expect(lr.summary).toContain('left to right')
    expect(JSON.stringify(fromSource.items)).toBe(JSON.stringify(lr.items))
    const overridden = model(`erDiagram\n  direction LR\n${SHOP.split('\n').slice(1).join('\n')}`, { direction: 'TB' })
    expect(JSON.stringify(overridden.items)).toBe(JSON.stringify(tb.items))
    const bt = model(SHOP, { direction: 'BT' })
    const tbBoxes = entityBoxes(tb)
    const btBoxes = entityBoxes(bt)
    expect(tbBoxes.get('CUSTOMER')!.y).toBeLessThan(tbBoxes.get('LINE_ITEM')!.y)
    expect(btBoxes.get('CUSTOMER')!.y).toBeGreaterThan(btBoxes.get('LINE_ITEM')!.y)
  })

  it('changes the edge paths with the edge style but not the boxes', () => {
    const curved = model(SHOP, { edgeStyle: 'curved' })
    const straight = model(SHOP, { edgeStyle: 'straight' })
    const ortho = model(SHOP, { edgeStyle: 'orthogonal' })
    const d = (m: RenderModel) => paths(m, 'edge').map((p) => p.d).join('|')
    expect(new Set([d(curved), d(straight), d(ortho)]).size).toBe(3)
    expect(JSON.stringify([...entityBoxes(curved)])).toBe(JSON.stringify([...entityBoxes(straight)]))
    for (const m of [curved, straight, ortho]) expect(everyValue(m)).not.toMatch(/NaN|undefined|Infinity/)
  })

  it('scales with size and density', () => {
    const md = model(SHOP)
    const lg = model(SHOP, { size: 'lg' })
    const sm = model(SHOP, { size: 'sm' })
    expect(lg.fontSize).toBe(16)
    expect(sm.fontSize).toBe(12)
    expect(lg.width).toBeGreaterThan(md.width)
    expect(sm.width).toBeLessThan(md.width)
    expect(model(SHOP, { density: 'spacious' }).height).toBeGreaterThan(model(SHOP, { density: 'compact' }).height)
  })

  it('uses the corner radius of the rounded option, capped for tables', () => {
    const none = shapes(model(SHOP, { rounded: 'none' }), 'entity')[0]!.d
    const full = shapes(model(SHOP, { rounded: 'full' }), 'entity')[0]!.d
    expect(none).not.toContain('A')
    expect(full).toContain('A10,10')
  })

  it('paints entities with the tone option, class styles and styles', () => {
    const m = model('erDiagram\n  A:::danger ||--o{ B : x\n  C\n  classDef danger stroke-width:4px\n  style B stroke-dasharray:3\n  classDef default tone:success\n  class C hot\n  classDef hot tone:warning', { tone: 'primary' })
    const paint = Object.fromEntries(shapes(m, 'entity').map((s) => [s.id!, s.paint]))
    expect(paint.A).toMatchObject({ fill: 'surface', tone: 'danger', stroke: 'thick' })
    expect(paint.B).toMatchObject({ tone: 'success', dash: 'dashed', stroke: 'normal' })
    expect(paint.C).toMatchObject({ tone: 'warning' })
    expect(shapes(model(SHOP, { tone: 'info' }), 'entity').every((s) => s.paint.tone === 'info')).toBe(true)
    expect(shapes(model(SHOP), 'entity').every((s) => s.paint.tone === 'neutral')).toBe(true)
  })

  it('passes the front matter title to the model and never draws it', () => {
    const m = model('---\ntitle: Orchard Mill orders\n---\nerDiagram\n  A ||--o{ B : x')
    expect(m.title).toBe('Orchard Mill orders')
    expect(texts(m).some((t) => t.lines.join(' ').includes('Orchard Mill orders'))).toBe(false)
  })

  it('truncates very long cells and keeps the full text as a tooltip', () => {
    const long = 'wordy'.repeat(80)
    const m = model(`erDiagram\n  A {\n    string ${long} "${long}"\n  }\n  A ||--o{ B : ${long}`)
    const name = texts(m, 'entity-name')[0]!
    expect(name.lines[0]!.endsWith('…')).toBe(true)
    expect(name.title).toBe(long)
    expect(name.lines[0]!.length).toBeLessThan(long.length)
    const comment = texts(m, 'entity-comment')[0]!
    expect(comment.title).toBe(long)
    expect(entityBoxes(m).get('A')!.w).toBeLessThan(900)
    expect(m.alt.sections[0]!.items[0]).toContain(long)
    expect(m.width).toBeLessThan(1600)
    expect(everyValue(m)).not.toMatch(/NaN|undefined|Infinity/)
  })

  it('falls back to the id when the display name is only a line break', () => {
    const m = model('erDiagram\n  "<br>" ||--o{ B : x')
    expect(texts(m, 'entity-title')[0]!.lines).toEqual(['<br>'])
    expect(m.alt.sections[0]!.items[0]).toBe('<br>: no attributes')
  })

  it('wraps a very long entity name over several lines', () => {
    const m = model(`erDiagram\n  "${'Kestrel Freight '.repeat(8)}" ||--o{ B : x`)
    expect(texts(m, 'entity-title')[0]!.lines.length).toBeGreaterThan(1)
  })

  it('handles unicode, quotes and entity codes', () => {
    const m = model('erDiagram\n  "客户 😀" {\n    текст имя "комментарий #quot;q#quot;"\n  }\n  "客户 😀" ||--o{ Заказ : 注文')
    expect(texts(m, 'entity-title')[0]!.lines).toEqual(['客户 😀'])
    expect(texts(m, 'entity-comment')[0]!.lines).toEqual(['комментарий "q"'])
    expect(texts(m, 'edge-label')[0]!.lines).toEqual(['注文'])
    expect(m.alt.sections[0]!.items[0]).toBe('客户 😀: имя (текст, "комментарий "q"")')
  })

  it('keeps hostile text inert', () => {
    const m = model(`erDiagram
  "<script>alert(1)</script>" {
    string x "javascript:alert(1)"
  }`)
    const all = texts(m).flatMap((t) => t.lines).join('\n')
    expect(all).toContain('<script>alert(1)</script>')
    expect(all).toContain('javascript:alert(1)')
    for (const it of m.items) if (it.kind !== 'text') expect(it.d).toMatch(/^[MLHVACZ0-9eE.,\s-]+$/)
    const withLabel = model('erDiagram\n  A ||--o{ B : "\\"><img src=x onerror=alert(1)>"')
    for (const it of withLabel.items as RenderItem[]) if (it.kind !== 'text') expect(it.d).toMatch(/^[MLHVACZ0-9eE.,\s-]+$/)
  })

  it('stays fast for a large diagram', () => {
    const rows = Array.from({ length: 150 }, (_, i) => `  E${i} ||--o{ E${i + 1} : r${i}`)
    const p = parseMermaid(`erDiagram\n${rows.join('\n')}`)
    if (!p.ok) throw new Error('parse')
    const t = performance.now()
    const r = renderModel(p.ast)
    expect(performance.now() - t).toBeLessThan(2000)
    expect(r.ok).toBe(true)
  })
})

describe('erDiagram render errors', () => {
  it('reports an empty diagram', () => {
    expect(failure('erDiagram')).toMatchObject({ code: 'empty', diagramType: 'er' })
    expect(failure('erDiagram\n  %% only a comment').code).toBe('empty')
    expect(failure('erDiagram\n  direction LR').message).toContain('no entities')
  })

  it('enforces the node and edge limits', () => {
    expect(failure(SHOP, { maxNodes: 3 })).toMatchObject({ code: 'limit', message: expect.stringContaining('4 nodes') })
    expect(failure(SHOP, { maxEdges: 2 })).toMatchObject({ code: 'limit', message: expect.stringContaining('3 connections') })
    expect(model(SHOP, { maxNodes: 4, maxEdges: 3 }).nodes).toBe(4)
  })
})
