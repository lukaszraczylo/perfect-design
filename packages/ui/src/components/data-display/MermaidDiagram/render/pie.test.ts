import { describe, expect, it } from 'vitest'
import { measureText, metricsFor } from '../../_diagram/text'
import type { RenderItem, RenderModel, RenderOptions, RShape, RText } from '../../_diagram/types'
import { parseMermaid } from '../parse'
import { renderModel } from '../render'

function draw(src: string, opts: RenderOptions = {}): RenderModel {
  const parsed = parseMermaid(src)
  if (!parsed.ok) throw new Error(`parse: ${parsed.errors[0]!.message}`)
  const r = renderModel(parsed.ast, opts)
  if (!r.ok) throw new Error(`render: ${r.error.code} ${r.error.message}`)
  return r.model
}

function fails(src: string, opts: RenderOptions = {}) {
  const parsed = parseMermaid(src)
  if (!parsed.ok) throw new Error('parse failed')
  const r = renderModel(parsed.ast, opts)
  if (r.ok) throw new Error('expected a render error')
  return r.error
}

const texts = (m: RenderModel): RText[] => m.items.filter((i): i is RText => i.kind === 'text')
const shapes = (m: RenderModel, role: string): RShape[] => m.items.filter((i): i is RShape => i.kind === 'shape' && i.role === role)
const byRole = (m: RenderModel, role: string): RenderItem[] => m.items.filter((i) => i.role === role)
/** Absolute numbers of a path; relative `h`/`v` moves of square corners are skipped. */
const numbers = (d: string): number[] => (d.replace(/[hv]-?\d+(?:\.\d+)?/g, '').match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)

function expectSane(m: RenderModel): void {
  const max = Math.max(m.width, m.height)
  for (const i of m.items) {
    if (i.kind === 'text') {
      expect(Number.isFinite(i.x) && Number.isFinite(i.y)).toBe(true)
      expect(i.size).toBeGreaterThanOrEqual(m.fontSize)
      continue
    }
    expect(i.d).not.toMatch(/NaN|undefined|Infinity/)
    const v = numbers(i.d)
    for (let k = 0; k < v.length; k++) {
      expect(v[k]).toBeGreaterThanOrEqual(0)
      expect(v[k]).toBeLessThanOrEqual(max)
    }
    // coordinates in the canvas: even indexes are x, odd are y for the polyline paths drawn here
    if (i.kind === 'path') for (let k = 0; k + 1 < v.length; k += 2) expect(v[k]).toBeLessThanOrEqual(m.width)
  }
}

function expectNoTextOverlap(m: RenderModel): void {
  const mm = metricsFor('md')
  const boxes = texts(m).map((t) => {
    const w = Math.max(...t.lines.map((l) => measureText(l, mm.font)))
    const h = t.lines.length * mm.lineHeight
    const x1 = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'start' ? t.x : t.x - w
    return { x1, x2: x1 + w, y1: t.y - h / 2, y2: t.y + h / 2, t }
  })
  for (let a = 0; a < boxes.length; a++) {
    expect(boxes[a]!.x1).toBeGreaterThanOrEqual(0)
    expect(boxes[a]!.x2).toBeLessThanOrEqual(m.width)
    expect(boxes[a]!.y1).toBeGreaterThanOrEqual(0)
    expect(boxes[a]!.y2).toBeLessThanOrEqual(m.height)
    for (let b = a + 1; b < boxes.length; b++) {
      const p = boxes[a]!
      const q = boxes[b]!
      const overlap = p.x1 < q.x2 - 0.5 && q.x1 < p.x2 - 0.5 && p.y1 < q.y2 - 0.5 && q.y1 < p.y2 - 0.5
      expect(overlap, `${JSON.stringify(p.t.lines)} overlaps ${JSON.stringify(q.t.lines)}`).toBe(false)
    }
  }
}

const PETS = `pie showData title Pets adopted
  "Dogs" : 42
  "Cats" : 30
  "Rabbits" : 18
  "Fish" : 10`

