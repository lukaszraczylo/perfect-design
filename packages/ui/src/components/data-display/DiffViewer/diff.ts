/**
 * Pure diff engine for DiffViewer: line splitting, a Myers O(ND) line diff with a cost cap, hunk building, a unified diff
 * parser and a word-level diff for changed line pairs. No Vue, no DOM: everything here is plain data in, plain data out.
 */

export type LineType = 'ctx' | 'del' | 'add'

export interface DiffLine {
  type: LineType
  text: string
  /** 1-based line number in the old text (0 for added lines). */
  oldNo: number
  /** 1-based line number in the new text (0 for removed lines). */
  newNo: number
  /** The line this one is compared with in a change block (removed i with added i), for word highlighting. */
  pair?: DiffLine
}

export interface Hunk {
  /** `@@ -a,b +c,d @@` plus the optional section text. */
  header: string
  oldStart: number
  oldCount: number
  newStart: number
  newCount: number
  lines: DiffLine[]
}

export interface DiffFile {
  /** Display name: the new name, or the old one when the file was deleted. Empty when the patch has no file headers. */
  name: string
  hunks: Hunk[]
}

/** A part of a diff in display order: file heading, change group, or a run of unchanged lines that can be revealed. */
export type DiffBlock =
  | { kind: 'file'; name: string }
  | { kind: 'hunk'; hunk: Hunk; index: number }
  | { kind: 'gap'; id: number; lines: DiffLine[]; fromEnd: boolean }

export interface DiffModel {
  blocks: DiffBlock[]
  hunks: Hunk[]
  added: number
  removed: number
  /** The Myers search hit its cost cap; the edit script is valid but may not be the shortest. */
  approximate: boolean
}

