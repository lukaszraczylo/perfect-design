/**
 * `pie` parser.
 *
 * Supported: `pie`, `pie showData`, `pie title Pets adopted`, `pie showData title Pets`, a separate `title Pets` line, and
 * slices written as `"Label" : 42.5`. A label may also be written without quotes when it contains no colon. Values are
 * non-negative numbers (digits with an optional decimal part); zero is allowed and is listed but not drawn. Duplicate
 * labels are allowed and stay separate slices.
 * Not supported: exponent notation and thousands separators in values, escaped quotes inside a label (write `#quot;`).
 */
import type { PreparedSource } from '../../_diagram/source'
import { fail, type DiagramMeta, type SourceLine } from '../../_diagram/types'

export interface PieSlice {
  /** Text as written between the quotes (before entity handling). */
  label: string
  value: number
  line: number
}

export interface PieAst {
  type: 'pie'
  showData: boolean
  slices: PieSlice[]
  meta: DiagramMeta
}

const FORM = 'Write each slice as "Label" : 42.'
const NUMBER = /^(?:\d+(?:\.\d+)?|\.\d+)$/

function parseValue(l: SourceLine, raw: string, col: number): number {
  const text = raw.trim()
  if (text === '') return fail(l.no, col, `This slice has no value after the colon. ${FORM}`)
  if (/^-/.test(text)) return fail(l.no, col + raw.indexOf('-'), `Pie values cannot be negative ("${text}"). Use 0 or a positive number.`)
  if (!NUMBER.test(text)) return fail(l.no, col + (raw.length - raw.trimStart().length), `"${text}" is not a number. Write the value as digits with an optional decimal part, for example 42 or 42.5.`)
  const value = Number(text)
  if (!Number.isFinite(value)) return fail(l.no, col + (raw.length - raw.trimStart().length), `"${text.slice(0, 20)}..." is too large to draw.`)
  return value
}

export function parsePie(p: PreparedSource): PieAst {
  const meta: DiagramMeta = { ...p.meta }
  let showData = false
  let rest = p.rest
  let restCol = p.header.col + p.header.text.length - rest.length
  if (/^showData(?=\s|$)/.test(rest)) {
    showData = true
    const after = rest.slice('showData'.length)
    restCol += rest.length - after.trimStart().length
    rest = after.trimStart()
  }
  if (rest !== '') {
    const t = /^title(?:\s+(.*))?$/.exec(rest)
    if (!t) fail(p.header.no, restCol, 'After "pie" write "showData", "title Your title", or both: "pie showData title Your title".')
    else if (!t[1]?.trim()) fail(p.header.no, restCol + rest.length, 'A title needs text, for example "pie title Pets adopted".')
    else meta.title = t[1].trim()
  }

  const slices: PieSlice[] = []
  for (const l of p.lines) {
    const title = /^title(?:\s+(.*))?$/.exec(l.text)
    if (title) {
      if (!title[1]?.trim()) fail(l.no, l.col + l.text.length, 'A title needs text, for example "title Pets adopted".')
      meta.title = title[1]!.trim()
      continue
    }
    let label: string
    let valueAt: number
    if (l.text.startsWith('"')) {
      const close = l.text.indexOf('"', 1)
      if (close < 0) return fail(l.no, l.col, 'This quoted label is never closed. Add the closing quote: "Label" : 42.')
      label = l.text.slice(1, close)
      const after = l.text.slice(close + 1)
      const colon = /^\s*:/.exec(after)
      if (!colon) return fail(l.no, l.col + close + 1, `Expected a colon after the label. ${FORM}`)
      valueAt = close + 1 + colon[0].length
    } else {
      const colon = l.text.indexOf(':')
      if (colon < 0) return fail(l.no, l.col, `Unknown statement "${l.text.split(/\s+/)[0]}": a slice needs a colon and a value. ${FORM}`)
      label = l.text.slice(0, colon).trim()
      valueAt = colon + 1
    }
    if (label.trim() === '') return fail(l.no, l.col, `This slice has no label. ${FORM}`)
    const value = parseValue(l, l.text.slice(valueAt), l.col + valueAt)
    slices.push({ label, value, line: l.no })
  }
  return { type: 'pie', showData, slices, meta }
}
