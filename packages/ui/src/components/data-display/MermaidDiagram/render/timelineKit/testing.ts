/** Test helpers for the gantt, timeline and journey renderers: model building, path walking and geometry checks. */
import { expect } from 'vitest'
import { measureText } from '../../../_diagram/text'
import type { RenderItem, RenderModel, RenderOptions, RText } from '../../../_diagram/types'
import { parseMermaid } from '../../parse'
import { renderModel } from '..'

export function model(source: string, opts: RenderOptions = {}): RenderModel {
  const p = parseMermaid(source)
  if (!p.ok) throw new Error(`parse failed: ${JSON.stringify(p.errors)}`)
  const r = renderModel(p.ast, opts)
  if (!r.ok) throw new Error(`render failed: ${JSON.stringify(r.error)}`)
  return r.model
}

export function renderError(source: string, opts: RenderOptions = {}) {
  const p = parseMermaid(source)
  if (!p.ok) throw new Error('parse failed')
  const r = renderModel(p.ast, opts)
  if (r.ok) throw new Error('expected a render error')
  return r.error
}

/** Absolute points visited by a path made of M L H V Q A Z (absolute) and h v (relative). */
export function pathPoints(d: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? []
  let cx = 0
  let cy = 0
  let i = 0
  let cmd = ''
  const num = (): number => Number(tokens[i++])
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i]!)) cmd = tokens[i++]!
    if (cmd === 'Z' || cmd === 'z') continue
    if (cmd === 'M' || cmd === 'L') { cx = num(); cy = num() }
    else if (cmd === 'H') cx = num()
    else if (cmd === 'V') cy = num()
    else if (cmd === 'h') cx += num()
    else if (cmd === 'v') cy += num()
    else if (cmd === 'Q') { num(); num(); cx = num(); cy = num() }
    else if (cmd === 'A') { num(); num(); num(); num(); num(); cx = num(); cy = num() }
    else throw new Error(`unexpected path command ${cmd}`)
    out.push({ x: cx, y: cy })
  }
  return out
}

export function textBox(t: RText, lineHeight: number): { x0: number; x1: number; y0: number; y1: number } {
  const w = Math.max(...t.lines.map((l) => measureText(l, t.size, t.bold)))
  const h = t.lines.length * lineHeight
  const x0 = t.anchor === 'start' ? t.x : t.anchor === 'end' ? t.x - w : t.x - w / 2
  return { x0, x1: x0 + w, y0: t.y - h / 2, y1: t.y + h / 2 }
}

export function expectSane(m: RenderModel): void {
  expect(Number.isFinite(m.width) && Number.isFinite(m.height) && m.width > 0 && m.height > 0).toBe(true)
  const eps = 0.51
  for (const it of m.items as RenderItem[]) {
    if (it.kind === 'text') {
      expect(Number.isFinite(it.x) && Number.isFinite(it.y), it.role).toBe(true)
      expect(it.size).toBeGreaterThanOrEqual(m.fontSize)
      expect(it.x).toBeGreaterThanOrEqual(-eps)
      expect(it.x).toBeLessThanOrEqual(m.width + eps)
      expect(it.y).toBeGreaterThanOrEqual(-eps)
      expect(it.y).toBeLessThanOrEqual(m.height + eps)
      for (const l of it.lines) expect(l).not.toMatch(/NaN|undefined|Infinity/)
      continue
    }
    expect(it.d, it.role).not.toMatch(/NaN|undefined|Infinity/)
    for (const p of pathPoints(it.d)) {
      expect(p.x, `${it.role} x`).toBeGreaterThanOrEqual(-eps)
      expect(p.x, `${it.role} x`).toBeLessThanOrEqual(m.width + eps)
      expect(p.y, `${it.role} y`).toBeGreaterThanOrEqual(-eps)
      expect(p.y, `${it.role} y`).toBeLessThanOrEqual(m.height + eps)
    }
  }
}

/** No two text boxes of the model overlap (1px tolerance). */
export function expectNoTextOverlap(m: RenderModel, lineHeight = Math.round(m.fontSize * 1.4)): void {
  const texts = m.items.filter((i): i is RText => i.kind === 'text')
  const boxes = texts.map((t) => ({ t, b: textBox(t, lineHeight) }))
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!.b
      const b = boxes[j]!.b
      const overlap = a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 - 1 && b.y0 < a.y1 - 1
      expect(overlap, `${boxes[i]!.t.lines.join('|')} overlaps ${boxes[j]!.t.lines.join('|')}`).toBe(false)
    }
  }
}

export const texts = (m: RenderModel): string[] => m.items.filter((i): i is RText => i.kind === 'text').flatMap((t) => t.lines)