/** Split text into lines (LF, CRLF or CR). One trailing line break does not add an empty last line. `''` gives `[]`. */
export function splitLines(text: string): string[] {
  if (typeof text !== 'string' || text === '') return []
  const lines = text.split(/\r\n|\r|\n/)
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

/* ------------------------------------------------------------------ line diff */

/** One edit step: `0` keep, `-1` remove an old line, `1` add a new line. */
export type EditOp = 0 | -1 | 1

export interface LineDiff {
  ops: EditOp[]
  approximate: boolean
}

export interface DiffOptions {
  /** Largest edit distance Myers explores before it degrades to a greedy resync. Default 1000. */
  maxCost?: number
}

const DEFAULT_MAX_COST = 1000
const RESYNC_WINDOW = 64

function intern(a: readonly string[], b: readonly string[]): [Int32Array, Int32Array] {
  const ids = new Map<string, number>()
  const id = (s: string) => {
    let v = ids.get(s)
    if (v === undefined) ids.set(s, (v = ids.size))
    return v
  }
  const x = new Int32Array(a.length)
  const y = new Int32Array(b.length)
  for (let i = 0; i < a.length; i++) x[i] = id(a[i])
  for (let i = 0; i < b.length; i++) y[i] = id(b[i])
  return [x, y]
}

/** Myers on interned ids. Returns the ops, or null when the edit distance exceeds `limit`. */
function myers(a: Int32Array, b: Int32Array, limit: number): EditOp[] | null {
  const n = a.length
  const m = b.length
  const max = Math.min(n + m, limit)
  const off = max + 1
  const v = new Int32Array(2 * max + 3)
  const trace: Int32Array[] = []
  let found = -1
  for (let d = 0; d <= max && found < 0; d++) {
    for (let k = -d; k <= d; k += 2) {
      let x: number
      if (k === -d || (k !== d && v[off + k - 1] < v[off + k + 1])) x = v[off + k + 1]
      else x = v[off + k - 1] + 1
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
    trace.push(v.slice(off - d, off + d + 1))
  }
  if (found < 0) return null
  // Backtrack from (n, m). trace[d][k + d] is the furthest x on diagonal k after round d.
  const out: EditOp[] = []
  let x = n
  let y = m
  for (let d = found; d > 0; d--) {
    const prev = trace[d - 1]
    const k = x - y
    const down = k === -d || (k !== d && prev[k - 1 + d - 1] < prev[k + 1 + d - 1])
    const pk = down ? k + 1 : k - 1
    const px = prev[pk + d - 1]
    const py = px - pk
    const sx = down ? px : px + 1
    while (x > sx) {
      out.push(0)
      x--
      y--
    }
    out.push(down ? 1 : -1)
    x = px
    y = py
  }
  while (x > 0) {
    out.push(0)
    x--
  }
  return out.reverse()
}

/** Greedy fallback: keep equal lines, look a bounded window ahead to resync, otherwise replace. Always a valid script. */
function greedy(a: Int32Array, b: Int32Array): EditOp[] {
  const out: EditOp[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push(0)
      i++
      j++
      continue
    }
    let skipA = -1
    let skipB = -1
    const reach = Math.min(RESYNC_WINDOW, Math.max(a.length - i, b.length - j))
    for (let s = 1; s <= reach && (skipA < 0 || skipB < 0); s++) {
      if (skipA < 0 && i + s < a.length && a[i + s] === b[j]) skipA = s
      if (skipB < 0 && j + s < b.length && b[j + s] === a[i]) skipB = s
    }
    if (skipA > 0 && (skipB < 0 || skipA <= skipB)) {
      for (let s = 0; s < skipA; s++) out.push(-1)
      i += skipA
    } else if (skipB > 0) {
      for (let s = 0; s < skipB; s++) out.push(1)
      j += skipB
    } else {
      out.push(-1, 1)
      i++
      j++
    }
  }
  while (i++ < a.length) out.push(-1)
  while (j++ < b.length) out.push(1)
  return out
}

/** Within each run of changes, put the removals before the additions so a change block always reads "old lines, then new lines". */
function normalise(ops: EditOp[]): EditOp[] {
  const out: EditOp[] = []
  let del = 0
  let add = 0
  const flush = () => {
    for (let i = 0; i < del; i++) out.push(-1)
    for (let i = 0; i < add; i++) out.push(1)
    del = add = 0
  }
  for (const op of ops) {
    if (op === 0) {
      flush()
      out.push(0)
    } else if (op === -1) del++
    else add++
  }
  flush()
  return out
}

/** Line diff of two line arrays. The result applies as an edit script to `a` to give `b`. */
export function diffLines(a: readonly string[], b: readonly string[], options: DiffOptions = {}): LineDiff {
  const cost = Number(options.maxCost)
  const limit = Number.isFinite(cost) && cost >= 1 ? Math.floor(cost) : DEFAULT_MAX_COST
  let head = 0
  const min = Math.min(a.length, b.length)
  while (head < min && a[head] === b[head]) head++
  let tail = 0
  while (tail < min - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++
  const [x, y] = intern(a.slice(head, a.length - tail), b.slice(head, b.length - tail))
  let middle: EditOp[]
  let approximate = false
  if (x.length === 0) middle = Array.from({ length: y.length }, () => 1 as EditOp)
  else if (y.length === 0) middle = Array.from({ length: x.length }, () => -1 as EditOp)
  else {
    const exact = myers(x, y, limit)
    approximate = exact === null
    middle = exact ?? greedy(x, y)
  }
  const ops: EditOp[] = []
  for (let i = 0; i < head; i++) ops.push(0)
  for (const op of normalise(middle)) ops.push(op)
  for (let i = 0; i < tail; i++) ops.push(0)
  return { ops, approximate }
}

/** Apply an edit script to the old lines (used by tests and by callers that want to verify a result). */
export function applyOps(a: readonly string[], b: readonly string[], ops: readonly EditOp[]): string[] {
  const out: string[] = []
  let i = 0
  let j = 0
  for (const op of ops) {
    if (op === 0) {
      out.push(a[i])
      i++
      j++
    } else if (op === -1) i++
    else out.push(b[j++])
  }
  return out
}

/* ------------------------------------------------------------------ pairing and hunks */

/** Link removed line i with added line i inside each block of removals followed by additions. */
export function pairBlocks(lines: DiffLine[]): void {
  let i = 0
  while (i < lines.length) {
    if (lines[i].type !== 'del') {
      i++
      continue
    }
    let d = i
    while (d < lines.length && lines[d].type === 'del') d++
    let a = d
    while (a < lines.length && lines[a].type === 'add') a++
    const count = Math.min(d - i, a - d)
    for (let k = 0; k < count; k++) {
      lines[i + k].pair = lines[d + k]
      lines[d + k].pair = lines[i + k]
    }
    i = a
  }
}

const hunkHeader = (os: number, oc: number, ns: number, nc: number) => `@@ -${os},${oc} +${ns},${nc} @@`

/** Build the display model for two texts: change groups with `context` unchanged lines around them, and the gaps between. */
export function buildModel(oldText: string, newText: string, options: DiffOptions & { context?: number } = {}): DiffModel {
  const a = splitLines(oldText)
  const b = splitLines(newText)
  const { ops, approximate } = diffLines(a, b, options)
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  let added = 0
  let removed = 0
  for (const op of ops) {
    if (op === 0) lines.push({ type: 'ctx', text: a[i], oldNo: ++i, newNo: ++j })
    else if (op === -1) {
      lines.push({ type: 'del', text: a[i], oldNo: ++i, newNo: 0 })
      removed++
    } else {
      lines.push({ type: 'add', text: b[j], oldNo: 0, newNo: ++j })
      added++
    }
  }
  pairBlocks(lines)
  const ctxN = Number.isFinite(Number(options.context)) ? Math.max(0, Math.floor(Number(options.context))) : 3
  const keep = new Uint8Array(lines.length)
  for (let p = 0; p < lines.length; p++) {
    if (lines[p].type === 'ctx') continue
    const from = Math.max(0, p - ctxN)
    const to = Math.min(lines.length - 1, p + ctxN)
    for (let q = from; q <= to; q++) keep[q] = 1
  }
  const blocks: DiffBlock[] = []
  const hunks: Hunk[] = []
  let oldSeen = 0
  let newSeen = 0
  let gapId = 0
  let p = 0
  if (keep.every((k) => k === 0)) return { blocks, hunks, added, removed, approximate }
  while (p < lines.length) {
    let q = p
    while (q < lines.length && keep[q] === keep[p]) q++
    const run = lines.slice(p, q)
    if (keep[p]) {
      const oc = run.filter((l) => l.type !== 'add').length
      const nc = run.filter((l) => l.type !== 'del').length
      const hunk: Hunk = {
        header: hunkHeader(oc > 0 ? oldSeen + 1 : oldSeen, oc, nc > 0 ? newSeen + 1 : newSeen, nc),
        oldStart: oc > 0 ? oldSeen + 1 : oldSeen,
        oldCount: oc,
        newStart: nc > 0 ? newSeen + 1 : newSeen,
        newCount: nc,
        lines: run,
      }
      hunks.push(hunk)
      blocks.push({ kind: 'hunk', hunk, index: hunks.length - 1 })
    } else if (run.length > 0) blocks.push({ kind: 'gap', id: gapId++, lines: run, fromEnd: p === 0 })
    for (const l of run) {
      if (l.type !== 'add') oldSeen++
      if (l.type !== 'del') newSeen++
    }
    p = q
  }
  return { blocks, hunks, added, removed, approximate }
}

/* ------------------------------------------------------------------ unified diff parser */

const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/

function fileName(raw: string): string {
  const name = raw.replace(/\t.*$/, '').trim().replace(/^"(.*)"$/, '$1')
  if (name === '/dev/null') return ''
  return name.replace(/^[ab]\//, '')
}

/** Parse a unified diff. Never throws; text that is not a diff gives no files. A "\ No newline at end of file" line is ignored. */
export function parseUnifiedDiff(patch: string): DiffFile[] {
  const files: DiffFile[] = []
  if (typeof patch !== 'string' || patch.trim() === '') return files
  const text = patch.split(/\r\n|\r|\n/)
  if (text[text.length - 1] === '') text.pop()
  let file: DiffFile | null = null
  let hunk: Hunk | null = null
  let oldName = ''
  let remOld = 0
  let remNew = 0
  let oldNo = 0
  let newNo = 0
  const ensureFile = (name: string) => {
    file = { name, hunks: [] }
    files.push(file)
    hunk = null
  }
  for (let n = 0; n < text.length; n++) {
    const line = text[n]
    const inBody = hunk !== null && (remOld > 0 || remNew > 0)
    if (inBody) {
      const c = line[0]
      if (c === '\\') continue
      if (c === ' ' || line === '') {
        if (remOld <= 0 || remNew <= 0) { remOld = remNew = 0; continue }
        hunk!.lines.push({ type: 'ctx', text: line.slice(1), oldNo: oldNo++, newNo: newNo++ })
        remOld--
        remNew--
        continue
      }
      if (c === '-') {
        hunk!.lines.push({ type: 'del', text: line.slice(1), oldNo: oldNo++, newNo: 0 })
        remOld = Math.max(0, remOld - 1)
        continue
      }
      if (c === '+') {
        hunk!.lines.push({ type: 'add', text: line.slice(1), oldNo: 0, newNo: newNo++ })
        remNew = Math.max(0, remNew - 1)
        continue
      }
      // Anything else ends the hunk (junk or the next header); fall through and read it as a header line.
    }
    const m = HUNK_RE.exec(line)
    if (m) {
      if (!file) ensureFile('')
      remOld = m[2] === undefined ? 1 : Number(m[2])
      remNew = m[4] === undefined ? 1 : Number(m[4])
      oldNo = Number(m[1])
      newNo = Number(m[3])
      hunk = {
        header: line.trim(),
        oldStart: oldNo,
        oldCount: remOld,
        newStart: newNo,
        newCount: remNew,
        lines: [],
      }
      ;(file as DiffFile | null)!.hunks.push(hunk)
      continue
    }
    if (line.startsWith('diff ')) {
      file = null
      hunk = null
      remOld = remNew = 0
      continue
    }
    if (line.startsWith('--- ')) {
      oldName = fileName(line.slice(4))
      hunk = null
      remOld = remNew = 0
      continue
    }
    if (line.startsWith('+++ ') && !(hunk !== null && remOld > 0)) {
      const next = fileName(line.slice(4))
      ensureFile(next || oldName)
      oldName = ''
      remOld = remNew = 0
      continue
    }
    // Tolerance: a header whose counts were too small. Keep accepting +/- lines of the open hunk.
    if (hunk !== null && (line[0] === '+' || line[0] === '-')) {
      const h: Hunk = hunk
      if (line[0] === '+') h.lines.push({ type: 'add', text: line.slice(1), oldNo: 0, newNo: newNo++ })
      else h.lines.push({ type: 'del', text: line.slice(1), oldNo: oldNo++, newNo: 0 })
    }
  }
  return files.filter((f) => f.hunks.length > 0)
}

/** Display model for a parsed patch. Unchanged lines between hunks are not in a patch, so there are no gaps to reveal. */
export function buildPatchModel(files: DiffFile[]): DiffModel {
  const blocks: DiffBlock[] = []
  const hunks: Hunk[] = []
  let added = 0
  let removed = 0
  const named = files.length > 1 || files.some((f) => f.name !== '')
  for (const f of files) {
    if (named) blocks.push({ kind: 'file', name: f.name || 'Unnamed file' })
    for (const h of f.hunks) {
      pairBlocks(h.lines)
      for (const l of h.lines) {
        if (l.type === 'add') added++
        else if (l.type === 'del') removed++
      }
      hunks.push(h)
      blocks.push({ kind: 'hunk', hunk: h, index: hunks.length - 1 })
    }
  }
  return { blocks, hunks, added, removed, approximate: false }
}

/** Unified diff text of a model (what "Copy" puts on the clipboard for two texts). */
export function toUnifiedText(model: DiffModel, oldName = 'Original', newName = 'Modified'): string {
  if (model.hunks.length === 0) return ''
  const out: string[] = [`--- ${oldName}`, `+++ ${newName}`]
  for (const block of model.blocks) {
    if (block.kind === 'file') out.push(`# ${block.name}`)
    else if (block.kind === 'hunk') {
      out.push(block.hunk.header)
      for (const l of block.hunk.lines) out.push((l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' ') + l.text)
    }
  }
  return out.join('\n') + '\n'
}

/* ------------------------------------------------------------------ word diff */

export interface WordPart {
  kind: 'eq' | 'del' | 'add'
  text: string
}

const TOKEN_RE = /\s+|[\p{L}\p{N}_]+|[^\p{L}\p{N}_\s]/gu
/** Above this many tokens on either side the word diff is skipped and the whole line stays as one piece. */
export const WORD_TOKEN_CAP = 400

/** Word-level diff of two lines, or null when it would not help (too long, or nothing but whitespace in common). */
export function diffWords(oldLine: string, newLine: string): WordPart[] | null {
  const a = oldLine.match(TOKEN_RE) ?? []
  const b = newLine.match(TOKEN_RE) ?? []
  if (a.length > WORD_TOKEN_CAP || b.length > WORD_TOKEN_CAP) return null
  const w = b.length + 1
  const dp = new Uint16Array((a.length + 1) * w)
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1])
    }
  }
  const parts: WordPart[] = []
  const push = (kind: WordPart['kind'], text: string) => {
    const last = parts[parts.length - 1]
    if (last && last.kind === kind) last.text += text
    else parts.push({ kind, text })
  }
  let shared = false
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      if (a[i].trim() !== '') shared = true
      push('eq', a[i])
      i++
      j++
    } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) push('del', a[i++])
    else push('add', b[j++])
  }
  while (i < a.length) push('del', a[i++])
  while (j < b.length) push('add', b[j++])
  return shared ? parts : null
}
