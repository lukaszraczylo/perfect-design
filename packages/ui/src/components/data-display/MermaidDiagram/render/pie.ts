/**
 * Pie chart renderer. Slices run clockwise from 12 o'clock in source order, each one a separate shape in a categorical
 * chart slot with a thin gap between neighbours. Colour is never the only cue: percentages sit outside the pie on short
 * leader lines and the legend (right of the pie, or below when the labels are wide) repeats label, value and percentage.
 */
import { checkLimits, rectPath } from '../../_diagram/graph'
import { cleanLabel, measureText, plural, r2, wrapText } from '../../_diagram/text'
import { ParseFail, type ChartSlot, type Metrics, type RenderItem, type RenderModel, type RenderOptions } from '../../_diagram/types'
import type { PieAst } from '../parse/pie'

const SLOTS: readonly ChartSlot[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
/** Slices below this share get no label on the pie itself; the legend still lists them. */
const LABEL_FROM = 3
/** Natural width of the whole chart at the default font size. */
const MAX_WIDTH = 560

const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 10, useGrouping: false })
const num = (n: number): string => fmt.format(n)
const pct = (share: number): string => `${num(Math.round(share * 1000) / 10)}%`

interface Row {
  label: string
  value: number
  share: number
  slot: ChartSlot
  text: string
}

/** Push labels on one side apart so they do not overlap; keep them inside [lo, hi] when there is room. */
function spread(ys: number[], gap: number, lo: number, hi: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y || a.i - b.i)
  for (let k = 0; k < order.length; k++) order[k]!.y = Math.max(order[k]!.y, k === 0 ? lo : order[k - 1]!.y + gap)
  for (let k = order.length - 1; k >= 0; k--) order[k]!.y = Math.min(order[k]!.y, k === order.length - 1 ? hi : order[k + 1]!.y - gap)
  const out = ys.slice()
  for (const o of order) out[o.i] = o.y
  return out
}

