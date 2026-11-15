import { splitLines, type TokenLines } from './types'

export function tokenizePlain(source: string): TokenLines {
  return splitLines(source).map((line) => (line ? [{ type: 'plain', text: line }] : []))
}
