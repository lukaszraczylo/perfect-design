import { describe, expect, it } from 'vitest'
import { isPlainSafe, quote, yamlStringify } from './yamlStringify'

describe('yamlStringify: scalars', () => {
  it('writes plain strings without quotes', () => {
    expect(yamlStringify('hello world')).toBe('hello world')
    expect(yamlStringify('nginx:1.27')).toBe('nginx:1.27')
    expect(yamlStringify('a-b_c/d.e')).toBe('a-b_c/d.e')
    expect(yamlStringify('café')).toBe('café')
  })
  it('quotes strings that would read back as something else', () => {
    for (const s of ['yes', 'No', 'ON', 'off', 'y', 'N', 'null', 'NULL', '~', 'true', 'False', '12', '-3', '+4', '1.5', '.5', '1e3', '0x1F', '0o7', '0b1', '1_000', '1,000', '.inf', '-.INF', '.nan', '2024-01-02', '2024-01-02T03:04:05Z', '']) {
      expect(yamlStringify(s), s).toBe(JSON.stringify(s))
    }
  })
  it('quotes strings with YAML syntax characters', () => {
    for (const s of ['a: b', 'a:', '- item', '-', '? q', ': v', '# c', 'a #c', '&a', '*a', '!t', '|', '>', "'q'", '"q"', '%d', '@x', '`x', '[a]', '{a}', ',a', '---', '...', ' lead', 'trail ', '<<', 'tab\there', 'bell\u0007', '\u0085', '\u2028']) {
      const out = yamlStringify(s)
      expect(out.startsWith('"'), s).toBe(true)
      expect(JSON.parse(out)).toBe(s)
    }
  })
  it('keeps plain colons and hashes that carry no meaning', () => {
    expect(yamlStringify('a:b')).toBe('a:b')
    expect(yamlStringify('a#b')).toBe('a#b')
    expect(yamlStringify('-a')).toBe('-a')
    expect(yamlStringify('1.2.3')).toBe('1.2.3')
  })
  it('escapes line-break characters that JSON leaves alone', () => {
    expect(quote('a\u2028b\u0085c\ufeff')).toBe('"a\\u2028b\\u0085c\\ufeff"')
    expect(quote('say "hi"\n')).toBe('"say \\"hi\\"\\n"')
  })
  it('writes numbers, including special values', () => {
    expect(yamlStringify(42)).toBe('42')
    expect(yamlStringify(-1.5)).toBe('-1.5')
    expect(yamlStringify(1e21)).toBe('1e+21')
    expect(yamlStringify(NaN)).toBe('.nan')
    expect(yamlStringify(Infinity)).toBe('.inf')
    expect(yamlStringify(-Infinity)).toBe('-.inf')
    expect(yamlStringify(-0)).toBe('-0.0')
    expect(yamlStringify(0)).toBe('0')
  })
  it('writes booleans, null, undefined, bigint and symbols', () => {
    expect(yamlStringify(true)).toBe('true')
    expect(yamlStringify(false)).toBe('false')
    expect(yamlStringify(null)).toBe('null')
    expect(yamlStringify(undefined)).toBe('null')
    expect(yamlStringify(10n ** 20n)).toBe('100000000000000000000')
    expect(yamlStringify(Symbol('s'))).toBe('null')
    expect(yamlStringify(() => 1)).toBe('null')
  })
  it('writes dates as ISO 8601 and invalid dates as null', () => {
    expect(yamlStringify(new Date(Date.UTC(2024, 0, 2, 3, 4, 5)))).toBe('2024-01-02T03:04:05.000Z')
    expect(yamlStringify(new Date('nope'))).toBe('null')
    expect(yamlStringify({ at: new Date(0) })).toBe('at: 1970-01-01T00:00:00.000Z')
  })
  it('exposes isPlainSafe', () => {
    expect(isPlainSafe('ok')).toBe(true)
    expect(isPlainSafe('no way: x')).toBe(false)
    expect(isPlainSafe('')).toBe(false)
  })
})

