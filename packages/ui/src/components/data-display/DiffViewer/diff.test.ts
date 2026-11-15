import { describe, expect, it } from 'vitest'
import {
  applyOps, buildModel, buildPatchModel, diffLines, diffWords, pairBlocks, parseUnifiedDiff, splitLines, toUnifiedText,
  WORD_TOKEN_CAP, type DiffLine,
} from './diff'

const lines = (n: number, f: (i: number) => string = (i) => `line ${i}`) => Array.from({ length: n }, (_, i) => f(i))
const check = (a: string[], b: string[], opts = {}) => {
  const r = diffLines(a, b, opts)
  expect(applyOps(a, b, r.ops)).toEqual(b)
  expect(r.ops.filter((o) => o !== 1).length).toBe(a.length)
  expect(r.ops.filter((o) => o !== -1).length).toBe(b.length)
  return r
}

describe('splitLines', () => {
  it('splits LF, CRLF and CR and drops one trailing break', () => {
    expect(splitLines('a\nb\n')).toEqual(['a', 'b'])
    expect(splitLines('a\r\nb\rc')).toEqual(['a', 'b', 'c'])
    expect(splitLines('a\n\n')).toEqual(['a', ''])
  })
  it('gives no lines for empty or non-string input', () => {
    expect(splitLines('')).toEqual([])
    expect(splitLines(undefined as unknown as string)).toEqual([])
    expect(splitLines(null as unknown as string)).toEqual([])
    expect(splitLines(5 as unknown as string)).toEqual([])
  })
})

describe('diffLines', () => {
  it('keeps identical input', () => {
    const r = check(['a', 'b'], ['a', 'b'])
    expect(r.ops).toEqual([0, 0])
    expect(r.approximate).toBe(false)
  })
  it('handles empty sides', () => {
    expect(check([], ['a', 'b']).ops).toEqual([1, 1])
    expect(check(['a', 'b'], []).ops).toEqual([-1, -1])
    expect(check([], []).ops).toEqual([])
  })
  it('handles pure insert, delete and replace', () => {
    expect(check(['a', 'c'], ['a', 'b', 'c']).ops).toEqual([0, 1, 0])
    expect(check(['a', 'b', 'c'], ['a', 'c']).ops).toEqual([0, -1, 0])
    expect(check(['a', 'b', 'c'], ['a', 'B', 'c']).ops).toEqual([0, -1, 1, 0])
  })
  it('puts removals before additions in a change block', () => {
    const r = check(['x', 'a', 'b', 'y'], ['x', 'c', 'd', 'y'])
    expect(r.ops).toEqual([0, -1, -1, 1, 1, 0])
  })
  it('handles moved blocks, duplicates and unicode', () => {
    check(['a', 'b', 'c', 'd', 'e'], ['d', 'e', 'a', 'b', 'c'])
    check(['x', 'x', 'x', 'y'], ['x', 'y', 'x', 'x'])
    check(['naïve', '日本語', 'Ω'], ['日本語', 'Ω', 'naïve'])
  })
  it('ignores an invalid maxCost and uses the default', () => {
    expect(check(['a'], ['b'], { maxCost: 0 }).approximate).toBe(false)
    expect(check(['a'], ['b'], { maxCost: Number.NaN }).approximate).toBe(false)
  })
  it('is exact and fast for a sparse 10k-line change', () => {
    const a = lines(10000)
    const b = a.slice()
    for (let i = 100; i < 10000; i += 500) b[i] = `changed ${i}`
    b.splice(5000, 0, 'inserted')
    const t = performance.now()
    const r = check(a, b)
    expect(performance.now() - t).toBeLessThan(1500)
    expect(r.approximate).toBe(false)
    expect(r.ops.filter((o) => o !== 0).length).toBe(2 * 20 + 1)
  })
  it('degrades to a valid approximate script when everything differs (10k lines)', () => {
    const a = lines(10000, (i) => `old ${i}`)
    const b = lines(10000, (i) => `new ${i}`)
    const t = performance.now()
    const r = check(a, b)
    expect(performance.now() - t).toBeLessThan(1500)
    expect(r.approximate).toBe(true)
  })
  it('the cost cap makes a moderately different input approximate but still valid', () => {
    const a = lines(400, (i) => `a${i}`)
    const b = lines(400, (i) => (i % 2 ? `b${i}` : `a${i}`))
    const r = check(a, b, { maxCost: 10 })
    expect(r.approximate).toBe(true)
    expect(check(a, b).approximate).toBe(false)
  })
  it('resyncs after inserted and removed lines in the greedy fallback', () => {
    const a = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6']
    const b = ['x', 'k2', 'k3', 'y', 'z', 'k4', 'k5', 'k6', 'tail']
    const r = check(a, b, { maxCost: 1 })
    expect(r.approximate).toBe(true)
    expect(r.ops.filter((o) => o === 0).length).toBeGreaterThanOrEqual(4)
    check(['p', 'q', 'r'], ['q', 'r'], { maxCost: 1 })
    check(['q', 'r'], ['x', 'q', 'r'], { maxCost: 1 })
    check(['q', 'r', 's', 't'], ['r', 'q', 't', 's', 'u'], { maxCost: 1 })
  })
  it('randomised inputs always give a valid script', () => {
    let seed = 7
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296
    for (let t = 0; t < 60; t++) {
      const a = lines(Math.floor(rnd() * 30), () => String(Math.floor(rnd() * 5)))
      const b = lines(Math.floor(rnd() * 30), () => String(Math.floor(rnd() * 5)))
      check(a, b)
      check(a, b, { maxCost: 2 })
    }
  })
})

