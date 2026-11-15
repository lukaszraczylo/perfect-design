export const TOKEN_TYPES = ['keyword', 'string', 'number', 'comment', 'type', 'function', 'key', 'punctuation', 'operator', 'constant', 'anchor', 'tag', 'plain'] as const
export type TokenType = (typeof TOKEN_TYPES)[number]

export interface Token {
  type: TokenType
  text: string
}

export const CODE_LANGUAGES = ['json', 'yaml', 'go', 'toml', 'shell', 'plain'] as const
export type CodeLanguage = (typeof CODE_LANGUAGES)[number]

/** One token array per source line. Concatenating the `text` of a line's tokens always reproduces the line. */
export type TokenLines = Token[][]

/** Split source into lines, accepting LF, CRLF and lone CR. A trailing newline does not add an empty last line. */
export function splitLines(source: string): string[] {
  const text = String(source ?? '').replace(/\r\n?/g, '\n')
  const lines = text.split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines
}

/** Push a token, merging into the previous one when the type matches. Empty text is skipped. */
export function push(out: Token[], type: TokenType, text: string): void {
  if (!text) return
  const last = out[out.length - 1]
  if (last && last.type === type) last.text += text
  else out.push({ type, text })
}

export const isDigit = (c: string | undefined): boolean => c !== undefined && c >= '0' && c <= '9'
export const isIdentStart = (c: string | undefined): boolean => c !== undefined && /[\p{L}_]/u.test(c)
export const isIdentPart = (c: string | undefined): boolean => c !== undefined && /[\p{L}\p{N}_]/u.test(c)

/** Match a sticky (`y`) regex at index `i`; returns the matched text or null. */
export function at(re: RegExp, line: string, i: number): string | null {
  re.lastIndex = i
  const m = re.exec(line)
  return m ? m[0] : null
}
