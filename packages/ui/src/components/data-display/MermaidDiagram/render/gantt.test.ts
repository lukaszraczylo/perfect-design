import { describe, expect, it } from 'vitest'
import { metricsFor } from '../../_diagram/text'
import type { RPath, RShape, RText } from '../../_diagram/types'
import { parseMermaid } from '../parse'
import { renderModel } from '.'
import { expectNoTextOverlap, expectSane, model, pathPoints, renderError, texts } from './timelineKit/testing'

const SAMPLE = `gantt
  title Kestrel Freight dock upgrade
  dateFormat YYYY-MM-DD
  section Planning
  Survey the dock :done, s1, 2026-03-01, 5d
  Draft layout :active, s2, after s1, 1w
  Sign off :milestone, crit, m1, after s2, 0d
  section Build
  Install racking :crit, b1, after m1, 10d
  Train staff :2026-03-20, 2026-03-27
  Go live :milestone, g1, 2026-04-05, 0d
`

const shapes = (m: ReturnType<typeof model>, role: string) => m.items.filter((i): i is RShape => i.kind === 'shape' && i.role === role)

describe('gantt render', () => {
  it('builds a sane model with counts, title, summary and alt', () => {
    const m = model(SAMPLE)
    expectSane(m)
    expectNoTextOverlap(m)
    expect(m.type).toBe('gantt')
    expect(m.title).toBe('Kestrel Freight dock upgrade')
    expect(m.nodes).toBe(6)
    expect(m.edges).toBe(3)
    expect(m.fontSize).toBe(14)
    expect(m.summary).toBe('Gantt chart with 6 tasks in 2 sections, from 2026-03-01 to 2026-04-05')
    expect(m.alt.sections[0]).toEqual({
      title: 'Tasks',
      ordered: true,
      items: [
        'Planning: Survey the dock, 2026-03-01 to 2026-03-06 (done)',
        'Planning: Draft layout, 2026-03-06 to 2026-03-13 (active)',
        'Planning: Sign off, 2026-03-13 (milestone, critical)',
        'Build: Install racking, 2026-03-13 to 2026-03-23 (critical)',
        'Build: Train staff, 2026-03-20 to 2026-03-27',
        'Build: Go live, 2026-04-05 (milestone)',
      ],
    })
    expect(m.alt.sections[1]!.items).toEqual(['Draft layout depends on s1', 'Sign off depends on s2', 'Install racking depends on m1'])
  })

  it('never draws the title inside the svg', () => {
    expect(texts(model(SAMPLE))).not.toContain('Kestrel Freight dock upgrade')
  })

  it('is deterministic', () => {
    expect(JSON.stringify(model(SAMPLE))).toBe(JSON.stringify(model(SAMPLE)))
  })

  it('status is readable without colour', () => {
    const m = model(SAMPLE)
    const t = texts(m)
    expect(t).toContain('done')
    expect(t).toContain('active')
    expect(t).toContain('critical')
    expect(t).toContain('2026-03-13, critical')
    expect(t).toContain('2026-04-05')
    const tasks = shapes(m, 'task')
    expect(tasks[0]!.paint).toMatchObject({ fill: 'surface', stroke: 'normal' }) // done: outline
    expect(tasks[1]!.paint).toMatchObject({ fill: 'solid', tone: 'primary' })
    expect(m.items.some((i) => i.kind === 'path' && i.role === 'done-mark')).toBe(true)
    const outlines = shapes(m, 'task-outline')
    expect(outlines.length).toBe(3) // active, critical bar, critical milestone
    expect(outlines.every((o) => o.paint.stroke === 'thick' && o.paint.fill === 'none')).toBe(true)
    expect(shapes(m, 'task').find((s) => s.title?.startsWith('Install'))!.paint.tone).toBe('danger')
    expect(shapes(m, 'milestone')).toHaveLength(2)
  })

  it('done critical task is a thick danger outline, done milestone is an outline diamond', () => {
    const m = model('gantt\nA :done, crit, 2026-01-01, 4d\nB :done, milestone, 2026-01-03, 0d\nC :done, milestone, crit, 2026-01-03, 0d\nD :active, milestone, 2026-01-03, 0d')
    expect(shapes(m, 'task')[0]!.paint).toEqual({ fill: 'surface', tone: 'danger', stroke: 'thick' })
    const ms = shapes(m, 'milestone')
    expect(ms[0]!.paint).toMatchObject({ fill: 'surface', stroke: 'normal' })
    expect(ms[1]!.paint).toMatchObject({ fill: 'surface', stroke: 'thick', tone: 'danger' })
    expect(ms[2]!.paint.fill).toBe('solid')
    expect(shapes(m, 'task-outline')).toHaveLength(1)
  })

  it('milestone is a diamond path', () => {
    const d = shapes(model(SAMPLE), 'milestone')[0]!.d
    expect(d.match(/L/g)).toHaveLength(3)
    expect(d.endsWith('Z')).toBe(true)
  })

  it('bars scale with dates and stay at least 4px wide', () => {
    const m = model('gantt\nLong :2026-01-01, 30d\nTiny :t, 2026-01-10, 1m\nZero :z, 2026-01-12, 0d')
    const widths = shapes(m, 'task').map((sh) => {
      const xs = pathPoints(sh.d).map((p) => p.x)
      return Math.max(...xs) - Math.min(...xs)
    })
    expect(widths).toHaveLength(3)
    expect(widths[0]!).toBeGreaterThan(widths[1]!)
    expect(widths[1]!).toBeGreaterThanOrEqual(4)
    expect(widths[2]!).toBeGreaterThanOrEqual(4)
    expectSane(m)
  })

  it('tone option decides the bar tone; neutral falls back to primary', () => {
    expect(shapes(model('gantt\nA :2026-01-01, 1d', { tone: 'success' }), 'task')[0]!.paint.tone).toBe('success')
    expect(shapes(model('gantt\nA :2026-01-01, 1d', { tone: 'neutral' }), 'task')[0]!.paint.tone).toBe('primary')
    expect(shapes(model('gantt\nA :2026-01-01, 1d'), 'task')[0]!.paint.tone).toBe('primary')
  })

  it('alternate sections get a muted band; the implicit section has no name row', () => {
    const m = model('gantt\nA :2026-01-01, 1d\nsection One\nB :1d\nsection Two\nC :1d\nsection Three\nD :1d')
    const bands = shapes(m, 'section-band')
    expect(bands.length).toBe(2)
    expect(bands.every((b) => b.paint.fill === 'muted' && b.paint.stroke === 'none')).toBe(true)
    expect(m.items.filter((i): i is RText => i.kind === 'text' && i.role === 'section-label').map((t) => t.lines[0])).toEqual(['One', 'Two', 'Three'])
    expect(m.summary).toContain('in 4 sections')
    expectNoTextOverlap(m)
  })

  it('empty sections are skipped', () => {
    const m = model('gantt\nsection Empty\nsection Full\nA :2026-01-01, 1d')
    expect(m.summary).toContain('in 1 section,')
    expect(texts(m)).not.toContain('Empty')
  })

  it('long names wrap in the label column or are truncated with a title', () => {
    const long = 'Reconcile the quarterly freight invoices with the warehouse receiving records and carrier statements for every depot across the region'
    const m = model(`gantt\n${long} :2026-01-01, 3d\nShort :2026-01-04, 2d`)
    expectSane(m)
    const label = m.items.find((i): i is RText => i.kind === 'text' && i.role === 'task-label')!
    expect(label.lines.length).toBeLessThanOrEqual(3)
    expect(label.lines.at(-1)!.endsWith('…')).toBe(true)
    expect(label.title).toBe(long)
    expect(m.alt.sections[0]!.items[0]).toContain(long)
    expectNoTextOverlap(m)
  })

  it('a wrapped name that fits in three lines has no title', () => {
    const m = model('gantt\nReview the freight invoices before close :2026-01-01, 3d')
    const label = m.items.find((i): i is RText => i.kind === 'text' && i.role === 'task-label')!
    expect(label.lines.length).toBeGreaterThan(1)
    expect(label.title).toBeUndefined()
  })

  it('tick choice follows the span: hours, days, weeks, months', () => {
    const labels = (src: string) => model(src).items.filter((i): i is RText => i.kind === 'text' && i.role === 'axis-label').map((t) => t.lines[0]!)
    const hours = labels('gantt\ndateFormat YYYY-MM-DD HH:mm\nA :2026-01-01 08:00, 5h')
    expect(hours[0]).toMatch(/^\d\d:\d\d$/)
    expect(labels('gantt\ndateFormat YYYY-MM-DD HH:mm\nA :2026-01-01 00:00, 20h')[0]).toMatch(/^\d\d:\d\d$/)
    expect(labels('gantt\ndateFormat YYYY-MM-DD HH:mm\nA :2026-01-01 00:00, 40h')[0]).toMatch(/^\d\d:\d\d$/)
    expect(labels('gantt\nA :2026-01-01, 6d')).toContain('3 Jan')
    expect(labels('gantt\nA :2026-01-01, 60d')[0]).toBe('5 Jan') // Monday
    expect(labels('gantt\nA :2026-01-01, 400d')).toContain('Jan 2027')
    expect(labels('gantt\nA :2020-01-01, 4000d').length).toBeGreaterThan(3)
  })

  it('tick labels never overlap, even for long spans', () => {
    const m = model('gantt\nA :2010-01-01, 4000d')
    expectNoTextOverlap(m)
    expectSane(m)
  })

  it('gridlines are faint paths', () => {
    const grid = model(SAMPLE).items.filter((i): i is RPath => i.kind === 'path' && i.role === 'gridline')
    expect(grid.length).toBeGreaterThan(3)
    expect(grid.every((g) => g.faint && g.style === 'solid')).toBe(true)
  })

  it('all tasks on one date still render', () => {
    const m = model('gantt\nA :milestone, 2026-01-01, 0d\nB :milestone, 2026-01-01, 0d')
    expectSane(m)
    expect(m.summary).toContain('from 2026-01-01 to 2026-01-02')
  })

  it('same-instant milestones with time', () => {
    const m = model('gantt\ndateFormat YYYY-MM-DD HH:mm\nA :milestone, 2026-01-01 09:00, 0m')
    expectSane(m)
    expect(m.summary).toContain('2026-01-01 09:00')
  })

  it('size, density and rounding scale the model', () => {
    const base = model(SAMPLE)
    const big = model(SAMPLE, { size: 'lg', density: 'spacious', rounded: 'full' })
    const small = model(SAMPLE, { size: 'sm', density: 'compact', rounded: 'none' })
    expect(big.fontSize).toBe(16)
    expect(big.height).toBeGreaterThan(base.height)
    expect(small.height).toBeLessThan(base.height)
    expectSane(big)
    expectSane(small)
    expectNoTextOverlap(big)
    expectNoTextOverlap(small)
  })

  it('1000 tasks stay inside the default limit when raised, and fail by default', () => {
    const lines = ['gantt']
    for (let i = 0; i < 400; i++) lines.push(`Task ${i} :2026-01-01, ${i + 1}d`)
    const err = renderError(lines.join('\n'))
    expect(err).toMatchObject({ code: 'limit', diagramType: 'gantt' })
    expect(err.message).toContain('400 nodes')
    const t0 = performance.now()
    const m = model(lines.join('\n'), { maxNodes: 1000 })
    expect(performance.now() - t0).toBeLessThan(500)
    expect(m.nodes).toBe(400)
  })

  it('edge limit counts after-dependencies', () => {
    const err = renderError('gantt\nA :a, 2026-01-01, 1d\nB :after a, 1d\nC :after a b, 1d'.replace('after a b', 'after a'), { maxEdges: 1 })
    expect(err).toMatchObject({ code: 'limit' })
    expect(err.message).toContain('2 connections')
  })

  it('empty chart is an empty error', () => {
    expect(renderError('gantt\ntitle Nothing')).toMatchObject({ code: 'empty' })
    expect(renderError('gantt')).toMatchObject({ code: 'empty' })
  })

  it('hostile text only appears inside text lines', () => {
    const m = model('gantt\nsection "><img src=x onerror=alert(1)>\n<script>alert(1)</script> :s, 2026-01-01, 2d\njavascript:alert(1) :2026-01-03, 1d'.replace('javascript:alert(1)', 'javascript alert(1)'))
    for (const i of m.items) if (i.kind !== 'text') expect(i.d).not.toMatch(/script|onerror|javascript/)
    expect(texts(m).join(' ')).toContain('alert(1)')
    expect(texts(m).join(' ')).not.toMatch(/<(img|script)/)
    expectSane(m)
  })

  it('unicode names and entities', () => {
    const m = model('gantt\nZażółć gęślą jaźń &amp; #35; :2026-01-01, 3d\n日本語のタスク :2026-01-02, 2d')
    expect(texts(m).join('|')).toContain('Zażółć')
    expect(m.alt.sections[0]!.items[0]).toContain('& #')
    expectSane(m)
  })

  it('alt sections and metrics come through renderModel directly', () => {
    const p = parseMermaid(SAMPLE)
    if (!p.ok) throw new Error('parse')
    const r = renderModel(p.ast, {})
    expect(r.ok).toBe(true)
    expect(metricsFor().font).toBe(14)
  })

  it('tasks with a very long section name truncate the band label', () => {
    const m = model(`gantt\nsection ${'Very long section name '.repeat(10)}\nA :2026-01-01, 3d`)
    const l = m.items.find((i): i is RText => i.kind === 'text' && i.role === 'section-label')!
    expect(l.lines[0]!.length).toBeGreaterThan(5)
    expectSane(m)
  })
})