describe('buildModel', () => {
  it('reports no hunks for identical texts', () => {
    const m = buildModel('a\nb', 'a\nb')
    expect(m.hunks).toEqual([])
    expect(m.blocks).toEqual([])
    expect(toUnifiedText(m)).toBe('')
  })
  it('groups changes with context and creates gaps between them', () => {
    const a = lines(30)
    const b = a.slice()
    b[2] = 'X'
    b[25] = 'Y'
    const m = buildModel(a.join('\n'), b.join('\n'))
    expect(m.hunks.map((h) => h.header)).toEqual(['@@ -1,6 +1,6 @@', '@@ -23,7 +23,7 @@'])
    expect(m.blocks.map((x) => x.kind)).toEqual(['hunk', 'gap', 'hunk', 'gap'])
    const gap = m.blocks[1] as { kind: 'gap'; lines: DiffLine[]; fromEnd: boolean }
    expect(gap.lines.length).toBe(16)
    expect(gap.fromEnd).toBe(false)
    expect(m.added).toBe(2)
    expect(m.removed).toBe(2)
  })
  it('merges hunks whose gap is within twice the context', () => {
    const a = lines(20)
    const b = a.slice()
    b[5] = 'X'
    b[11] = 'Y'
    expect(buildModel(a.join('\n'), b.join('\n'), { context: 3 }).hunks.length).toBe(1)
    expect(buildModel(a.join('\n'), b.join('\n'), { context: 2 }).hunks.length).toBe(2)
  })
  it('marks a leading gap fromEnd, supports zero context and bad context', () => {
    const a = lines(12)
    const b = a.slice()
    b[10] = 'X'
    const m = buildModel(a.join('\n'), b.join('\n'), { context: 1 })
    expect((m.blocks[0] as { fromEnd: boolean }).fromEnd).toBe(true)
    expect(buildModel(a.join('\n'), b.join('\n'), { context: 0 }).hunks[0].lines.length).toBe(2)
    expect(buildModel(a.join('\n'), b.join('\n'), { context: Number.NaN }).hunks[0].lines.length).toBe(1 + 1 + 3 + 1)
  })
  it('numbers hunks of pure additions and deletions', () => {
    expect(buildModel('', 'a\nb').hunks[0].header).toBe('@@ -0,0 +1,2 @@')
    expect(buildModel('a\nb', '').hunks[0].header).toBe('@@ -1,2 +0,0 @@')
    const m = buildModel('a\nb\nc', 'a\nb\nx\nc', { context: 0 })
    expect(m.hunks[0].header).toBe('@@ -2,0 +3,1 @@')
  })
  it('pairs removed and added lines of a block', () => {
    const m = buildModel('a\nb\nc', 'a\nB\nc')
    const [del, add] = m.hunks[0].lines.filter((l) => l.type !== 'ctx')
    expect(del.pair).toBe(add)
    expect(add.pair).toBe(del)
  })
  it('produces unified text for copying', () => {
    const text = toUnifiedText(buildModel('a\nb', 'a\nc'), 'one', 'two')
    expect(text).toBe('--- one\n+++ two\n@@ -1,2 +1,2 @@\n a\n-b\n+c\n')
  })
  it('flags approximate results', () => {
    const m = buildModel(lines(50, (i) => `o${i}`).join('\n'), lines(50, (i) => `n${i}`).join('\n'), { maxCost: 3 })
    expect(m.approximate).toBe(true)
  })
})

