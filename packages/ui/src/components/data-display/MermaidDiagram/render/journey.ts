/**
 * `journey` renderer. An actor legend on top (a distinct marker shape plus the name, so actors differ by shape and
 * text, not colour), then rows of task cards under section bands. Each card holds the task name, a score face placed at
 * a height that follows the score, the score as text ("4 of 5") and the actors with their markers. A line joins the
 * faces of a row. Rows wrap when the width would pass about 900px at the md size.
 */
import { checkLimits, rectPath } from '../../_diagram/graph'
import { MARKER_SHAPES, circlePath, markerPath, packColumns, rowLimit } from '../../_diagram/timelineRows'
import { cleanLabel, labelBlock, measureText, plural, r2, truncateToWidth } from '../../_diagram/text'
import { ParseFail, type DiagramTone, type Metrics, type RenderItem, type RenderModel, type RenderOptions } from '../../_diagram/types'
import type { JourneyAst } from '../parse/journey'

interface Col {
  index: number
  name: string[]
  nameH: number
  actors: { text: string; shown: string }[]
  w: number
}

export function renderJourney(ast: JourneyAst, opts: RenderOptions, m: Metrics): RenderModel {
  if (ast.tasks.length === 0) throw new ParseFail(1, 1, 'This journey has no tasks. Add one such as "Order online: 4: Customer".', 'empty')
  checkLimits(ast.tasks.length, 0, opts)

  const f = m.font
  const accent: DiagramTone = opts.tone ?? 'neutral'
  const lineTone: DiagramTone = accent === 'neutral' ? 'primary' : accent
  const r = Math.round(f * 1.05)
  const step = Math.round(r * 0.8)
  const mr = Math.max(4, Math.round(f * 0.38))
  const colGap = Math.round(m.nodeSep * 0.6)
  const hasSections = ast.sections.some((s) => s.name !== '')
  const limit = rowLimit(f)
  const items: RenderItem[] = []
  const markerOf = (actor: string): (typeof MARKER_SHAPES)[number] => MARKER_SHAPES[ast.actors.indexOf(actor) % MARKER_SHAPES.length]!

  // legend
  let y = m.margin
  let maxW = 0
  if (ast.actors.length) {
    const legendGap = Math.round(f * 1.4)
    const entries = [{ label: 'Actors', actor: undefined as string | undefined }, ...ast.actors.map((a) => ({ label: cleanLabel(a).join(' '), actor: a as string | undefined }))].map((e) => ({ ...e, w: e.actor === undefined ? measureText(e.label, f, true) : 2 * mr + 6 + measureText(e.label, f) }))
    const rows = packColumns(entries.map((e) => e.w), legendGap, limit)
    for (const row of rows) {
      let x = m.margin
      const cy = y + m.lineHeight / 2
      for (const i of row) {
        const e = entries[i]!
        if (e.actor === undefined) items.push({ kind: 'text', role: 'legend-title', x: r2(x), y: r2(cy), lines: [e.label], anchor: 'start', size: f, bold: true })
        else {
          items.push({ kind: 'shape', role: 'legend-marker', d: markerPath(markerOf(e.actor), x + mr, cy, mr), paint: { fill: 'solid', tone: lineTone, stroke: 'none' } })
          items.push({ kind: 'text', role: 'legend-label', x: r2(x + 2 * mr + 6), y: r2(cy), lines: [e.label], anchor: 'start', size: f })
        }
        x += e.w + legendGap
      }
      maxW = Math.max(maxW, x - legendGap - m.margin)
      y += m.lineHeight + Math.round(m.padY * 0.4)
    }
    y += m.padY
  }

  // columns
  const wrapW = Math.round(m.wrap * 0.75)
  const cols: Col[] = ast.tasks.map((t, index) => {
    const name = labelBlock(cleanLabel(t.name), wrapW, f, m.lineHeight)
    const actors = t.actors.map((a) => {
      const text = cleanLabel(a).join(' ')
      return { text, shown: truncateToWidth(text, wrapW - 2 * mr - 6, f) }
    })
    const actorW = Math.max(0, ...actors.map((a) => 2 * mr + 6 + measureText(a.shown, f)))
    const w = Math.ceil(Math.max(f * 7, name.width, actorW, measureText('5 of 5', f), 2 * r + 4) + 2 * m.padX)
    return { index, name: name.lines, nameH: name.height, actors, w }
  })
  const rows = packColumns(cols.map((c) => c.w), colGap, limit)
  const bandH = m.lineHeight + Math.round(m.padY * 0.8)
  const areaH = 4 * step + 2 * r + m.lineHeight + 4

  for (const row of rows) {
    const rc = row.map((i) => cols[i]!)
    const rowW = rc.reduce((n, c) => n + c.w, 0) + (rc.length - 1) * colGap
    maxW = Math.max(maxW, rowW)
    const nameH = Math.max(...rc.map((c) => c.nameH))
    const actorsH = Math.max(...rc.map((c) => c.actors.length)) * m.lineHeight
    const cardH = Math.ceil(m.padY + nameH + m.padY * 0.6 + areaH + (actorsH ? m.padY * 0.4 + actorsH : 0) + m.padY)
    const anySection = hasSections
    const cardTop = y + (anySection ? bandH + m.padY * 0.6 : 0)
    const xs: number[] = []
    let x = m.margin
    for (const c of rc) {
      xs.push(x)
      x += c.w + colGap
    }

    if (anySection) {
      let i = 0
      while (i < rc.length) {
        const s = ast.tasks[rc[i]!.index]!.section
        let j = i
        while (j + 1 < rc.length && ast.tasks[rc[j + 1]!.index]!.section === s) j++
        const name = cleanLabel(ast.sections[s]!.name).join(' ')
        if (name) {
          const bw = xs[j]! + rc[j]!.w - xs[i]!
          items.push({ kind: 'shape', role: 'section-band', d: rectPath({ x: xs[i]!, y, width: bw, height: bandH }, Math.min(m.radius, 8)), paint: { fill: 'muted', tone: 'neutral', stroke: s % 2 === 0 ? 'none' : 'thin' } })
          const shown = truncateToWidth(name, bw - 2 * m.padX, f)
          items.push({ kind: 'text', role: 'section-label', x: r2(xs[i]! + bw / 2), y: r2(y + bandH / 2), lines: [shown], anchor: 'middle', size: f, bold: true, ...(shown !== name ? { title: name } : {}) })
        }
        i = j + 1
      }
    }

    const areaTop = cardTop + m.padY + nameH + m.padY * 0.6
    const faces: { cx: number; cy: number; score: number }[] = []
    rc.forEach((c, k) => {
      const t = ast.tasks[c.index]!
      const cx = xs[k]! + c.w / 2
      items.push({ kind: 'shape', role: 'task-card', d: rectPath({ x: xs[k]!, y: cardTop, width: c.w, height: cardH }, m.radius), paint: { fill: 'surface', tone: accent, stroke: 'thin' } })
      items.push({ kind: 'text', role: 'task-label', x: r2(cx), y: r2(cardTop + m.padY + c.nameH / 2), lines: c.name, anchor: 'middle', size: f })
      const cy = areaTop + r + (5 - t.score) * step
      faces.push({ cx, cy, score: t.score })
      items.push({ kind: 'text', role: 'score-text', x: r2(cx), y: r2(cy + r + m.lineHeight / 2 + 2), lines: [`${t.score} of 5`], anchor: 'middle', size: f, bold: true })
      const first = areaTop + areaH + m.padY * 0.4
      c.actors.forEach((a, ai) => {
        const ay = first + ai * m.lineHeight + m.lineHeight / 2
        const left = xs[k]! + m.padX
        items.push({ kind: 'shape', role: 'actor-marker', d: markerPath(markerOf(t.actors[ai]!), left + mr, ay, mr), paint: { fill: 'solid', tone: lineTone, stroke: 'none' } })
        items.push({ kind: 'text', role: 'actor-label', x: r2(left + 2 * mr + 6), y: r2(ay), lines: [a.shown], anchor: 'start', size: f, ...(a.shown !== a.text ? { title: a.text } : {}) })
      })
    })
    if (faces.length > 1) items.push({ kind: 'path', role: 'score-line', d: faces.map((p, i) => `${i ? 'L' : 'M'}${r2(p.cx)},${r2(p.cy)}`).join(''), style: 'solid', thick: true, tone: lineTone })
    for (const p of faces) {
      items.push({ kind: 'shape', role: 'face', d: circlePath(p.cx, p.cy, r), paint: { fill: 'surface', tone: 'neutral', stroke: 'normal' } })
      for (const sx of [-1, 1]) items.push({ kind: 'shape', role: 'face-eye', d: circlePath(p.cx + sx * r * 0.35, p.cy - r * 0.25, r * 0.1), paint: { fill: 'solid', tone: 'neutral', stroke: 'none' } })
      const bend = ((p.score - 3) * r * 0.45)
      const my = p.cy + r * 0.3
      items.push({ kind: 'path', role: 'face-mouth', d: `M${r2(p.cx - r * 0.5)},${r2(my)}Q${r2(p.cx)},${r2(my + bend)} ${r2(p.cx + r * 0.5)},${r2(my)}`, style: 'solid' })
    }
    y = cardTop + cardH + m.padY * 1.5
  }

  const taskItems = ast.tasks.map((t) => {
    const sec = ast.sections[t.section]!.name
    const actors = t.actors.length ? `, actors ${t.actors.map((a) => cleanLabel(a).join(' ')).join(', ')}` : ''
    return `${sec ? `${cleanLabel(sec).join(' ')} / ` : ''}${cleanLabel(t.name).join(' ')}: score ${t.score} of 5${actors}`
  })
  const sections = [{ title: 'Tasks', ordered: true, items: taskItems }]
  if (ast.actors.length) sections.push({ title: 'Actors', ordered: false, items: ast.actors.map((a) => cleanLabel(a).join(' ')) })
  const named = ast.sections.filter((s) => s.name !== '').length
  const secs = named ? ` in ${plural(named, 'section')}` : ''
  const act = ast.actors.length ? ` and ${plural(ast.actors.length, 'actor')}` : ''
  return {
    type: 'journey',
    ...(ast.meta.title ? { title: ast.meta.title } : {}),
    width: Math.ceil(maxW + 2 * m.margin),
    height: Math.ceil(y - m.padY * 1.5 + m.margin),
    items,
    alt: { sections },
    summary: `User journey with ${plural(ast.tasks.length, 'task')}${secs}${act}`,
    nodes: ast.tasks.length,
    edges: 0,
    fontSize: f,
  }
}
