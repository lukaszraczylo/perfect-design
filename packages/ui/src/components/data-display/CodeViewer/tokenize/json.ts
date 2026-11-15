import { at, isDigit, push, splitLines, type Token, type TokenLines } from './types'

/** End index (exclusive) of a double-quoted string starting at `i`; an unterminated string runs to the end of the line. */
export function scanDoubleQuoted(line: string, i: number): number {
  let j = i + 1
  while (j < line.length) {
    if (line[j] === '\\') j += 2
    else if (line[j] === '"') return j + 1
    else j++
  }
  return line.length
}

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
const WORD = /[A-Za-z_$][\w$]*/y

/** JSON with tolerance for JSONC comments (`//`, multi-line block comments) and unquoted words. */
export function tokenizeJson(source: string): TokenLines {
  let inBlock = false
  return splitLines(source).map((line) => {
    const out: Token[] = []
    let i = 0
    if (inBlock) {
      const end = line.indexOf('*/')
      if (end < 0) {
        push(out, 'comment', line)
        return out
      }
      push(out, 'comment', line.slice(0, end + 2))
      i = end + 2
      inBlock = false
    }
    while (i < line.length) {
      const c = line[i]
      if (c === ' ' || c === '\t') {
        let j = i
        while (line[j] === ' ' || line[j] === '\t') j++
        push(out, 'plain', line.slice(i, j))
        i = j
      } else if (c === '"') {
        const end = scanDoubleQuoted(line, i)
        let k = end
        while (line[k] === ' ' || line[k] === '\t') k++
        push(out, line[k] === ':' ? 'key' : 'string', line.slice(i, end))
        i = end
      } else if (c === '/' && line[i + 1] === '/') {
        push(out, 'comment', line.slice(i))
        i = line.length
      } else if (c === '/' && line[i + 1] === '*') {
        const end = line.indexOf('*/', i + 2)
        if (end < 0) {
          push(out, 'comment', line.slice(i))
          inBlock = true
          i = line.length
        } else {
          push(out, 'comment', line.slice(i, end + 2))
          i = end + 2
        }
      } else if ('{}[],:'.includes(c)) {
        push(out, 'punctuation', c)
        i++
      } else if (c === '-' || isDigit(c)) {
        const m = at(NUMBER, line, i)
        if (m) {
          push(out, 'number', m)
          i += m.length
        } else {
          push(out, 'operator', c)
          i++
        }
      } else {
        const m = at(WORD, line, i)
        if (m) {
          push(out, /^(true|false|null)$/.test(m) ? 'constant' : 'plain', m)
          i += m.length
        } else {
          push(out, 'plain', c)
          i++
        }
      }
    }
    return out
  })
}