describe('pairBlocks', () => {
  const l = (type: DiffLine['type'], text: string): DiffLine => ({ type, text, oldNo: 0, newNo: 0 })
  it('pairs by position and leaves extras unpaired', () => {
    const arr = [l('del', '1'), l('del', '2'), l('del', '3'), l('add', 'a'), l('add', 'b'), l('ctx', 'c'), l('add', 'z'), l('del', 'q')]
    pairBlocks(arr)
    expect(arr[0].pair).toBe(arr[3])
    expect(arr[1].pair).toBe(arr[4])
    expect(arr[2].pair).toBeUndefined()
    expect(arr[6].pair).toBeUndefined()
    expect(arr[7].pair).toBeUndefined()
  })
})

const PATCH = `diff --git a/app.conf b/app.conf
index 111..222 100644
--- a/app.conf
+++ b/app.conf
@@ -1,4 +1,4 @@ section one
 name = sample
-port = 80
+port = 8080
 mode = dev
 debug = false
\\ No newline at end of file
@@ -20,2 +20,3 @@
 tail = 1
+extra = 2
 end = 3
`

describe('parseUnifiedDiff', () => {
  it('parses a multi-hunk file with the section text and numbers lines', () => {
    const files = parseUnifiedDiff(PATCH)
    expect(files.length).toBe(1)
    expect(files[0].name).toBe('app.conf')
    expect(files[0].hunks.length).toBe(2)
    expect(files[0].hunks[0].header).toBe('@@ -1,4 +1,4 @@ section one')
    const [h1, h2] = files[0].hunks
    expect(h1.lines.map((l) => [l.type, l.text, l.oldNo, l.newNo])).toEqual([
      ['ctx', 'name = sample', 1, 1], ['del', 'port = 80', 2, 0], ['add', 'port = 8080', 0, 2], ['ctx', 'mode = dev', 3, 3], ['ctx', 'debug = false', 4, 4],
    ])
    expect(h2.lines.length).toBe(3)
    expect(h2.lines[1].newNo).toBe(21)
  })
  it('parses several files, a created file and a deleted file', () => {
    const files = parseUnifiedDiff('--- /dev/null\n+++ b/new.txt\n@@ -0,0 +1,2 @@\n+a\n+b\n--- a/old.txt\n+++ /dev/null\n@@ -1 +0,0 @@\n-gone\n')
    expect(files.map((f) => f.name)).toEqual(['new.txt', 'old.txt'])
    expect(files[0].hunks[0].lines.length).toBe(2)
    expect(files[1].hunks[0].lines[0]).toMatchObject({ type: 'del', text: 'gone', oldNo: 1 })
  })
  it('treats a deleted line that looks like a header as content while the hunk has lines left', () => {
    const files = parseUnifiedDiff('--- a/x\n+++ b/x\n@@ -1,2 +1,1 @@\n--- not a header\n ctx\n')
    expect(files[0].hunks[0].lines[0]).toMatchObject({ type: 'del', text: '-- not a header' })
  })
  it('handles CRLF, tabs after file names, quoted names and blank context lines', () => {
    const files = parseUnifiedDiff('--- "a/q.txt"\t2024\r\n+++ "b/q.txt"\t2024\r\n@@ -1,3 +1,3 @@\r\n a\r\n\r\n-b\r\n+c\r\n')
    expect(files[0].name).toBe('q.txt')
    expect(files[0].hunks[0].lines.map((l) => l.type)).toEqual(['ctx', 'ctx', 'del', 'add'])
  })
  it('works without file headers and keeps lines past a too-small count', () => {
    const files = parseUnifiedDiff('@@ -1 +1 @@\n-a\n+b\n+c\n-d\nrandom text\n')
    expect(files[0].name).toBe('')
    expect(files[0].hunks[0].lines.map((l) => l.type)).toEqual(['del', 'add', 'add', 'del'])
  })
  it('never throws on junk and returns no files', () => {
    for (const junk of ['', '   ', 'hello world', '+++ x\n--- y', '@@ nope @@', 'diff --git a b', null, undefined, 42, '\u0000\u0001']) {
      expect(parseUnifiedDiff(junk as string)).toEqual([])
    }
  })
  it('does not add a phantom line for a truncated patch', () => {
    const files = parseUnifiedDiff('@@ -1,5 +1,5 @@\n a\n')
    expect(files[0].hunks[0].lines.length).toBe(1)
  })
  it('ignores header lines after a hunk when no counts remain', () => {
    const files = parseUnifiedDiff('diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1 +1 @@\n-a\n+b\ndiff --git a/y b/y\n--- a/y\n+++ b/y\n@@ -1 +1 @@\n-c\n+d\n')
    expect(files.map((f) => f.name)).toEqual(['x', 'y'])
  })
})

