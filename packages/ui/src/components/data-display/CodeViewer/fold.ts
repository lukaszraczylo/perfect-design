import type { CodeLanguage, Token, TokenLines } from './tokenize'

/** A foldable region. `start` stays visible; lines `start + 1` to `end` (inclusive, 0-based) are hidden when collapsed. */
export interface FoldRegion {
  start: number
  end: number
}

export interface FoldRow {
  /** 0-based source line index. */
  line: number
  /** Region starting on this line, when foldable. */
  region?: FoldRegion
  /** True when `region` is collapsed; the hidden lines are skipped. */
  folded: boolean
}

const OPEN: Record<string, string> = { '{': '}', '[': ']', '(': ')' }
const CLOSERS = new Set(['}', ']', ')'])

const isBlank = (line: string): boolean => line.trim() === ''
const indentOf = (line: string): number => {
  let n = 0
  while (line[n] === ' ' || line[n] === '\t') n++
  return n
}
const significant = (tokens: Token[] | undefined): Token[] => (tokens ?? []).filter((t) => t.type !== 'plain' || t.text.trim() !== '')

/** Keep one region per start line (the one reaching furthest) and drop empty ones. Result is sorted by start. */
function normalise(regions: FoldRegion[], total: number): FoldRegion[] {
  const best = new Map<number, FoldRegion>()
  for (const r of regions) {
    if (r.start < 0 || r.end <= r.start || r.end >= total) continue
    const cur = best.get(r.start)
    if (!cur || r.end > cur.end) best.set(r.start, r)
  }
  return [...best.values()].sort((a, b) => a.start - b.start)
}

/** Brackets in punctuation tokens: strings and comments never count. `open` chars are language specific. */
function bracketRegions(tokens: TokenLines, open: string): FoldRegion[] {
  const out: FoldRegion[] = []
  const stack: { ch: string; line: number }[] = []
  tokens.forEach((line, i) => {
    for (const t of line) {
      if (t.type !== 'punctuation' && t.type !== 'operator') continue
      for (const ch of t.text) {
        if (open.includes(ch) && OPEN[ch]) stack.push({ ch, line: i })
        else if (CLOSERS.has(ch)) {
          const idx = stack.map((s) => OPEN[s.ch]).lastIndexOf(ch)
          if (idx < 0) continue
          const [opened] = stack.splice(idx)
          out.push({ start: opened.line, end: i - 1 })
        }
      }
    }
  })
  return out
}

/** Multi-line block comments (Go, JSON with comments). The closing line is part of the region. */
function blockCommentRegions(tokens: TokenLines): FoldRegion[] {
  const out: FoldRegion[] = []
  let open = -1
  tokens.forEach((line, i) => {
    const sig = significant(line)
    if (open >= 0) {
      if (sig[0]?.type === 'comment' && sig[0].text.includes('*/')) {
        out.push({ start: open, end: i })
        open = -1
      }
      return
    }
    const last = sig[sig.length - 1]
    if (last?.type !== 'comment' || last.text.startsWith('//')) return
    const idx = last.text.lastIndexOf('/*')
    if (idx >= 0 && last.text.indexOf('*/', idx + 2) < 0) open = i
  })
  return out
}

