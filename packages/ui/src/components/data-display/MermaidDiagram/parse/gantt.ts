/**
 * `gantt` parser.
 *
 * Supported: `title`, `dateFormat` (tokens YYYY YY MM DD HH mm with any separators), `section`, tasks
 * `Name :[done|active|crit|milestone ...,] [id,] [start,] end|duration`. Start is a date, `after id [id2 ...]` (latest end
 * of the referenced tasks) or omitted (the previous task's end). End is a date, a duration (`3d` `2w` `12h` `30m` `45s` `500ms`, calendar `2M` and `1y`) or
 * `until id` (start of that task). A task whose first item is neither a date nor `after` and which has two items is
 * read as `id, end` (start omitted). Referenced ids must be defined on an earlier line. Dates are UTC.
 * Accepted and ignored: `axisFormat` (the chart picks its own tick labels), `tickInterval`, `excludes`, `includes`,
 * `weekday`, `weekend`, `todayMarker`, `inclusiveEndDates`, `topAxis`, `displayMode`, `click`.
 * Not supported: the `X`/`x` unix formats and other day-name or month-name tokens, 
 * references to tasks defined further down.
 */
import { fail, type DiagramMeta, type SourceLine } from '../../_diagram/types'
import type { PreparedSource } from '../../_diagram/source'
import { compileDateFormat, formatDateTime, durationEnd, looksLikeDuration, parseDateText, type DateFormat } from '../../_diagram/ganttDates'

export interface GanttSection {
  /** Empty for the implicit section that holds tasks written before any `section` line. */
  name: string
  line: number
}

export interface GanttTask {
  name: string
  /** Id written in the source, if any. */
  id?: string
  /** Index into `GanttAst.sections`. */
  section: number
  done: boolean
  active: boolean
  crit: boolean
  milestone: boolean
  /** Milliseconds since the epoch (UTC). */
  start: number
  end: number
  /** Ids this task starts after or ends at (`after`, `until`), in source order. */
  deps: string[]
  line: number
}

export interface GanttAst {
  type: 'gantt'
  /** Date format as written (default `YYYY-MM-DD`). */
  dateFormat: string
  /** True when the date format has hours or minutes. */
  hasTime: boolean
  sections: GanttSection[]
  tasks: GanttTask[]
  meta: DiagramMeta
}

const IGNORED = new Set(['axisFormat', 'tickInterval', 'excludes', 'includes', 'weekday', 'weekend', 'todayMarker', 'inclusiveEndDates', 'topAxis', 'displayMode', 'click'])
const TAGS = new Set(['done', 'active', 'crit', 'milestone'])
const ID = /^[\p{L}\p{N}_-]+$/u
const DIRECTIVE = /^([A-Za-z]+)(?:\s+(.*))?$/

interface Item {
  text: string
  /** Index in the line text of the first character of the item. */
  at: number
}

function splitItems(text: string, from: number): Item[] {
  const out: Item[] = []
  let start = from
  for (let i = from; i <= text.length; i++) {
    if (i === text.length || text[i] === ',') {
      const raw = text.slice(start, i)
      out.push({ text: raw.trim(), at: start + (raw.length - raw.trimStart().length) })
      start = i + 1
    }
  }
  return out
}

