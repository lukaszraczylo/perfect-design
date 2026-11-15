import { describe, expect, it } from 'vitest'
import { goLiteral, goPackageSource, goQuote } from './goLiteral'

describe('goQuote', () => {
  it('wraps and escapes quotes, backslashes and common controls', () => {
    expect(goQuote('plain')).toBe('"plain"')
    expect(goQuote('say "hi"')).toBe('"say \\"hi\\""')
    expect(goQuote('a\\b')).toBe('"a\\\\b"')
    expect(goQuote('l1\nl2\tt\r')).toBe('"l1\\nl2\\tt\\r"')
  })
  it('escapes other control characters and line separators', () => {
    expect(goQuote('\u0000\u0007\u007f')).toBe('"\\x00\\x07\\x7f"')
    expect(goQuote('\u0085\u2028\u2029\ufeff')).toBe('"\\u0085\\u2028\\u2029\\ufeff"')
  })
  it('keeps unicode and emoji and replaces lone surrogates', () => {
    expect(goQuote('日本語 é 😀')).toBe('"日本語 é 😀"')
    expect(goQuote('\ud800')).toBe('"\\ufffd"')
  })
})

describe('goLiteral: scalars', () => {
  it('writes strings, booleans and nil', () => {
    expect(goLiteral('x')).toBe('"x"')
    expect(goLiteral(true)).toBe('true')
    expect(goLiteral(false)).toBe('false')
    expect(goLiteral(null)).toBe('nil')
    expect(goLiteral(undefined)).toBe('nil')
    expect(goLiteral(() => 1)).toBe('nil')
    expect(goLiteral(Symbol('s'))).toBe('nil')
  })
  it('writes numbers naturally and as float64 on request', () => {
    expect(goLiteral(42)).toBe('42')
    expect(goLiteral(-3.5)).toBe('-3.5')
    expect(goLiteral(1e21)).toBe('float64(1e+21)')
    expect(goLiteral(42, { numbers: 'float64' })).toBe('float64(42)')
    expect(goLiteral(3.5, { numbers: 'float64' })).toBe('float64(3.5)')
    expect(goLiteral(42, { numbers: 'nope' as never })).toBe('42')
  })
  it('writes NaN, infinities and negative zero with math helpers', () => {
    expect(goLiteral(NaN)).toBe('math.NaN()')
    expect(goLiteral(Infinity)).toBe('math.Inf(1)')
    expect(goLiteral(-Infinity)).toBe('math.Inf(-1)')
    expect(goLiteral(-0)).toBe('math.Copysign(0, -1)')
  })
  it('writes bigint as int64 and dates as ISO strings', () => {
    expect(goLiteral(12n)).toBe('int64(12)')
    expect(goLiteral(new Date(Date.UTC(2024, 0, 2, 3, 4, 5)))).toBe('"2024-01-02T03:04:05.000Z"')
    expect(goLiteral(new Date('nope'))).toBe('nil')
  })
  it('writes multi-line strings as raw literals unless they contain a backtick or carriage return', () => {
    expect(goLiteral('a\nb')).toBe('`a\nb`')
    expect(goLiteral('a`\nb')).toBe('"a`\\nb"')
    expect(goLiteral('a\r\nb')).toBe('"a\\r\\nb"')
  })
})

describe('goLiteral: collections', () => {
  it('writes maps with tabs, trailing commas and aligned values', () => {
    expect(goLiteral({ name: 'api', replicas: 3, ok: true })).toBe('map[string]any{\n\t"name":     "api",\n\t"replicas": 3,\n\t"ok":       true,\n}')
  })
  it('writes slices and nests them', () => {
    expect(goLiteral([1, 'a', null])).toBe('[]any{\n\t1,\n\t"a",\n\tnil,\n}')
    expect(goLiteral({ a: [1] })).toBe('map[string]any{\n\t"a": []any{\n\t\t1,\n\t},\n}')
  })
  it('breaks alignment around multi-line values like gofmt', () => {
    expect(goLiteral({ a: 1, bb: [2], ccc: 3 })).toBe('map[string]any{\n\t"a": 1,\n\t"bb": []any{\n\t\t2,\n\t},\n\t"ccc": 3,\n}')
  })
  it('writes empty containers inline', () => {
    expect(goLiteral({})).toBe('map[string]any{}')
    expect(goLiteral([])).toBe('[]any{}')
    expect(goLiteral({ a: undefined })).toBe('map[string]any{}')
  })
  it('quotes and escapes keys', () => {
    expect(goLiteral({ 'a "b"': 1 })).toBe('map[string]any{\n\t"a \\"b\\"": 1,\n}')
  })
  it('supports Map, Set and typed arrays', () => {
    expect(goLiteral(new Map<unknown, unknown>([[1, 'x']]))).toBe('map[string]any{\n\t"1": "x",\n}')
    expect(goLiteral(new Set(['a']))).toBe('[]any{\n\t"a",\n}')
    expect(goLiteral(new Uint8Array([1]))).toBe('[]any{\n\t1,\n}')
  })
  it('throws a clear error for circular structures', () => {
    const a: Record<string, unknown> = {}
    a.self = [a]
    expect(() => goLiteral(a)).toThrow('Cannot render a circular structure as a Go literal (cycle at $.self[0])')
  })
  it('handles a large value', () => {
    const big = Array.from({ length: 2000 }, (_, i) => ({ id: i, s: 'x' }))
    const start = performance.now()
    expect(goLiteral(big).split('\n').length).toBeGreaterThan(8000)
    expect(performance.now() - start).toBeLessThan(1000)
  })
})

describe('goPackageSource', () => {
  it('wraps the literal in a package and a variable', () => {
    expect(goPackageSource({ a: 1 }, { packageName: 'config' })).toBe('package config\n\nvar data = map[string]any{\n\t"a": 1,\n}')
  })
  it('adds import "math" only when needed', () => {
    expect(goPackageSource([NaN])).toBe('package main\n\nimport "math"\n\nvar data = []any{\n\tmath.NaN(),\n}')
    expect(goPackageSource([-0], { numbers: 'float64' })).toContain('import "math"')
    expect(goPackageSource([1])).not.toContain('import')
  })
  it('falls back for invalid package and variable names and uses a custom variable', () => {
    expect(goPackageSource(1, { packageName: '1bad', variable: 'x y' })).toBe('package main\n\nvar data = 1')
    expect(goPackageSource(1, { packageName: 'ok_1', variable: 'payload' })).toBe('package ok_1\n\nvar payload = 1')
  })
})