describe('buildPatchModel', () => {
  it('adds file rows for named files and counts changes', () => {
    const m = buildPatchModel(parseUnifiedDiff(PATCH))
    expect(m.blocks.map((b) => b.kind)).toEqual(['file', 'hunk', 'hunk'])
    expect(m.hunks.length).toBe(2)
    expect(m.added).toBe(2)
    expect(m.removed).toBe(1)
    expect(m.hunks[0].lines[1].pair).toBe(m.hunks[0].lines[2])
  })
  it('has no file row for a single unnamed file and names an unnamed file among several', () => {
    expect(buildPatchModel(parseUnifiedDiff('@@ -1 +1 @@\n-a\n+b\n')).blocks.map((b) => b.kind)).toEqual(['hunk'])
    const m = buildPatchModel([{ name: '', hunks: [] }, { name: 'b', hunks: [] }])
    expect(m.blocks).toEqual([{ kind: 'file', name: 'Unnamed file' }, { kind: 'file', name: 'b' }])
  })
})

describe('diffWords', () => {
  it('marks only the changed words', () => {
    const parts = diffWords('port = 80;', 'port = 8080;')!
    expect(parts.filter((p) => p.kind === 'del').map((p) => p.text)).toEqual(['80'])
    expect(parts.filter((p) => p.kind === 'add').map((p) => p.text)).toEqual(['8080'])
    expect(parts.filter((p) => p.kind === 'eq').map((p) => p.text).join('')).toBe('port = ;')
  })
  it('keeps the old and new text recoverable', () => {
    const o = 'the quick brown fox jumps'
    const n = 'the slow brown dog jumps over'
    const parts = diffWords(o, n)!
    expect(parts.filter((p) => p.kind !== 'add').map((p) => p.text).join('')).toBe(o)
    expect(parts.filter((p) => p.kind !== 'del').map((p) => p.text).join('')).toBe(n)
  })
  it('handles unicode words', () => {
    const parts = diffWords('héllo wörld 日本', 'héllo welt 日本')!
    expect(parts.some((p) => p.kind === 'del' && p.text === 'wörld')).toBe(true)
  })
  it('returns null when nothing but whitespace is shared, or for empty lines', () => {
    expect(diffWords('alpha beta', 'gamma delta')).toBeNull()
    expect(diffWords('', '')).toBeNull()
  })
  it('skips very long lines', () => {
    const long = Array.from({ length: WORD_TOKEN_CAP + 1 }, (_, i) => `w${i}`).join(' ')
    expect(diffWords(long, long + ' x')).toBeNull()
    expect(diffWords('a b', long)).toBeNull()
  })
})
