import { at, isDigit, isIdentPart, isIdentStart, push, splitLines, type Token, type TokenLines } from './types'

export const GO_KEYWORDS = new Set(
  'break default func interface select case defer go map struct chan else goto package switch const fallthrough if range type continue for import return var'.split(' '),
)
export const GO_CONSTANTS = new Set(['true', 'false', 'nil', 'iota'])
export const GO_TYPES = new Set(
  'any bool byte comparable complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune string uint uint8 uint16 uint32 uint64 uintptr'.split(' '),
)
export const GO_BUILTINS = new Set('append cap clear close complex copy delete imag len make max min new panic print println real recover'.split(' '))

const NUMBER = /0[xX][0-9a-fA-F_]*(?:\.[0-9a-fA-F_]*)?(?:[pP][+-]?\d[\d_]*)?i?|0[bB][01_]+i?|0[oO][0-7_]+i?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?i?/y
const OPERATOR = /&\^=?|<<=?|>>=?|\.\.\.|&&|\|\||<-|\+\+|--|[=!<>:+\-*/%&|^]=|[+\-*/%&|^<>=!~]/y

function scanQuoted(line: string, i: number, q: string): number {
  let j = i + 1
  while (j < line.length) {
    if (line[j] === '\\') j += 2
    else if (line[j] === q) return j + 1
    else j++
  }
  return line.length
}

/** Go tokenizer: keeps state for block comments and raw (backtick) strings that span lines. */
export function tokenizeGo(source: string): TokenLines {
  let inBlock = false
  let inRaw = false
  let typeBlock = false
  return splitLines(source).map((line) => {
    const out: Token[] = []
    let i = 0
    let prev = ''
    let first = true
    if (inBlock) {
      const end = line.indexOf('*/')
      if (end < 0) {
        push(out, 'comment', line)
        return out
      }
      push(out, 'comment', line.slice(0, end + 2))
      i = end + 2
      inBlock = false
    } else if (inRaw) {
      const end = line.indexOf('`')
      if (end < 0) {
        push(out, 'string', line)
        return out
      }
      push(out, 'string', line.slice(0, end + 1))
      i = end + 1
      inRaw = false
    }
    if (typeBlock && /^\s*\)/.test(line)) typeBlock = false
    const typeLine = typeBlock
    while (i < line.length) {
      const c = line[i]
      if (c === ' ' || c === '\t') {
        let j = i
        while (line[j] === ' ' || line[j] === '\t') j++
        push(out, 'plain', line.slice(i, j))
        i = j
        continue
      }
      if (c === '/' && line[i + 1] === '/') {
        push(out, 'comment', line.slice(i))
        break
      }
      if (c === '/' && line[i + 1] === '*') {
        const end = line.indexOf('*/', i + 2)
        if (end < 0) {
          push(out, 'comment', line.slice(i))
          inBlock = true
          break
        }
        push(out, 'comment', line.slice(i, end + 2))
        i = end + 2
        continue
      }
      if (c === '"' || c === "'") {
        const end = scanQuoted(line, i, c)
        push(out, 'string', line.slice(i, end))
        i = end
        first = false
        continue
      }
      if (c === '`') {
        const end = line.indexOf('`', i + 1)
        if (end < 0) {
          push(out, 'string', line.slice(i))
          inRaw = true
          break
        }
        push(out, 'string', line.slice(i, end + 1))
        i = end + 1
        first = false
        continue
      }
      if (isIdentStart(c)) {
        let j = i + 1
        while (isIdentPart(line[j])) j++
        const word = line.slice(i, j)
        let k = j
        while (line[k] === ' ' || line[k] === '\t') k++
        const call = line[k] === '('
        let type: Token['type'] = 'plain'
        if (GO_KEYWORDS.has(word)) type = 'keyword'
        else if (prev === 'func') type = 'function'
        else if (prev === 'type' || prev === 'package' || (typeLine && first)) type = 'type'
        else if (GO_CONSTANTS.has(word)) type = 'constant'
        else if (GO_TYPES.has(word)) type = 'type'
        else if (call) type = 'function'
        if (word === 'type' && /^\s*\($/.test(line.slice(j))) typeBlock = true
        push(out, type, word)
        prev = word
        first = false
        i = j
        continue
      }
      const prevCh = line[i - 1]
      if (isDigit(c) || (c === '.' && isDigit(line[i + 1]) && !(isIdentPart(prevCh) || prevCh === ')' || prevCh === ']'))) {
        const m = at(NUMBER, line, i)
        if (m) {
          push(out, 'number', m)
          i += m.length
          prev = ''
          first = false
          continue
        }
      }
      const op = at(OPERATOR, line, i)
      if (op) {
        push(out, 'operator', op)
        i += op.length
      } else {
        push(out, '()[]{},;.:'.includes(c) ? 'punctuation' : 'plain', c)
        i++
      }
      prev = ''
      first = false
    }
    return out
  })
}
