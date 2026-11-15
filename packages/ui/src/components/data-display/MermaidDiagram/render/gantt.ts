/**
 * `gantt` renderer. Layout: label column on the left (bold section names, task names), a tick axis on top, faint
 * gridlines, one bar per task. State is never colour alone: done = outline bar with a check mark, active = solid bar with a
 * thick outline, critical = danger tone with a thick outline, milestone = diamond; each also prints its status as text.
 * Tick labels use a fixed readable format (time, day, week start or month) and ignore `axisFormat`.
 */
import { checkLimits, rectPath } from '../../_diagram/graph'
import { formatDateTime, makeTicks, MS_DAY, MS_HOUR } from '../../_diagram/ganttDates'
import { cleanLabel, labelBlock, measureText, plural, r2, truncateToWidth } from '../../_diagram/text'
import { ParseFail, type DiagramTone, type Metrics, type Paint, type RenderItem, type RenderModel, type RenderOptions } from '../../_diagram/types'
import type { GanttAst, GanttTask } from '../parse/gantt'

const MAX_NAME_LINES = 3

function statusWords(t: GanttTask): string[] {
  const out: string[] = []
  if (t.milestone) out.push('milestone')
  if (t.crit) out.push('critical')
  if (t.done) out.push('done')
  if (t.active) out.push('active')
  return out
}

