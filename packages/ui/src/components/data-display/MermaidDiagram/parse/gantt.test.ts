import { describe, expect, it } from 'vitest'
import { parseMermaid } from '.'
import type { GanttAst } from './gantt'

const ok = (src: string): GanttAst => {
  const r = parseMermaid(src)
  if (!r.ok) throw new Error(JSON.stringify(r.errors))
  return r.ast as GanttAst
}
const bad = (src: string) => {
  const r = parseMermaid(src)
  if (r.ok) throw new Error('expected failure')
  return r.errors[0]!
}
const day = (s: string) => Date.parse(`${s}T00:00:00Z`)

describe('gantt parse: good', () => {
  const full = `gantt
  title Warehouse rollout
  dateFormat YYYY-MM-DD
  axisFormat %d/%m
  excludes weekends
  todayMarker off
  section Planning
  Survey the site :done, s1, 2026-03-01, 5d
  Draft layout :active, s2, after s1, 1w
  Sign off :milestone, crit, m1, after s2, 0d
  section Build
  Install racking :crit, b1, after m1, 10d
  Train staff :2026-03-20, 2026-03-27
  Go live :milestone, g1, 2026-03-10, until b1
`
  it('reads every task, tag and date', () => {
    const a = ok(full)
    expect(a.type).toBe('gantt')
    expect(a.meta.title).toBe('Warehouse rollout')
    expect(a.sections.map((s) => s.name)).toEqual(['Planning', 'Build'])
    expect(a.tasks).toHaveLength(6)
    const [s1, s2, m1, b1, tr, g1] = a.tasks
    expect(s1).toMatchObject({ name: 'Survey the site', id: 's1', done: true, start: day('2026-03-01'), end: day('2026-03-06') })
    expect(s2).toMatchObject({ active: true, start: day('2026-03-06'), end: day('2026-03-13'), deps: ['s1'] })
    expect(m1).toMatchObject({ milestone: true, crit: true, start: day('2026-03-13'), end: day('2026-03-13') })
    expect(b1).toMatchObject({ crit: true, section: 1, end: day('2026-03-23') })
    expect(tr).toMatchObject({ start: day('2026-03-20'), end: day('2026-03-27') })
    expect(g1).toMatchObject({ start: day('2026-03-10'), end: b1!.start, deps: ['b1'] })
  })

  it('tags in any order, with or without id', () => {
    const a = ok('gantt\nA :crit, done, active, 2026-01-01, 1d\nB :milestone, 2026-01-02, 0d')
    expect(a.tasks[0]).toMatchObject({ crit: true, done: true, active: true })
    expect(a.tasks[1]!.milestone).toBe(true)
    expect(a.tasks[0]!.id).toBeUndefined()
  })

  it('start omitted follows the previous task, also across sections', () => {
    const a = ok('gantt\nA :2026-01-01, 2d\nsection S\nB :3d\nC :t3, 1w')
    expect(a.tasks[1]!.start).toBe(day('2026-01-03'))
    expect(a.tasks[2]).toMatchObject({ id: 't3', start: day('2026-01-06'), end: day('2026-01-13') })
  })

  it('after takes the latest end of several ids', () => {
    const a = ok('gantt\nA :a, 2026-01-01, 2d\nB :b, 2026-01-01, 5d\nC :after a b, 1d')
    expect(a.tasks[2]!.start).toBe(day('2026-01-06'))
    expect(a.tasks[2]!.deps).toEqual(['a', 'b'])
  })

  it('durations in h, m, w, d and decimals', () => {
    const a = ok('gantt\ndateFormat YYYY-MM-DD HH:mm\nA :2026-01-01 08:00, 12h\nB :30m\nC :1.5d')
    expect(a.hasTime).toBe(true)
    expect(a.tasks[0]!.end - a.tasks[0]!.start).toBe(12 * 3600000)
    expect(a.tasks[1]!.end - a.tasks[1]!.start).toBe(30 * 60000)
    expect(a.tasks[2]!.end - a.tasks[2]!.start).toBe(36 * 3600000)
  })

  it('other date formats', () => {
    expect(ok('gantt\ndateFormat DD/MM/YYYY\nA :01/02/2026, 05/02/2026').tasks[0]!.end).toBe(day('2026-02-05'))
    expect(ok('gantt\ndateFormat YY.MM.DD\nA :26.02.01, 2d').tasks[0]!.start).toBe(day('2026-02-01'))
    expect(ok('gantt\ndateFormat HH:mm\nA :09:00, 30m').hasTime).toBe(true)
    expect(ok('gantt\ndateFormat YYYY-MM-DD\nA :2024-02-29, 1d').tasks[0]!.end).toBe(day('2024-03-01'))
  })

  it('task outside a section goes to an implicit unnamed section', () => {
    const a = ok('gantt\nA :2026-01-01, 1d\nsection X\nB :1d')
    expect(a.sections.map((s) => s.name)).toEqual(['', 'X'])
    expect(a.tasks.map((t) => t.section)).toEqual([0, 1])
  })

  it('accepts and ignores every other directive', () => {
    const a = ok('gantt\ntickInterval 1week\nweekday monday\nweekend friday\nincludes 2026-01-01\ninclusiveEndDates\ntopAxis\ndisplayMode compact\nclick A href "#"\nA :2026-01-01, 1d')
    expect(a.tasks).toHaveLength(1)
  })

  it('a task whose id or name looks like a keyword is still a task', () => {
    const a = ok('gantt\nweekday report :2026-01-01, 1d\nTitle page :2026-01-02, 1d')
    expect(a.tasks.map((t) => t.name)).toEqual(['weekday report', 'Title page'])
  })

  it('unicode, quotes and hostile text stay plain data', () => {
    const a = ok('gantt\ntitle Zażółć "gęślą" <script>alert(1)</script>\nsection "><img src=x onerror=alert(1)>\njavascript alert(1) :2026-01-01, 1d\nUbicación :2026-01-02, 1d')
    expect(a.meta.title).toContain('<script>')
    expect(a.sections[0]!.name).toBe('"><img src=x onerror=alert(1)>')
    expect(a.tasks[1]!.name).toBe('Ubicación')
  })

  it('CRLF source', () => {
    expect(ok('gantt\r\nA :2026-01-01, 1d\r\nB :1d\r\n').tasks).toHaveLength(2)
  })

  it('front matter title', () => {
    expect(ok('---\ntitle: From front matter\n---\ngantt\nA :2026-01-01, 1d').meta.title).toBe('From front matter')
  })

  it('1000 tasks parse quickly', () => {
    const lines = ['gantt', 'dateFormat YYYY-MM-DD']
    for (let i = 0; i < 1000; i++) lines.push(`Task ${i} :t${i}, ${i === 0 ? '2026-01-01' : `after t${i - 1}`}, 1d`)
    const t0 = performance.now()
    const a = ok(lines.join('\n'))
    expect(performance.now() - t0).toBeLessThan(200)
    expect(a.tasks).toHaveLength(1000)
  })

  it('empty body and only comments parse to no tasks', () => {
    expect(ok('gantt').tasks).toEqual([])
    expect(ok('gantt\n%% nothing here\n\n').tasks).toEqual([])
    expect(ok('gantt\ntitle Only a title').meta.title).toBe('Only a title')
  })

  it('a very long task name is kept whole', () => {
    expect(ok(`gantt\n${'long '.repeat(300)}:2026-01-01, 1d`).tasks[0]!.name.length).toBeGreaterThan(1000)
  })
})

