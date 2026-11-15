/**
 * Mind map renderer: a tidy tree that grows to the right. The root sits at the left, its children are stacked
 * vertically and every parent is centred on its children. Depth is shown without colour: the root is larger, bold with
 * a thick outline, level 1 is bold with a normal outline and a thick connector, deeper levels are plain with a thin
 * outline. Shapes carry the node form of the source (square, rounded, circle, bang, cloud, hexagon).
 */
import { checkLimits } from '../../_diagram/graph'
import { shapePath, shapeSize, type Box, type NodeShape } from '../../_diagram/shapes'
import { interpretStyle } from '../../_diagram/style'
import { cleanLabel, decodeEntities, labelBlock, plural, r2 } from '../../_diagram/text'
import { ParseFail, type DiagramTone, type EdgeStyle, type Metrics, type Paint, type RenderItem, type RenderModel, type RenderOptions } from '../../_diagram/types'
import type { MindmapAst, MindmapNode, MindmapShape } from '../parse/mindmap'

const SHAPE: Record<MindmapShape, NodeShape> = { default: 'rect', square: 'rect', rounded: 'round', circle: 'circle', bang: 'asymmetric', cloud: 'stadium', hexagon: 'hexagon' }

const FORMAT_TAG = /<\/?(?:b|i|u|s|em|strong|small|sub|sup|code|mark|span|p|div)\b[^<>]*>/gi

/** Label lines: `<br/>` breaks lines, a backtick markdown string loses its markers, entity codes are decoded. Other markup stays literal text. */
function labelLines(text: string): string[] {
  const t = text.trim()
  if (t.length >= 2 && t.startsWith('`') && t.endsWith('`')) return cleanLabel(t)
  const lines = decodeEntities(t.replace(/<br\s*\/?>/gi, '\n').replace(FORMAT_TAG, ''))
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.length ? lines : [t]
}

interface Placed {
  node: MindmapNode
  lines: string[]
  fontPx: number
  bold: boolean
  shape: NodeShape
  w: number
  h: number
  x: number
  cy: number
}

function connector(a: { x: number; y: number }, b: { x: number; y: number }, style: EdgeStyle): string {
  const mid = (a.x + b.x) / 2
  if (style === 'straight') return `M${r2(a.x)},${r2(a.y)}L${r2(b.x)},${r2(b.y)}`
  if (style === 'orthogonal') return `M${r2(a.x)},${r2(a.y)}H${r2(mid)}V${r2(b.y)}H${r2(b.x)}`
  return `M${r2(a.x)},${r2(a.y)}C${r2(mid)},${r2(a.y)} ${r2(mid)},${r2(b.y)} ${r2(b.x)},${r2(b.y)}`
}

