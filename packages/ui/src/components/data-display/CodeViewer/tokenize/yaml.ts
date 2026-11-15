import { push, splitLines, type Token, type TokenLines } from './types'

const isWs = (c: string | undefined): boolean => c === ' ' || c === '\t'
const isEnd = (c: string | undefined): boolean => c === undefined || isWs(c)
const BLOCK_HEADER = /^[|>](?:[+-]?\d?|\d[+-])(?=\s|$)/
const NUMBER = /^(?:[-+]?(?:\d[\d_]*)(?:\.[\d_]*)?(?:[eE][-+]?\d+)?|[-+]?\.\d+(?:[eE][-+]?\d+)?|0x[0-9a-fA-F_]+|0o[0-7_]+|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN))$/
const CONSTANT = /^(?:~|null|Null|NULL|true|True|TRUE|false|False|FALSE)$/

/** Scan a quoted scalar body from `from` (just after the opening quote, or line start when continuing). Returns the index after the closing quote, or -1 when unterminated. */
function scanQuote(line: string, from: number, q: '"' | "'"): number {
  let j = from
  while (j < line.length) {
    const c = line[j]
    if (q === '"' && c === '\\') j += 2
    else if (c === q) {
      if (q === "'" && line[j + 1] === "'") j += 2
      else return j + 1
    } else j++
  }
  return -1
}

/** End of a plain scalar starting at `i`: stops before ` #`, before `:` + blank (or flow delimiter) and, inside flow collections, before `,[]{}`. */
function scanPlain(line: string, i: number, flow: boolean): number {
  let j = i
  while (j < line.length) {
    const c = line[j]
    if (c === '#' && j > i && isWs(line[j - 1])) break
    if (c === ':' && (isEnd(line[j + 1]) || (flow && ',]}'.includes(line[j + 1])))) break
    if (flow && ',[]{}'.includes(c)) break
    j++
  }
  return j
}

function classify(text: string): 'constant' | 'number' | 'string' {
  if (CONSTANT.test(text)) return 'constant'
  if (NUMBER.test(text)) return 'number'
  return 'string'
}

/**
 * YAML tokenizer. Line oriented with state for block scalars and multi-line quoted scalars.
 * Models documents, comments, keys, anchors, aliases, tags, block scalars, flow collections and quoted escapes.
 */
export function tokenizeYaml(source: string): TokenLines {
  let block: number | null = null
  let quote: '"' | "'" | null = null
  let flow = 0
  return splitLines(source).map((line) => {
    const out: Token[] = []
    let i = 0
    const isMarker = (line.startsWith('---') || line.startsWith('...')) && isEnd(line[3])
    if (block !== null) {
      let ind = 0
      while (isWs(line[ind])) ind++
      if (!isMarker && (ind === line.length || ind > block)) {
        push(out, 'plain', line.slice(0, ind))
        push(out, 'string', line.slice(ind))
        return out
      }
      block = null
    }
    if (quote) {
      const end = scanQuote(line, 0, quote)
      if (end < 0) {
        push(out, 'string', line)
        return out
      }
      push(out, 'string', line.slice(0, end))
      i = end
      quote = null
    } else if (line[0] === '%') {
      const hash = line.search(/\s#/)
      if (hash < 0) push(out, 'keyword', line)
      else {
        const rest = line.slice(hash)
        const text = rest.trimStart()
        push(out, 'keyword', line.slice(0, hash))
        push(out, 'plain', rest.slice(0, rest.length - text.length))
        push(out, 'comment', text)
      }
      return out
    } else if (isMarker && flow === 0) {
      push(out, 'punctuation', line.slice(0, 3))
      i = 3
    }
    let expectKey = flow === 0 && !isMarker
    let base = isMarker ? -1 : 0
    if (i === 0) {
      while (isWs(line[i])) i++
      push(out, 'plain', line.slice(0, i))
      base = i
    }
    while (i < line.length) {
      const c = line[i]
      if (isWs(c)) {
        let j = i
        while (isWs(line[j])) j++
        push(out, 'plain', line.slice(i, j))
        i = j
        continue
      }
      if (c === '#' && (i === 0 || isWs(line[i - 1]))) {
        push(out, 'comment', line.slice(i))
        break
      }
      if (flow === 0 && (c === '-' || c === '?') && isEnd(line[i + 1])) {
        push(out, 'punctuation', c)
        if (c === '-') base = i
        i++
        continue
      }
      if (c === '&' || c === '*') {
        let j = i + 1
        while (j < line.length && !isWs(line[j]) && !',[]{}'.includes(line[j])) j++
        push(out, 'anchor', line.slice(i, j))
        i = j
        continue
      }
      if (c === '!') {
        let j = i + 1
        if (line[j] === '<') {
          const close = line.indexOf('>', j)
          j = close < 0 ? line.length : close + 1
        } else while (j < line.length && !isWs(line[j]) && !',[]{}'.includes(line[j])) j++
        push(out, 'tag', line.slice(i, j))
        i = j
        continue
      }
      if (flow === 0 && (c === '|' || c === '>')) {
        const m = BLOCK_HEADER.exec(line.slice(i, i + 8))
        if (m) {
          push(out, 'operator', m[0])
          i += m[0].length
          block = base
          expectKey = false
          continue
        }
      }
      if (c === '{' || c === '[') {
        flow++
        push(out, 'punctuation', c)
        i++
        continue
      }
      if (c === '}' || c === ']') {
        flow = Math.max(0, flow - 1)
        push(out, 'punctuation', c)
        i++
        continue
      }
      if (flow > 0 && c === ',') {
        push(out, 'punctuation', c)
        i++
        continue
      }
      if (c === ':' && (isEnd(line[i + 1]) || (flow > 0 && ',]}'.includes(line[i + 1])))) {
        push(out, 'punctuation', c)
        expectKey = false
        i++
        continue
      }
      const canKey = expectKey || flow > 0
      let end: number
      let text: string
      let isQuoted = false
      if (c === '"' || c === "'") {
        const close = scanQuote(line, i + 1, c)
        if (close < 0) {
          push(out, 'string', line.slice(i))
          quote = c
          break
        }
        end = close
        text = line.slice(i, end)
        isQuoted = true
      } else {
        end = scanPlain(line, i, flow > 0)
        let e = end
        while (e > i && isWs(line[e - 1])) e--
        text = line.slice(i, e)
        end = e
        if (!text) {
          push(out, 'plain', c)
          i++
          continue
        }
      }
      let k = end
      while (isWs(line[k])) k++
      const colon = line[k] === ':' && (isEnd(line[k + 1]) || (flow > 0 && ',]}'.includes(line[k + 1])))
      if (colon && canKey) {
        push(out, text === '<<' ? 'operator' : 'key', text)
        if (flow === 0) base = i
        expectKey = false
      } else push(out, isQuoted ? 'string' : classify(text), text)
      i = end
    }
    return out
  })
}
