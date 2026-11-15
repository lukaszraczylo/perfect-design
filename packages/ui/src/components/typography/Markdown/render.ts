import { h, type Component, type VNode, type VNodeChild } from 'vue'
import CodeViewer from '../../data-display/CodeViewer/CodeViewer.vue'
import CopyButton from '../../data-display/_shared/CopyButton.vue'
import type { Block, CodeNode, HeadingNode, Inline, ListItemNode, ListNode, Root, TableNode } from './parse/ast'
import type { HeadingInfo } from './parse/headings'
import { parseInfo } from './parse/info'
import { inlineToText } from './parse/inline'
import { isExternalUrl, resolveUrl, sanitizeUrl } from './parse/url'
import type { MarkdownCodeProps, MarkdownComponents, MarkdownImageProps, MarkdownLinkProps } from './types'
import { ALIGN_CLASS, headingClass, headingSpace, md, type MarkdownSize } from './variants'

export interface ResolvedOptions {
  headingOffset: number
  headingIds: boolean
  headingAnchors: boolean
  idPrefix: string
  linkTarget?: '_self' | '_blank'
  externalTarget?: '_self' | '_blank'
  baseUrl?: string
  allowedProtocols?: readonly string[]
  highlight: boolean
  codeFold: boolean
  size: MarkdownSize
  components: MarkdownComponents
}

export interface RenderContext {
  o: ResolvedOptions
  headings: Map<HeadingNode, HeadingInfo>
  labels: Map<string, number>
  /** Text of the nearest heading rendered so far: names table regions. */
  heading: string
}

const LANGUAGES: Record<string, 'json' | 'yaml' | 'go' | 'toml' | 'shell' | 'plain'> = {
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  go: 'go',
  golang: 'go',
  toml: 'toml',
  shell: 'shell',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  plain: 'plain',
  text: 'plain',
  txt: 'plain',
}
const LANGUAGE_NAMES = { json: 'JSON', yaml: 'YAML', go: 'Go', toml: 'TOML', shell: 'Shell', plain: 'Plain text' } as const

/** Fresh per render: region labels and the nearest heading are tracked while walking the tree. */
export function createContext(headings: Map<HeadingNode, HeadingInfo>, options: ResolvedOptions): RenderContext {
  return { o: options, headings, labels: new Map(), heading: '' }
}

/** Region names must be unique per page for landmark navigation: a repeat gets ` 2`, ` 3`... */
function unique(ctx: RenderContext, label: string): string {
  const n = (ctx.labels.get(label) ?? 0) + 1
  ctx.labels.set(label, n)
  return n === 1 ? label : `${label} ${n}`
}

/** URL for an `href` or `src`, or `null` when it fails the allow-list (before or after `baseUrl` resolution). */
function safeUrl(raw: string, o: ResolvedOptions, image: boolean): string | null {
  const opts = { image, allowedProtocols: o.allowedProtocols }
  const ok = sanitizeUrl(raw, opts)
  if (ok === null || !o.baseUrl) return ok
  const resolved = resolveUrl(ok, o.baseUrl)
  return resolved === ok ? ok : sanitizeUrl(resolved, opts)
}

function renderLink(node: Extract<Inline, { type: 'link' }>, ctx: RenderContext): VNodeChild[] {
  const children = renderInlines(node.children, ctx)
  const href = safeUrl(node.url, ctx.o, false)
  if (href === null) return children
  const external = isExternalUrl(node.url)
  const wanted = external ? ctx.o.externalTarget : ctx.o.linkTarget
  const blank = wanted === '_blank' && !/^(?:mailto|tel):/i.test(href)
  const rel = external || blank ? 'noopener noreferrer' : undefined
  const props: MarkdownLinkProps = { href, external, ...(node.title ? { title: node.title } : {}), ...(blank ? { target: '_blank' as const } : {}), ...(rel ? { rel } : {}) }
  const label: VNodeChild[] = blank ? [...children, h('span', { class: 'sr-only' }, ' (opens in a new tab)')] : children
  const custom = ctx.o.components.link
  if (custom && typeof custom !== 'string') return [h(custom as Component, props, { default: () => label })]
  const attrs = { href, title: props.title, target: props.target, rel }
  if (custom) return [h(custom, attrs, label)]
  return [h('a', { ...attrs, 'data-slot': 'markdown-link', class: md.link }, label)]
}

function renderImage(node: Extract<Inline, { type: 'image' }>, ctx: RenderContext): VNodeChild[] {
  const src = safeUrl(node.url, ctx.o, true)
  if (src === null) return node.alt ? [node.alt] : []
  const props: MarkdownImageProps = { src, alt: node.alt, ...(node.title ? { title: node.title } : {}) }
  const custom = ctx.o.components.image
  if (custom) return [typeof custom === 'string' ? h(custom, props) : h(custom as Component, props)]
  return [h('img', { ...props, loading: 'lazy', decoding: 'async', 'data-slot': 'markdown-image', class: md.image })]
}