export function parseGantt(p: PreparedSource): GanttAst {
  const meta: DiagramMeta = { ...p.meta }
  const ast: GanttAst = { type: 'gantt', dateFormat: 'YYYY-MM-DD', hasTime: false, sections: [], tasks: [], meta }
  let fmt: DateFormat = compileDateFormat('YYYY-MM-DD') as DateFormat
  const byId = new Map<string, GanttTask>()
  let section = -1

  const colOf = (l: SourceLine, at: number): number => l.col + at

  const dateOf = (l: SourceLine, it: Item, what: string): number => {
    const v = parseDateText(it.text, fmt)
    if (v === undefined) {
      fail(l.no, colOf(l, it.at), `"${it.text}" is not ${what} in the format ${fmt.source}. Write a date such as ${formatExample(fmt)}${what === 'an end date' ? ', a duration such as 3d, 2w, 12h or 30m, or "until taskId"' : ''}.`)
    }
    return v as number
  }

  const lookup = (l: SourceLine, id: string, at: number, kw: string): GanttTask => {
    const t = byId.get(id)
    if (!t) fail(l.no, colOf(l, at), `"${kw} ${id}" refers to an unknown task id "${id}". Give that task the id (":id, start, end") on a line above this one.`)
    return t as GanttTask
  }

  for (const l of p.lines) {
    const dm = DIRECTIVE.exec(l.text)
    const word = dm?.[1]
    if (word === 'title' && (dm![2] !== undefined || l.text === 'title')) {
      const t = (dm![2] ?? '').trim()
      if (t) meta.title = t
      continue
    }
    if (word === 'dateFormat') {
      const f = (dm![2] ?? '').trim()
      const at = l.text.indexOf(f, word.length)
      if (!f) fail(l.no, colOf(l, word.length), 'dateFormat needs a format, for example "dateFormat YYYY-MM-DD".')
      const c = compileDateFormat(f)
      if (typeof c === 'number') {
        const bad = f.slice(c).match(/^[A-Za-z]+/)?.[0] ?? f.slice(c, c + 1)
        fail(l.no, colOf(l, at + c), c === 0 && !/[A-Za-z]/.test(f) ? `The date format "${f}" has no date parts. Use tokens such as YYYY-MM-DD.` : `The date format "${f}" uses "${bad}", which is not supported. Use the tokens YYYY, YY, MM, DD, HH and mm, for example "YYYY-MM-DD" or "DD/MM/YYYY HH:mm".`)
      }
      fmt = c as DateFormat
      ast.dateFormat = f
      ast.hasTime = fmt.hasTime
      continue
    }
    if (word !== undefined && IGNORED.has(word) && (!l.text.includes(':') || word === 'todayMarker' || word === 'click')) continue
    if (word === 'section' && dm![2] !== undefined) {
      const name = dm![2].trim()
      if (!name) fail(l.no, colOf(l, word.length), 'A section needs a name, for example "section Planning".')
      ast.sections.push({ name, line: l.no })
      section = ast.sections.length - 1
      continue
    }
    if (l.text === 'section') fail(l.no, l.col, 'A section needs a name, for example "section Planning".')

    // task line
    const colon = l.text.indexOf(':')
    if (colon < 0) fail(l.no, colOf(l, l.text.length), `"${l.text}" is not a task. Write the task name, a colon and its dates, for example "${l.text} :2026-03-01, 5d".`)
    const name = l.text.slice(0, colon).trim()
    if (!name) fail(l.no, l.col, 'A task needs a name before the colon, for example "Design :2026-03-01, 5d".')
    const items = splitItems(l.text, colon + 1)
    const tags = { done: false, active: false, crit: false, milestone: false }
    let k = 0
    while (k < items.length && TAGS.has(items[k]!.text)) {
      tags[items[k]!.text as keyof typeof tags] = true
      k++
    }
    const rest = items.slice(k)
    for (const it of rest) if (it.text === '') fail(l.no, colOf(l, it.at), 'This item is empty. Remove the extra comma or write a value.')
    if (rest.length === 0) fail(l.no, colOf(l, l.text.length), `Task "${name}" has no dates. Write ":2026-03-01, 5d" (start and duration) or ":2026-03-01, 2026-03-06" (start and end).`)
    if (rest.length > 3) fail(l.no, colOf(l, rest[3]!.at), `Too many items. A task is "[tags,] [id,] start, end", with at most one id, one start and one end.`)

    // id / start / end
    let idItem: Item | undefined
    let startItem: Item | undefined
    let endItem: Item
    const isStartish = (t: string): boolean => parseDateText(t, fmt) !== undefined || /^after(\s|$)/i.test(t)
    if (rest.length === 3) [idItem, startItem, endItem] = rest as [Item, Item, Item]
    else if (rest.length === 2) {
      if (!isStartish(rest[0]!.text) && ID.test(rest[0]!.text) && /[\p{L}_]/u.test(rest[0]!.text) && durationEnd(0, rest[0]!.text) === undefined) [idItem, endItem] = rest as [Item, Item]
      else [startItem, endItem] = rest as [Item, Item]
    } else endItem = rest[0]!

    let id: string | undefined
    if (idItem) {
      if (!ID.test(idItem.text)) fail(l.no, colOf(l, idItem.at), `"${idItem.text}" is not a valid task id. Use letters, digits, "_" or "-" without spaces.`)
      if (byId.has(idItem.text)) fail(l.no, colOf(l, idItem.at), `The task id "${idItem.text}" is already used by another task. Give each task its own id.`)
      id = idItem.text
    }

    const deps: string[] = []
    let start: number
    if (startItem) {
      const am = /^after(\s+(.*))?$/i.exec(startItem.text)
      if (am) {
        const refs = (am[2] ?? '').split(/\s+/).filter(Boolean)
        if (refs.length === 0) fail(l.no, colOf(l, startItem.at + startItem.text.length), '"after" needs at least one task id, for example "after design".')
        let latest = -Infinity
        let from = startItem.at + 5
        for (const ref of refs) {
          const at = l.text.indexOf(ref, from)
          from = at + ref.length
          const t = lookup(l, ref, at, 'after')
          deps.push(ref)
          latest = Math.max(latest, t.end)
        }
        start = latest
      } else start = dateOf(l, startItem, 'a start date')
    } else {
      const prev = ast.tasks[ast.tasks.length - 1]
      if (!prev) fail(l.no, colOf(l, endItem.at), `The first task needs a start date because there is no earlier task to follow. Write ":2026-03-01, ${endItem.text}".`)
      start = prev!.end
    }

    let end = 0
    const um = /^until\s+(\S+)$/i.exec(endItem.text)
    const durEnd = durationEnd(start, endItem.text)
    if (um) {
      const at = l.text.indexOf(um[1]!, endItem.at + 5)
      end = lookup(l, um[1]!, at, 'until').start
      deps.push(um[1]!)
    } else if (durEnd !== undefined) end = durEnd
    else if (looksLikeDuration(endItem.text) && parseDateText(endItem.text, fmt) === undefined) {
      const m = looksLikeDuration(endItem.text)!
      fail(l.no, colOf(l, endItem.at), `The duration unit "${m[2]}" in "${endItem.text}" is not supported. Use ms, s, m (minutes), h, d, w, M (months) or y (years), for example "3d" or "2M". Months and years must be whole numbers.`)
    } else end = dateOf(l, endItem, 'an end date')
    if (end < start) {
      fail(l.no, colOf(l, endItem.at), `The task "${name}" ends (${formatDateTime(end, fmt.hasTime)}) before it starts (${formatDateTime(start, fmt.hasTime)}). Move the end later or the start earlier.`)
    }

    if (section < 0) {
      ast.sections.push({ name: '', line: l.no })
      section = ast.sections.length - 1
    }
    const task: GanttTask = { name, ...(id ? { id } : {}), section, ...tags, start, end, deps, line: l.no }
    ast.tasks.push(task)
    if (id) byId.set(id, task)
  }
  return ast
}

function formatExample(f: DateFormat): string {
  return f.parts.map((x) => ('literal' in x ? x.literal : x.token === 'YYYY' ? '2026' : x.token === 'YY' ? '26' : x.token === 'MM' ? '03' : x.token === 'DD' ? '01' : x.token === 'HH' ? '09' : '30')).join('')
}
