import type { Block, Inline, Root } from './ast'
import { parseMarkdown } from './parse'
import type { ParseOptions } from './ast'

/** Test helper: compact HTML-like rendering of an AST, close to the CommonMark reference output, for readable assertions. */
export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inl(nodes: Inline[]): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case 'text':
          return esc(n.value)
        case 'inlineCode':
          return `<code>${esc(n.value)}</code>`
        case 'emphasis':
          return `<em>${inl(n.children)}</em>`
        case 'strong':
          return `<strong>${inl(n.children)}</strong>`
        case 'delete':
          return `<del>${inl(n.children)}</del>`
        case 'link':
          return `<a href="${esc(n.url)}"${n.title ? ` title="${esc(n.title)}"` : ''}>${inl(n.children)}</a>`
        case 'image':
          return `<img src="${esc(n.url)}" alt="${esc(n.alt)}"${n.title ? ` title="${esc(n.title)}"` : ''} />`
        case 'break':
          return '<br />\n'
        case 'softbreak':
          return '\n'
      }
    })
    .join('')
}

function blocks(list: Block[], tight = false): string {
  return list
    .map((b) => {
      switch (b.type) {
        case 'paragraph':
          return tight ? inl(b.children) : `<p>${inl(b.children)}</p>`
        case 'heading':
          return `<h${b.depth}>${inl(b.children)}</h${b.depth}>`
        case 'blockquote':
          return `<blockquote>\n${blocks(b.children)}\n</blockquote>`
        case 'list': {
          const tag = b.ordered ? 'ol' : 'ul'
          const start = b.ordered && b.start !== 1 ? ` start="${b.start}"` : ''
          const items = b.children
            .map((i) => {
              const box = i.checked === null ? '' : `<input ${i.checked ? 'checked="" ' : ''}disabled="" type="checkbox" /> `
              const inner = blocks(i.children, b.tight)
              return `<li>${box}${inner}</li>`
            })
            .join('\n')
          return `<${tag}${start}>\n${items}\n</${tag}>`
        }
        case 'code':
          return `<pre><code${b.lang ? ` class="language-${esc(b.lang)}"` : ''}>${esc(b.value)}</code></pre>`
        case 'thematicBreak':
          return '<hr />'
        case 'table': {
          const al = (i: number) => (b.align[i] ? ` align="${b.align[i]}"` : '')
          const head = b.head.map((c, i) => `<th${al(i)}>${inl(c)}</th>`).join('')
          const rows = b.rows.map((r) => `<tr>${r.map((c, i) => `<td${al(i)}>${inl(c)}</td>`).join('')}</tr>`).join('')
          return `<table><thead><tr>${head}</tr></thead>${rows ? `<tbody>${rows}</tbody>` : ''}</table>`
        }
      }
    })
    .join('\n')
}

export function astToHtml(root: Root): string {
  return blocks(root.children)
}

/** Parse and render to the compact HTML above. */
export function html(source: string, options?: ParseOptions): string {
  return astToHtml(parseMarkdown(source, options))
}