export function renderGantt(ast: GanttAst, opts: RenderOptions, m: Metrics): RenderModel {
  if (ast.tasks.length === 0) throw new ParseFail(1, 1, 'This Gantt chart has no tasks. Add one such as "Design :2026-03-01, 5d".', 'empty')
  const edges = ast.tasks.reduce((n, t) => n + t.deps.length, 0)
  checkLimits(ast.tasks.length, edges, opts)

  const accent: DiagramTone = opts.tone && opts.tone !== 'neutral' ? opts.tone : 'primary'
  const f = m.font
  const dateText = (ms: number): string => formatDateTime(ms, ast.hasTime)

  // time range
  let from = Infinity
  let to = -Infinity
  for (const t of ast.tasks) {
    from = Math.min(from, t.start)
    to = Math.max(to, t.end)
  }
  if (to <= from) to = from + (ast.hasTime ? MS_HOUR : MS_DAY)
  const span = to - from

  // groups of tasks per section (empty sections are not drawn)
  const groups = ast.sections
    .map((s, i) => ({ name: s.name, tasks: ast.tasks.filter((t) => t.section === i) }))
    .filter((g) => g.tasks.length > 0)

  // label column
  const indent = Math.round(m.padX * 0.8)
  const nameMax = Math.round(m.wrap * 0.95)
  let labelW = f * 6
  for (const g of groups) {
    if (g.name) labelW = Math.max(labelW, measureText(cleanLabel(g.name).join(' '), f, true) + 2 * m.padX)
    for (const t of g.tasks) labelW = Math.max(labelW, measureText(cleanLabel(t.name).join(' '), f) + 2 * m.padX + indent)
  }
  labelW = Math.min(Math.ceil(labelW), nameMax + 2 * m.padX + indent)
  const nameWidth = labelW - 2 * m.padX - indent

  // status and milestone text to the right of bars
  const barH = Math.round(f * 1.3)
  const half = Math.round(barH * 0.65)
  const sideText = (t: GanttTask): string => {
    const words = statusWords(t)
    if (t.milestone) return [dateText(t.start), ...words.filter((w) => w !== 'milestone')].join(', ')
    return words.join(', ')
  }
  let reserve = 0
  for (const t of ast.tasks) reserve = Math.max(reserve, measureText(sideText(t), f, false))

  const plotW = Math.round(f * 40)
  const leftInset = half + 4
  const ticksAll = makeTicks(from, to, ast.hasTime)
  const px = (ms: number): number => leftInset + ((ms - from) / span) * plotW
  // keep ticks whose labels do not collide
  const ticks: { x: number; label: string; w: number }[] = []
  let lastRight = -Infinity
  for (const tk of ticksAll) {
    const w = measureText(tk.label, f)
    const x = px(tk.at)
    if (x - w / 2 >= lastRight + f * 0.8) {
      ticks.push({ x, label: tk.label, w })
      lastRight = x + w / 2
    }
  }
  const tickHalf = ticks.length ? ticks[ticks.length - 1]!.w / 2 : 0
  const rightPad = Math.ceil(Math.max(reserve + 12 + half, tickHalf + 8, 16))
  const innerW = leftInset + plotW + rightPad
  const totalW = labelW + innerW

  // rows
  const axisH = m.lineHeight + m.padY
  const secH = m.lineHeight + Math.round(m.padY * 0.8)
  interface Row { kind: 'section' | 'task'; y: number; h: number; lines: string[]; full?: string; task?: GanttTask }
  const rows: Row[] = []
  const bands: { y: number; h: number }[] = []
  let y = axisH
  groups.forEach((g, gi) => {
    const top = y
    if (g.name) {
      const secName = cleanLabel(g.name).join(' ')
      const shown = truncateToWidth(secName, labelW - 2 * m.padX, f)
      rows.push({ kind: 'section', y, h: secH, lines: [shown], full: shown !== secName ? secName : undefined })
      y += secH
    }
    for (const t of g.tasks) {
      const full = cleanLabel(t.name).join(' ')
      const block = labelBlock([full], nameWidth, f, m.lineHeight)
      let lines = block.lines
      let truncated = false
      if (lines.length > MAX_NAME_LINES) {
        lines = lines.slice(0, MAX_NAME_LINES)
        lines[MAX_NAME_LINES - 1] = truncateToWidth(`${lines[MAX_NAME_LINES - 1]!} ${block.lines[MAX_NAME_LINES]!}`, nameWidth, f)
        truncated = true
      }
      const h = Math.max(barH + m.padY * 1.2, lines.length * m.lineHeight + m.padY * 0.8)
      rows.push({ kind: 'task', y, h, lines, full: truncated ? full : undefined, task: t })
      y += h
    }
    if (gi % 2 === 1) bands.push({ y: top, h: y - top })
  })
  const bodyH = y
  const x0 = m.margin
  const y0 = m.margin
  const items: RenderItem[] = []

  for (const b of bands) items.push({ kind: 'shape', role: 'section-band', d: rectPath({ x: x0, y: y0 + b.y, width: totalW, height: b.h }, 0), paint: { fill: 'muted', tone: 'neutral', stroke: 'none' } })

  // axis and gridlines
  const gx = x0 + labelW
  items.push({ kind: 'path', role: 'axis', d: `M${r2(x0)},${r2(y0 + axisH)}H${r2(x0 + totalW)}`, style: 'solid', faint: true })
  for (const tk of ticks) {
    items.push({ kind: 'path', role: 'gridline', d: `M${r2(gx + tk.x)},${r2(y0 + axisH)}V${r2(y0 + bodyH)}`, style: 'solid', faint: true })
    items.push({ kind: 'text', role: 'axis-label', x: r2(gx + tk.x), y: r2(y0 + axisH / 2), lines: [tk.label], anchor: 'middle', size: f, muted: true })
  }

  for (const r of rows) {
    const cy = y0 + r.y + r.h / 2
    if (r.kind === 'section') {
      items.push({ kind: 'text', role: 'section-label', x: r2(x0 + m.padX), y: r2(cy), lines: r.lines, anchor: 'start', size: f, bold: true, ...(r.full ? { title: r.full } : {}) })
      continue
    }
    const t = r.task!
    items.push({ kind: 'text', role: 'task-label', x: r2(x0 + m.padX + (groups.some((g) => g.name) ? indent : 0)), y: r2(cy), lines: r.lines, anchor: 'start', size: f, ...(r.full ? { title: r.full } : {}) })
    const tone: DiagramTone = t.crit ? 'danger' : accent
    const tip = `${cleanLabel(t.name).join(' ')}: ${t.milestone ? dateText(t.start) : `${dateText(t.start)} to ${dateText(t.end)}`}`
    const sx = gx + px(t.start)
    let right: number
    if (t.milestone) {
      const d = `M${r2(sx - half)},${r2(cy)}L${r2(sx)},${r2(cy - half)}L${r2(sx + half)},${r2(cy)}L${r2(sx)},${r2(cy + half)}Z`
      const paint: Paint = t.done ? { fill: 'surface', tone, stroke: t.crit ? 'thick' : 'normal' } : { fill: 'solid', tone, stroke: 'none' }
      items.push({ kind: 'shape', role: 'milestone', d, paint, title: tip })
      if (!t.done && (t.active || t.crit)) items.push({ kind: 'shape', role: 'task-outline', d, paint: { fill: 'none', tone: 'neutral', stroke: 'thick' } })
      right = sx + half
    } else {
      const w = Math.max(4, ((t.end - t.start) / span) * plotW)
      const box = { x: sx, y: cy - barH / 2, width: r2(w), height: barH }
      if (t.done) {
        items.push({ kind: 'shape', role: 'task', d: rectPath(box, m.radius), paint: { fill: 'surface', tone, stroke: t.crit ? 'thick' : 'normal' }, title: tip })
        if (w >= barH * 1.6) {
          const mx = sx + barH * 0.4
          items.push({ kind: 'path', role: 'done-mark', d: `M${r2(mx)},${r2(cy)}L${r2(mx + barH * 0.22)},${r2(cy + barH * 0.22)}L${r2(mx + barH * 0.6)},${r2(cy - barH * 0.22)}`, style: 'solid', thick: true, tone })
        }
      } else {
        items.push({ kind: 'shape', role: 'task', d: rectPath(box, m.radius), paint: { fill: 'solid', tone, stroke: 'none' }, title: tip })
        if (t.active || t.crit) {
          const o = 2
          items.push({ kind: 'shape', role: 'task-outline', d: rectPath({ x: box.x - o, y: box.y - o, width: box.width + 2 * o, height: box.height + 2 * o }, m.radius + o), paint: { fill: 'none', tone: 'neutral', stroke: 'thick' } })
        }
      }
      right = sx + box.width
    }
    const text = sideText(t)
    if (text) items.push({ kind: 'text', role: 'task-status', x: r2(right + 8), y: r2(cy), lines: [text], anchor: 'start', size: f, muted: true })
  }

  // text alternative
  const sectionOf = (t: GanttTask): string => ast.sections[t.section]!.name
  const taskItems = ast.tasks.map((t) => {
    const name = cleanLabel(t.name).join(' ')
    const sec = sectionOf(t)
    const when = t.milestone ? dateText(t.start) : `${dateText(t.start)} to ${dateText(t.end)}`
    const st = statusWords(t)
    return `${sec ? `${cleanLabel(sec).join(' ')}: ` : ''}${name}, ${when}${st.length ? ` (${st.join(', ')})` : ''}`
  })
  const sections = [{ title: 'Tasks', ordered: true, items: taskItems }]
  const deps = ast.tasks.filter((t) => t.deps.length)
  if (deps.length) sections.push({ title: 'Dependencies', ordered: false, items: deps.map((t) => `${cleanLabel(t.name).join(' ')} depends on ${t.deps.join(', ')}`) })

  return {
    type: 'gantt',
    ...(ast.meta.title ? { title: ast.meta.title } : {}),
    width: Math.ceil(totalW + 2 * m.margin),
    height: Math.ceil(bodyH + 2 * m.margin),
    items,
    alt: { sections },
    summary: `Gantt chart with ${plural(ast.tasks.length, 'task')} in ${plural(groups.length, 'section')}, from ${dateText(from)} to ${dateText(to)}`,
    nodes: ast.tasks.length,
    edges,
    fontSize: f,
  }
}
