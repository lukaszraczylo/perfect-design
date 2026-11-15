import { DIRECTION_PHRASE, checkLimits, drawGraph, rectPath, type GraphCluster, type GraphEdge, type GraphNode } from '../../_diagram/graph'
import { shapePath, type Box } from '../../_diagram/shapes'
import { interpretStyle, mergeStyles, type NodeStyle } from '../../_diagram/style'
import { cleanLabel, labelBlock, plural, r2 } from '../../_diagram/text'
import { ParseFail, type Direction, type Metrics, type Paint, type RenderItem, type RenderModel, type RenderOptions, type RPath, type TextAlt } from '../../_diagram/types'
import type { StateAst, StateDef, StateNote } from '../parse/state'

const flat = (raw: string): string[] => cleanLabel(raw)
const horizontal = (d: Direction): boolean => d === 'LR' || d === 'RL'

export function stateStyle(ast: StateAst, def: StateDef): NodeStyle {
  const parts: NodeStyle[] = [interpretStyle(ast.classDefs.default)]
  for (const name of def.classes) parts.push(interpretStyle(ast.classDefs[name], name))
  return mergeStyles(...parts)
}

export function renderState(ast: StateAst, opts: RenderOptions, m: Metrics): RenderModel {
  if (ast.states.length === 0) throw new ParseFail(1, 1, 'This state diagram has no states. Add a transition such as "[*] --> Idle".', 'empty')
  const real = ast.states.filter((s) => s.kind === 'state' || s.kind === 'composite')
  checkLimits(real.length, ast.transitions.length, opts)
  const direction = opts.direction ?? ast.direction
  const byId = new Map(ast.states.map((s) => [s.id, s]))
  const gid = (id: string) => `s:${id}`

  /** Layout direction in force where a state lives: the nearest composite with its own `direction`, else the diagram's. */
  const dirIn = (parent?: string): Direction => {
    let p = parent
    for (let guard = 0; p && guard < 100; guard++) {
      const d = byId.get(p)!
      if (d.direction) return d.direction
      p = d.parent
    }
    return direction
  }

  const notesOf = new Map<string, StateNote[]>()
  for (const n of ast.notes) notesOf.set(n.target, [...(notesOf.get(n.target) ?? []), n])
  const groupOf = (id: string): string | undefined => (notesOf.has(id) ? `g:${id}` : undefined)
  // a composite with `--` dividers holds one invisible cluster per concurrent region; its states live in those
  const regionCount = (id: string): number => byId.get(id)?.regions ?? 1
  const regionId = (parent: string, k: number): string => `r:${parent}|${k}`
  const containerOf = (def: StateDef): string | undefined => {
    if (!def.parent) return undefined
    return regionCount(def.parent) > 1 ? regionId(def.parent, Math.min(def.region ?? 1, regionCount(def.parent))) : gid(def.parent)
  }
  const parentOf = (def: StateDef): string | undefined => groupOf(def.id) ?? containerOf(def)

  const nodes: GraphNode[] = []
  const clusters: GraphCluster[] = []

  for (const def of ast.states) {
    const style = stateStyle(ast, def)
    const tone = style.tone ?? opts.tone ?? 'neutral'
    const paint: Paint = { fill: 'surface', tone, stroke: style.thick ? 'thick' : 'normal', dash: style.dashed ? 'dashed' : undefined }
    const parent = parentOf(def)

    if (def.kind === 'composite') {
      clusters.push({
        id: gid(def.id),
        parent,
        title: def.title,
        // regions sit across the flow of the composite: side by side in a vertical flow, stacked in a horizontal one
        direction: regionCount(def.id) > 1 ? (horizontal(dirIn(def.id)) ? 'TB' : 'LR') : def.direction,
        paint: { fill: 'muted', tone, stroke: style.thick ? 'normal' : 'thin', dash: style.dashed ? 'dashed' : undefined },
      })
      for (let k = 1; regionCount(def.id) > 1 && k <= regionCount(def.id); k++) {
        clusters.push({ id: regionId(def.id, k), parent: gid(def.id), title: '', direction: dirIn(def.id), paint: { fill: 'none', tone: 'neutral', stroke: 'none' } })
      }
      continue
    }

    if (def.kind === 'start') {
      const d = Math.round(m.font * 1.2)
      nodes.push({
        id: gid(def.id), width: d, height: d, shape: 'circle', parent,
        draw: (box) => [{ kind: 'shape', role: 'start', id: def.id, d: shapePath('circle', box, m).d, paint: { fill: 'solid', tone: 'neutral', stroke: 'none' }, title: 'Start' }],
      })
    } else if (def.kind === 'end') {
      const d = Math.round(m.font * 1.8)
      nodes.push({
        id: gid(def.id), width: d, height: d, shape: 'circle', parent,
        draw: (box) => {
          const inner = d * 0.5
          const dot: Box = { x: box.x + (box.width - inner) / 2, y: box.y + (box.height - inner) / 2, width: inner, height: inner }
          return [
            { kind: 'shape', role: 'end', id: def.id, d: shapePath('circle', box, m).d, paint: { fill: 'surface', tone: 'neutral', stroke: 'normal' }, title: 'End' },
            { kind: 'shape', role: 'end-dot', d: shapePath('circle', dot, m).d, paint: { fill: 'solid', tone: 'neutral', stroke: 'none' } },
          ]
        },
      })
    } else if (def.kind === 'choice') {
      const d = Math.round(m.font * 2)
      nodes.push({
        id: gid(def.id), width: d, height: d, shape: 'rhombus', parent,
        draw: (box) => [{ kind: 'shape', role: 'choice', id: def.id, d: shapePath('rhombus', box, m).d, paint, title: def.title }],
      })
    } else if (def.kind === 'fork' || def.kind === 'join') {
      const length = Math.round(m.font * 5)
      const thick = Math.max(6, Math.round(m.font * 0.5))
      const across = !horizontal(dirIn(def.parent))
      nodes.push({
        id: gid(def.id), width: across ? length : thick, height: across ? thick : length, parent,
        draw: (box) => [{ kind: 'shape', role: 'bar', id: def.id, d: rectPath(box, 2), paint: { fill: 'solid', tone: style.tone ?? 'neutral', stroke: 'none' }, title: `${def.kind}: ${def.title}` }],
      })
    } else {
      const title = labelBlock(flat(def.title), m.wrap, m.font, m.lineHeight, def.descriptions.length > 0)
      const descLines = def.descriptions.flatMap(flat).filter((l) => l !== '')
      const desc = labelBlock(descLines, m.wrap, m.font, m.lineHeight)
      const gap = Math.round(m.padY * 0.6)
      const width = Math.max(title.width, desc.width) + 2 * m.padX
      const height = descLines.length ? title.height + desc.height + 2 * gap + 2 * m.padY : title.height + 2 * m.padY
      nodes.push({
        id: gid(def.id),
        width: Math.max(width, m.font * 3.5),
        height: Math.max(height, m.lineHeight + 2 * m.padY),
        parent,
        draw: (box) => {
          const items: RenderItem[] = [{ kind: 'shape', role: 'node', id: def.id, d: rectPath(box, m.radius), paint }]
          const cx = r2(box.x + box.width / 2)
          if (!descLines.length) {
            items.push({ kind: 'text', role: 'node-label', x: cx, y: r2(box.y + box.height / 2), lines: title.lines, anchor: 'middle', size: m.font })
            return items
          }
          const top = box.y + (box.height - (title.height + desc.height + 2 * gap)) / 2
          const ruleY = top + title.height + gap
          items.push({ kind: 'text', role: 'node-label', x: cx, y: r2(top + title.height / 2), lines: title.lines, anchor: 'middle', size: m.font, bold: true })
          items.push({ kind: 'path', role: 'node-divider', d: `M${r2(box.x)},${r2(ruleY)}H${r2(box.x + box.width)}`, style: 'solid', faint: true })
          items.push({ kind: 'text', role: 'node-description', x: r2(box.x + m.padX), y: r2(ruleY + gap + desc.height / 2), lines: desc.lines, anchor: 'start', size: m.font })
          return items
        },
      })
    }
  }

  // notes sit beside their state: both go into an invisible group laid out across the flow, left notes before the state
  const edges: GraphEdge[] = []
  // hidden edges chain the regions of a composite so they stay in order across the flow; they come first in the list so
  // a transition pointing back to an earlier region is the one the layout reverses
  for (const def of ast.states) {
    for (let k = 1; def.kind === 'composite' && k < regionCount(def.id); k++) {
      edges.push({ id: `rc:${def.id}|${k}`, from: regionId(def.id, k), to: regionId(def.id, k + 1), style: 'solid', hidden: true })
    }
  }
  const noteAt = Math.round(m.font * 0.8)
  for (const [target, list] of notesOf) {
    const def = byId.get(target)!
    clusters.push({ id: `g:${target}`, parent: containerOf(def), title: '', direction: horizontal(dirIn(def.parent)) ? 'TB' : 'LR' })
    for (const n of list) {
      const block = labelBlock(n.lines.flatMap(flat), m.wrap, m.font, m.lineHeight)
      const width = block.width + 2 * m.padX + noteAt / 2
      const height = block.height + 2 * m.padY
      nodes.push({
        id: `n:${n.index}`, width, height, parent: `g:${target}`,
        draw: (box) => {
          const { x, y, width: w, height: h } = box
          const c = Math.min(noteAt, h / 2, w / 2)
          return [
            { kind: 'shape', role: 'note', id: `note${n.index}`, d: `M${r2(x)},${r2(y)}H${r2(x + w - c)}L${r2(x + w)},${r2(y + c)}V${r2(y + h)}H${r2(x)}Z`, paint: { fill: 'muted', tone: 'neutral', stroke: 'thin' } },
            { kind: 'path', role: 'note-fold', d: `M${r2(x + w - c)},${r2(y)}V${r2(y + c)}H${r2(x + w)}`, style: 'solid', faint: true },
            { kind: 'text', role: 'note-text', x: r2(x + m.padX), y: r2(y + h / 2), lines: block.lines, anchor: 'start', size: m.font },
          ]
        },
      })
      const left = n.side === 'left'
      edges.push({ id: `c${n.index}`, from: left ? `n:${n.index}` : gid(target), to: left ? gid(target) : `n:${n.index}`, style: 'dotted' })
    }
  }

  ast.transitions.forEach((t) => {
    edges.push({ id: `t${t.index}`, from: gid(t.from), to: gid(t.to), label: t.label, style: 'solid', markerEnd: 'arrow' })
  })

  const drawing = drawGraph({ nodes, edges, clusters, direction }, m, opts.edgeStyle ?? 'curved')
  const hidden = (id?: string): boolean => id !== undefined && (id.startsWith('g:') || id.startsWith('r:'))
  const items = drawing.items.filter((it) => !(it.kind === 'shape' && it.role === 'cluster' && hidden(it.id)) && !(it.kind === 'text' && it.role === 'cluster-title' && it.lines.every((l) => l === '')))

  // dashed dividers between the regions of a concurrent composite, from the composite's top (below its title) to its bottom
  const dividers: RPath[] = []
  for (const def of ast.states) {
    const box = def.kind === 'composite' && regionCount(def.id) > 1 ? drawing.layout.clusters.get(gid(def.id)) : undefined
    if (!box) continue
    const stacked = horizontal(dirIn(def.id))
    const regions = Array.from({ length: regionCount(def.id) }, (_, i) => drawing.layout.clusters.get(regionId(def.id, i + 1))!)
    for (let k = 1; k < regions.length; k++) {
      const before = regions[k - 1]!
      const after = regions[k]!
      const at = stacked ? (before.y + before.height + after.y) / 2 : (before.x + before.width + after.x) / 2
      const d = stacked
        ? `M${r2(box.x + m.margin)},${r2(at + m.margin)}H${r2(box.x + box.width + m.margin)}`
        : `M${r2(at + m.margin)},${r2(box.y + box.titleHeight + m.margin)}V${r2(box.y + box.height + m.margin)}`
      dividers.push({ kind: 'path', role: 'region-divider', id: `${regionId(def.id, k + 1)}`, d, style: 'dashed', faint: true })
    }
  }
  // after the cluster frames, before edges and nodes
  const firstOther = items.findIndex((it) => it.role !== 'cluster' && it.role !== 'cluster-title')
  items.splice(firstOther < 0 ? items.length : firstOther, 0, ...dividers)

  // text alternative
  const titleOf = (def: StateDef): string => cleanLabel(def.title).join(' ')
  const labelOf = (id: string, scoped = false): string => {
    const def = byId.get(id)!
    const parent = def.parent ? byId.get(def.parent) : undefined
    if (def.kind === 'start') return scoped && parent ? `Start of ${titleOf(parent)}` : 'Start'
    if (def.kind === 'end') return scoped && parent ? `End of ${titleOf(parent)}` : 'End'
    return titleOf(def)
  }
  const KIND_NOTE: Partial<Record<StateDef['kind'], string>> = { composite: 'composite state', choice: 'choice', fork: 'fork', join: 'join' }
  const vertical = horizontal(direction)
  const reverse = direction === 'BT' || direction === 'RL'
  const positioned = ast.states.map((def) => ({ def, box: drawing.layout.nodes.get(gid(def.id)) ?? drawing.layout.clusters.get(gid(def.id))! }))
  positioned.sort((a, b) => {
    const k = reverse ? -1 : 1
    const pa = (vertical ? a.box.x : a.box.y) * k
    const pb = (vertical ? b.box.x : b.box.y) * k
    const ca = vertical ? a.box.y : a.box.x
    const cb = vertical ? b.box.y : b.box.x
    return Math.abs(pa - pb) > 1 ? pa - pb : ca - cb
  })
  // composite members follow their composite, region by region (flow order inside a region)
  const kids = new Map<string, StateDef[]>()
  for (const { def } of positioned) kids.set(def.parent ?? '', [...(kids.get(def.parent ?? '') ?? []), def])
  const ordered: StateDef[] = []
  const walk = (parent: string): void => {
    const list = kids.get(parent) ?? []
    for (const def of [...list].sort((a, b) => (a.region ?? 1) - (b.region ?? 1))) {
      ordered.push(def)
      walk(def.id)
    }
  }
  walk('')
  const stateItems = ordered.map((def) => {
    const parent = def.parent ? byId.get(def.parent) : undefined
    const kind = def.kind === 'composite' && regionCount(def.id) > 1 ? `${regionCount(def.id)} concurrent regions` : KIND_NOTE[def.kind]
    const where = parent ? `inside ${titleOf(parent)}${regionCount(parent.id) > 1 ? `, region ${Math.min(def.region ?? 1, regionCount(parent.id))}` : ''}` : ''
    const extra = [kind, where].filter(Boolean).join(', ')
    const desc = def.descriptions.flatMap(flat).filter((l) => l !== '')
    return `${labelOf(def.id)}${extra ? ` (${extra})` : ''}${desc.length ? `: ${desc.join('; ')}` : ''}`
  })
  const transitionItems = ast.transitions.map((t) => {
    const label = t.label ? cleanLabel(t.label).join(' ') : ''
    return `${labelOf(t.from, true)} to ${labelOf(t.to, true)}${label ? `: ${label}` : ''}`
  })
  const sections: TextAlt['sections'] = [
    { title: 'States', ordered: true, items: stateItems },
    { title: 'Transitions', ordered: false, items: transitionItems },
  ]
  if (ast.notes.length) {
    sections.push({ title: 'Notes', ordered: false, items: ast.notes.map((n) => `${labelOf(n.target)}, note on the ${n.side}: ${n.lines.flatMap(flat).join(' ')}`) })
  }

  const composites = ast.states.filter((s) => s.kind === 'composite').length
  const withGroups = composites ? `, with ${plural(composites, 'composite state')}` : ''
  return {
    type: 'state',
    title: ast.meta.title,
    width: drawing.width,
    height: drawing.height,
    items,
    alt: { sections },
    summary: `State diagram with ${plural(real.length, 'state')} and ${plural(ast.transitions.length, 'transition')}${withGroups}, ${DIRECTION_PHRASE[direction]}`,
    nodes: real.length,
    edges: ast.transitions.length,
    fontSize: m.font,
  }
}

