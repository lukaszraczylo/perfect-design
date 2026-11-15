/**
 * AST produced by `parseMarkdown`. Plain data only: no functions, no HTML strings. Renderers walk it and
 * build elements, so no markup from the source can ever reach the DOM unescaped.
 */
export type Align = 'left' | 'center' | 'right' | null

export interface TextNode {
  type: 'text'
  value: string
}
export interface InlineCodeNode {
  type: 'inlineCode'
  value: string
}
export interface EmphasisNode {
  type: 'emphasis'
  children: Inline[]
}
export interface StrongNode {
  type: 'strong'
  children: Inline[]
}
export interface DeleteNode {
  type: 'delete'
  children: Inline[]
}
export interface LinkNode {
  type: 'link'
  /** Raw destination from the source (entities and escapes decoded). Not yet checked: use `sanitizeUrl`. */
  url: string
  title: string | null
  children: Inline[]
  /** `<url>` or a bare URL: the label is the URL itself. */
  autolink?: boolean
}
export interface ImageNode {
  type: 'image'
  url: string
  title: string | null
  /** Plain-text description. */
  alt: string
}
/** Hard line break (two trailing spaces or a trailing backslash). */
export interface BreakNode {
  type: 'break'
}
/** Newline inside a paragraph. */
export interface SoftBreakNode {
  type: 'softbreak'
}
export type Inline = TextNode | InlineCodeNode | EmphasisNode | StrongNode | DeleteNode | LinkNode | ImageNode | BreakNode | SoftBreakNode

export interface ParagraphNode {
  type: 'paragraph'
  children: Inline[]
}
export interface HeadingNode {
  type: 'heading'
  depth: 1 | 2 | 3 | 4 | 5 | 6
  children: Inline[]
}
export interface BlockquoteNode {
  type: 'blockquote'
  children: Block[]
}
export interface ListItemNode {
  type: 'listItem'
  /** `null` for a normal item, `true`/`false` for a task list item. */
  checked: boolean | null
  children: Block[]
}
export interface ListNode {
  type: 'list'
  ordered: boolean
  /** First number of an ordered list; `null` for bullet lists. */
  start: number | null
  /** Tight lists render item paragraphs without `<p>`. */
  tight: boolean
  children: ListItemNode[]
}
export interface CodeNode {
  type: 'code'
  /** Whole info string of a fence (empty for indented code). */
  info: string
  /** First word of the info string, or `null`. */
  lang: string | null
  /** Rest of the info string, or `null`. */
  meta: string | null
  value: string
  /** `false` for a fence that ran to the end of the input without a closing fence. */
  closed: boolean
}
export interface ThematicBreakNode {
  type: 'thematicBreak'
}
export interface TableNode {
  type: 'table'
  align: Align[]
  head: Inline[][]
  rows: Inline[][][]
}
export type Block = ParagraphNode | HeadingNode | BlockquoteNode | ListNode | CodeNode | ThematicBreakNode | TableNode

export interface Root {
  type: 'root'
  children: Block[]
  /** Input exceeded `maxLength`: the content is unformatted text (one paragraph, `plain` set). */
  plain?: boolean
}

export interface ParseOptions {
  /** Maximum container nesting (block quotes, lists) and inline nesting. Deeper markers stay literal text. Default 32, clamped to 1..100. */
  maxDepth?: number
  /** Inputs longer than this many UTF-16 units are returned as one plain-text paragraph. Default 1 000 000. */
  maxLength?: number
  /** The text is still arriving: close dangling emphasis, code spans, links and table rows in the last block instead of showing raw syntax. */
  streaming?: boolean
  /** Parse only inline syntax (one paragraph); no block structure. */
  inline?: boolean
}

export const DEFAULT_MAX_DEPTH = 32
export const DEFAULT_MAX_LENGTH = 1_000_000