describe('pie render: model', () => {
  it('describes the chart and counts slices', () => {
    const m = draw(PETS)
    expect(m.type).toBe('pie')
    expect(m.title).toBe('Pets adopted')
    expect(m.summary).toBe('Pie chart with 4 slices, total 100')
    expect(m.nodes).toBe(4)
    expect(m.edges).toBe(0)
    expect(m.fontSize).toBe(14)
    expectSane(m)
  })

  it('lists slices in source order with value and percentage', () => {
    expect(draw(PETS).alt.sections).toEqual([
      { title: 'Slices', ordered: false, items: ['Dogs: 42 (42%)', 'Cats: 30 (30%)', 'Rabbits: 18 (18%)', 'Fish: 10 (10%)'] },
    ])
  })

  it('rounds percentages to one decimal and prints values as given', () => {
    const m = draw('pie\n"A" : 1\n"B" : 1\n"C" : 1\n"D" : 0.1\n"E" : 0.2')
    expect(m.alt.sections[0]!.items).toEqual(['A: 1 (30.3%)', 'B: 1 (30.3%)', 'C: 1 (30.3%)', 'D: 0.1 (3%)', 'E: 0.2 (6.1%)'])
    expect(m.summary).toBe('Pie chart with 5 slices, total 3.3')
  })

  it('shows raw values in the legend only with showData', () => {
    const withData = draw(PETS)
    expect(texts(withData).filter((t) => t.role === 'legend-label').map((t) => t.lines.join(' '))).toEqual(['Dogs: 42 (42%)', 'Cats: 30 (30%)', 'Rabbits: 18 (18%)', 'Fish: 10 (10%)'])
    const without = draw('pie\n"Dogs" : 42\n"Cats" : 58')
    expect(texts(without).filter((t) => t.role === 'legend-label').map((t) => t.lines.join(' '))).toEqual(['Dogs: 42%', 'Cats: 58%'])
  })

  it('is deterministic', () => {
    expect(JSON.stringify(draw(PETS))).toBe(JSON.stringify(draw(PETS)))
  })

  it('cleans labels in the legend and in the text alternative', () => {
    const m = draw('pie\n"Say #quot;hi#quot; &amp; <b>bye</b>" : 1\n"Line<br/>two" : 1')
    expect(m.alt.sections[0]!.items).toEqual(['Say "hi" & bye: 1 (50%)', 'Line two: 1 (50%)'])
  })
})

