/**
 * In-house line diff for DiffViewer. Pure functions, no DOM, no dependencies.
 *
 * `diffOps` trims the common prefix and suffix, then runs Myers' O(ND) algorithm on the middle with a cost cap. Past the cap it
 * falls back to a greedy resync with a bounded look-ahead: the result is still a correct edit script (applying it to the old
 * lines gives the new lines) but not always the shortest one, and `approximate` says so.
 */

export type DiffType = 'equal' | 'del' | 'add'

export interface DiffLine {
  /** Index in the model's `lines` array. */
  i: number
  type: DiffType
  /** Line number on the old side, 0 when the line only exists on the new side. */
  oldNo: number
  /** Line number on the new side, 0 when the line only exists on the old side. */
  newNo: number
  text: string
  /** Index of the paired line in the same change block (the i-th removed line pairs with the i-th added line), or -1. */
  pair: number
}

export interface DiffHunk {
  /** `@@ -os,oc +ns,nc @@` plus an optional section text. */
  header: string
  /** Range of `lines` shown by this hunk (end exclusive). */
  from: number
  to: number
}

export type Segment =
  | { kind: 'file'; text: string }
  | { kind: 'hunk'; index: number }
  | { kind: 'lines'; from: number; to: number }
  /** Unchanged lines `from..to` folded away. A gap of a pasted patch has no content (`expandable: false`). */
  | { kind: 'gap'; id: number; from: number; to: number; count: number; expandable: boolean }

export interface DiffModel {
  source: 'text' | 'patch'
  lines: DiffLine[]
  hunks: DiffHunk[]
  segments: Segment[]
  adds: number
  dels: number
  approximate: boolean
}

export const EQ = 0
export const DEL = 1
export const ADD = 2

/** Split into lines (LF, CRLF or CR). One trailing line break does not create an extra empty line; `''` has no lines. */
export function splitLines(text: string): string[] {
  if (!text) return []
  const parts = text.split(/\r\n|\r|\n/)
  if (parts[parts.length - 1] === '') parts.pop()
  return parts
}

/** Myers forward search. Returns the ops in order, or null when more than `cap` edits are needed. */
function myers(a: Int32Array, b: Int32Array, cap: number): number[] | null {
  const n = a.length
  const m = b.length
  const off = cap + 1
  const v = new Int32Array(2 * cap + 3)
  const trace: Int32Array[] = []
  let found = -1
  for (let d = 0; d <= cap && found < 0; d++) {
    trace.push(v.slice(off - d - 1, off + d + 2))
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v[off + k] = x
      if (x >= n && y >= m) {
        found = d
        break
      }
    }
  }
  if (found < 0) return null
  const rev: number[] = []
  let x = n
  let y = m
  for (let d = found; d > 0; d--) {
    const snap = trace[d]
    const k = x - y
    const prevK = k === -d || (k !== d && snap[k - 1 + d + 1] < snap[k + 1 + d + 1]) ? k + 1 : k - 1
    const prevX = snap[prevK + d + 1]
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) {
      rev.push(EQ)
      x--
      y--
    }
    if (x === prevX) {
      rev.push(ADD)
      y--
    } else {
      rev.push(DEL)
      x--
    }
  }
  while (x > 0 && y > 0) {
    rev.push(EQ)
    x--
    y--
  }
  return rev.reverse()
}

const LOOKAHEAD = 64

/** Linear-time fallback: walk both sides, resync on the nearest match within `LOOKAHEAD` lines. */
function greedy(a: Int32Array, b: Int32Array): number[] {
  const n = a.length
  const m = b.length
  const out: number[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push(EQ)
      i++
      j++
      continue
    }
    let done = false
    for (let k = 1; k <= LOOKAHEAD && !done; k++) {
      if (i + k < n && a[i + k] === b[j]) {
        for (let t = 0; t < k; t++) out.push(DEL)
        i += k
        done = true
      } else if (j + k < m && b[j + k] === a[i]) {
        for (let t = 0; t < k; t++) out.push(ADD)
        j += k
        done = true
      }
    }
    if (!done) {
      out.push(DEL, ADD)
      i++
      j++
    }
  }
  while (i++ < n) out.push(DEL)
  while (j++ < m) out.push(ADD)
  return out
}