export function renderInlines(nodes: readonly Inline[], ctx: RenderContext): VNodeChild[] {
  const out: VNodeChild[] = []
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        out.push(node.value)
        break
      case 'softbreak':
        out.push('\n')
        break
      case 'break':
        out.push(h('br'))
        break
      case 'inlineCode':
        out.push(h('code', { 'data-slot': 'markdown-inline-code', class: md.inlineCode }, node.value))
        break
      case 'emphasis':
        out.push(h('em', { 'data-slot': 'markdown-emphasis' }, renderInlines(node.children, ctx)))
        break
      case 'strong':
        out.push(h('strong', { 'data-slot': 'markdown-strong', class: md.strong }, renderInlines(node.children, ctx)))
        break
      case 'delete':
        out.push(h('del', { 'data-slot': 'markdown-delete', class: md.del }, renderInlines(node.children, ctx)))
        break
      case 'link':
        out.push(...renderLink(node, ctx))
        break
      case 'image':
        out.push(...renderImage(node, ctx))
        break
    }
  }
  return out
}

function renderHeading(node: HeadingNode, ctx: RenderContext): VNode {
  const info = ctx.headings.get(node)!
  ctx.heading = info.text
  const tag = `h${info.level}`
  const anchored = ctx.o.headingIds && ctx.o.headingAnchors
  const props = {
    id: ctx.o.headingIds ? info.id : undefined,
    'data-slot': 'markdown-heading',
    class: `${headingClass(ctx.o.size, info.level)}${anchored ? '' : ` ${headingSpace(info.level)}`}`,
  }
  const heading = h(tag, props, renderInlines(node.children, ctx))
  if (!anchored) return heading
  const link = h(
    'a',
    { href: `#${info.id}`, 'data-slot': 'markdown-heading-anchor', class: md.anchor },
    [h('span', { 'aria-hidden': 'true' }, '#'), h('span', { class: 'sr-only' }, 'Link to this section')],
  )
  return h('div', { 'data-slot': 'markdown-heading-row', class: `${md.headingRow} ${headingSpace(info.level)}` }, [heading, link])
}

function renderCode(node: CodeNode, ctx: RenderContext): VNode {
  const { language, filename } = parseInfo(node.info)
  const custom = ctx.o.components.code
  if (custom) {
    const props: MarkdownCodeProps = { code: node.value, language, info: node.info, closed: node.closed, ...(filename ? { filename } : {}) }
    return typeof custom === 'string' ? h(custom, { 'data-language': language || undefined }, node.value) : h(custom as Component, props)
  }
  const known = LANGUAGES[language.toLowerCase()]
  let inner: VNode
  if (ctx.o.highlight && known) {
    inner = h(CodeViewer, {
      source: node.value,
      language: known,
      filename,
      label: unique(ctx, filename || `${LANGUAGE_NAMES[known]} code`),
      foldable: ctx.o.codeFold,
      lineNumbers: ctx.o.codeFold,
      copy: true,
    })
  } else {
    const title = filename || language
    inner = h('div', { 'data-slot': 'markdown-code', 'data-language': language || undefined, class: md.plainCode }, [
      h('div', { 'data-slot': 'markdown-code-header', class: md.plainCodeHeader }, [
        h('span', { class: 'min-w-0 truncate font-mono' }, title),
        h(CopyButton, { text: node.value, label: 'Copy code', copiedLabel: 'Code copied', class: 'ms-auto shrink-0' }),
      ]),
      h(
        'pre',
        { 'data-slot': 'markdown-code-pre', role: 'region', tabindex: 0, 'aria-label': unique(ctx, filename || (language ? `${language} code` : 'Code')), class: md.plainCodePre },
        h('code', node.value),
      ),
    ])
  }
  return h('div', { 'data-slot': 'markdown-code-block', class: md.codeWrap }, [inner])
}

const NUMERIC = /^[+-]?\d[\d.,\s]*(?:%|[a-zA-Z]{1,3})?$/

function renderTable(node: TableNode, ctx: RenderContext): VNode {
  const label = unique(ctx, ctx.heading || 'Table')
  const width = node.align.length
  const numeric = node.align.map((_, col) => {
    let seen = false
    for (const row of node.rows) {
      const text = inlineToText(row[col] ?? []).trim()
      if (text === '') continue
      if (text.length > 32 || !NUMERIC.test(text)) return false
      seen = true
    }
    return seen
  })
  const cls = (base: string, col: number) => `${base} ${ALIGN_CLASS[node.align[col] ?? 'left']}${numeric[col] ? ' tabular-nums' : ''}`
  const head = node.head.map((cell, col) =>
    h(
      'th',
      { scope: 'col', 'data-slot': 'markdown-table-head', class: cls(md.th, col) },
      cell.length ? renderInlines(cell, ctx) : [h('span', { class: 'sr-only' }, `Column ${col + 1}`)],
    ),
  )
  const body = node.rows.map((row) =>
    h(
      'tr',
      { 'data-slot': 'markdown-table-row' },
      Array.from({ length: width }, (_, col) => h('td', { 'data-slot': 'markdown-table-cell', class: cls(md.td, col) }, renderInlines(row[col] ?? [], ctx))),
    ),
  )
  return h('div', { 'data-slot': 'markdown-table-scroll', role: 'region', tabindex: 0, 'aria-label': label, class: md.tableScroll }, [
    h('table', { 'data-slot': 'markdown-table', class: md.table }, [
      h('thead', { class: md.thead }, [h('tr', head)]),
      ...(body.length ? [h('tbody', body)] : []),
    ]),
  ])
}

