import { at, push, splitLines, type Token, type TokenLines } from './types'

export const SHELL_KEYWORDS = new Set('if then else elif fi for while until do done case esac in function select time'.split(' '))
const AFTER_KEYWORD = new Set(['then', 'do', 'else', 'elif', 'if', 'while', 'until', '!', 'time'])
const VARIABLE = /\$(?:\{[^}\n]*\}?|[A-Za-z_][A-Za-z0-9_]*|[0-9@*#?$!-])/y
const OPERATOR = /&>>?|>>?&?\d*|<<<?-?|<&?|&&|\|\|?&?|;;?&?|&|=/y
const HEREDOC = /<<-?\s*(?:'([^'\n]+)'|"([^"\n]+)"|\\?([A-Za-z_][\w]*))/
const ASSIGN = /[A-Za-z_][A-Za-z0-9_]*\+?=/y
const WORD_STOP = /[\s;|&<>()"'$#`{}=]/

interface Heredoc {
  delim: string
  strip: boolean
}

/** End (exclusive) of a quoted string whose body starts at `from`, or -1 when unterminated on this line. Single quotes have no escapes. */
function closeQuote(line: string, from: number, q: string): number {
  let j = from
  while (j < line.length) {
    if (q === '"' && line[j] === '\\') j += 2
    else if (line[j] === q) return j + 1
    else j++
  }
  return -1
}

/** Shell (sh, bash, zsh) tokenizer: comments, quotes, variables, keywords, commands, flags, redirections and heredocs. */
export function tokenizeShell(source: string): TokenLines {
  let quote: '"' | "'" | null = null
  let heredoc: Heredoc | null = null
  let continued = false
  return splitLines(source).map((line) => {
    const out: Token[] = []
    let i = 0
    if (heredoc) {
      const body = heredoc.strip ? line.replace(/^\t+/, '') : line
      const done = body === heredoc.delim
      push(out, done ? 'constant' : 'string', line)
      if (done) heredoc = null
      return out
    }
    if (quote) {
      const end = closeQuote(line, 0, quote)
      if (end < 0) {
        push(out, 'string', line)
        return out
      }
      push(out, 'string', line.slice(0, end))
      i = end
      quote = null
    }
    let cmd = !continued && i === 0
    continued = false
    if (i === 0 && /^\s*\$ /.test(line)) {
      const ws = line.length - line.trimStart().length
      push(out, 'plain', line.slice(0, ws))
      push(out, 'punctuation', '$')
      i = ws + 1
    }
    let pending: Heredoc | null = null
    let afterAssign = false
    while (i < line.length) {
      const c = line[i]
      if (c === ' ' || c === '\t') {
        let j = i
        while (line[j] === ' ' || line[j] === '\t') j++
        push(out, 'plain', line.slice(i, j))
        i = j
        continue
      }
      if (c === '#' && (i === 0 || /[\s;&|(]/.test(line[i - 1]))) {
        push(out, 'comment', line.slice(i))
        break
      }
      if (c === '\\' && i === line.length - 1) {
        push(out, 'punctuation', c)
        continued = true
        i++
        continue
      }
      if (c === '"' || c === "'") {
        const end = closeQuote(line, i + 1, c)
        if (end < 0) {
          push(out, 'string', line.slice(i))
          quote = c
          break
        }
        push(out, 'string', line.slice(i, end))
        i = end
        if (afterAssign) afterAssign = false
        else cmd = false
        continue
      }
      if (c === '$') {
        const v = at(VARIABLE, line, i)
        if (v) {
          push(out, 'constant', v)
          i += v.length
          if (afterAssign) afterAssign = false
          else cmd = false
          continue
        }
        if (line[i + 1] === '(') {
          push(out, 'operator', '$(')
          i += 2
          cmd = true
          continue
        }
      }
      if (c === '<' && line[i + 1] === '<' && line[i + 2] !== '<') {
        const h = HEREDOC.exec(line.slice(i))
        if (h) pending = { delim: h[1] ?? h[2] ?? h[3], strip: h[0].startsWith('<<-') }
      }
      const op = at(OPERATOR, line, i)
      if (op) {
        push(out, 'operator', op)
        i += op.length
        if (/^(?:\||\|\||&&|;|;;|&)$/.test(op)) cmd = true
        continue
      }
      if ('(){}`'.includes(c)) {
        push(out, 'punctuation', c)
        i++
        if (c === '(' || c === '{' || c === '`') cmd = true
        continue
      }
      if (cmd) {
        const a = at(ASSIGN, line, i)
        if (a) {
          push(out, 'key', a.replace(/\+?=$/, ''))
          push(out, 'operator', a.endsWith('+=') ? '+=' : '=')
          i += a.length
          afterAssign = true
          continue
        }
      }
      let j = i
      while (j < line.length && (j === i || !WORD_STOP.test(line[j]))) j++
      const word = line.slice(i, j)
      i = j
      const wasAssign = afterAssign
      afterAssign = false
      if (SHELL_KEYWORDS.has(word) || word === '!') {
        push(out, 'keyword', word)
        cmd = AFTER_KEYWORD.has(word)
      } else if (wasAssign) {
        push(out, 'plain', word)
      } else if (cmd) {
        push(out, 'function', word)
        cmd = false
      } else if (/^--?[A-Za-z0-9][\w-]*$/.test(word)) push(out, 'tag', word)
      else if (/^[-+]?\d+(?:\.\d+)?$/.test(word)) push(out, 'number', word)
      else push(out, 'plain', word)
    }
    if (pending) heredoc = pending
    return out
  })
}