export function renderMindmap(ast: MindmapAst, opts: RenderOptions, m: Metrics): RenderModel {
  const count = ast.nodes.length
  if (count === 0) throw new ParseFail(1, 1, 'This mind map has no nodes. Add a root on a new line below "mindmap", for example "  root((Topic))".', 'empty')
  checkLimits(count, count - 1, opts)
  const colGap = Math.round(m.rankSep * 0.9)
  const rowGap = Math.round(m.nodeSep * 0.5)
  const edgeStyle = opts.edgeStyle ?? 'curved'

  // size every node
  const placed: Placed[] = ast.nodes.map((node) => {
    const root = node.depth === 0
    const fontPx = root ? Math.round(m.font * 1.2) : m.font
    const bold = node.depth <= 1
    const lh = root ? Math.round(fontPx * 1.4) : m.lineHeight
    const mm: Metrics = root ? { ...m, padX: Math.round(m.padX * 1.3), padY: Math.round(m.padY * 1.3), lineHeight: lh } : m
    const lines = labelLines(node.text)
    const block = labelBlock(lines, m.wrap, fontPx, lh, bold)
    const shape: NodeShape = root && node.shape === 'default' ? 'stadium' : SHAPE[node.shape]
    const size = shapeSize(shape, block.width, block.height, mm)
    let w = Math.max(size.width, m.font * 3.5)
    let h = Math.max(size.height, lh + 2 * mm.padY)
    if (shape === 'circle') w = h = Math.max(w, h)
    return { node, lines: block.lines, fontPx, bold, shape, w, h, x: 0, cy: 0 }
  })

  // children in document order, subtree heights bottom-up (parents come before children, so walk backwards)
  const children: number[][] = placed.map(() => [])
  placed.forEach((p, i) => {
    if (p.node.parent !== undefined) children[p.node.parent]!.push(i)
  })
  const span: number[] = new Array(count).fill(0)
  const stack: number[] = new Array(count).fill(0)
  for (let i = count - 1; i >= 0; i--) {
    const kids = children[i]!
    stack[i] = kids.reduce((sum, k) => sum + span[k]!, 0) + rowGap * Math.max(0, kids.length - 1)
    span[i] = Math.max(placed[i]!.h, stack[i]!)
  }

  // tops top-down, then centres bottom-up so every parent sits between its first and last child
  const top: number[] = new Array(count).fill(0)
  for (let i = 0; i < count; i++) {
    const kids = children[i]!
    let cursor = top[i]! + (span[i]! - stack[i]!) / 2
    for (const k of kids) {
      top[k] = cursor
      cursor += span[k]! + rowGap
    }
    const p = placed[i]!
    p.x = p.node.parent === undefined ? 0 : placed[p.node.parent]!.x + placed[p.node.parent]!.w + colGap
  }
  for (let i = count - 1; i >= 0; i--) {
    const kids = children[i]!
    const p = placed[i]!
    const own = top[i]! + span[i]! / 2
    const centred = kids.length ? (placed[kids[0]!]!.cy + placed[kids[kids.length - 1]!]!.cy) / 2 : own
    p.cy = Math.min(Math.max(centred, top[i]! + p.h / 2), top[i]! + span[i]! - p.h / 2)
  }

  const width = Math.ceil(Math.max(...placed.map((p) => p.x + p.w)) + 2 * m.margin)
  const height = Math.ceil(span[0]! + 2 * m.margin)
  const ox = m.margin
  const oy = m.margin
  const tone = (node: MindmapNode): DiagramTone => {
    let t: DiagramTone | undefined
    for (const c of node.classes) t = interpretStyle(undefined, c).tone ?? t
    return t ?? opts.tone ?? 'neutral'
  }

  const items: RenderItem[] = []
  placed.forEach((p, i) => {
    if (p.node.parent === undefined) return
    const parent = placed[p.node.parent]!
    const lean = p.shape === 'asymmetric' ? p.h * 0.2 : 0
    items.push({
      kind: 'path',
      role: 'edge',
      id: `e${i}`,
      d: connector({ x: ox + parent.x + parent.w, y: oy + parent.cy }, { x: ox + p.x + lean, y: oy + p.cy }, edgeStyle),
      style: 'solid',
      thick: p.node.depth === 1 || undefined,
    })
  })
  placed.forEach((p, i) => {
    const box: Box = { x: ox + p.x, y: oy + p.cy - p.h / 2, width: p.w, height: p.h }
    const paint: Paint = { fill: 'surface', tone: tone(p.node), stroke: p.node.depth === 0 ? 'thick' : p.node.depth === 1 ? 'normal' : 'thin' }
    items.push({ kind: 'shape', role: 'node', id: `n${i}`, d: shapePath(p.shape, box, m).d, paint })
    const dx = p.shape === 'asymmetric' ? p.h * 0.1 : 0
    items.push({ kind: 'text', role: 'node-label', x: r2(box.x + box.width / 2 + dx), y: r2(p.cy + oy), lines: p.lines, anchor: 'middle', size: p.fontPx, bold: p.bold || undefined })
  })

  const levels = Math.max(...placed.map((p) => p.node.depth)) + 1
  const root = placed[0]!
  return {
    type: 'mindmap',
    title: ast.meta.title,
    width,
    height,
    items,
    alt: { sections: [{ title: 'Outline', ordered: true, items: placed.map((p) => `Level ${p.node.depth + 1}: ${p.lines.join(' ')}`) }] },
    summary: `Mind map with ${plural(count, 'node')} in ${plural(levels, 'level')}, root "${root.lines.join(' ')}"`,
    nodes: count,
    edges: count - 1,
    fontSize: m.font,
  }
}