/** Within every run of changes put the removals before the additions (same result, a stable reading order). */
function normalise(ops: number[]): number[] {
  const out: number[] = []
  let i = 0
  while (i < ops.length) {
    if (ops[i] === EQ) {
      out.push(EQ)
      i++
      continue
    }
    let dels = 0
    let adds = 0
    while (i < ops.length && ops[i] !== EQ) {
      if (ops[i] === DEL) dels++
      else adds++
      i++
    }
    for (let t = 0; t < dels; t++) out.push(DEL)
    for (let t = 0; t < adds; t++) out.push(ADD)
  }
  return out
}

export interface DiffOps {
  ops: Uint8Array
  approximate: boolean
}

/** Edit script turning `a` into `b`: EQ consumes one line of each, DEL one of `a`, ADD one of `b`. */
export function diffOps(a: readonly string[], b: readonly string[], maxCost = 1000): DiffOps {
  const ids = new Map<string, number>()
  const intern = (s: string) => {
    let id = ids.get(s)
    if (id === undefined) ids.set(s, (id = ids.size))
    return id
  }
  const ia = Int32Array.from(a, intern)
  const ib = Int32Array.from(b, intern)
  let p = 0
  const lim = Math.min(ia.length, ib.length)
  while (p < lim && ia[p] === ib[p]) p++
  let s = 0
  while (s < lim - p && ia[ia.length - 1 - s] === ib[ib.length - 1 - s]) s++
  const ma = ia.subarray(p, ia.length - s)
  const mb = ib.subarray(p, ib.length - s)
  let mid: number[]
  let approximate = false
  if (ma.length === 0) mid = new Array<number>(mb.length).fill(ADD)
  else if (mb.length === 0) mid = new Array<number>(ma.length).fill(DEL)
  else {
    const cap = Math.max(1, Math.min(ma.length + mb.length, Math.floor(Number.isFinite(maxCost) ? maxCost : 1000)))
    const exact = myers(ma, mb, cap)
    if (exact) mid = exact
    else {
      approximate = true
      mid = greedy(ma, mb)
    }
    mid = normalise(mid)
  }
  const ops = new Uint8Array(p + mid.length + s)
  ops.fill(EQ, 0, p)
  ops.set(mid, p)
  ops.fill(EQ, p + mid.length)
  return { ops, approximate }
}

/** Pair the i-th removed line with the i-th added line of every change block (for word highlighting and split rows). */
export function pairLines(lines: DiffLine[]): void {
  let i = 0
  while (i < lines.length) {
    if (lines[i].type === 'equal') {
      i++
      continue
    }
    const dels: number[] = []
    const adds: number[] = []
    while (i < lines.length && lines[i].type !== 'equal') {
      if (lines[i].type === 'del') dels.push(i)
      else adds.push(i)
      i++
    }
    for (let k = 0; k < Math.min(dels.length, adds.length); k++) {
      lines[dels[k]].pair = adds[k]
      lines[adds[k]].pair = dels[k]
    }
  }
}

/** Diff two texts into a flat list of lines. */
export function computeDiff(oldText: string, newText: string, maxCost = 1000): { lines: DiffLine[]; approximate: boolean } {
  const a = splitLines(oldText)
  const b = splitLines(newText)
  const { ops, approximate } = diffOps(a, b, maxCost)
  const lines: DiffLine[] = []
  let ai = 0
  let bi = 0
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k]
    if (op === EQ) lines.push({ i: k, type: 'equal', oldNo: ai + 1, newNo: bi + 1, text: a[ai++], pair: -1 }), bi++
    else if (op === DEL) lines.push({ i: k, type: 'del', oldNo: ai + 1, newNo: 0, text: a[ai++], pair: -1 })
    else lines.push({ i: k, type: 'add', oldNo: 0, newNo: bi + 1, text: b[bi++], pair: -1 })
  }
  pairLines(lines)
  return { lines, approximate }
}

const header = (os: number, oc: number, ns: number, nc: number, section = '') => `@@ -${os},${oc} +${ns},${nc} @@${section ? ` ${section}` : ''}`

export function countChanges(lines: DiffLine[]): { adds: number; dels: number } {
  let adds = 0
  let dels = 0
  for (const l of lines) {
    if (l.type === 'add') adds++
    else if (l.type === 'del') dels++
  }
  return { adds, dels }
}

