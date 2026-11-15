import { DIRECTION_PHRASE, checkLimits, drawGraph, type GraphCluster, type GraphEdge, type GraphNode } from '../../_diagram/graph'
import { shapePath, shapeSize, type Box, type NodeShape } from '../../_diagram/shapes'
import { interpretStyle, mergeStyles, type NodeStyle } from '../../_diagram/style'
import { cleanLabel, labelBlock, plural, r2 } from '../../_diagram/text'
import { ParseFail, type Marker, type Metrics, type Paint, type RenderItem, type RenderModel, type RenderOptions } from '../../_diagram/types'
import type { FlowEdge, FlowEdgeEnd, FlowNode, FlowchartAst } from '../parse/flowchart'

const MARKER: Record<FlowEdgeEnd, Marker | undefined> = { arrow: 'arrow', cross: 'cross', circle: 'circle', none: undefined }

const SHAPE_NOTE: Partial<Record<NodeShape, string>> = { rhombus: 'decision', cylinder: 'database' }

export function nodeStyle(ast: FlowchartAst, node: FlowNode): NodeStyle {
  const parts: NodeStyle[] = [interpretStyle(ast.classDefs.default)]
  for (const name of node.classes) parts.push(interpretStyle(ast.classDefs[name], name))
  parts.push(interpretStyle(node.style))
  return mergeStyles(...parts)
}

function edgeStyle(ast: FlowchartAst, e: FlowEdge): NodeStyle {
  const parts: NodeStyle[] = []
  for (const ls of ast.linkStyles) if (ls.indexes === 'default' || ls.indexes.includes(e.index)) parts.push(interpretStyle(ls.decl))
  return mergeStyles(...parts)
}