export function renderPie(ast: PieAst, opts: RenderOptions, m: Metrics): RenderModel {
  if (ast.slices.length === 0) throw new ParseFail(1, 1, 'This pie has no slices. Add a line such as "Dogs" : 42.', 'empty')
  checkLimits(ast.slices.length, 0, opts)
  const total = ast.slices.reduce((s, x) => s + x.value, 0)
  if (!(total > 0)) throw new ParseFail(1, 1, 'The pie has no values greater than zero. Give at least one slice a value above 0.', 'empty')

  const font = m.font
  const lh = m.lineHeight
  const scale = font / 14
  const n = ast.slices.length
  const names = ast.slices.map((s) => cleanLabel(s.label).join(' ').trim() || s.label.trim())

  // neighbouring slices must not share a colour, including the last one next to the first
  const slots = ast.slices.map((_, i) => SLOTS[i % SLOTS.length]!)
  if (n > 1 && n % SLOTS.length === 1) slots[n - 1] = SLOTS[2]!
  const rows: Row[] = ast.slices.map((s, i) => {
    const share = s.value / total
    const text = ast.showData ? `${names[i]}: ${num(s.value)} (${pct(share)})` : `${names[i]}: ${pct(share)}`
    return { label: names[i]!, value: s.value, share, slot: slots[i]!, text }
  })

  // ---- pie block
  const R = Math.round(font * 7.86)
  const labelled = rows.filter((r) => r.share * 100 >= LABEL_FROM)
  const labelW = Math.max(measureText('100%', font), ...labelled.map((r) => measureText(pct(r.share), font)))
  const roomX = Math.ceil(labelW + 24)
  const roomY = Math.round(lh / 2) + 24
  const pieW = 2 * (R + roomX)
  const pieH = 2 * (R + roomY)

  // ---- legend
  const swatch = Math.round(font * 0.9)
  const textX = swatch + 8
  const rowGap = Math.round(font * 0.45)
  const maxW = Math.round(MAX_WIDTH * scale)
  const gap = Math.round(font * 1.7)
  const natural = Math.max(...rows.map((r) => measureText(r.text, font))) + textX
  const rightRoom = maxW - 2 * m.margin - pieW - gap
  const right = natural <= rightRoom
  const legendW = right ? Math.ceil(natural) : Math.min(Math.ceil(natural), maxW - 2 * m.margin)
  const legend = rows.map((r) => {
    const lines = wrapText(r.text, legendW - textX, font)
    return { lines, height: Math.max(lines.length * lh, swatch) }
  })
  const legendH = legend.reduce((s, l) => s + l.height, 0) + rowGap * (n - 1)

  const bodyW = right ? pieW + gap + legendW : Math.max(pieW, legendW)
  const bodyH = right ? Math.max(pieH, legendH) : pieH + gap + legendH
  const width = Math.ceil(bodyW + 2 * m.margin)
  const height = Math.ceil(bodyH + 2 * m.margin)
  const pieX = m.margin + (right ? 0 : (bodyW - pieW) / 2)
  const pieY = m.margin + (right ? (bodyH - pieH) / 2 : 0)
  const cx = pieX + roomX + R
  const cy = pieY + roomY + R

  const items: RenderItem[] = []
  const point = (a: number, r: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const xy = (a: number, r: number): string => {
    const [x, y] = point(a, r)
    return `${r2(x)},${r2(y)}`
  }

  // ---- slices
  const drawn = rows.filter((r) => r.value > 0)
  const half = 0.75
  const eps = Math.asin(Math.min(1, half / R))
  let angle = -Math.PI / 2
  const mids: { row: Row; mid: number }[] = []
  for (const r of rows) {
    if (r.value <= 0) continue
    const span = r.share * 2 * Math.PI
    const a1 = angle
    const a2 = angle + span
    angle = a2
    const mid = (a1 + a2) / 2
    mids.push({ row: r, mid })
    const paint = { fill: 'solid' as const, tone: r.slot, stroke: 'none' as const }
    const common = { kind: 'shape' as const, role: 'slice', paint, title: r.text, id: `slice-${rows.indexOf(r)}` }
    if (drawn.length === 1) {
      items.push({ ...common, d: `M${r2(cx - R)},${r2(cy)}A${R},${R} 0 1 1 ${r2(cx + R)},${r2(cy)}A${R},${R} 0 1 1 ${r2(cx - R)},${r2(cy)}Z` })
      continue
    }
    const gapped = span > 4 * eps
    const s1 = gapped ? a1 + eps : a1
    const s2 = gapped ? a2 - eps : a2
    // slices that are not huge move their tip away from the centre so the gap keeps a constant width
    const tip = gapped && span < 4.5 ? Math.min(R * 0.5, half / Math.sin(span / 2)) : 0
    const [tx, ty] = point(mid, tip)
    const large = s2 - s1 > Math.PI ? 1 : 0
    items.push({ ...common, d: `M${r2(tx)},${r2(ty)}L${xy(s1, R)}A${R},${R} 0 ${large} 1 ${xy(s2, R)}Z` })
  }

  // ---- percentages outside the pie, on short leaders
  const sides: Record<'left' | 'right', { row: Row; mid: number; y: number }[]> = { left: [], right: [] }
  for (const { row, mid } of mids) {
    if (row.share * 100 < LABEL_FROM) continue
    sides[Math.cos(mid) >= 0 ? 'right' : 'left'].push({ row, mid, y: point(mid, R + 16)[1] })
  }
  for (const side of ['left', 'right'] as const) {
    const list = sides[side]
    const ys = spread(list.map((e) => e.y), lh, cy - R - roomY + lh / 2 + 4, cy + R + roomY - lh / 2 - 4)
    list.forEach((e, k) => {
      const [px, py] = point(e.mid, R)
      const [ex, ey] = point(e.mid, R + 10)
      const lx = cx + (R + 16) * Math.cos(e.mid)
      const c = Math.cos(e.mid)
      const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end'
      items.push({ kind: 'path', role: 'leader', d: `M${r2(px)},${r2(py)}L${r2(ex)},${r2(ey)}L${r2(lx + (anchor === 'start' ? -4 : anchor === 'end' ? 4 : 0))},${r2(ys[k]!)}`, style: 'solid', faint: true })
      items.push({ kind: 'text', role: 'slice-label', x: r2(lx), y: r2(ys[k]!), lines: [pct(e.row.share)], anchor, size: font })
    })
  }

  // ---- legend
  const lx = right ? pieX + pieW + gap : m.margin + (bodyW - legendW) / 2
  let ly = right ? m.margin + (bodyH - legendH) / 2 : m.margin + pieH + gap
  rows.forEach((r, i) => {
    const l = legend[i]!
    const top = ly
    items.push({ kind: 'shape', role: 'legend-swatch', d: rectPath({ x: lx, y: top + (lh - swatch) / 2, width: swatch, height: swatch }, Math.min(m.radius, 3)), paint: { fill: 'solid', tone: r.slot, stroke: 'none' } })
    items.push({ kind: 'text', role: 'legend-label', x: r2(lx + textX), y: r2(top + (l.lines.length * lh) / 2), lines: l.lines, anchor: 'start', size: font })
    ly += l.height + rowGap
  })

  return {
    type: 'pie',
    title: ast.meta.title,
    width,
    height,
    items,
    alt: { sections: [{ title: 'Slices', ordered: false, items: rows.map((r) => `${r.label}: ${num(r.value)} (${pct(r.share)})`) }] },
    summary: `Pie chart with ${plural(n, 'slice')}, total ${num(total)}`,
    nodes: n,
    edges: 0,
    fontSize: font,
  }
}
