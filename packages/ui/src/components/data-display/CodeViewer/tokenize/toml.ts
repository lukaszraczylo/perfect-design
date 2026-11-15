import { at, push, splitLines, type Token, type TokenLines } from './types'

const KEY = /(?:[A-Za-z0-9_-]+|"(?:[^"\\]|\\.)*"|'[^']*')(?:[ \t]*\.[ \t]*(?:[A-Za-z0-9_-]+|"(?:[^"\\]|\\.)*"|'[^']*'))*(?=[ \t]*=)/y
const DATE = /\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})?)?|\d{2}:\d{2}:\d{2}(?:\.\d+)?/y
const NUMBER = /[+-]?(?:0x[0-9a-fA-F_]+|0o[0-7_]+|0b[01_]+|inf|nan|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?)/y
const WORD = /[A-Za-z_][A-Za-z0-9_-]*/y
const HEADER = /^(\s*)(\[\[?)([^\]\n]*?)(\]\]?)(\s*)(#.*)?$/

/** End of a basic or literal single-line string starting at `i`; unterminated strings run to the end of the line. */
function scanString(line: string, i: number, q: string): number {
  let j = i + 1
  while (j < line.length) {
    if (q === '"' && line[j] === '\\') j += 2
    else if (line[j] === q) return j + 1
    else j++
  }
  return line.length
}

/** End (exclusive) of a multi-line string body from `from`, or -1 when the closing delimiter is not on this line. */
function scanMulti(line: string, from: number, q: string): number {
  let j = from
  const delim = q.repeat(3)
  while (j < line.length) {
    if (q === '"' && line[j] === '\\') j += 2
    else if (line.startsWith(delim, j)) return j + 3
    else j++
  }
  return -1
}

/** TOML tokenizer: tables, dotted keys, strings (including multi-line), numbers, dates, booleans, arrays and inline tables. */
export function tokenizeToml(source: string): TokenLines {
  let multi: '"' | "'" | null = null
  let depth = 0
  return splitLines(source).map((line) => {
    const out: Token[] = []
    let i = 0
    if (multi) {
      const end = scanMulti(line, 0, multi)
      if (end < 0) {
        push(out, 'string', line)
        return out
      }
      push(out, 'string', line.slice(0, end))
      i = end
      multi = null
    } else if (depth === 0) {
      const h = HEADER.exec(line)
      if (h) {
        push(out, 'plain', h[1])
        push(out, 'punctuation', h[2])
        push(out, 'type', h[3])
        push(out, 'punctuation', h[4])
        push(out, 'plain', h[5])
        push(out, 'comment', h[6] ?? '')
        return out
      }
    }
    while (i < line.length) {
      const c = line[i]
      if (c === ' ' || c === '\t') {
        let j = i
        while (line[j] === ' ' || line[j] === '\t') j++
        push(out, 'plain', line.slice(i, j))
        i = j
        continue
      }
      if (c === '#') {
        push(out, 'comment', line.slice(i))
        break
      }
      const key = at(KEY, line, i)
      if (key) {
        push(out, 'key', key)
        i += key.length
        continue
      }
      if (c === '"' || c === "'") {
        if (line.startsWith(c.repeat(3), i)) {
          const end = scanMulti(line, i + 3, c)
          if (end < 0) {
            push(out, 'string', line.slice(i))
            multi = c
            break
          }
          push(out, 'string', line.slice(i, end))
          i = end
        } else {
          const end = scanString(line, i, c)
          push(out, 'string', line.slice(i, end))
          i = end
        }
        continue
      }
      if (c === '=') {
        push(out, 'operator', c)
        i++
        continue
      }
      if ('[]{},.'.includes(c)) {
        if (c === '[') depth++
        else if (c === ']') depth = Math.max(0, depth - 1)
        push(out, 'punctuation', c)
        i++
        continue
      }
      const date = at(DATE, line, i)
      const num = date ?? at(NUMBER, line, i)
      if (num) {
        push(out, 'number', num)
        i += num.length
        continue
      }
      const word = at(WORD, line, i)
      if (word) {
        push(out, word === 'true' || word === 'false' ? 'constant' : 'plain', word)
        i += word.length
        continue
      }
      push(out, 'plain', c)
      i++
    }
    return out
  })
}