describe('yamlStringify: multi-line strings', () => {
  it('uses literal blocks with the right chomping indicator', () => {
    expect(yamlStringify({ a: 'one\ntwo' })).toBe('a: |-\n  one\n  two')
    expect(yamlStringify({ a: 'one\ntwo\n' })).toBe('a: |\n  one\n  two')
    expect(yamlStringify({ a: 'one\ntwo\n\n' })).toBe('a: |+\n  one\n  two\n')
  })
  it('keeps blank lines inside a block empty', () => {
    expect(yamlStringify({ a: 'one\n\ntwo\n' })).toBe('a: |\n  one\n\n  two')
  })
  it('indents block lines relative to the key and to sequence items', () => {
    expect(yamlStringify({ a: { b: 'x\ny' } })).toBe('a:\n  b: |-\n    x\n    y')
    expect(yamlStringify(['x\ny'])).toBe('- |-\n  x\n  y')
    expect(yamlStringify({ a: 'x\ny' }, { indent: 4 })).toBe('a: |-\n    x\n    y')
  })
  it('writes a root multi-line string as a block', () => {
    expect(yamlStringify('hi\nthere')).toBe('|-\n  hi\n  there')
  })
  it('quotes multi-line strings a block cannot represent', () => {
    expect(yamlStringify({ a: ' x\ny' })).toBe('a: " x\\ny"')
    expect(yamlStringify({ a: '\nx' })).toBe('a: "\\nx"')
    expect(yamlStringify({ a: 'x\r\ny' })).toBe('a: "x\\r\\ny"')
    expect(yamlStringify({ a: ' \n ' })).toBe('a: " \\n "')
    expect(yamlStringify({ a: 'x\u0007\ny' })).toBe('a: "x\\u0007\\ny"')
  })
  it('never writes a multi-line key as a block', () => {
    expect(yamlStringify({ 'a\nb': 1 })).toBe('"a\\nb": 1')
  })
})

describe('yamlStringify: collections', () => {
  it('writes nested maps and lists with correct indentation', () => {
    const value = { name: 'web', spec: { replicas: 2, ports: [80, 443], env: [{ name: 'A', value: '1' }, { name: 'B', value: 'x y' }] } }
    expect(yamlStringify(value)).toBe(
      ['name: web', 'spec:', '  replicas: 2', '  ports:', '    - 80', '    - 443', '  env:', '    - name: A', "      value: \"1\"", '    - name: B', '      value: x y'].join('\n'),
    )
  })
  it('supports four-space indentation and falls back to two for other values', () => {
    expect(yamlStringify({ a: { b: 1 } }, { indent: 4 })).toBe('a:\n    b: 1')
    expect(yamlStringify({ a: { b: 1 } }, { indent: 3 as never })).toBe('a:\n  b: 1')
    expect(yamlStringify({ a: [{ b: 1, c: 2 }] }, { indent: 4 })).toBe('a:\n    - b: 1\n      c: 2')
  })
  it('writes empty containers inline', () => {
    expect(yamlStringify({})).toBe('{}')
    expect(yamlStringify([])).toBe('[]')
    expect(yamlStringify({ a: {}, b: [], c: [{}, []] })).toBe('a: {}\nb: []\nc:\n  - {}\n  - []')
    expect(yamlStringify({ a: undefined })).toBe('{}')
  })
  it('writes nested lists as dash dash', () => {
    expect(yamlStringify([[1, 2], [3, [4]]])).toBe('- - 1\n  - 2\n- - 3\n  - - 4')
  })
  it('skips undefined, functions and symbols in maps and writes null in lists', () => {
    expect(yamlStringify({ a: 1, b: undefined, c: () => 1, d: Symbol('x'), e: null })).toBe('a: 1\ne: null')
    expect(yamlStringify([1, undefined, () => 1])).toBe('- 1\n- null\n- null')
  })
  it('preserves key order and quotes keys that need it', () => {
    expect(yamlStringify({ z: 1, a: 2, m: 3 })).toBe('z: 1\na: 2\nm: 3')
    expect(yamlStringify({ 'a b': 1, 'c: d': 2, yes: 3, '': 4, '- x': 5 })).toBe('a b: 1\n"c: d": 2\n"yes": 3\n"": 4\n"- x": 5')
  })
  it('supports Map, Set, typed arrays and toJSON', () => {
    expect(yamlStringify(new Map<unknown, unknown>([['a', 1], [2, 'x']]))).toBe('a: 1\n"2": x')
    expect(yamlStringify(new Set([1, 2]))).toBe('- 1\n- 2')
    expect(yamlStringify(new Uint8Array([1, 2]))).toBe('- 1\n- 2')
    expect(yamlStringify({ toJSON: () => ({ v: 1 }) })).toBe('v: 1')
  })
  it('throws a clear error for circular structures and names the path', () => {
    const a: Record<string, unknown> = { b: { c: [] as unknown[] } }
    ;((a.b as Record<string, unknown[]>).c).push(a)
    expect(() => yamlStringify(a)).toThrow(TypeError)
    expect(() => yamlStringify(a)).toThrow('Cannot stringify a circular structure to YAML (cycle at $.b.c[0])')
  })
  it('writes shared non-circular references twice', () => {
    const shared = { x: 1 }
    expect(yamlStringify({ a: shared, b: shared })).toBe('a:\n  x: 1\nb:\n  x: 1')
  })
  it('is deterministic and handles a large value', () => {
    const big = Array.from({ length: 2000 }, (_, i) => ({ id: i, tags: ['a', 'b'] }))
    const start = performance.now()
    const out = yamlStringify(big)
    expect(performance.now() - start).toBeLessThan(1000)
    expect(out.split('\n')).toHaveLength(2000 * 4)
    expect(yamlStringify(big)).toBe(out)
  })
})
