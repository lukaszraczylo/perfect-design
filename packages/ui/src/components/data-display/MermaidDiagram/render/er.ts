import { DIRECTION_PHRASE, checkLimits, drawGraph, rectPath, type GraphEdge, type GraphNode } from '../../_diagram/graph'
import type { Box } from '../../_diagram/shapes'
import { interpretStyle, mergeStyles, type NodeStyle } from '../../_diagram/style'
import { cleanLabel, decodeEntities, labelBlock, measureText, plural, r2, truncateToWidth } from '../../_diagram/text'
import { ParseFail, type Marker, type Metrics, type Paint, type RenderItem, type RenderModel, type RenderOptions, type RText } from '../../_diagram/types'
import type { ErAttribute, ErAst, ErCardinality, ErEntity } from '../parse/er'

const MARKER: Record<ErCardinality, Marker> = { one: 'exactly-one', 'zero-one': 'zero-one', 'zero-many': 'zero-many', 'one-many': 'one-many' }
const PHRASE: Record<ErCardinality, string> = { one: 'one', 'zero-one': 'zero or one', 'zero-many': 'zero or more', 'one-many': 'one or more' }

function entityStyle(ast: ErAst, e: ErEntity): NodeStyle {
  const parts: NodeStyle[] = [interpretStyle(ast.classDefs.default)]
  for (const name of e.classes) parts.push(interpretStyle(ast.classDefs[name], name))
  parts.push(interpretStyle(e.style))
  return mergeStyles(...parts)
}

/** Display name of an entity as lines: the alias when there is one, `<br>` breaks lines, entity codes are decoded. */
const titleLines = (e: ErEntity): string[] => decodeEntities(e.alias ?? e.id).split(/<br\s*\/?>/i).map((l) => l.trim()).filter(Boolean)

const entityName = (e: ErEntity): string => titleLines(e).join(' ') || e.id

interface Cell {
  text: string
  full: string
  width: number
}

interface Table {
  /** One entry per column that has any content: type, name, keys, comment. */
  cols: { id: 'type' | 'name' | 'keys' | 'comment'; width: number }[]
  rows: Record<'type' | 'name' | 'keys' | 'comment', Cell>[]
}

function buildTable(attrs: ErAttribute[], m: Metrics): Table {
  const cap = { type: m.wrap * 0.8, name: m.wrap, keys: m.wrap, comment: m.wrap * 1.3 }
  const cell = (full: string, id: keyof typeof cap, bold = false): Cell => {
    const text = truncateToWidth(full, cap[id], m.font)
    return { text, full, width: measureText(text, m.font, bold) }
  }
  const rows = attrs.map((a) => ({
    type: cell(decodeEntities(a.type), 'type'),
    name: cell(decodeEntities(a.name), 'name'),
    keys: cell(a.keys.join(', '), 'keys', true),
    comment: cell(decodeEntities(a.comment ?? ''), 'comment'),
  }))
  const cols = (['type', 'name', 'keys', 'comment'] as const)
    .map((id) => ({ id, width: Math.max(0, ...rows.map((r) => r[id].width)) }))
    .filter((c) => c.width > 0)
  return { cols, rows }
}

