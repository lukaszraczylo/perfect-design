import { describe, expect, it } from 'vitest'
import { CODE_LANGUAGES, TOKEN_TYPES, normalizeLanguage, splitLines, tokenize, type TokenLines } from './index'
import { tokenizeJson, scanDoubleQuoted } from './json'
import { tokenizeYaml } from './yaml'
import { tokenizeGo } from './go'
import { tokenizeToml } from './toml'
import { tokenizeShell } from './shell'
import { tokenizePlain } from './plain'
import { at, isDigit, isIdentPart, isIdentStart, push } from './types'

type Pair = [string, string]
/** Non-blank tokens of one line as [type, text]. */
const line = (t: TokenLines, i = 0): Pair[] =>
  t[i].filter((x) => !(x.type === 'plain' && x.text.trim() === '')).map((x): Pair => [x.type, x.type === 'plain' ? x.text.trim() : x.text])
const joined = (t: TokenLines) => t.map((l) => l.map((x) => x.text).join(''))
const types = (t: TokenLines) => new Set(t.flat().map((x) => x.type))

const SAMPLES: Record<string, string> = {
  json: '{"a": [1, 2.5e3, true, null], /* c */ "b": "x\\"y"} // end',
  yaml: '---\na: &x [1, "b"]\nb: |\n  text\n...\n',
  go: 'package main\nfunc main() { x := `a\nb`; /* c\nd */ }\n',
  toml: '[a.b]\nk = """x\ny"""\nz = [1,\n2]\n',
  shell: 'cat <<EOF\nx\nEOF\necho "a\nb" | grep -v "$X"\n',
  plain: 'just text\n\ttabbed',
}

describe('language dispatch', () => {
  it('exposes the six languages and thirteen token types', () => {
    expect([...CODE_LANGUAGES]).toEqual(['json', 'yaml', 'go', 'toml', 'shell', 'plain'])
    expect(TOKEN_TYPES).toHaveLength(13)
  })
  it('falls back to plain for unknown, empty and non-string languages', () => {
    for (const bad of ['rust', '', undefined, null, 5, {}]) expect(normalizeLanguage(bad)).toBe('plain')
    expect(normalizeLanguage('yaml')).toBe('yaml')
    expect(tokenize('a: 1', 'rust')).toEqual(tokenizePlain('a: 1'))
  })
  it.each(CODE_LANGUAGES)('%s: tokens always concatenate back to the source lines', (lang) => {
    for (const src of [SAMPLES[lang], '', 'x', '\n\n', 'a\r\nb\rc', '\t\ta', '日本語 "é', '"unterminated', "'x", '`raw', '/* open', '#', '<<', '\\', 'a'.repeat(3000)]) {
      expect(joined(tokenize(src, lang))).toEqual(splitLines(src).map((l) => l))
    }
  })
  it.each(CODE_LANGUAGES)('%s: empty input is one empty line, one character input works', (lang) => {
    expect(tokenize('', lang)).toEqual([[]])
    expect(joined(tokenize('x', lang))).toEqual(['x'])
  })
})

describe('splitLines and helpers', () => {
  it('splits LF, CRLF and CR and drops one trailing newline', () => {
    expect(splitLines('a\r\nb\rc\n')).toEqual(['a', 'b', 'c'])
    expect(splitLines('')).toEqual([''])
    expect(splitLines('\n')).toEqual([''])
    expect(splitLines('a\n\n')).toEqual(['a', ''])
    expect(splitLines(undefined as unknown as string)).toEqual([''])
  })
  it('push merges equal types and skips empty text', () => {
    const out: { type: string; text: string }[] = []
    push(out as never, 'plain', 'a')
    push(out as never, 'plain', 'b')
    push(out as never, 'plain', '')
    push(out as never, 'key', 'c')
    expect(out).toEqual([{ type: 'plain', text: 'ab' }, { type: 'key', text: 'c' }])
  })
  it('classifies characters and matches sticky regexes', () => {
    expect(isDigit('5')).toBe(true)
    expect(isDigit('a')).toBe(false)
    expect(isDigit(undefined)).toBe(false)
    expect(isIdentStart('é')).toBe(true)
    expect(isIdentStart('1')).toBe(false)
    expect(isIdentPart('1')).toBe(true)
    expect(isIdentPart(undefined)).toBe(false)
    expect(at(/b+/y, 'abbc', 1)).toBe('bb')
    expect(at(/b+/y, 'abbc', 0)).toBeNull()
  })
  it('plain tokenizer keeps whitespace and blank lines', () => {
    expect(tokenizePlain('a\n\n  b')).toEqual([[{ type: 'plain', text: 'a' }], [], [{ type: 'plain', text: '  b' }]])
  })
})