function yamlRegions(lines: string[], tokens: TokenLines): FoldRegion[] {
  const out: FoldRegion[] = []
  const total = lines.length
  const skip = (i: number): boolean => {
    if (isBlank(lines[i])) return true
    const sig = significant(tokens[i])
    return sig.length === 0 || sig.every((t) => t.type === 'comment')
  }
  /** Lines made only of block scalar or multi-line string text can not start a region. */
  const textOnly = (i: number): boolean => {
    const sig = significant(tokens[i])
    return sig.length > 0 && sig.every((t) => t.type === 'string')
  }
  const nextContent = (from: number): number => {
    let j = from
    while (j < total && skip(j)) j++
    return j
  }
  for (let i = 0; i < total; i++) {
    if (skip(i) || textOnly(i) || /^(---|\.\.\.)(\s|$)/.test(lines[i])) continue
    const ind = indentOf(lines[i])
    const next = nextContent(i + 1)
    if (next >= total) continue
    const nextInd = indentOf(lines[next])
    const keyOnly = /:\s*(#.*)?$/.test(lines[i]) && !/^\s*-\s/.test(lines[i])
    const seqSibling = keyOnly && nextInd === ind && /^\s*-(\s|$)/.test(lines[next])
    if (nextInd <= ind && !seqSibling) continue
    let end = next
    for (let j = next; j < total; j++) {
      if (skip(j)) continue
      if (/^(---|\.\.\.)(\s|$)/.test(lines[j])) break
      const jInd = indentOf(lines[j])
      if (jInd > ind || (seqSibling && jInd === ind && /^\s*-(\s|$)/.test(lines[j]))) end = j
      else break
    }
    out.push({ start: i, end })
  }
  return out
}

function tomlRegions(lines: string[], tokens: TokenLines): FoldRegion[] {
  const headers: { line: number; name: string }[] = []
  tokens.forEach((line, i) => {
    const sig = significant(line)
    if (sig[0]?.type === 'punctuation' && /^\[\[?$/.test(sig[0].text) && sig[1]?.type === 'type') headers.push({ line: i, name: sig[1].text.replace(/\s+/g, '') })
  })
  const out: FoldRegion[] = []
  headers.forEach((h, idx) => {
    let stop = lines.length
    for (let k = idx + 1; k < headers.length; k++) {
      if (!headers[k].name.startsWith(`${h.name}.`)) {
        stop = headers[k].line
        break
      }
    }
    let end = stop - 1
    while (end > h.line && isBlank(lines[end])) end--
    out.push({ start: h.line, end })
  })
  return [...out, ...bracketRegions(tokens, '[{')]
}

const SHELL_OPEN = new Set(['if', 'case', 'do'])
const SHELL_CLOSE: Record<string, string> = { fi: 'if', esac: 'case', done: 'do' }

function shellRegions(tokens: TokenLines): FoldRegion[] {
  const out: FoldRegion[] = bracketRegions(tokens, '{(')
  const stack: { kw: string; line: number }[] = []
  tokens.forEach((line, i) => {
    for (const t of line) {
      if (t.type !== 'keyword') continue
      if (SHELL_OPEN.has(t.text)) stack.push({ kw: t.text, line: i })
      else if (SHELL_CLOSE[t.text]) {
        const idx = stack.map((s) => s.kw).lastIndexOf(SHELL_CLOSE[t.text])
        if (idx < 0) continue
        const [opened] = stack.splice(idx)
        out.push({ start: opened.line, end: i - 1 })
      }
    }
  })
  return out
}

/**
 * Foldable regions for the given tokenised source: indentation for YAML, tables and brackets for TOML,
 * brackets for JSON/Go, brackets and `if/fi`, `do/done`, `case/esac` for shell, plus multi-line block comments.
 * Plain text has none. Regions never overlap partially: they are nested or disjoint.
 */
export function computeFolds(lines: string[], tokens: TokenLines, language: CodeLanguage): FoldRegion[] {
  const total = lines.length
  let regions: FoldRegion[]
  switch (language) {
    case 'yaml':
      regions = yamlRegions(lines, tokens)
      break
    case 'toml':
      regions = tomlRegions(lines, tokens)
      break
    case 'json':
      regions = [...bracketRegions(tokens, '{['), ...blockCommentRegions(tokens)]
      break
    case 'go':
      regions = [...bracketRegions(tokens, '{(['), ...blockCommentRegions(tokens)]
      break
    case 'shell':
      regions = shellRegions(tokens)
      break
    default:
      regions = []
  }
  return normalise(regions, total)
}

/** Visible rows given the set of collapsed region start lines. Hidden lines are skipped, so folded content is never rendered. */
export function buildRows(total: number, regions: FoldRegion[], collapsed: ReadonlySet<number>): FoldRow[] {
  const byStart = new Map(regions.map((r) => [r.start, r]))
  const rows: FoldRow[] = []
  for (let i = 0; i < total; ) {
    const region = byStart.get(i)
    const folded = !!region && collapsed.has(i)
    rows.push({ line: i, region, folded })
    i = folded ? region!.end + 1 : i + 1
  }
  return rows
}
