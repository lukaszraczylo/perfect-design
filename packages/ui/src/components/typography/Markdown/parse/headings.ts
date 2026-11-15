import type { Block, HeadingNode, Root } from './ast'
import { inlineToText } from './inline'
import { createSlugger } from './slug'
import { parseMarkdown } from './parse'
import type { ParseOptions } from './ast'

export interface HeadingInfo {
  /** Rendered level after `headingOffset` (1 to 6). */
  level: number
  /** Plain text of the heading. */
  text: string
  /** Unique id used on the element and in `#fragment` links. */
  id: string
}

export interface HeadingOptions {
  /** Added to every heading level; the result is clamped to 6. Default 0, range 0 to 5. */
  headingOffset?: number
  /** Prefix for ids, e.g. `doc` gives `doc-install`. Use it when several documents share a page. */
  idPrefix?: string
}

export function clampOffset(value: unknown): number {
  const n = Math.trunc(Number(value))
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0
}

/** Heading info keyed by node, in document order. Ids are unique within the document. */
export function headingMap(root: Root, options: HeadingOptions = {}): Map<HeadingNode, HeadingInfo> {
  const offset = clampOffset(options.headingOffset)
  const slug = createSlugger(options.idPrefix ?? '')
  const out = new Map<HeadingNode, HeadingInfo>()
  const walk = (blocks: Block[]) => {
    for (const block of blocks) {
      if (block.type === 'heading') {
        const text = inlineToText(block.children).trim()
        out.set(block, { level: Math.min(6, block.depth + offset), text, id: slug(text) })
      } else if (block.type === 'blockquote') walk(block.children)
      else if (block.type === 'list') for (const item of block.children) walk(item.children)
    }
  }
  walk(root.children)
  return out
}

/** Outline of a document for a table of contents: `{ level, text, id }` per heading, in order. Accepts source text or a parsed `Root`. */
export function extractHeadings(input: string | Root, options: HeadingOptions & ParseOptions = {}): HeadingInfo[] {
  const root = typeof input === 'string' ? parseMarkdown(input, options) : input
  return [...headingMap(root, options).values()]
}