describe('json tokenizer', () => {
  it('tokenizes keys, strings, numbers, constants and punctuation', () => {
    const t = tokenizeJson('{"name": "x", "n": -12.5e+3, "ok": true, "z": null, "l": [1]}')
    expect(line(t)).toEqual([
      ['punctuation', '{'], ['key', '"name"'], ['punctuation', ':'], ['string', '"x"'], ['punctuation', ','],
      ['key', '"n"'], ['punctuation', ':'], ['number', '-12.5e+3'], ['punctuation', ','],
      ['key', '"ok"'], ['punctuation', ':'], ['constant', 'true'], ['punctuation', ','],
      ['key', '"z"'], ['punctuation', ':'], ['constant', 'null'], ['punctuation', ','],
      ['key', '"l"'], ['punctuation', ':'], ['punctuation', '['], ['number', '1'], ['punctuation', ']}'],
    ])
  })
  it('keeps escapes inside strings and handles an escaped quote', () => {
    expect(line(tokenizeJson('"a\\"b\\\\"'))).toEqual([['string', '"a\\"b\\\\"']])
    expect(scanDoubleQuoted('"a\\"b"', 0)).toBe(6)
  })
  it('treats an unterminated string as a string to the end of the line', () => {
    expect(line(tokenizeJson('{"a": "oops'))).toEqual([['punctuation', '{'], ['key', '"a"'], ['punctuation', ':'], ['string', '"oops']])
  })
  it('tolerates line and block comments, including multi-line ones', () => {
    const t = tokenizeJson('// top\n/* a\nb */ 1 /* c */ , 2 /* open\nclose */')
    expect(line(t, 0)).toEqual([['comment', '// top']])
    expect(line(t, 1)).toEqual([['comment', '/* a']])
    expect(line(t, 2)).toEqual([['comment', 'b */'], ['number', '1'], ['comment', '/* c */'], ['punctuation', ','], ['number', '2'], ['comment', '/* open']])
    expect(line(t, 3)).toEqual([['comment', 'close */']])
    expect(types(tokenizeJson('/* never closed\nstill'))).toEqual(new Set(['comment']))
  })
  it('handles unquoted words, lone minus signs, tabs and unicode', () => {
    expect(line(tokenizeJson('\tfoo - é'))).toEqual([['plain', 'foo'], ['operator', '-'], ['plain', 'é']])
    expect(line(tokenizeJson('"ключ": "значение"'))[0]).toEqual(['key', '"ключ"'])
  })
  it('handles CRLF and a very long single line quickly', () => {
    expect(tokenizeJson('1\r\n2')).toHaveLength(2)
    const long = `[${Array.from({ length: 20000 }, (_, i) => i).join(',')}]`
    const start = performance.now()
    const t = tokenizeJson(long)
    expect(t).toHaveLength(1)
    expect(performance.now() - start).toBeLessThan(1500)
  })
})

