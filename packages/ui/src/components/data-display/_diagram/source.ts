/**
 * Source preparation shared by every diagram type: line endings, front matter, comments, `%%{init}%%` directives,
 * accessibility lines (`accTitle`, `accDescr`) and header detection. Line numbers always refer to the original source.
 */
import { ParseFail, fail, type DiagramMeta, type MermaidParseError, type SourceLine } from './types'

export interface PreparedSource {
  /** Original lines (no line endings), for error display. */
  raw: string[]
  /** Header line text, e.g. `flowchart TD`. */
  header: SourceLine
  /** The diagram keyword, e.g. `flowchart`, `sequenceDiagram`, `gitGraph`. */
  keyword: string
  /** Header text after the keyword, trimmed. */
  rest: string
  /** Significant lines after the header. */
  lines: SourceLine[]
  meta: DiagramMeta
}

/** Diagram keywords of Mermaid that this renderer does not draw. They produce an "unsupported" message naming the type. */
export const UNSUPPORTED_TYPES: readonly string[] = [
  'gitGraph', 'quadrantChart', 'xychart-beta', 'xychart', 'sankey-beta', 'sankey', 'requirementDiagram', 'C4Context', 'C4Container', 'C4Component',
  'C4Dynamic', 'C4Deployment', 'block-beta', 'block', 'packet-beta', 'packet', 'architecture-beta', 'architecture', 'kanban', 'radar-beta', 'radar', 'zenuml', 'treemap',
]

export const SUPPORTED_KEYWORDS: readonly string[] = [
  'graph', 'flowchart', 'flowchart-elk', 'sequenceDiagram', 'pie', 'stateDiagram', 'stateDiagram-v2', 'erDiagram', 'classDiagram', 'classDiagram-v2', 'gantt', 'mindmap', 'timeline', 'journey',
]

const TAB = 4

function indentOf(line: string): number {
  let n = 0
  for (const ch of line) {
    if (ch === ' ') n += 1
    else if (ch === '\t') n += TAB
    else break
  }
  return n
}

function unquote(v: string): string {
  const t = v.trim()
  return (t.startsWith('"') && t.endsWith('"') && t.length >= 2) || (t.startsWith("'") && t.endsWith("'") && t.length >= 2) ? t.slice(1, -1) : t
}

/**
 * Cut a `%%` comment that follows a statement on the same line. A `%%` counts only when it is preceded by whitespace and is
 * outside double quotes and brackets, so `A["50%% off"]` and `A[x %% y]` keep their text.
 */
export function stripTrailingComment(text: string): string {
  let quote = false
  let depth = 0
  for (let i = 0; i < text.length - 1; i++) {
    const ch = text[i]!
    if (ch === '"') quote = !quote
    else if (quote) continue
    else if (ch === '[' || ch === '(' || ch === '{') depth++
    else if (ch === ']' || ch === ')' || ch === '}') depth = Math.max(0, depth - 1)
    else if (ch === '%' && text[i + 1] === '%' && depth === 0 && i > 0 && /\s/.test(text[i - 1]!)) return text.slice(0, i).trimEnd()
  }
  return text
}

/**
 * Split statements separated by `;` (outside double quotes) into separate lines with their own columns. Empty pieces are
 * dropped, so a trailing `;` is fine. Used for the diagram types where `;` ends a statement.
 */