export function renderEr(ast: ErAst, opts: RenderOptions, m: Metrics): RenderModel {
  if (ast.entities.length === 0) throw new ParseFail(1, 1, 'This entity relationship diagram has no entities. Add one such as "CUSTOMER ||--o{ ORDER : places".', 'empty')
  checkLimits(ast.entities.length, ast.relationships.length, opts)
  const direction = opts.direction ?? ast.direction
  const gap = Math.round(m.padX * 1.2)
  const rowH = m.lineHeight + Math.round(m.padY * 0.5)
  const bodyPad = Math.round(m.padY * 0.5)
  const radius = Math.min(m.radius, 10)

  const nodes: GraphNode[] = ast.entities.map((entity) => {
    const style = entityStyle(ast, entity)
    const title = labelBlock(titleLines(entity).length ? titleLines(entity) : [entity.id], m.wrap * 1.6, m.font, m.lineHeight, true)
    const table = buildTable(entity.attributes, m)
    const tableWidth = table.cols.reduce((sum, c) => sum + c.width, 0) + gap * Math.max(0, table.cols.length - 1)
    const width = Math.max(title.width, tableWidth) + 2 * m.padX
    const titleH = title.height + Math.round(m.padY * 1.4)
    const bodyH = table.rows.length ? table.rows.length * rowH + 2 * bodyPad : 0
    const paint: Paint = { fill: 'surface', tone: style.tone ?? opts.tone ?? 'neutral', stroke: style.thick ? 'thick' : 'normal', dash: style.dashed ? 'dashed' : undefined }
    return {
      id: `e:${entity.id}`,
      width: Math.max(width, m.font * 6),
      height: titleH + bodyH,
      draw: (box: Box): RenderItem[] => {
        const items: RenderItem[] = [{ kind: 'shape', role: 'entity', id: entity.id, d: rectPath(box, radius), paint }]
        items.push({ kind: 'text', role: 'entity-title', x: r2(box.x + box.width / 2), y: r2(box.y + titleH / 2), lines: title.lines, anchor: 'middle', size: m.font, bold: true })
        if (!table.rows.length) return items
        const ruleY = r2(box.y + titleH)
        items.push({ kind: 'path', role: 'entity-divider', d: `M${r2(box.x)},${ruleY}H${r2(box.x + box.width)}`, style: 'solid', faint: true })
        let x = box.x + m.padX
        for (const col of table.cols) {
          table.rows.forEach((row, i) => {
            const cellItem = row[col.id]
            if (!cellItem.text) return
            const t: RText = {
              kind: 'text',
              role: `entity-${col.id}`,
              x: r2(x),
              y: r2(box.y + titleH + bodyPad + rowH * (i + 0.5)),
              lines: [cellItem.text],
              anchor: 'start',
              size: m.font,
              bold: col.id === 'keys' || undefined,
              muted: col.id === 'type' || col.id === 'comment' || undefined,
              italic: col.id === 'comment' || undefined,
              title: cellItem.text === cellItem.full ? undefined : cellItem.full,
            }
            items.push(t)
          })
          x += col.width + gap
        }
        return items
      },
    }
  })

  const edges: GraphEdge[] = ast.relationships.map((r) => ({
    id: `r${r.index}`,
    from: `e:${r.from}`,
    to: `e:${r.to}`,
    label: r.label,
    style: r.identifying ? 'solid' : 'dashed',
    markerStart: MARKER[r.fromCard],
    markerEnd: MARKER[r.toCard],
  }))

  const drawing = drawGraph({ nodes, edges, direction }, m, opts.edgeStyle ?? 'curved')

  const byId = new Map(ast.entities.map((e) => [e.id, e]))
  const nameOf = (id: string): string => entityName(byId.get(id)!)
  const entities = ast.entities.map((e) => {
    const attrs = e.attributes.map((a) => {
      const detail = [decodeEntities(a.type), ...a.keys, ...(a.comment ? [`"${decodeEntities(a.comment)}"`] : [])]
      return `${decodeEntities(a.name)} (${detail.join(', ')})`
    })
    return `${entityName(e)}: ${attrs.length ? attrs.join(', ') : 'no attributes'}`
  })
  const relationships = ast.relationships.map((r) => {
    const label = r.label ? cleanLabel(r.label).join(' ') : ''
    return `${nameOf(r.from)} to ${nameOf(r.to)}${label ? `: ${label}` : ''} (${PHRASE[r.fromCard]} to ${PHRASE[r.toCard]}, ${r.identifying ? 'identifying' : 'non-identifying'})`
  })
  const sections = [{ title: 'Entities', ordered: true, items: entities }]
  if (relationships.length) sections.push({ title: 'Relationships', ordered: false, items: relationships })

  return {
    type: 'er',
    title: ast.meta.title,
    width: drawing.width,
    height: drawing.height,
    items: drawing.items,
    alt: { sections },
    summary: `Entity relationship diagram with ${plural(ast.entities.length, 'entity', 'entities')} and ${plural(ast.relationships.length, 'relationship')}, ${DIRECTION_PHRASE[direction]}`,
    nodes: ast.entities.length,
    edges: ast.relationships.length,
    fontSize: m.font,
  }
}