/** Group the changes of `lines` into hunks with `context` unchanged lines around them and lay out the visible segments. */
export function buildModel(lines: DiffLine[], approximate: boolean, options: { context: number; collapse: boolean }): DiffModel {
  const ctx = Number.isFinite(options.context) ? Math.min(50, Math.max(0, Math.floor(options.context))) : 3
  const total = lines.length
  const blocks: [number, number][] = []
  for (let i = 0; i < total; ) {
    if (lines[i].type === 'equal') {
      i++
      continue
    }
    const start = i
    while (i < total && lines[i].type !== 'equal') i++
    blocks.push([start, i])
  }
  const oldPrefix = new Int32Array(total + 1)
  const newPrefix = new Int32Array(total + 1)
  for (let i = 0; i < total; i++) {
    oldPrefix[i + 1] = oldPrefix[i] + (lines[i].type === 'add' ? 0 : 1)
    newPrefix[i + 1] = newPrefix[i] + (lines[i].type === 'del' ? 0 : 1)
  }
  const ranges: [number, number][] = []
  for (const [s, e] of blocks) {
    const last = ranges[ranges.length - 1]
    if (last && s - last[1] <= 2 * ctx + 0 && s - ctx <= last[1]) last[1] = Math.min(total, e + ctx)
    else ranges.push([Math.max(0, s - ctx), Math.min(total, e + ctx)])
  }
  const hunks: DiffHunk[] = ranges.map(([from, to]) => {
    const oc = oldPrefix[to] - oldPrefix[from]
    const nc = newPrefix[to] - newPrefix[from]
    return { header: header(oc === 0 ? oldPrefix[from] : oldPrefix[from] + 1, oc, nc === 0 ? newPrefix[from] : newPrefix[from] + 1, nc), from, to }
  })
  const segments: Segment[] = []
  const between = (from: number, to: number) => {
    if (to <= from) return
    if (options.collapse) segments.push({ kind: 'gap', id: from, from, to, count: to - from, expandable: true })
    else segments.push({ kind: 'lines', from, to })
  }
  let pos = 0
  hunks.forEach((h, index) => {
    between(pos, h.from)
    segments.push({ kind: 'hunk', index }, { kind: 'lines', from: h.from, to: h.to })
    pos = h.to
  })
  between(pos, total)
  return { source: 'text', lines, hunks, segments, ...countChanges(lines), approximate }
}

/* ------------------------------------------------------------------------------------------ unified diff parser */

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@ ?(.*)$/

/**
 * Read a unified diff (one or several files) into a model. Tolerant: `diff --git` / `index` lines, CRLF and stray text are
 * skipped, `\ No newline at end of file` markers are ignored, and a malformed patch gives an empty model instead of throwing.
 */
export function parseUnifiedDiff(patch: string): DiffModel {
  const src = splitLines(String(patch ?? ''))
  const lines: DiffLine[] = []
  const hunks: DiffHunk[] = []
  const segments: Segment[] = []
  let oldName = ''
  let newName = ''
  let fileShown = true
  let gapId = -1
  let prevEnd = 0 // old line after the previous hunk of the current file
  let open = false
  let remOld = 0
  let remNew = 0
  let oldNo = 0
  let newNo = 0
  let hunkStart = 0
  const nameOf = (s: string) => s.slice(4).split('\t')[0].trim()

  const closeHunk = () => {
    if (!open) return
    open = false
    hunks[hunks.length - 1].to = lines.length
  }
  const fileRow = () => {
    if (fileShown) return
    fileShown = true
    const text = !oldName || oldName === newName ? newName || oldName : !newName ? oldName : `${oldName} to ${newName}`
    if (text) segments.push({ kind: 'file', text })
  }

  for (let idx = 0; idx < src.length; idx++) {
    const line = src[idx]
    if (open && (remOld > 0 || remNew > 0 || !/^(--- |@@ |diff |index )/.test(line))) {
      const c = line[0]
      if (c === '@' && line.startsWith('@@ ')) {
        // a new hunk header before the counts were used up: fall through
      } else {
        const text = line.slice(1)
        if (c === '+') lines.push({ i: lines.length, type: 'add', oldNo: 0, newNo: newNo++, text, pair: -1 }), remNew--
        else if (c === '-') lines.push({ i: lines.length, type: 'del', oldNo: oldNo++, newNo: 0, text, pair: -1 }), remOld--
        else if (c === ' ' || line === '') lines.push({ i: lines.length, type: 'equal', oldNo: oldNo++, newNo: newNo++, text, pair: -1 }), remOld--, remNew--
        continue
      }
    }
    if (line.startsWith('--- ') && src[idx + 1]?.startsWith('+++ ')) {
      closeHunk()
      oldName = nameOf(line)
      newName = nameOf(src[idx + 1])
      idx++
      fileShown = false
      prevEnd = 0
      continue
    }
    const m = HUNK_RE.exec(line)
    if (m) {
      closeHunk()
      fileRow()
      const os = Number(m[1])
      const oc = m[2] === undefined ? 1 : Number(m[2])
      const ns = Number(m[3])
      const nc = m[4] === undefined ? 1 : Number(m[4])
      const gap = os - (prevEnd || 1)
      const gapCount = oc === 0 ? os - prevEnd : gap
      if (gapCount > 0) segments.push({ kind: 'gap', id: gapId--, from: 0, to: 0, count: gapCount, expandable: false })
      prevEnd = (oc === 0 ? os + 1 : os + oc)
      hunkStart = lines.length
      hunks.push({ header: header(os, oc, ns, nc, m[5].trim()), from: hunkStart, to: hunkStart })
      segments.push({ kind: 'hunk', index: hunks.length - 1 })
      open = true
      remOld = oc
      remNew = nc
      oldNo = oc === 0 ? os + 1 : os
      newNo = nc === 0 ? ns + 1 : ns
      segments.push({ kind: 'lines', from: hunkStart, to: hunkStart })
      continue
    }
  }
  closeHunk()
  // The `lines` segments were created empty; fill their ends from the hunks.
  let h = 0
  for (const s of segments) {
    if (s.kind === 'lines') {
      s.from = hunks[h].from
      s.to = hunks[h].to
      h++
    }
  }
  pairLines(lines)
  return { source: 'patch', lines, hunks, segments, ...countChanges(lines), approximate: false }
}

