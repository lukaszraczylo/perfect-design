import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { __unstable__loadDesignSystem } from '@tailwindcss/node'
import { describe, expect, it } from 'vitest'
import { DASH, DIAGRAM_VARIANTS, FRAME, MARKERS, STROKE_WIDTH, isVariant, pathClass, shapeClass, shapeStrokeWidth, textClass } from './palette'
import { DIAGRAM_TONES, type Marker, type Paint, type PaintTone, type RPath, type RShape, type RText } from './types'

const TONES: PaintTone[] = [...DIAGRAM_TONES, 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
const FILLS: Paint['fill'][] = ['surface', 'muted', 'solid', 'canvas', 'none']
const STROKES: Paint['stroke'][] = ['none', 'thin', 'normal', 'thick']
const MARKER_IDS: Marker[] = ['arrow', 'open', 'cross', 'circle', 'triangle', 'diamond', 'diamond-filled', 'one', 'exactly-one', 'zero-one', 'many', 'zero-many', 'one-many']

const everyClass = (): string[] => {
  const out: string[] = []
  for (const v of DIAGRAM_VARIANTS) {
    out.push(...FRAME[v].split(' '))
    for (const fill of FILLS) for (const tone of TONES) for (const stroke of STROKES) out.push(...shapeClass(v, { fill, tone, stroke }).split(' '))
    for (const tone of [undefined, ...TONES]) for (const faint of [false, true]) out.push(...pathClass(v, { kind: 'path', d: '', style: 'solid', role: 'x', faint, tone } as RPath).split(' '))
    for (const tone of [undefined, ...TONES]) for (const muted of [false, true]) for (const italic of [false, true]) for (const mono of [false, true]) {
      out.push(...textClass({ kind: 'text', x: 0, y: 0, lines: [], anchor: 'start', size: 14, role: 'x', onSolid: tone, muted, italic, mono } as RText, v).split(' '))
    }
  }
  return [...new Set(out.filter(Boolean))]
}

describe('palette classes', () => {
  it('knows the variants', () => {
    expect(DIAGRAM_VARIANTS).toEqual(['outline', 'filled', 'mono', 'soft'])
    expect(isVariant('mono')).toBe(true)
    expect(isVariant('neon')).toBe(false)
    expect(isVariant(undefined)).toBe(false)
  })
  it('uses semantic tokens only: no raw colours, gradients, shadows or blur', () => {
    const all = everyClass().join(' ')
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b|rgb|hsl|oklch|gradient|shadow|blur|\[/i)
    expect(all).not.toMatch(/indigo|violet|purple/)
  })
  it('every class is a valid Tailwind utility (written out literally, not built from strings)', async () => {
    const root = resolve(process.cwd(), 'src/styles')
    const design = await __unstable__loadDesignSystem(`@import "tailwindcss";\n${readFileSync(join(root, 'theme.css'), 'utf8')}`, { base: root })
    const classes = everyClass()
    const css = design.candidatesToCss(classes)
    const invalid = classes.filter((_, i) => !css[i])
    expect(invalid).toEqual([])
    expect(classes.length).toBeGreaterThan(40)
  })
  it('shape classes follow the variant and stroke', () => {
    const base: Paint = { fill: 'surface', tone: 'primary', stroke: 'normal' }
    expect(shapeClass('outline', base)).toBe('fill-card stroke-primary')
    expect(shapeClass('filled', base)).toBe('fill-primary/10 stroke-primary')
    expect(shapeClass('soft', base)).toBe('fill-primary/10 stroke-none')
    expect(shapeClass('mono', base)).toBe('fill-card stroke-foreground')
    expect(shapeClass('outline', { ...base, stroke: 'none' })).toBe('fill-card stroke-none')
    expect(shapeClass('filled', { ...base, stroke: 'none' })).toBe('fill-primary/10 stroke-none')
    expect(shapeClass('mono', { ...base, stroke: 'none' })).toBe('fill-card stroke-none')
    expect(shapeClass('soft', { ...base, tone: 'neutral' })).toBe('fill-card stroke-none')
  })
  it('solid, muted, canvas and open fills', () => {
    expect(shapeClass('outline', { fill: 'solid', tone: 'success', stroke: 'none' })).toBe('fill-success stroke-none')
    expect(shapeClass('mono', { fill: 'solid', tone: 'success', stroke: 'none' })).toBe('fill-foreground stroke-none')
    expect(shapeClass('outline', { fill: 'muted', tone: 'neutral', stroke: 'thin' })).toBe('fill-muted/50 stroke-muted-foreground')
    expect(shapeClass('outline', { fill: 'muted', tone: 'neutral', stroke: 'none' })).toBe('fill-muted/50 stroke-none')
    expect(shapeClass('soft', { fill: 'muted', tone: 'neutral', stroke: 'thin' })).toBe('fill-card stroke-border')
    expect(shapeClass('soft', { fill: 'muted', tone: 'neutral', stroke: 'none' })).toBe('fill-card stroke-none')
    expect(shapeClass('mono', { fill: 'muted', tone: 'neutral', stroke: 'thin' })).toBe('fill-none stroke-foreground')
    expect(shapeClass('outline', { fill: 'canvas', tone: 'neutral', stroke: 'none' })).toBe('fill-card stroke-none')
    expect(shapeClass('soft', { fill: 'canvas', tone: 'neutral', stroke: 'none' })).toBe('fill-muted stroke-none')
    expect(shapeClass('outline', { fill: 'none', tone: 'danger', stroke: 'normal' })).toBe('fill-none stroke-destructive')
    expect(shapeClass('mono', { fill: 'none', tone: 'danger', stroke: 'normal' })).toBe('fill-none stroke-foreground')
    expect(shapeClass('outline', { fill: 'none', tone: 'danger', stroke: 'none' })).toBe('fill-none stroke-none')
  })
  it('an unknown tone is neutral', () => {
    expect(shapeClass('outline', { fill: 'surface', tone: 'rainbow' as PaintTone, stroke: 'normal' })).toBe('fill-card stroke-muted-foreground')
  })
  it('warning never relies on a thin amber outline: tinted fill plus a foreground outline', () => {
    expect(shapeClass('outline', { fill: 'surface', tone: 'warning', stroke: 'normal' })).toBe('fill-warning/20 stroke-warning-foreground dark:stroke-warning')
  })
  it('stroke widths and dashes', () => {
    expect(STROKE_WIDTH).toEqual({ none: 0, thin: 1, normal: 1.5, thick: 3 })
    expect(shapeStrokeWidth({ paint: { stroke: 'thick' } } as RShape)).toBe(3)
    expect(DASH).toEqual({ dashed: '6 4', dotted: '1.5 4' })
  })
  it('path classes', () => {
    const p = (extra: Partial<RPath>) => ({ kind: 'path', d: '', style: 'solid', role: 'x', ...extra }) as RPath
    expect(pathClass('outline', p({}))).toBe('fill-none stroke-muted-foreground')
    expect(pathClass('mono', p({}))).toBe('fill-none stroke-foreground')
    expect(pathClass('outline', p({ faint: true }))).toBe('fill-none stroke-border')
    expect(pathClass('outline', p({ tone: 'info' }))).toBe('fill-none stroke-info')
    expect(pathClass('mono', p({ tone: 'info' }))).toBe('fill-none stroke-foreground')
  })
  it('text classes', () => {
    const t = (extra: Partial<RText>) => ({ kind: 'text', x: 0, y: 0, lines: [], anchor: 'start', size: 14, role: 'x', ...extra }) as RText
    expect(textClass(t({}), 'outline')).toBe('fill-foreground')
    expect(textClass(t({ muted: true, mono: true, italic: true }), 'outline')).toBe('fill-muted-foreground dark:fill-foreground/80 font-mono italic')
    expect(textClass(t({ onSolid: 'primary' }), 'outline')).toBe('fill-primary-foreground')
    expect(textClass(t({ onSolid: 'neutral' }), 'soft')).toBe('fill-background')
    expect(textClass(t({ onSolid: 'primary' }), 'mono')).toBe('fill-card')
    expect(textClass(t({ muted: true }), 'mono')).toBe('fill-foreground')
  })
  it('frames', () => {
    expect(FRAME.outline).toBe('rounded-lg border border-border bg-card')
    expect(FRAME.soft).toBe('rounded-lg bg-muted')
    expect(FRAME.mono).toBe('rounded-lg border border-foreground bg-card')
  })
})

describe('markers', () => {
  it('defines every marker once with geometry that ends at the reference point', () => {
    expect(MARKERS.map((m) => m.id)).toEqual(MARKER_IDS)
    for (const m of MARKERS) {
      expect(m.width).toBeGreaterThan(0)
      expect(m.refX).toBeLessThanOrEqual(m.width)
      expect(m.parts.length).toBeGreaterThan(0)
      for (const part of m.parts) expect(part.tag === 'circle' ? part.r! > 0 : (part.d ?? '').length > 4).toBe(true)
    }
  })
})
