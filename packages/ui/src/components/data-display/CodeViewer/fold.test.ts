import { describe, expect, it } from 'vitest'
import { buildRows, computeFolds, type FoldRegion } from './fold'
import { splitLines, tokenize, type CodeLanguage } from './tokenize'
import { normaliseStartLine, parseLineSpec } from './lineSpec'

const folds = (src: string, lang: CodeLanguage): FoldRegion[] => computeFolds(splitLines(src), tokenize(src, lang), lang)

describe('computeFolds: json', () => {
  it('folds objects and arrays, keeping the closing line visible', () => {
    const src = '{\n  "a": [\n    1,\n    2\n  ],\n  "b": {\n    "c": 1\n  }\n}'
    expect(folds(src, 'json')).toEqual([{ start: 0, end: 7 }, { start: 1, end: 3 }, { start: 5, end: 6 }])
  })
  it('ignores brackets inside strings and comments, and one-line containers', () => {
    expect(folds('{\n  "a": "{[(",\n  // }\n  "b": []\n}', 'json')).toEqual([{ start: 0, end: 3 }])
    expect(folds('[1, 2, 3]', 'json')).toEqual([])
  })
  it('ignores unmatched closers and openers', () => {
    expect(folds('}\n]\n{\n1', 'json')).toEqual([])
  })
  it('folds multi-line block comments', () => {
    expect(folds('/* a\n b\n c */\n{}', 'json')).toEqual([{ start: 0, end: 2 }])
  })
})

describe('computeFolds: go', () => {
  const src = 'package main\nimport (\n\t"fmt"\n\t"os"\n)\n/* doc\n more */\n// line\nfunc main() {\n\tif x {\n\t\ty()\n\t}\n\tswitch v {\n\tcase 1:\n\t\tz()\n\t}\n}\n'
  it('folds import blocks, functions, nested blocks, switches and block comments', () => {
    expect(folds(src, 'go')).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 6 },
      { start: 8, end: 15 },
      { start: 9, end: 10 },
      { start: 12, end: 14 },
    ])
  })
  it('folds const and var groups, type and struct blocks, composite literals', () => {
    const g = 'const (\n\tA = 1\n\tB = 2\n)\ntype T struct {\n\tX int\n}\nvar m = map[string]int{\n\t"a": 1,\n}\nvar s = []int{1,\n\t2}'
    expect(folds(g, 'go').map((r) => r.start)).toEqual([0, 4, 7])
  })
  it('does not fold on brackets inside raw strings, runes and comments', () => {
    expect(folds('x := `{\n}`\ny := \'{\'\n// {\nz := "}"', 'go')).toEqual([])
  })
  it('handles a line comment that mentions an opening block comment', () => {
    expect(folds('// see /* x\nfunc a() {\n\tb()\n}', 'go')).toEqual([{ start: 1, end: 2 }])
  })
  it('handles an unclosed block comment and a trailing comment opener', () => {
    expect(folds('x := 1 /* open\nstill\n', 'go')).toEqual([])
    expect(folds('/* a */ y := 1', 'go')).toEqual([])
  })
})

describe('computeFolds: yaml', () => {
  it('folds by indentation, including nested mappings and sequence items', () => {
    const src = 'a:\n  b: 1\n  c:\n    - x\n    - y: 1\n      z: 2\nd: 3'
    expect(folds(src, 'yaml')).toEqual([{ start: 0, end: 5 }, { start: 2, end: 5 }, { start: 4, end: 5 }])
  })
  it('folds a key whose sequence is not indented', () => {
    const src = 'list:\n- a\n- b: 1\n  c: 2\nnext: 1'
    expect(folds(src, 'yaml')).toEqual([{ start: 0, end: 3 }, { start: 2, end: 3 }])
  })
  it('folds a dash with a nested mapping on following lines and skips comments and blanks', () => {
    const src = 'a:\n  # note\n\n  b: 1\n\n# tail\nc: 2'
    expect(folds(src, 'yaml')).toEqual([{ start: 0, end: 3 }])
  })
  it('does not fold block scalar text and folds the key that owns it', () => {
    const src = 'k: |\n  line: one\n    deeper\nz: 1'
    expect(folds(src, 'yaml')).toEqual([{ start: 0, end: 2 }])
  })
  it('splits regions at document markers', () => {
    const src = 'a:\n  b: 1\n---\nc:\n  d: 2\n...'
    expect(folds(src, 'yaml')).toEqual([{ start: 0, end: 1 }, { start: 3, end: 4 }])
  })
  it('returns nothing for flat, empty and comment-only input', () => {
    expect(folds('a: 1\nb: 2', 'yaml')).toEqual([])
    expect(folds('', 'yaml')).toEqual([])
    expect(folds('# a\n# b', 'yaml')).toEqual([])
    expect(folds('a:', 'yaml')).toEqual([])
  })
})