export function renderFlowchart(ast: FlowchartAst, opts: RenderOptions, m: Metrics): RenderModel {
  const subgraphIds = new Set(ast.subgraphs.map((s) => s.id))
  const nodes = ast.nodes.filter((n) => !subgraphIds.has(n.id))
  if (nodes.length === 0 && ast.subgraphs.length === 0) throw new ParseFail(1, 1, 'This flowchart has no nodes. Add a node such as "A[Start] --> B[End]".', 'empty')
  checkLimits(nodes.length, ast.edges.length, opts)
  const direction = opts.direction ?? ast.direction
  const nid = (id: string) => (subgraphIds.has(id) ? `c:${id}` : `n:${id}`)

  const graphNodes: GraphNode[] = nodes.map((node) => {
    const style = nodeStyle(ast, node)
    const lines = cleanLabel(node.label || node.id)
    const block = labelBlock(lines, m.wrap, m.font, m.lineHeight)
    const size = shapeSize(node.shape, block.width, block.height, m)
    const width = Math.max(size.width, m.font * 3.5)
    const height = Math.max(size.height, m.lineHeight + 2 * m.padY)
    const paint: Paint = { fill: 'surface', tone: style.tone ?? opts.tone ?? 'neutral', stroke: style.thick ? 'thick' : 'normal', dash: style.dashed ? 'dashed' : undefined }
    return {
      id: nid(node.id),
      width: node.shape === 'circle' || node.shape === 'doublecircle' ? Math.max(width, height) : width,
      height: node.shape === 'circle' || node.shape === 'doublecircle' ? Math.max(width, height) : height,
      shape: node.shape,
      parent: node.parent && subgraphIds.has(node.parent) ? `c:${node.parent}` : undefined,
      draw: (box: Box): RenderItem[] => {
        const outline = shapePath(node.shape, box, m)
        const items: RenderItem[] = [{ kind: 'shape', role: 'node', id: node.id, d: outline.d, paint }]
        for (const d of outline.inner) items.push({ kind: 'shape', role: 'node-detail', d, paint: { ...paint, fill: 'none' } })
        const dx = node.shape === 'asymmetric' ? box.height * 0.1 : 0
        items.push({ kind: 'text', role: 'node-label', x: r2(box.x + box.width / 2 + dx), y: r2(box.y + box.height / 2), lines: block.lines, anchor: 'middle', size: m.font })
        return items
      },
    }
  })

  const clusters: GraphCluster[] = ast.subgraphs.map((s) => ({
    id: `c:${s.id}`,
    parent: s.parent ? `c:${s.parent}` : undefined,
    title: s.title,
    direction: s.direction,
  }))

  const edges: GraphEdge[] = ast.edges.map((e) => {
    const st = edgeStyle(ast, e)
    return {
      id: `e${e.index}`,
      from: nid(e.from),
      to: nid(e.to),
      label: e.label,
      minLen: e.length,
      style: e.line === 'dotted' || st.dashed ? 'dashed' : 'solid',
      thick: e.line === 'thick' || st.thick,
      markerEnd: MARKER[e.head],
      markerStart: MARKER[e.tail],
      hidden: e.line === 'invisible',
      tone: st.tone,
    }
  })

  const drawing = drawGraph({ nodes: graphNodes, edges, clusters, direction }, m, opts.edgeStyle ?? 'curved')

  // text alternative: nodes in reading order, then connections, then groups
  const horizontal = direction === 'LR' || direction === 'RL'
  const reverse = direction === 'BT' || direction === 'RL'
  const labelOf = (id: string): string => {
    const sg = ast.subgraphs.find((s) => s.id === id)
    if (sg) return cleanLabel(sg.title).join(' ')
    const n = ast.nodes.find((x) => x.id === id)
    return n ? cleanLabel(n.label || n.id).join(' ') : id
  }
  const ordered = nodes
    .map((n) => ({ n, box: drawing.layout.nodes.get(nid(n.id)) }))
    .sort((a, b) => {
      const pa = a.box ? (horizontal ? a.box.x : a.box.y) * (reverse ? -1 : 1) : 0
      const pb = b.box ? (horizontal ? b.box.x : b.box.y) * (reverse ? -1 : 1) : 0
      const ca = a.box ? (horizontal ? a.box.y : a.box.x) : 0
      const cb = b.box ? (horizontal ? b.box.y : b.box.x) : 0
      return Math.abs(pa - pb) > 1 ? pa - pb : ca - cb
    })
    .map(({ n }) => {
      const note = SHAPE_NOTE[n.shape]
      const group = n.parent ? subgraphLabel(ast, n.parent) : ''
      const extra = [note, group ? `in ${group}` : ''].filter(Boolean).join(', ')
      return `${labelOf(n.id)}${extra ? ` (${extra})` : ''}`
    })
  const connections = ast.edges.map((e) => {
    const label = e.label ? cleanLabel(e.label).join(' ') : ''
    const kind = e.line === 'dotted' ? ' (dashed line)' : e.line === 'thick' ? ' (thick line)' : e.line === 'invisible' ? ' (layout only)' : ''
    return `${labelOf(e.from)} to ${labelOf(e.to)}${label ? `: ${label}` : ''}${kind}`
  })
  const sections = [
    { title: 'Nodes', ordered: true, items: ordered },
    { title: 'Connections', ordered: false, items: connections },
  ]
  if (ast.subgraphs.length) {
    sections.push({
      title: 'Groups',
      ordered: false,
      items: ast.subgraphs.map((s) => {
        const inside = [...nodes.filter((n) => n.parent === s.id).map((n) => labelOf(n.id)), ...ast.subgraphs.filter((x) => x.parent === s.id).map((x) => cleanLabel(x.title).join(' '))]
        return `${cleanLabel(s.title).join(' ')}: ${inside.length ? inside.join(', ') : 'empty'}`
      }),
    })
  }
  const groups = ast.subgraphs.length ? ` in ${plural(ast.subgraphs.length, 'group')}` : ''
  return {
    type: 'flowchart',
    width: drawing.width,
    height: drawing.height,
    items: drawing.items,
    alt: { sections },
    summary: `Flowchart with ${plural(nodes.length, 'node')} and ${plural(ast.edges.length, 'connection')}${groups}, ${DIRECTION_PHRASE[direction]}`,
    nodes: nodes.length,
    edges: ast.edges.length,
    fontSize: m.font,
  }
}

function subgraphLabel(ast: FlowchartAst, id: string): string {
  const sg = ast.subgraphs.find((s) => s.id === id)
  return sg ? cleanLabel(sg.title).join(' ') : id
}
