/**
 * `timeline` renderer. One column per period: bold period label above a horizontal axis with a dot, event cards below
 * (wrapped to `m.wrap`). Sections are labelled bands over their columns. When the total width would pass about 900px
 * at the md size, columns wrap onto further rows, each with its own axis.
 */
import { checkLimits, rectPath } from '../../_diagram/graph'
import { circlePath, packColumns, rowLimit } from '../../_diagram/timelineRows'
import { cleanLabel, labelBlock, plural, r2, truncateToWidth } from '../../_diagram/text'
import { ParseFail, type DiagramTone, type Metrics, type RenderItem, type RenderModel, type RenderOptions } from '../../_diagram/types'
import type { TimelineAst } from '../parse/timeline'

interface Col {
  index: number
  label: string[]
  labelH: number
  cards: { lines: string[]; w: number; h: number }[]
  w: number
  cardsH: number
}

export function renderTimeline(ast: TimelineAst, opts: RenderOptions, m: Metrics): RenderModel {
  if (ast.periods.length === 0) throw new ParseFail(1, 1, 'This timeline has no periods. Add one such as "2004 : Launch".', 'empty')
  const eventCount = ast.periods.reduce((n, p) => n + p.events.length, 0)
  checkLimits(eventCount, 0, opts)

  const f = m.font
  const accent: DiagramTone = opts.tone ?? 'neutral'
  const dotTone: DiagramTone = accent === 'neutral' ? 'primary' : accent
  const cardGap = Math.round(m.padY * 0.9)
  const colGap = m.nodeSep
  const hasSections = ast.sections.length > 0

  const cols: Col[] = ast.periods.map((p, index) => {
    const label = labelBlock(cleanLabel(p.label), m.wrap, f, m.lineHeight, true)
    const cards = p.events.map((e) => {
      const b = labelBlock(cleanLabel(e), m.wrap - 2 * m.padX, f, m.lineHeight)
      return { lines: b.lines, w: Math.ceil(b.width + 2 * m.padX), h: Math.ceil(b.height + 2 * m.padY) }
    })
    const w = Math.max(Math.ceil(label.width), f * 5, ...cards.map((c) => c.w))
    const cardsH = cards.reduce((n, c) => n + c.h, 0) + Math.max(0, cards.length - 1) * cardGap
    return { index, label: label.lines, labelH: label.height, cards, w, cardsH }
  })

  const limit = rowLimit(f)
  const rows = packColumns(cols.map((c) => c.w), colGap, limit)
  const bandH = m.lineHeight + Math.round(m.padY * 0.8)
  const dotR = Math.max(4, Math.round(f * 0.35))
  const stem = Math.round(m.padY * 1.2)

  const items: RenderItem[] = []
  let y = m.margin
  let maxW = 0
  const sectionName = (i: number): string => (i >= 0 ? ast.sections[i]!.name : '')

  for (const row of rows) {
    const rowCols = row.map((i) => cols[i]!)
    const rowW = rowCols.reduce((n, c) => n + c.w, 0) + (rowCols.length - 1) * colGap
    maxW = Math.max(maxW, rowW)
    const labelH = Math.max(...rowCols.map((c) => c.labelH))
    const cardsH = Math.max(...rowCols.map((c) => c.cardsH))
    const anySection = hasSections && rowCols.some((c) => ast.periods[c.index]!.section >= 0)
    const top = y
    const ext = Math.min(colGap / 2 - 2, m.margin - 2)
    const bandTop = top
    const labelTop = bandTop + (anySection ? bandH + m.padY * 0.6 : 0)
    const axisY = labelTop + labelH + m.padY * 0.8 + dotR
    const cardsTop = axisY + dotR + stem
    const bottom = cardsTop + cardsH

    // column x positions
    const xs: number[] = []
    let x = m.margin
    for (const c of rowCols) {
      xs.push(x)
      x += c.w + colGap
    }

    // section bands: runs of equal section within the row
    if (anySection) {
      let i = 0
      while (i < rowCols.length) {
        const s = ast.periods[rowCols[i]!.index]!.section
        let j = i
        while (j + 1 < rowCols.length && ast.periods[rowCols[j + 1]!.index]!.section === s) j++
        if (s >= 0) {
          const bx = xs[i]! - ext
          const bw = xs[j]! + rowCols[j]!.w + ext - bx
          items.push({ kind: 'shape', role: 'section-band', d: rectPath({ x: bx, y: bandTop, width: bw, height: bandH }, Math.min(m.radius, 8)), paint: { fill: 'muted', tone: 'neutral', stroke: s % 2 === 0 ? 'none' : 'thin' } })
          if (s % 2 === 1) items.push({ kind: 'shape', role: 'section-body', d: rectPath({ x: bx, y: bandTop + bandH + 2, width: bw, height: bottom - bandTop - bandH - 2 }, Math.min(m.radius, 8)), paint: { fill: 'muted', tone: 'neutral', stroke: 'none' } })
          const name = cleanLabel(sectionName(s)).join(' ')
          const shown = truncateToWidth(name, bw - 2 * m.padX, f)
          items.push({ kind: 'text', role: 'section-label', x: r2(bx + bw / 2), y: r2(bandTop + bandH / 2), lines: [shown], anchor: 'middle', size: f, bold: true, ...(shown !== name ? { title: name } : {}) })
        }
        i = j + 1
      }
    }

    // axis
    items.push({ kind: 'path', role: 'axis', d: `M${r2(m.margin - colGap / 4)},${r2(axisY)}H${r2(m.margin + rowW + colGap / 4)}`, style: 'solid' })
    rowCols.forEach((c, k) => {
      const cx = xs[k]! + c.w / 2
      items.push({ kind: 'text', role: 'period-label', x: r2(cx), y: r2(labelTop + labelH - c.labelH / 2), lines: c.label, anchor: 'middle', size: f, bold: true })
      items.push({ kind: 'shape', role: 'period-dot', d: circlePath(cx, axisY, dotR), paint: { fill: 'solid', tone: dotTone, stroke: 'none' } })
      let cy = cardsTop
      c.cards.forEach((card, ci) => {
        if (ci === 0) items.push({ kind: 'path', role: 'stem', d: `M${r2(cx)},${r2(axisY + dotR)}V${r2(cy)}`, style: 'solid', faint: true })
        const bx = cx - card.w / 2
        items.push({ kind: 'shape', role: 'event-card', d: rectPath({ x: bx, y: cy, width: card.w, height: card.h }, m.radius), paint: { fill: 'surface', tone: accent, stroke: 'normal' } })
        items.push({ kind: 'text', role: 'event-label', x: r2(cx), y: r2(cy + card.h / 2), lines: card.lines, anchor: 'middle', size: f })
        cy += card.h + cardGap
      })
    })
    y = bottom + m.padY * 2
  }

  // text alternative
  const periodItems = ast.periods.map((p) => {
    const label = cleanLabel(p.label).join(' ')
    const events = p.events.map((e) => cleanLabel(e).join(' '))
    return events.length ? `${label}: ${events.join(', ')}` : label
  })
  const sections = [{ title: 'Periods', ordered: true, items: periodItems }]
  if (hasSections) {
    sections.push({
      title: 'Sections',
      ordered: false,
      items: ast.sections.map((s, si) => {
        const names = ast.periods.filter((p) => p.section === si).map((p) => cleanLabel(p.label).join(' '))
        return `${cleanLabel(s.name).join(' ')}: ${names.length ? names.join(', ') : 'no periods'}`
      }),
    })
  }
  const secs = hasSections ? ` in ${plural(ast.sections.length, 'section')}` : ''
  return {
    type: 'timeline',
    ...(ast.meta.title ? { title: ast.meta.title } : {}),
    width: Math.ceil(maxW + 2 * m.margin),
    height: Math.ceil(y - m.padY * 2 + m.margin),
    items,
    alt: { sections },
    summary: `Timeline with ${plural(ast.periods.length, 'period')} and ${plural(eventCount, 'event')}${secs}`,
    nodes: eventCount,
    edges: 0,
    fontSize: f,
  }
}
