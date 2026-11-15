/**
 * `timeline` parser.
 *
 * Supported: `title`, `section Name`, period lines `2004 : Event one : Event two` (the period is any text before the
 * first colon, events are separated by colons), continuation lines that start with a colon (`: another event`) and
 * `<br>` inside any text. A period without events is allowed. Colons cannot appear inside period or event text.
 * Not supported: per-section colour themes and `timeline LR`/`TD` directions.
 */
import { fail, type DiagramMeta } from '../../_diagram/types'
import type { PreparedSource } from '../../_diagram/source'

export interface TimelineSection {
  name: string
  line: number
}

export interface TimelinePeriod {
  /** Period text as written. */
  label: string
  /** Event texts as written, in order. */
  events: string[]
  /** Index into `TimelineAst.sections`, -1 when the period is written before any `section`. */
  section: number
  line: number
}

export interface TimelineAst {
  type: 'timeline'
  sections: TimelineSection[]
  periods: TimelinePeriod[]
  meta: DiagramMeta
}

/** Split `text` on colons, returning each part with the index where it starts. */
function splitColons(text: string, from: number): { text: string; at: number }[] {
  const out: { text: string; at: number }[] = []
  let start = from
  for (let i = from; i <= text.length; i++) {
    if (i === text.length || text[i] === ':') {
      const raw = text.slice(start, i)
      out.push({ text: raw.trim(), at: start + (raw.length - raw.trimStart().length) })
      start = i + 1
    }
  }
  return out
}

export function parseTimeline(p: PreparedSource): TimelineAst {
  const meta: DiagramMeta = { ...p.meta }
  const ast: TimelineAst = { type: 'timeline', sections: [], periods: [], meta }
  let section = -1
  for (const l of p.lines) {
    const kw = /^(title|section)(?:\s+(.*))?$/.exec(l.text)
    if (kw && !/^(title|section)\s*:/.test(l.text)) {
      const value = (kw[2] ?? '').trim()
      if (kw[1] === 'title') {
        if (value) meta.title = value
      } else {
        if (!value) fail(l.no, l.col + l.text.length, 'A section needs a name, for example "section Early years".')
        ast.sections.push({ name: value, line: l.no })
        section = ast.sections.length - 1
      }
      continue
    }
    if (l.text.startsWith(':')) {
      const prev = ast.periods[ast.periods.length - 1]
      if (!prev) fail(l.no, l.col, 'This event has no period to belong to. Write a period first, for example "2004 : Event".')
      for (const part of splitColons(l.text, 1)) {
        if (part.text === '') fail(l.no, l.col + part.at, 'This event is empty. Write the event text after the colon, for example ": Launch".')
        prev!.events.push(part.text)
      }
      continue
    }
    const parts = splitColons(l.text, 0)
    const label = parts[0]!.text
    const events: string[] = []
    for (const part of parts.slice(1)) {
      if (part.text === '') fail(l.no, l.col + part.at, 'This event is empty. Remove the extra colon or write the event text, for example "2004 : Launch".')
      events.push(part.text)
    }
    ast.periods.push({ label, events, section, line: l.no })
  }
  return ast
}
