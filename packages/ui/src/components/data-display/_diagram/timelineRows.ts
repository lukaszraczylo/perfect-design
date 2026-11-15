/**
 * Small geometry helpers shared by the timeline and journey renderers: wrapping columns into rows and a few path
 * builders for dots and markers.
 */
import { r2 } from './text'

/** Natural row width in px at the md size; scaled with the font. */
export const rowLimit = (font: number): number => Math.round(900 * (font / 14))

/** Greedy packing: indexes of the columns of each row; every row holds at least one column. */
export function packColumns(widths: number[], gap: number, limit: number): number[][] {
  const rows: number[][] = []
  let cur: number[] = []
  let used = 0
  widths.forEach((w, i) => {
    const next = cur.length === 0 ? w : used + gap + w
    if (cur.length > 0 && next > limit) {
      rows.push(cur)
      cur = [i]
      used = w
    } else {
      cur.push(i)
      used = next
    }
  })
  if (cur.length) rows.push(cur)
  return rows
}

export const circlePath = (cx: number, cy: number, r: number): string =>
  `M${r2(cx - r)},${r2(cy)}A${r2(r)},${r2(r)} 0 1,0 ${r2(cx + r)},${r2(cy)}A${r2(r)},${r2(r)} 0 1,0 ${r2(cx - r)},${r2(cy)}Z`

export const diamondPath = (cx: number, cy: number, r: number): string => `M${r2(cx - r)},${r2(cy)}L${r2(cx)},${r2(cy - r)}L${r2(cx + r)},${r2(cy)}L${r2(cx)},${r2(cy + r)}Z`

export const squarePath = (cx: number, cy: number, r: number): string => `M${r2(cx - r)},${r2(cy - r)}H${r2(cx + r)}V${r2(cy + r)}H${r2(cx - r)}Z`

export const trianglePath = (cx: number, cy: number, r: number): string => `M${r2(cx)},${r2(cy - r)}L${r2(cx + r)},${r2(cy + r * 0.8)}L${r2(cx - r)},${r2(cy + r * 0.8)}Z`

export const MARKER_SHAPES = ['circle', 'square', 'diamond', 'triangle'] as const
export type MarkerShape = (typeof MARKER_SHAPES)[number]

export function markerPath(shape: MarkerShape, cx: number, cy: number, r: number): string {
  if (shape === 'circle') return circlePath(cx, cy, r)
  if (shape === 'square') return squarePath(cx, cy, r)
  if (shape === 'diamond') return diamondPath(cx, cy, r * 1.15)
  return trianglePath(cx, cy, r * 1.1)
}