/* ----------------------------------------------------------------------------------------------- word highlight */

export interface WordPart {
  type: DiffType
  text: string
}

const TOKEN_RE = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu
const MAX_TOKENS = 400

/**
 * Token-level diff of two lines. Returns null when a line has more than 400 tokens, or the lines share no word at all (then the
 * whole line is the change and marking every word adds nothing).
 */
export function diffWords(a: string, b: string): WordPart[] | null {
  const ta = a.match(TOKEN_RE) ?? []
  const tb = b.match(TOKEN_RE) ?? []
  if (ta.length > MAX_TOKENS || tb.length > MAX_TOKENS) return null
  let p = 0
  const lim = Math.min(ta.length, tb.length)
  while (p < lim && ta[p] === tb[p]) p++
  let s = 0
  while (s < lim - p && ta[ta.length - 1 - s] === tb[tb.length - 1 - s]) s++
  const ma = ta.slice(p, ta.length - s)
  const mb = tb.slice(p, tb.length - s)
  const n = ma.length
  const m = mb.length
  const w = m + 1
  const table = new Uint16Array((n + 1) * w)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) table[i * w + j] = ma[i] === mb[j] ? table[(i + 1) * w + j + 1] + 1 : Math.max(table[(i + 1) * w + j], table[i * w + j + 1])
  }
  const parts: WordPart[] = []
  const push = (type: DiffType, text: string) => {
    const last = parts[parts.length - 1]
    if (last && last.type === type) last.text += text
    else parts.push({ type, text })
  }
  let shared = 0
  for (let k = 0; k < p; k++) push('equal', ta[k])
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && ma[i] === mb[j]) {
      if (ma[i].trim()) shared++
      push('equal', ma[i])
      i++
      j++
    } else if (j < m && (i >= n || table[i * w + j + 1] >= table[(i + 1) * w + j])) push('add', mb[j++])
    else push('del', ma[i++])
  }
  for (let k = ta.length - s; k < ta.length; k++) push('equal', ta[k])
  for (let k = 0; k < p; k++) if (ta[k].trim()) shared++
  for (let k = ta.length - s; k < ta.length; k++) if (ta[k].trim()) shared++
  return shared === 0 ? null : parts
}

/** The visible diff as unified diff text (what the copy button puts on the clipboard). */
export function toUnifiedText(model: DiffModel, oldLabel: string, newLabel: string): string {
  if (model.hunks.length === 0) return ''
  const out = [`--- ${oldLabel}`, `+++ ${newLabel}`]
  for (const h of model.hunks) {
    out.push(h.header)
    for (let i = h.from; i < h.to; i++) {
      const l = model.lines[i]
      out.push((l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' ') + l.text)
    }
  }
  return out.join('\n')
}