describe('gantt parse: bad', () => {
  it('unknown date format token', () => {
    expect(bad('gantt\ndateFormat X')).toMatchObject({ line: 2, column: 12, message: expect.stringContaining('"X", which is not supported') })
    expect(bad('gantt\ndateFormat YYYY-MMM-DD')).toMatchObject({ line: 2, column: 19 })
    expect(bad('gantt\n  dateFormat -/-').message).toContain('no date parts')
    expect(bad('gantt\ndateFormat').message).toContain('needs a format')
  })

  it('start or end not parseable', () => {
    const s = bad('gantt\nA :2026-13-01, 1d')
    expect(s).toMatchObject({ line: 2, column: 4 })
    expect(s.message).toContain('"2026-13-01" is not a start date in the format YYYY-MM-DD')
    const e = bad('gantt\nA :2026-01-01, tomorrow')
    expect(e).toMatchObject({ line: 2, column: 16 })
    expect(e.message).toContain('"tomorrow" is not an end date')
    expect(e.message).toContain('until taskId')
    expect(bad('gantt\ndateFormat HH:mm\nA :25:00, 1h').message).toContain('09:30')
    expect(bad('gantt\nA :2026-02-30, 1d').line).toBe(2)
    expect(bad('gantt\nA :2026-1-01, 1d').line).toBe(2)
    expect(bad('gantt\nA :2026-01-01x, 1d').line).toBe(2)
  })

  it('unsupported duration unit', () => {
    const e = bad('gantt\nA :2026-01-01, 3q')
    expect(e).toMatchObject({ line: 2, column: 16 })
    expect(e.message).toBe('The duration unit "q" in "3q" is not supported. Use ms, s, m (minutes), h, d, w, M (months) or y (years), for example "3d" or "2M". Months and years must be whole numbers.')
    expect(bad('gantt\nA :2026-01-01, 1.5M').message).toContain('"M"')
  })

  it('durations in months and years follow the calendar, seconds and milliseconds are fixed', () => {
    const t = (d: string) => ok(`gantt\nA :2026-01-31, ${d}`).tasks[0]!
    const day = (ms: number) => new Date(ms).toISOString().slice(0, 10)
    expect(day(t('1M').end)).toBe('2026-02-28')
    expect(day(t('2M').end)).toBe('2026-03-31')
    expect(day(t('1y').end)).toBe('2027-01-31')
    expect(day(t('13M').end)).toBe('2027-02-28')
    expect(day(ok('gantt\nA :2024-02-29, 1y').tasks[0]!.end)).toBe('2025-02-28')
    expect(t('86400s').end - t('0s').end).toBe(86400000)
    expect(t('1500ms').end - t('0ms').end).toBe(1500)
    expect(ok('gantt\nA :a1, 2026-01-01, 2M\nB :after a1, 1y').tasks[1]!.end).toBeGreaterThan(ok('gantt\nA :a1, 2026-01-01, 2M').tasks[0]!.end)
  })

  it('after and until with an unknown id', () => {
    const e = bad('gantt\nA :a, 2026-01-01, 1d\nB :after a zz, 1d')
    expect(e).toMatchObject({ line: 3, column: 12 })
    expect(e.message).toContain('unknown task id "zz"')
    const u = bad('gantt\nA :2026-01-01, until nope')
    expect(u).toMatchObject({ line: 2, column: 22 })
    expect(bad('gantt\nB :after later, 1d\nL :later, 2026-01-01, 1d').line).toBe(2)
    expect(bad('gantt\nA :2026-01-01, 1d\nB :after, 1d').message).toContain('needs at least one task id')
  })

  it('duplicate id', () => {
    const e = bad('gantt\nA :x, 2026-01-01, 1d\nB :x, 2026-01-02, 1d')
    expect(e).toMatchObject({ line: 3, column: 4 })
    expect(e.message).toContain('"x" is already used')
  })

  it('invalid id', () => {
    expect(bad('gantt\nA :bad id!, 2026-01-01, 1d').message).toContain('not a valid task id')
  })

  it('end before start', () => {
    const e = bad('gantt\nA :2026-03-05, 2026-03-01')
    expect(e).toMatchObject({ line: 2, column: 16 })
    expect(e.message).toContain('ends (2026-03-01) before it starts (2026-03-05)')
    expect(bad('gantt\ndateFormat YYYY-MM-DD HH:mm\nA :2026-03-05 10:00, 2026-03-05 09:00').message).toContain('2026-03-05 09:00')
    expect(bad('gantt\nA :a, 2026-03-05, 1d\nB :2026-03-10, until a').line).toBe(3)
  })

  it('line without a colon', () => {
    const e = bad('gantt\nDesign the thing')
    expect(e).toMatchObject({ line: 2, column: 17 })
    expect(e.message).toContain('Write the task name, a colon and its dates')
  })

  it('task shape errors', () => {
    expect(bad('gantt\n:2026-01-01, 1d')).toMatchObject({ line: 2, column: 1 })
    expect(bad('gantt\nA :')).toMatchObject({ line: 2, column: 4 })
    expect(bad('gantt\nA :done')).toMatchObject({ line: 2, column: 8 })
    expect(bad('gantt\nA :2026-01-01,, 1d')).toMatchObject({ line: 2, column: 15 })
    expect(bad('gantt\nA :a, 2026-01-01, 1d, 5d')).toMatchObject({ line: 2, column: 23 })
    expect(bad('gantt\nA :3d').message).toContain('needs a start date')
    expect(bad('gantt\nA :3d').column).toBe(4)
  })

  it('sections without a name', () => {
    expect(bad('gantt\nsection')).toMatchObject({ line: 2, column: 1 })
    expect(bad('gantt\nsection   ')).toMatchObject({ line: 2, column: 1 })
  })

  it('reports the original line number after comments and blank lines', () => {
    const e = bad('gantt\n%% c\n\n  title X\n  A :bad')
    expect(e.line).toBe(5)
    expect(e.column).toBe(6)
  })
})