describe('yaml tokenizer', () => {
  it('tokenizes keys, values, comments and constants', () => {
    const t = tokenizeYaml('name: web # note\nreplicas: 3\non: true\nnone: ~\nratio: 0.5\nhex: 0x1F\nsci: 1e3\nmsg: hello world\ninf: .inf')
    expect(line(t, 0)).toEqual([['key', 'name'], ['punctuation', ':'], ['string', 'web'], ['comment', '# note']])
    expect(line(t, 1)[2]).toEqual(['number', '3'])
    expect(line(t, 2)[2]).toEqual(['constant', 'true'])
    expect(line(t, 3)[2]).toEqual(['constant', '~'])
    expect(line(t, 4)[2]).toEqual(['number', '0.5'])
    expect(line(t, 5)[2]).toEqual(['number', '0x1F'])
    expect(line(t, 6)[2]).toEqual(['number', '1e3'])
    expect(line(t, 7)[2]).toEqual(['string', 'hello world'])
    expect(line(t, 8)[2]).toEqual(['number', '.inf'])
  })
  it('does not treat a # inside a value without a preceding space as a comment', () => {
    expect(line(tokenizeYaml('url: http://x.test/#frag'))[2]).toEqual(['string', 'http://x.test/#frag'])
    expect(line(tokenizeYaml('# full line comment'))).toEqual([['comment', '# full line comment']])
  })
  it('handles sequences, nested sequences and keys after dashes', () => {
    const t = tokenizeYaml('- name: web\n  image: nginx:1.27\n- - a\n- plain')
    expect(line(t, 0)).toEqual([['punctuation', '-'], ['key', 'name'], ['punctuation', ':'], ['string', 'web']])
    expect(line(t, 1)).toEqual([['key', 'image'], ['punctuation', ':'], ['string', 'nginx:1.27']])
    expect(line(t, 2)).toEqual([['punctuation', '-'], ['punctuation', '-'], ['string', 'a']])
    expect(line(t, 3)).toEqual([['punctuation', '-'], ['string', 'plain']])
  })
  it('handles anchors, aliases, merge keys and tags', () => {
    const t = tokenizeYaml('base: &b\n  a: 1\nuse:\n  <<: *b\n  t: !!str 12\n  u: !custom x\n  v: !<tag:yaml.org,2002:str> y\n  w: &anc !!map {}')
    expect(line(t, 0)).toEqual([['key', 'base'], ['punctuation', ':'], ['anchor', '&b']])
    expect(line(t, 3)).toEqual([['operator', '<<'], ['punctuation', ':'], ['anchor', '*b']])
    expect(line(t, 4)[2]).toEqual(['tag', '!!str'])
    expect(line(t, 4)[3]).toEqual(['number', '12'])
    expect(line(t, 5)[2]).toEqual(['tag', '!custom'])
    expect(line(t, 6)[2]).toEqual(['tag', '!<tag:yaml.org,2002:str>'])
    expect(line(t, 7).slice(2, 4)).toEqual([['anchor', '&anc'], ['tag', '!!map']])
    expect(joined(tokenizeYaml('v: !<unterminated'))).toEqual(['v: !<unterminated'])
  })
  it('handles multi-document streams and directives', () => {
    const t = tokenizeYaml('%YAML 1.2 # v\n%TAG ! tag:x,2000:\n---\na: 1\n...\n--- !tag\ntext\n---')
    expect(line(t, 0)).toEqual([['keyword', '%YAML 1.2'], ['comment', '# v']])
    expect(line(t, 1)).toEqual([['keyword', '%TAG ! tag:x,2000:']])
    expect(line(t, 2)).toEqual([['punctuation', '---']])
    expect(line(t, 4)).toEqual([['punctuation', '...']])
    expect(line(t, 5)).toEqual([['punctuation', '---'], ['tag', '!tag']])
    expect(line(t, 6)).toEqual([['string', 'text']])
    expect(line(t, 7)).toEqual([['punctuation', '---']])
  })
  it('does not treat --- inside text as a document marker', () => {
    expect(line(tokenizeYaml('----'))).toEqual([['string', '----']])
  })
  it('tokenizes block scalars with chomping and indentation indicators', () => {
    for (const head of ['|', '>', '|-', '>-', '|+', '>+', '|2', '|2-', '|-2', '>+1']) {
      const t = tokenizeYaml(`k: ${head}\n  line: one\n\n  # not a comment\nnext: 1`)
      expect(line(t, 0)).toEqual([['key', 'k'], ['punctuation', ':'], ['operator', head]])
      expect(line(t, 1)).toEqual([['string', 'line: one']])
      expect(t[2]).toEqual([])
      expect(line(t, 3)).toEqual([['string', '# not a comment']])
      expect(line(t, 4)[0]).toEqual(['key', 'next'])
    }
  })
  it('ends a block scalar at a dedent and at a document marker', () => {
    const t = tokenizeYaml('a:\n  b: |\n    x\n  c: 1\nz: |\n  y\n---\nq: 1')
    expect(line(t, 3)[0]).toEqual(['key', 'c'])
    expect(line(t, 6)).toEqual([['punctuation', '---']])
    expect(line(t, 7)[0]).toEqual(['key', 'q'])
  })
  it('supports block scalars for sequence items and a root block scalar', () => {
    const t = tokenizeYaml('- |\n  one\n- b: >\n    two\n')
    expect(line(t, 1)).toEqual([['string', 'one']])
    expect(line(t, 3)).toEqual([['string', 'two']])
    expect(line(tokenizeYaml('--- |\nroot text\ncol0'), 1)).toEqual([['string', 'root text']])
  })
  it('tokenizes double and single quoted strings with escapes', () => {
    const t = tokenizeYaml('a: "x: \\"q\\" \\n"\nb: \'it\'\'s\'\n"quoted key": 1\n\'k2\': 2')
    expect(line(t, 0)[2]).toEqual(['string', '"x: \\"q\\" \\n"'])
    expect(line(t, 1)[2]).toEqual(['string', "'it''s'"])
    expect(line(t, 2)[0]).toEqual(['key', '"quoted key"'])
    expect(line(t, 3)[0]).toEqual(['key', "'k2'"])
  })
  it('continues quoted strings across lines and recovers after them', () => {
    const t = tokenizeYaml('a: "one\n  two\n  three" # tail\nb: \'x\ny\'\nc: 1')
    expect(line(t, 0)[2]).toEqual(['string', '"one'])
    expect(line(t, 1)).toEqual([['string', '  two']])
    expect(line(t, 2)).toEqual([['string', '  three"'], ['comment', '# tail']])
    expect(line(t, 5)[0]).toEqual(['key', 'c'])
    expect(types(tokenizeYaml('a: "never closed\nmore'))).toEqual(new Set(['key', 'punctuation', 'string', 'plain']))
  })
  it('tokenizes flow collections, including nested and multi-line ones', () => {
    const t = tokenizeYaml('a: [1, "b", {k: v, n: null}, c: d]\nb: {x: 1,\n  y: [2, 3]}\nc: 1')
    expect(line(t, 0).map((p) => p[1]).join('')).toBe('a:[1,"b",{k:v,n:null},c:d]')
    expect(line(t, 0).find((p) => p[1] === 'k')).toEqual(['key', 'k'])
    expect(line(t, 0).find((p) => p[1] === 'n')).toEqual(['key', 'n'])
    expect(line(t, 0).find((p) => p[1] === 'null')).toEqual(['constant', 'null'])
    expect(line(t, 1).find((p) => p[1] === 'x')).toEqual(['key', 'x'])
    expect(line(t, 2)[0]).toEqual(['key', 'y'])
    expect(line(t, 3)[0]).toEqual(['key', 'c'])
    expect(joined(tokenizeYaml(']}'))).toEqual([']}'])
  })
  it('handles complex keys, stray colons, a lone dash and trailing whitespace', () => {
    const t = tokenizeYaml('? complex\n: value\n-\n- \na: b   \n- x #c')
    expect(line(t, 0)).toEqual([['punctuation', '?'], ['string', 'complex']])
    expect(line(t, 1)).toEqual([['punctuation', ':'], ['string', 'value']])
    expect(line(t, 2)).toEqual([['punctuation', '-']])
    expect(line(t, 4)).toEqual([['key', 'a'], ['punctuation', ':'], ['string', 'b']])
    expect(line(t, 5)).toEqual([['punctuation', '-'], ['string', 'x'], ['comment', '#c']])
  })
  it('handles tabs, CRLF, unicode and unterminated constructs without throwing', () => {
    expect(line(tokenizeYaml('k:\tv'))[2]).toEqual(['string', 'v'])
    expect(tokenizeYaml('a: 1\r\nb: 2')).toHaveLength(2)
    expect(line(tokenizeYaml('ключ: значение'))).toEqual([['key', 'ключ'], ['punctuation', ':'], ['string', 'значение']])
    expect(joined(tokenizeYaml('k: |'))).toEqual(['k: |'])
    expect(joined(tokenizeYaml(':'))).toEqual([':'])
    expect(joined(tokenizeYaml('{'))).toEqual(['{'])
  })
  it('handles an extremely long single line', () => {
    const long = `a: ${'word '.repeat(40000)}`
    const start = performance.now()
    expect(tokenizeYaml(long)).toHaveLength(1)
    expect(performance.now() - start).toBeLessThan(1500)
  })
})

