import { DEFAULT_MAX_DEPTH, DEFAULT_MAX_LENGTH, type ParseOptions, type Root } from './ast'
import { parseBlocks } from './block'
import { parseInline } from './inline'

function plainRoot(text: string): Root {
  return { type: 'root', plain: true, children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }] }
}

function limit(value: unknown, fallback: number, min: number, max: number): number {
  const n = Math.trunc(Number(value))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

/**
 * Parse Markdown (CommonMark plus GFM tables, task lists, strikethrough and bare http(s) autolinks) into an AST.
 * Never throws: oversized or unparseable input comes back as one plain-text paragraph. Raw HTML is kept as literal text.
 */
export function parseMarkdown(source: unknown, options: ParseOptions = {}): Root {
  const text = typeof source === 'string' ? source : source === null || source === undefined ? '' : String(source)
  const maxLength = limit(options.maxLength, DEFAULT_MAX_LENGTH, 0, Number.MAX_SAFE_INTEGER)
  if (text.length > maxLength) return plainRoot(text)
  const maxDepth = limit(options.maxDepth, DEFAULT_MAX_DEPTH, 1, 100)
  try {
    if (options.inline) {
      const flat = text.replace(/\r\n?/g, '\n').replace(/\0/g, '\ufffd').trim()
      return { type: 'root', children: [{ type: 'paragraph', children: parseInline(flat, new Map(), { maxDepth, streaming: !!options.streaming }) }] }
    }
    return parseBlocks(text, { maxDepth, streaming: !!options.streaming })
  } catch {
    return plainRoot(text)
  }
}