function renderItem(item: ListItemNode, list: ListNode, ctx: RenderContext, depth: number, mixed: boolean): VNode {
  const children = renderBlocks(item.children, ctx, { tight: list.tight, depth })
  if (item.checked === null) return h('li', { 'data-slot': 'markdown-list-item', class: list.tight ? md.item : md.itemLoose }, children)
  const first = item.children[0]
  const name = first && first.type === 'paragraph' ? inlineToText(first.children).trim() : ''
  return h('li', { 'data-slot': 'markdown-task-item', class: `${mixed ? md.taskMixed : md.task} ${list.tight ? 'mt-1.5' : 'mt-4'} first:mt-0` }, [
    h('input', { type: 'checkbox', disabled: true, checked: item.checked, 'aria-label': name || 'Task', 'data-slot': 'markdown-task-checkbox', class: md.checkbox }),
    h('div', { class: md.taskBody }, children),
  ])
}

function renderList(node: ListNode, ctx: RenderContext, depth: number): VNode {
  const tasks = node.children.filter((i) => i.checked !== null).length
  const allTasks = tasks > 0 && tasks === node.children.length
  const marker = node.ordered ? (depth === 0 ? md.ol : depth === 1 ? md.olNested : md.olDeep) : depth === 0 ? md.ul : depth === 1 ? md.ulNested : md.ulDeep
  return h(
    node.ordered ? 'ol' : 'ul',
    {
      'data-slot': 'markdown-list',
      start: node.ordered && node.start !== null && node.start !== 1 ? node.start : undefined,
      class: `${depth === 0 ? md.listTop : md.listInner} ${allTasks ? md.tasks : marker}`,
    },
    node.children.map((item) => renderItem(item, node, ctx, depth + 1, !allTasks && tasks > 0)),
  )
}

interface BlockState {
  /** Inside a tight list item: paragraphs render as bare inline content. */
  tight: boolean
  /** Number of enclosing lists. */
  depth: number
}

function renderParagraph(node: Extract<Block, { type: 'paragraph' }>, ctx: RenderContext, state: BlockState): VNodeChild[] {
  const only = node.children.length === 1 ? node.children[0] : null
  if (only && only.type === 'image' && only.title) {
    const src = safeUrl(only.url, ctx.o, true)
    if (src !== null && !ctx.o.components.image) {
      return [
        h('figure', { 'data-slot': 'markdown-figure', class: md.figure }, [
          h('img', { src, alt: only.alt, loading: 'lazy', decoding: 'async', 'data-slot': 'markdown-image', class: md.image }),
          h('figcaption', { 'data-slot': 'markdown-figcaption', class: md.figcaption }, only.title),
        ]),
      ]
    }
  }
  const children = renderInlines(node.children, ctx)
  if (state.tight) return children
  if (children.length === 0) return []
  return [h('p', { 'data-slot': 'markdown-paragraph', class: md.paragraph }, children)]
}

export function renderBlocks(blocks: readonly Block[], ctx: RenderContext, state: BlockState = { tight: false, depth: 0 }): VNodeChild[] {
  const out: VNodeChild[] = []
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        out.push(...renderParagraph(block, ctx, state))
        break
      case 'heading':
        out.push(renderHeading(block, ctx))
        break
      case 'blockquote':
        out.push(h('blockquote', { 'data-slot': 'markdown-blockquote', class: md.blockquote }, renderBlocks(block.children, ctx, { tight: false, depth: state.depth })))
        break
      case 'list':
        out.push(renderList(block, ctx, state.depth))
        break
      case 'code':
        out.push(renderCode(block, ctx))
        break
      case 'thematicBreak':
        out.push(h('hr', { 'data-slot': 'markdown-hr', class: md.hr }))
        break
      case 'table':
        out.push(renderTable(block, ctx))
        break
    }
  }
  return out
}

/** Children of the Markdown root element. Inline mode keeps only the inline content of the document. */
export function renderRoot(root: Root, ctx: RenderContext, inline: boolean): VNodeChild[] {
  if (inline) {
    const out: VNodeChild[] = []
    root.children.forEach((block, i) => {
      if (block.type === 'paragraph' || block.type === 'heading') {
        if (i > 0) out.push(' ')
        out.push(...renderInlines(block.children, ctx))
      }
    })
    return out
  }
  if (root.plain) return [h('p', { 'data-slot': 'markdown-paragraph', class: md.plain }, inlineToText((root.children[0] as Extract<Block, { type: 'paragraph' }>).children, '\n'))]
  return renderBlocks(root.children, ctx)
}