describe('pie render: geometry', () => {
  it('draws one shape per non-zero slice, clockwise from 12 o clock, in chart slots', () => {
    const m = draw('pie\n"A" : 25\n"B" : 25\n"C" : 25\n"D" : 25')
    const slices = shapes(m, 'slice')
    expect(slices.map((s) => s.paint)).toEqual(['chart-1', 'chart-2', 'chart-3', 'chart-4'].map((tone) => ({ fill: 'solid', tone, stroke: 'none' })))
    const [a, b] = slices.map((s) => numbers(s.d))
    // M tip, L start, A r r rotation large sweep end: sweep flag 1 is clockwise on screen
    expect(a![8]).toBe(1)
    expect(a![9]!).toBeGreaterThan(a![2]!)
    expect(a![10]!).toBeGreaterThan(a![3]!)
    expect(b![9]!).toBeLessThan(b![2]!)
    expect(b![10]!).toBeGreaterThan(b![3]!)
    // the first slice starts at the top: its start point is above the tip
    expect(a![3]!).toBeLessThan(a![1]!)
    expectSane(m)
  })

  it('leaves a gap between neighbouring slices', () => {
    const m = draw('pie\n"A" : 1\n"B" : 1')
    const [a, b] = shapes(m, 'slice').map((s) => numbers(s.d))
    // end of A and start of B are different points on the rim
    expect(Math.hypot(a![9]! - b![2]!, a![10]! - b![3]!)).toBeGreaterThan(0.5)
  })

  it('draws a single slice as a full circle made of two arcs', () => {
    const m = draw('pie\n"All" : 7\n"None" : 0')
    const [only] = shapes(m, 'slice')
    expect(shapes(m, 'slice')).toHaveLength(1)
    expect(only!.d.match(/A/g)).toHaveLength(2)
    expect(only!.paint.tone).toBe('chart-1')
    expect(texts(m).find((t) => t.role === 'slice-label')!.lines).toEqual(['100%'])
    expectSane(m)
  })

  it('lists zero slices without drawing them', () => {
    const m = draw('pie showData\n"A" : 3\n"Nothing" : 0\n"B" : 1')
    expect(shapes(m, 'slice')).toHaveLength(2)
    expect(shapes(m, 'legend-swatch')).toHaveLength(3)
    expect(texts(m).filter((t) => t.role === 'legend-label').map((t) => t.lines[0])).toContain('Nothing: 0 (0%)')
    expect(m.alt.sections[0]!.items).toContain('Nothing: 0 (0%)')
    expect(m.nodes).toBe(3)
  })

  it('gives every legend row a swatch, the label, the value and the percentage', () => {
    const m = draw(PETS)
    const swatches = shapes(m, 'legend-swatch')
    const slices = shapes(m, 'slice')
    expect(swatches.map((s) => s.paint.tone)).toEqual(slices.map((s) => s.paint.tone))
    expect(texts(m).filter((t) => t.role === 'legend-label')).toHaveLength(4)
    for (const s of [...swatches, ...slices]) expect(s.paint).toMatchObject({ fill: 'solid' })
  })

  it('puts percentages outside the pie on leader lines, in plain ink', () => {
    const m = draw(PETS)
    const labels = texts(m).filter((t) => t.role === 'slice-label')
    expect(labels.map((t) => t.lines[0]).sort()).toEqual(['10%', '18%', '30%', '42%'])
    for (const t of labels) expect(t.onSolid).toBeUndefined()
    expect(byRole(m, 'leader')).toHaveLength(4)
    for (const l of byRole(m, 'leader')) expect(l).toMatchObject({ kind: 'path', faint: true })
  })

  it('leaves tiny slices without a leader label but keeps them in the legend', () => {
    const m = draw('pie\n"Big" : 99\n"Tiny" : 1')
    expect(texts(m).filter((t) => t.role === 'slice-label').map((t) => t.lines[0])).toEqual(['99%'])
    expect(texts(m).filter((t) => t.role === 'legend-label')).toHaveLength(2)
    expect(shapes(m, 'slice')).toHaveLength(2)
    expectSane(m)
  })

  it('cycles the five slots and never repeats a colour between the last and first slice', () => {
    const six = shapes(draw('pie\n"1" : 1\n"2" : 1\n"3" : 1\n"4" : 1\n"5" : 1\n"6" : 1'), 'slice').map((s) => s.paint.tone)
    expect(six.slice(0, 5)).toEqual(['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'])
    expect(six[5]).not.toBe(six[0])
    expect(six[5]).not.toBe(six[4])
    const seven = shapes(draw('pie\n"1" : 1\n"2" : 1\n"3" : 1\n"4" : 1\n"5" : 1\n"6" : 1\n"7" : 1'), 'slice').map((s) => s.paint.tone)
    expect(seven.slice(5)).toEqual(['chart-1', 'chart-2'])
  })

  it('puts the legend on the right when labels are short and below when they are long', () => {
    const short = draw(PETS)
    const sliceXs = shapes(short, 'slice').flatMap((s) => numbers(s.d).filter((_, i) => i % 2 === 0 && i < 4))
    const swatchX = numbers(shapes(short, 'legend-swatch')[0]!.d)[0]!
    expect(swatchX).toBeGreaterThan(Math.max(...sliceXs))
    expect(short.width).toBeLessThanOrEqual(560)

    const long = draw(`pie showData\n"${'A very long label that needs more than the room beside the pie '.repeat(2)}" : 3\n"Short" : 1`)
    const pieBottom = Math.max(...shapes(long, 'slice').flatMap((s) => numbers(s.d).filter((_, i) => i % 2 === 1 && i < 4)))
    const swatchY = numbers(shapes(long, 'legend-swatch')[0]!.d)[1]!
    expect(swatchY).toBeGreaterThan(pieBottom)
    expect(long.width).toBeLessThanOrEqual(560)
    expect(texts(long).some((t) => t.role === 'legend-label' && t.lines.length > 1)).toBe(true)
    expectSane(long)
    expectNoTextOverlap(long)
  })

  it('keeps texts apart and inside the canvas for typical and crowded charts', () => {
    expectNoTextOverlap(draw(PETS))
    const rows = Array.from({ length: 12 }, (_, i) => `"Region ${i + 1}" : ${10 + (i % 3)}`).join('\n')
    const crowded = draw(`pie showData\n${rows}`)
    expectNoTextOverlap(crowded)
    expectSane(crowded)
    const dense = draw(`pie\n${Array.from({ length: 24 }, (_, i) => `"S${i}" : ${i % 2 ? 4 : 5}`).join('\n')}`)
    expectNoTextOverlap(dense)
    const clustered = draw('pie\n"A" : 30\n"B" : 4\n"C" : 4\n"D" : 4\n"E" : 4\n"F" : 54')
    expectNoTextOverlap(clustered)
  })

  it('scales with size and density and keeps text at least the base size', () => {
    const sm = draw(PETS, { size: 'sm' })
    const md = draw(PETS)
    const lg = draw(PETS, { size: 'lg' })
    expect(sm.width).toBeLessThan(md.width)
    expect(md.width).toBeLessThan(lg.width)
    expect(lg.width).toBeLessThanOrEqual(Math.round(560 * (16 / 14)))
    expect(texts(lg).every((t) => t.size >= 16)).toBe(true)
    expectSane(sm)
    expectSane(lg)
    expectSane(draw(PETS, { density: 'compact', rounded: 'none' }))
    expectSane(draw(PETS, { density: 'spacious', rounded: 'full' }))
  })

  it('does not draw the title inside the picture', () => {
    const m = draw(PETS)
    expect(texts(m).some((t) => t.lines.join(' ').includes('Pets adopted'))).toBe(false)
  })
})

