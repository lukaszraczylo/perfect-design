import type { Block, ParseOptions, Root } from './ast'
import { inlineToText } from './inline'
import { parseMarkdown } from './parse'

function blocksToText(blocks: Block[], out: string[]): void {
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
        out.push(inlineToText(block.children).trim())
        break
      case 'blockquote':
        blocksToText(block.children, out)
        break
      case 'list':
        for (const item of block.children) blocksToText(item.children, out)
        break
      case 'code':
        out.push(block.value)
        break
      case 'table':
        out.push(block.head.map((c) => inlineToText(c)).join(' '))
        for (const row of block.rows) out.push(row.map((c) => inlineToText(c)).join(' '))
        break
      case 'thematicBreak':
        break
    }
  }
}

/**
 * Plain text of a document for search indexes and summaries: no markup, one line per paragraph, heading,
 * list item, code line group and table row. Links keep their label, images their alt text, raw HTML stays as typed.
 */
export function renderMarkdownToText(input: string | Root, options: ParseOptions = {}): string {
  const root = typeof input === 'string' ? parseMarkdown(input, options) : input
  const lines: string[] = []
  blocksToText(root.children, lines)
  return lines.filter((l) => l !== '').join('\n')
}
