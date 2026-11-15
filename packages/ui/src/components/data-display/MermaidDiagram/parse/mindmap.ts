/**
 * `mindmap` parser.
 *
 * The tree comes from indentation: a line is a child of the nearest earlier line that is indented less (tabs count as
 * four spaces; uneven steps are fine, as in Mermaid). The first node is the root; a second line at the root level is an
 * error ("A mind map has one root").
 * Node text forms: `text`, `id[text]` (square), `id(text)` (rounded), `id((text))` (circle), `id))text((` (bang),
 * `id)text(` (cloud), `id{{text}}` (hexagon); the text may be in "quotes" (needed when it contains brackets) and may use
 * `<br/>` for line breaks and a backtick markdown string. The `id` must be written directly in front of the bracket and
 * use letters, digits, `_`, `-`, `.` or `$`; anything else (for example "Lists (a, b)") is plain text.
 * `:::class` lines are kept as classes of the node above (a class named like a tone, e.g. `danger`, sets the tone);
 * `::icon(...)` lines are accepted and ignored (the icon name is kept in the AST, nothing is drawn).
 * `Text:::class` on the node line works like a `:::class` line. Not supported: a root on the `mindmap` line, node text over
 * several source lines.
 */
import type { PreparedSource } from '../../_diagram/source'
import { fail, type DiagramMeta } from '../../_diagram/types'

export type MindmapShape = 'default' | 'square' | 'rounded' | 'circle' | 'bang' | 'cloud' | 'hexagon'

export interface MindmapNode {
  /** The `id` written in front of the bracket, or '' when there is none. */
  id: string
  /** Text as written (inside the quotes when quoted); `<br/>` and markdown are handled when drawing. */
  text: string
  shape: MindmapShape
  /** 0 for the root. */
  depth: number
  /** Index of the parent in `nodes`; undefined for the root. */
  parent?: number
  classes: string[]
  /** Name from an `::icon(name)` line; never drawn. */
  icon?: string
  line: number
}

export interface MindmapAst {
  type: 'mindmap'
  /** In reading order (parents before their children, siblings in source order). */
  nodes: MindmapNode[]
  meta: DiagramMeta
}

const FORMS: { open: string; close: string; shape: MindmapShape }[] = [
  { open: '((', close: '))', shape: 'circle' },
  { open: '))', close: '((', shape: 'bang' },
  { open: '{{', close: '}}', shape: 'hexagon' },
  { open: '(', close: ')', shape: 'rounded' },
  { open: ')', close: '(', shape: 'cloud' },
  { open: '[', close: ']', shape: 'square' },
]

const ID = /^[\p{L}\p{N}_\-.$]*$/u

interface Parsed {
  id: string
  text: string
  shape: MindmapShape
}

/** `col` is the 1-based column of `t[0]`. */
function parseNodeText(t: string, no: number, col: number): Parsed {
  for (let i = 0; i < t.length; i++) {
    const form = FORMS.find((f) => t.startsWith(f.open, i))
    if (!form) continue
    const id = t.slice(0, i)
    // a bracket only starts a shape right behind a plain id, otherwise the brackets are part of the text
    if (!ID.test(id)) break
    const start = i + form.open.length
    let inner: string
    const lead = t.slice(start).length - t.slice(start).trimStart().length
    if (t[start + lead] === '"') {
      const q = t.indexOf('"', start + lead + 1)
      if (q === -1) return fail(no, col + start + lead, 'This quoted text is never closed. Add the closing ".')
      const after = t.slice(q + 1)
      const rest = after.trimStart()
      const at = q + 1 + after.length - rest.length
      if (!rest.startsWith(form.close)) return fail(no, col + at, `Expected "${form.close}" after the quoted text, to close the shape opened with "${form.open}".`)
      if (rest.length > form.close.length) return fail(no, col + at + form.close.length, `Nothing may follow "${form.close}" on a node line. Put it on its own line, indented to make it a child.`)
      inner = t.slice(start + lead + 1, q)
    } else {
      if (!t.endsWith(form.close) || t.length - form.close.length < start) {
        const found = t.indexOf(form.close, start)
        if (found !== -1) return fail(no, col + found + form.close.length, `Nothing may follow "${form.close}" on a node line. Put it on its own line, indented to make it a child.`)
        return fail(no, col + i, `The "${form.open}" opened here is never closed. End the text with "${form.close}", for example ${id || 'id'}${form.open}Text${form.close}.`)
      }
      inner = t.slice(start, t.length - form.close.length)
    }
    if (inner.trim() === '') return fail(no, col + i, `The text between "${form.open}" and "${form.close}" is empty. Write the text of the node there.`)
    return { id, text: inner.trim(), shape: form.shape }
  }
  const quoted = t.length >= 2 && t.startsWith('"') && t.endsWith('"') && !t.slice(1, -1).includes('"')
  return { id: '', text: quoted ? t.slice(1, -1).trim() || t : t, shape: 'default' }
}

export function parseMindmap(p: PreparedSource): MindmapAst {
  const ast: MindmapAst = { type: 'mindmap', nodes: [], meta: p.meta }
  if (p.rest) fail(p.header.no, p.header.col + p.header.text.indexOf(p.rest, p.keyword.length), 'Put the root node on its own line below "mindmap", indented, for example "  root((Topic))".')
  const stack: { indent: number; index: number }[] = []

  for (const line of p.lines) {
    const t = line.text
    if (t.startsWith('::')) {
      const target = ast.nodes[ast.nodes.length - 1]
      if (!target) fail(line.no, line.col, 'An icon or class line belongs to the node above it, but there is no node above. Write the root node first.')
      if (t.startsWith(':::')) {
        const names = t.slice(3).split(/[\s,]+/).filter(Boolean)
        if (names.length === 0) fail(line.no, line.col, 'Expected a class name after ":::", for example ":::urgent".')
        for (const n of names) if (!target!.classes.includes(n)) target!.classes.push(n)
      } else {
        const m = /^::icon\((.*)\)$/.exec(t)
        if (!m) fail(line.no, line.col, 'Expected an icon line like "::icon(fa fa-book)". Icons are accepted but not drawn.')
        target!.icon = m![1]!.trim()
      }
      continue
    }
    while (stack.length && stack[stack.length - 1]!.indent >= line.indent) stack.pop()
    if (ast.nodes.length > 0 && stack.length === 0) {
      fail(line.no, line.col, 'A mind map has one root, but this line is at the same level as it. Indent it to make it a child of a node, or remove it.')
    }
    const inline = /^(\S.*?)\s*:::([\p{L}\p{N}_\- ]+)$/u.exec(t)
    const parsed = parseNodeText(inline ? inline[1]! : t, line.no, line.col)
    const parent = stack.length ? stack[stack.length - 1]!.index : undefined
    ast.nodes.push({ ...parsed, depth: parent === undefined ? 0 : ast.nodes[parent]!.depth + 1, parent, classes: inline ? inline[2]!.split(/\s+/).filter(Boolean) : [], line: line.no })
    stack.push({ indent: line.indent, index: ast.nodes.length - 1 })
  }
  return ast
}