describe('pie render: errors and edge cases', () => {
  it('reports a pie without slices and a pie with only zero values as empty', () => {
    expect(fails('pie')).toMatchObject({ code: 'empty', message: 'This pie has no slices. Add a line such as "Dogs" : 42.' })
    expect(fails('pie title Nothing\n"A" : 0\n"B" : 0')).toMatchObject({
      code: 'empty',
      message: 'The pie has no values greater than zero. Give at least one slice a value above 0.',
    })
  })

  it('enforces maxNodes', () => {
    expect(fails('pie\n"A" : 1\n"B" : 1\n"C" : 1', { maxNodes: 2 })).toMatchObject({ code: 'limit' })
    expect(draw('pie\n"A" : 1\n"B" : 1', { maxNodes: 2 }).nodes).toBe(2)
  })

  it('keeps hostile labels as inert text', () => {
    const m = draw('pie\n"<script>alert(1)</script>" : 1\nx"><img src=x onerror=alert(1)> : 1\n"javascript:alert(1)" : 1')
    for (const i of m.items) {
      if (i.kind === 'text') continue
      expect(i.d).not.toMatch(/[<>"]|script|onerror|javascript/i)
      expect(Object.values(i).filter((v) => typeof v === 'string' && v !== (i as { title?: string }).title).join(' ')).not.toMatch(/<|script|onerror/)
    }
    expect(texts(m).some((t) => t.lines.join(' ').includes('javascript:alert(1)'))).toBe(true)
    expectSane(m)
  })

  it('handles unicode, very long unbroken labels and duplicate labels', () => {
    const m = draw(`pie showData\n"日本語 ü" : 2\n"${'W'.repeat(300)}" : 1\n"Same" : 1\n"Same" : 1`)
    expectSane(m)
    expectNoTextOverlap(m)
    expect(m.alt.sections[0]!.items.filter((s) => s.startsWith('Same'))).toHaveLength(2)
  })

  it('handles huge and tiny values', () => {
    const m = draw('pie\n"Huge" : 123456789012\n"Small" : 0.000001')
    expectSane(m)
    expect(m.alt.sections[0]!.items[1]).toBe('Small: 0.000001 (0%)')
  })

  it('renders 300 slices quickly', () => {
    const lines = ['pie showData']
    for (let i = 0; i < 300; i++) lines.push(`"Slice ${i}" : ${(i % 7) + 1}`)
    const parsed = parseMermaid(lines.join('\n'))
    if (!parsed.ok) throw new Error('parse')
    const t = performance.now()
    const r = renderModel(parsed.ast)
    expect(performance.now() - t).toBeLessThan(200)
    expect(r.ok).toBe(true)
    if (r.ok) expectSane(r.model)
  })
})