describe('go tokenizer', () => {
  it('classifies keywords, predeclared types, constants and builtins', () => {
    const t = tokenizeGo('var x int = nil; y := make([]byte, len(z)); ok := true')
    const flat = t[0].map((x) => [x.type, x.text])
    expect(flat).toContainEqual(['keyword', 'var'])
    expect(flat).toContainEqual(['type', 'int'])
    expect(flat).toContainEqual(['constant', 'nil'])
    expect(flat).toContainEqual(['function', 'make'])
    expect(flat).toContainEqual(['type', 'byte'])
    expect(flat).toContainEqual(['function', 'len'])
    expect(flat).toContainEqual(['constant', 'true'])
    expect(line(tokenizeGo('iota error any rune uint8 float64 string bool'))).toEqual(
      [['constant', 'iota'], ...['error', 'any', 'rune', 'uint8', 'float64', 'string', 'bool'].map((w): Pair => ['type', w])],
    )
  })
  it('does not colour builtins that are not called', () => {
    expect(line(tokenizeGo('len := 3'))[0]).toEqual(['plain', 'len'])
    expect(line(tokenizeGo('panic(x)'))[0]).toEqual(['function', 'panic'])
  })
  it('names functions after func, before a call, and types after type and package', () => {
    expect(line(tokenizeGo('func Handle[T any](x T) {'))[1]).toEqual(['function', 'Handle'])
    expect(line(tokenizeGo('func (s *Server) Serve() error {')).find((p) => p[1] === 'Serve')).toEqual(['function', 'Serve'])
    expect(line(tokenizeGo('s.Handle (w)')).find((p) => p[1] === 'Handle')).toEqual(['function', 'Handle'])
    expect(line(tokenizeGo('type User struct {'))).toEqual([['keyword', 'type'], ['type', 'User'], ['keyword', 'struct'], ['punctuation', '{']])
    expect(line(tokenizeGo('package main'))).toEqual([['keyword', 'package'], ['type', 'main']])
    expect(line(tokenizeGo('if (x) {'))[0]).toEqual(['keyword', 'if'])
  })
  it('colours the first identifier of each line inside type ( ... ) blocks', () => {
    const t = tokenizeGo('type (\n\tID int64\n\tName string\n)\nvar after = 1')
    expect(line(t, 1)).toEqual([['type', 'ID'], ['type', 'int64']])
    expect(line(t, 2)).toEqual([['type', 'Name'], ['type', 'string']])
    expect(line(t, 4)[1]).toEqual(['plain', 'after'])
  })
  it('tokenizes interpreted strings, runes and escapes', () => {
    expect(line(tokenizeGo('s := "a\\"b\\n" + \'\\\'\' + \'x\''))).toEqual([
      ['plain', 's'], ['operator', ':='], ['string', '"a\\"b\\n"'], ['operator', '+'], ['string', "'\\''"], ['operator', '+'], ['string', "'x'"],
    ])
    expect(line(tokenizeGo('"unterminated'))).toEqual([['string', '"unterminated']])
  })
  it('tokenizes raw strings across lines and struct tags', () => {
    const t = tokenizeGo('x := `a\nb` + "c"\nName string `json:"name"`')
    expect(line(t, 0)[2]).toEqual(['string', '`a'])
    expect(line(t, 1)).toEqual([['string', 'b`'], ['operator', '+'], ['string', '"c"']])
    expect(line(t, 2)[2]).toEqual(['string', '`json:"name"`'])
    expect(types(tokenizeGo('`never closed\nstill raw'))).toEqual(new Set(['string']))
  })
  it('tokenizes line comments, directives and block comments', () => {
    const t = tokenizeGo('//go:build linux\n//nolint:errcheck\nx := 1 // tail\n/* a\nb */ y /* c */ := 2\n/* open')
    expect(line(t, 0)).toEqual([['comment', '//go:build linux']])
    expect(line(t, 1)).toEqual([['comment', '//nolint:errcheck']])
    expect(line(t, 2).at(-1)).toEqual(['comment', '// tail'])
    expect(line(t, 3)).toEqual([['comment', '/* a']])
    expect(line(t, 4)).toEqual([['comment', 'b */'], ['plain', 'y'], ['comment', '/* c */'], ['operator', ':='], ['number', '2']])
    expect(line(t, 5)).toEqual([['comment', '/* open']])
  })
  it('tokenizes every number form', () => {
    for (const n of ['42', '0', '1_000', '0x1F_FF', '0XAB', '0b1010', '0B1', '0o17', '017', '3.14', '.5', '6.02e23', '1E-9', '2i', '1.5i', '0x1p-2', '0x1.8p3']) {
      expect(line(tokenizeGo(`x = ${n}`)).at(-1), n).toEqual(['number', n])
    }
  })
  it('does not read a selector as a fractional number', () => {
    expect(line(tokenizeGo('a.b[0].c'))).toEqual([['plain', 'a'], ['punctuation', '.'], ['plain', 'b'], ['punctuation', '['], ['number', '0'], ['punctuation', '].'], ['plain', 'c']])
  })
  it('tokenizes operators including :=, <-, ..., &^ and compound forms', () => {
    for (const op of [':=', '<-', '...', '&^', '&^=', '<<=', '>>=', '&&', '||', '++', '--', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>', '+', '-', '*', '/', '%', '&', '|', '^', '<', '>', '=', '!', '~']) {
      expect(line(tokenizeGo(`a ${op} b`))[1], op).toEqual(['operator', op])
    }
  })
  it('tokenizes import blocks and paths', () => {
    const t = tokenizeGo('import (\n\t"fmt"\n\tlog "log/slog"\n\t_ "embed"\n)')
    expect(line(t, 1)).toEqual([['string', '"fmt"']])
    expect(line(t, 2)).toEqual([['plain', 'log'], ['string', '"log/slog"']])
    expect(line(t, 4)).toEqual([['punctuation', ')']])
  })
  it('handles unicode identifiers, tabs, CRLF and a stray character', () => {
    expect(line(tokenizeGo('变量 := "é"'))[0]).toEqual(['plain', '变量'])
    expect(tokenizeGo('a\r\nb')).toHaveLength(2)
    expect(line(tokenizeGo('@'))).toEqual([['plain', '@']])
    expect(line(tokenizeGo('1.'))).toEqual([['number', '1.']])
  })
  it('handles an extremely long single line', () => {
    const long = 'x := ' + Array.from({ length: 20000 }, (_, i) => `f(${i})`).join(' + ')
    const start = performance.now()
    expect(tokenizeGo(long)).toHaveLength(1)
    expect(performance.now() - start).toBeLessThan(1500)
  })
})

describe('toml tokenizer', () => {
  it('tokenizes comments, keys, strings, numbers and booleans', () => {
    const t = tokenizeToml('# c\ntitle = "x" # t\nn = 1_000\nf = -3.5e2\nh = 0xFF\nb = true\nl = \'lit\'\ninf = +inf\nq."a b".c = 1')
    expect(line(t, 0)).toEqual([['comment', '# c']])
    expect(line(t, 1)).toEqual([['key', 'title'], ['operator', '='], ['string', '"x"'], ['comment', '# t']])
    expect(line(t, 2)[2]).toEqual(['number', '1_000'])
    expect(line(t, 3)[2]).toEqual(['number', '-3.5e2'])
    expect(line(t, 4)[2]).toEqual(['number', '0xFF'])
    expect(line(t, 5)[2]).toEqual(['constant', 'true'])
    expect(line(t, 6)[2]).toEqual(['string', "'lit'"])
    expect(line(t, 7)[2]).toEqual(['number', '+inf'])
    expect(line(t, 8)[0]).toEqual(['key', 'q."a b".c'])
  })
  it('tokenizes table and array-table headers', () => {
    const t = tokenizeToml('[server.tls] # h\n[[products]]\n  [ spaced ]')
    expect(line(t, 0)).toEqual([['punctuation', '['], ['type', 'server.tls'], ['punctuation', ']'], ['comment', '# h']])
    expect(line(t, 1)).toEqual([['punctuation', '[['], ['type', 'products'], ['punctuation', ']]']])
    expect(line(t, 2)[1]).toEqual(['type', ' spaced '])
  })
  it('tokenizes dates and times as numbers', () => {
    const t = tokenizeToml('a = 1979-05-27T07:32:00Z\nb = 1979-05-27\nc = 07:32:00.5\nd = 1979-05-27 07:32:00-08:00')
    for (let i = 0; i < 4; i++) expect(line(t, i)[2][0]).toBe('number')
    expect(line(t, 3)[2][1]).toBe('1979-05-27 07:32:00-08:00')
  })
  it('tokenizes inline tables and arrays, including multi-line arrays that look like headers', () => {
    const t = tokenizeToml('p = { x = 1, y = "s" }\narr = [\n  [1, 2],\n  3\n]\n[real]')
    expect(line(t, 0).filter((x) => x[0] === 'key')).toEqual([['key', 'p'], ['key', 'x'], ['key', 'y']])
    expect(line(t, 2)[0]).toEqual(['punctuation', '['])
    expect(line(t, 5)[1]).toEqual(['type', 'real'])
  })
  it('tokenizes multi-line basic and literal strings', () => {
    const t = tokenizeToml('a = """\nline "quoted"\nend""" # c\nb = \'\'\'\nraw \\n\n\'\'\'\nc = 1\nd = """one line"""')
    expect(line(t, 0)).toEqual([['key', 'a'], ['operator', '='], ['string', '"""']])
    expect(line(t, 1)).toEqual([['string', 'line "quoted"']])
    expect(line(t, 2)).toEqual([['string', 'end"""'], ['comment', '# c']])
    expect(line(t, 4)).toEqual([['string', 'raw \\n']])
    expect(line(t, 6)[0]).toEqual(['key', 'c'])
    expect(line(t, 7)[2]).toEqual(['string', '"""one line"""'])
    expect(types(tokenizeToml('x = """never\nclosed'))).toEqual(new Set(['key', 'operator', 'string', 'plain']))
  })
  it('handles escapes, unterminated strings, bare words and strange input', () => {
    expect(line(tokenizeToml('a = "x\\"y"'))[2]).toEqual(['string', '"x\\"y"'])
    expect(line(tokenizeToml('a = "oops'))[2]).toEqual(['string', '"oops'])
    expect(line(tokenizeToml('a = bare'))[2]).toEqual(['plain', 'bare'])
    expect(line(tokenizeToml('a = @'))[2]).toEqual(['plain', '@'])
    expect(tokenizeToml('a = 1\r\nb = 2')).toHaveLength(2)
    expect(line(tokenizeToml('ключ = "é"'))[1]).toEqual(['operator', '='])
    expect(joined(tokenizeToml(']]]'))).toEqual([']]]'])
  })
  it('handles an extremely long single line', () => {
    const long = `a = [${Array.from({ length: 20000 }, (_, i) => i).join(', ')}]`
    const start = performance.now()
    expect(tokenizeToml(long)).toHaveLength(1)
    expect(performance.now() - start).toBeLessThan(1500)
  })
})

describe('shell tokenizer', () => {
  it('tokenizes comments, shebang and prompts', () => {
    const t = tokenizeShell('#!/usr/bin/env bash\n$ kubectl get pods # list\n  $ ls')
    expect(line(t, 0)).toEqual([['comment', '#!/usr/bin/env bash']])
    expect(line(t, 1)).toEqual([['punctuation', '$'], ['function', 'kubectl'], ['plain', 'get pods'], ['comment', '# list']])
    expect(line(t, 2)).toEqual([['punctuation', '$'], ['function', 'ls']])
  })
  it('does not start a comment in the middle of a word', () => {
    expect(line(tokenizeShell('echo a#b'))).toEqual([['function', 'echo'], ['plain', 'a#b']])
  })
  it('tokenizes commands, flags, numbers and arguments', () => {
    expect(line(tokenizeShell('docker run --rm -p 8080 -v=x name'))).toEqual([
      ['function', 'docker'], ['plain', 'run'], ['tag', '--rm'], ['tag', '-p'], ['number', '8080'], ['tag', '-v'], ['operator', '='], ['plain', 'x name'],
    ])
  })
  it('tokenizes quotes with escapes and single quotes without escapes', () => {
    expect(line(tokenizeShell('echo "a \\" b" \'c\\\' d'))).toEqual([['function', 'echo'], ['string', '"a \\" b"'], ['string', "'c\\'"], ['plain', 'd']])
  })
  it('continues quoted strings across lines', () => {
    const t = tokenizeShell('echo "multi\nline" | grep x\nls \'a\nb\'')
    expect(line(t, 0)[1]).toEqual(['string', '"multi'])
    expect(line(t, 1)).toEqual([['string', 'line"'], ['operator', '|'], ['function', 'grep'], ['plain', 'x']])
    expect(line(t, 3)).toEqual([['string', "b'"]])
    expect(types(tokenizeShell('echo "never\nclosed'))).toEqual(new Set(['function', 'plain', 'string']))
  })
  it('tokenizes variables, expansions and command substitution', () => {
    expect(line(tokenizeShell('echo $HOME ${USER:-x} $1 $@ $? $(date)'))).toEqual([
      ['function', 'echo'], ['constant', '$HOME'], ['constant', '${USER:-x}'], ['constant', '$1'], ['constant', '$@'], ['constant', '$?'], ['operator', '$('], ['function', 'date'], ['punctuation', ')'],
    ])
    expect(line(tokenizeShell('echo $'))).toEqual([['function', 'echo'], ['plain', '$']])
  })
  it('tokenizes keywords and command position after them', () => {
    const t = tokenizeShell('if [ -z "$X" ]; then echo ok; fi\nfor f in *.go; do go test; done\ncase $x in a) ;; esac')
    expect(line(t, 0).filter((x) => x[0] === 'keyword').map((x) => x[1])).toEqual(['if', 'then', 'fi'])
    expect(line(t, 0).find((x) => x[1] === 'echo')).toEqual(['function', 'echo'])
    expect(line(t, 1).find((x) => x[1] === 'go')).toEqual(['function', 'go'])
    expect(line(t, 1).find((x) => x[1] === 'f')).toEqual(['plain', 'f'])
    expect(line(t, 2).filter((x) => x[0] === 'keyword').map((x) => x[1])).toEqual(['case', 'in', 'esac'])
    expect(line(tokenizeShell('! false'))[0]).toEqual(['keyword', '!'])
  })
  it('tokenizes environment assignments before a command', () => {
    expect(line(tokenizeShell('A=1 B+="x" C=$D run --go'))).toEqual([
      ['key', 'A'], ['operator', '='], ['plain', '1'], ['key', 'B'], ['operator', '+='], ['string', '"x"'], ['key', 'C'], ['operator', '='], ['constant', '$D'], ['function', 'run'], ['tag', '--go'],
    ])
    expect(line(tokenizeShell('echo A=1'))).toEqual([['function', 'echo'], ['plain', 'A'], ['operator', '='], ['number', '1']])
  })
  it('tokenizes pipes, lists, redirections and grouping', () => {
    expect(line(tokenizeShell('a | b && c || d; e & f > out 2>&1 < input >> log'))).toEqual([
      ['function', 'a'], ['operator', '|'], ['function', 'b'], ['operator', '&&'], ['function', 'c'], ['operator', '||'], ['function', 'd'], ['operator', ';'], ['function', 'e'], ['operator', '&'],
      ['function', 'f'], ['operator', '>'], ['plain', 'out'], ['number', '2'], ['operator', '>&1'], ['operator', '<'], ['plain', 'input'], ['operator', '>>'], ['plain', 'log'],
    ])
    expect(line(tokenizeShell('(cd x) { ls; }')).filter((x) => x[0] === 'punctuation').map((x) => x[1])).toEqual(['(', ')', '{', '}'])
    expect(line(tokenizeShell('x=`date`'))[0]).toEqual(['key', 'x'])
  })
  it('handles line continuation', () => {
    const t = tokenizeShell('docker run \\\n  --rm \\\n  image')
    expect(line(t, 0)).toEqual([['function', 'docker'], ['plain', 'run'], ['punctuation', '\\']])
    expect(line(t, 1)).toEqual([['tag', '--rm'], ['punctuation', '\\']])
    expect(line(t, 2)).toEqual([['plain', 'image']])
  })
  it('tokenizes heredocs with quoted, dashed and plain delimiters', () => {
    const t = tokenizeShell('cat <<EOF > f\nhello $x\nEOF\ncat <<-"END"\n\tbody\n\tEND\ncat <<\'Q\'\nq\nQ\necho after\ncat <<< "here string"')
    expect(line(t, 1)).toEqual([['string', 'hello $x']])
    expect(line(t, 2)).toEqual([['constant', 'EOF']])
    expect(line(t, 4)).toEqual([['string', '\tbody']])
    expect(line(t, 5)).toEqual([['constant', '\tEND']])
    expect(line(t, 7)).toEqual([['string', 'q']])
    expect(line(t, 9)[0]).toEqual(['function', 'echo'])
    expect(line(t, 10)).toEqual([['function', 'cat'], ['operator', '<<<'], ['string', '"here string"']])
  })
  it('handles unicode, tabs, CRLF and a stray character', () => {
    expect(line(tokenizeShell('echo é\t"ü"'))).toEqual([['function', 'echo'], ['plain', 'é'], ['string', '"ü"']])
    expect(tokenizeShell('a\r\nb')).toHaveLength(2)
    expect(line(tokenizeShell('@'))).toEqual([['function', '@']])
  })
  it('handles an extremely long single line', () => {
    const long = `echo ${Array.from({ length: 20000 }, (_, i) => `a${i}`).join(' ')}`
    const start = performance.now()
    expect(tokenizeShell(long)).toHaveLength(1)
    expect(performance.now() - start).toBeLessThan(1500)
  })
})