export function splitSemicolons(lines: SourceLine[]): SourceLine[] {
  const out: SourceLine[] = []
  for (const line of lines) {
    if (!line.text.includes(';')) {
      out.push(line)
      continue
    }
    let quote = false
    let start = 0
    const s = line.text
    for (let i = 0; i <= s.length; i++) {
      if (s[i] === '"') quote = !quote
      // `#quot;` and `&amp;` are entity codes, not statement ends
      const entity = s[i] === ';' && /[#&]#?[A-Za-z0-9]+$/.test(s.slice(start, i))
      if (i === s.length || (s[i] === ';' && !quote && !entity)) {
        const raw = s.slice(start, i)
        const text = raw.trim()
        if (text) out.push({ no: line.no, text, indent: line.indent, col: line.col + start + (raw.length - raw.trimStart().length) })
        start = i + 1
      }
    }
  }
  return out
}

/** Split into original lines; accepts LF, CRLF and CR, and a leading byte order mark. */
export function splitSource(source: unknown): string[] {
  const text = typeof source === 'string' ? source : source == null ? '' : String(source)
  return text.replace(/^﻿/, '').split(/\r\n|\r|\n/)
}

export function prepareSource(source: unknown): PreparedSource {
  const raw = splitSource(source)
  const meta: DiagramMeta = {}
  const lines: SourceLine[] = []
  let i = 0

  // Front matter: `---` on the first non-blank line up to the next `---`.
  while (i < raw.length && raw[i]!.trim() === '') i++
  if (i < raw.length && raw[i]!.trim() === '---') {
    const open = i
    i++
    let closed = false
    for (; i < raw.length; i++) {
      const t = raw[i]!.trim()
      if (t === '---') {
        closed = true
        i++
        break
      }
      const m = /^title\s*:\s*(.*)$/.exec(raw[i]!)
      if (m && indentOf(raw[i]!) === 0 && m[1]!.trim()) meta.title = unquote(m[1]!)
    }
    if (!closed) fail(open + 1, raw[open]!.indexOf('---') + 1, 'The front matter opened here is never closed. Add a closing "---" line.')
  }

  for (; i < raw.length; i++) {
    const text = raw[i]!
    const t = text.trim()
    const no = i + 1
    if (t === '') continue
    if (t.startsWith('%%{')) {
      // Directive, possibly over several lines, ends with `}%%`. It is ignored.
      let j = i
      while (j < raw.length && !raw[j]!.includes('}%%')) j++
      if (j >= raw.length) fail(no, text.indexOf('%%{') + 1, 'This "%%{" directive is never closed. End it with "}%%".')
      i = j
      continue
    }
    if (t.startsWith('%%')) continue
    const acc = /^(accTitle|accDescr)\b\s*(:|\{)?(.*)$/.exec(t)
    if (acc && (acc[2] === ':' || acc[2] === '{')) {
      if (acc[1] === 'accTitle') {
        if (acc[2] === ':') meta.accTitle = acc[3]!.trim()
        else fail(no, text.indexOf('{') + 1, 'accTitle takes a single line: "accTitle: text".')
      } else if (acc[2] === ':') {
        meta.accDescr = acc[3]!.trim()
      } else {
        const parts: string[] = []
        const first = acc[3]!
        let closed = false
        if (first.includes('}')) {
          parts.push(first.slice(0, first.indexOf('}')))
          closed = true
        } else if (first.trim()) parts.push(first)
        let j = i + 1
        while (!closed && j < raw.length) {
          const l = raw[j]!
          if (l.includes('}')) {
            parts.push(l.slice(0, l.indexOf('}')))
            closed = true
          } else parts.push(l)
          j++
        }
        if (!closed) fail(no, text.indexOf('{') + 1, 'This accDescr block is never closed. End it with "}".')
        meta.accDescr = parts.map((p) => p.trim()).filter(Boolean).join(' ')
        i = closed && j > i + 1 ? j - 1 : i
      }
      continue
    }
    const code = stripTrailingComment(t)
    if (code !== '') lines.push({ no, text: code, indent: indentOf(text), col: text.length - text.trimStart().length + 1 })
  }

  const header = lines.shift()
  if (!header) throw new ParseFail(1, 1, 'There is no diagram: the source is empty or contains only comments.', 'empty')
  const kw = /^[A-Za-z][\w-]*/.exec(header.text)
  if (!kw) fail(header.no, header.col, 'Expected a diagram type such as "flowchart TD" or "sequenceDiagram" on the first line.')
  const keyword = kw![0]
  return { raw, header, keyword, rest: header.text.slice(keyword.length).trim(), lines, meta }
}

/** Build the typed error for a failure, including the offending source line. */
export function toParseError(e: ParseFail, raw: string[], diagramType?: string): MermaidParseError {
  const idx = Math.min(Math.max(e.line, 1), Math.max(raw.length, 1)) - 1
  return { code: e.code, message: e.message, line: e.line, column: e.column, sourceLine: raw[idx] ?? '', ...(diagramType ? { diagramType } : {}) }
}

/** Remove a trailing statement terminator and report the column shift. */
export const stripSemicolon = (t: string): string => t.replace(/;\s*$/, '')