describe('computeFolds: toml', () => {
  it('folds tables and nested tables, trimming trailing blank lines', () => {
    const src = '[a]\nx = 1\n\n[a.b]\ny = 2\n\n[c]\nz = 3'
    expect(folds(src, 'toml')).toEqual([{ start: 0, end: 4 }, { start: 3, end: 4 }, { start: 6, end: 7 }])
  })
  it('folds array tables and multi-line arrays and inline tables', () => {
    const src = '[[p]]\nl = [\n  1,\n  2,\n]\n[[p]]\nm = {\n  a = 1 }'
    expect(folds(src, 'toml')).toEqual([{ start: 0, end: 4 }, { start: 1, end: 3 }, { start: 5, end: 7 }, { start: 6, end: 6 }].filter((r) => r.end > r.start))
  })
  it('does not fold an empty table', () => {
    expect(folds('[a]\n[b]', 'toml')).toEqual([])
    expect(folds('[a]\n[b]\nx = 1', 'toml')).toEqual([{ start: 1, end: 2 }])
  })
})

describe('computeFolds: shell and plain', () => {
  it('folds if, loops, case and brace groups, ignoring quoted keywords', () => {
    const src = 'if x; then\n  echo "fi"\nfi\nfor a in b; do\n  ls\ndone\ncase $x in\n  a) ;;\nesac\nf() {\n  :\n}'
    expect(folds(src, 'shell')).toEqual([{ start: 0, end: 1 }, { start: 3, end: 4 }, { start: 6, end: 7 }, { start: 9, end: 10 }])
  })
  it('ignores unmatched closing keywords', () => {
    expect(folds('fi\ndone\nesac', 'shell')).toEqual([])
  })
  it('plain text has no regions', () => {
    expect(folds('a\n  b\n    c', 'plain')).toEqual([])
  })
})

describe('buildRows', () => {
  const regions: FoldRegion[] = [{ start: 0, end: 5 }, { start: 2, end: 3 }]
  it('lists every line when nothing is collapsed', () => {
    const rows = buildRows(7, regions, new Set())
    expect(rows.map((r) => r.line)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(rows.filter((r) => r.region).map((r) => r.line)).toEqual([0, 2])
    expect(rows.every((r) => !r.folded)).toBe(true)
  })
  it('skips hidden lines of a collapsed region, including nested collapsed ones', () => {
    expect(buildRows(7, regions, new Set([0])).map((r) => r.line)).toEqual([0, 6])
    expect(buildRows(7, regions, new Set([0, 2])).map((r) => [r.line, r.folded])).toEqual([[0, true], [6, false]])
    expect(buildRows(7, regions, new Set([2])).map((r) => r.line)).toEqual([0, 1, 2, 4, 5, 6])
  })
  it('ignores collapsed starts that are not regions', () => {
    expect(buildRows(3, [], new Set([1])).map((r) => r.line)).toEqual([0, 1, 2])
  })
  it('folding 10 000 lines stays fast', () => {
    const big: FoldRegion[] = Array.from({ length: 2500 }, (_, i) => ({ start: i * 4, end: i * 4 + 3 }))
    const start = performance.now()
    expect(buildRows(10000, big, new Set(big.map((r) => r.start)))).toHaveLength(2500)
    expect(performance.now() - start).toBeLessThan(500)
  })
})

describe('parseLineSpec and normaliseStartLine', () => {
  const set = (input: unknown, min = 1, max = 10) => [...parseLineSpec(input, min, max)]
  it('parses numbers, arrays, ranges and strings', () => {
    expect(set([2, 4])).toEqual([2, 4])
    expect(set(3)).toEqual([3])
    expect(set('1,3-5')).toEqual([1, 3, 4, 5])
    expect(set(' 2 - 3 , 7 ')).toEqual([2, 3, 7])
    expect(set(['4-5', 9])).toEqual([4, 5, 9])
  })
  it('swaps reversed ranges and clamps to the visible lines', () => {
    expect(set('5-3')).toEqual([3, 4, 5])
    expect(set('8-99')).toEqual([8, 9, 10])
    expect(set('0-2')).toEqual([1, 2])
    expect(set('1-999999999999999')).toHaveLength(10)
    expect(set([20, -1, 0])).toEqual([])
  })
  it('respects a start offset', () => {
    expect(set('10-12', 10, 14)).toEqual([10, 11, 12])
    expect(set('1-3', 10, 14)).toEqual([])
  })
  it('ignores invalid input', () => {
    for (const bad of ['abc', '3-', '-3', '1.5', '', null, undefined, {}, true, [NaN, 1.5, Infinity, null, {}, 'x']]) expect(set(bad), String(bad)).toEqual([])
    expect(set('1,abc,3')).toEqual([1, 3])
    expect(set('1234567890123456789')).toEqual([])
  })
  it('normalises the start line', () => {
    expect(normaliseStartLine(5)).toBe(5)
    expect(normaliseStartLine(5.9)).toBe(5)
    for (const bad of [0, -3, NaN, Infinity, '7', null, undefined, {}]) expect(normaliseStartLine(bad)).toBe(1)
  })
})
