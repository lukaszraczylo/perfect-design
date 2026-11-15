/**
 * Class maps of the SVG canvas. Every class is written out literally so Tailwind emits it, and every colour is a
 * semantic token from a pair covered by `__tests__/contrast.test.ts`: ink and muted ink on card/muted, tone strokes that
 * the tests cover on the background (warning uses its foreground token in light mode), and tints behind ink.
 */
import type { Marker, Paint, PaintTone, RPath, RShape, RText } from './types'

export const DIAGRAM_VARIANTS = ['outline', 'filled', 'mono', 'soft'] as const
export type DiagramVariant = (typeof DIAGRAM_VARIANTS)[number]

const STROKE: Record<PaintTone, string> = {
  neutral: 'stroke-muted-foreground',
  primary: 'stroke-primary',
  success: 'stroke-success',
  info: 'stroke-info',
  warning: 'stroke-warning-foreground dark:stroke-warning',
  danger: 'stroke-destructive',
  'chart-1': 'stroke-chart-1',
  'chart-2': 'stroke-chart-2',
  'chart-3': 'stroke-chart-3',
  'chart-4': 'stroke-chart-4',
  'chart-5': 'stroke-chart-5',
}

const TINT: Record<PaintTone, string> = {
  neutral: 'fill-muted',
  primary: 'fill-primary/10',
  success: 'fill-success/15',
  info: 'fill-info/15',
  warning: 'fill-warning/20',
  danger: 'fill-destructive/10',
  'chart-1': 'fill-chart-1/15',
  'chart-2': 'fill-chart-2/15',
  'chart-3': 'fill-chart-3/15',
  'chart-4': 'fill-chart-4/15',
  'chart-5': 'fill-chart-5/15',
}

const SOLID: Record<PaintTone, string> = {
  neutral: 'fill-muted-foreground',
  primary: 'fill-primary',
  success: 'fill-success',
  info: 'fill-info',
  warning: 'fill-warning',
  danger: 'fill-destructive',
  'chart-1': 'fill-chart-1',
  'chart-2': 'fill-chart-2',
  'chart-3': 'fill-chart-3',
  'chart-4': 'fill-chart-4',
  'chart-5': 'fill-chart-5',
}

const ON_SOLID: Record<PaintTone, string> = {
  neutral: 'fill-background',
  primary: 'fill-primary-foreground',
  success: 'fill-success-foreground',
  info: 'fill-info-foreground',
  warning: 'fill-warning-foreground',
  danger: 'fill-destructive-foreground',
  'chart-1': 'fill-foreground',
  'chart-2': 'fill-foreground',
  'chart-3': 'fill-foreground',
  'chart-4': 'fill-foreground',
  'chart-5': 'fill-foreground',
}

const tone = (t: PaintTone): PaintTone => (t in STROKE ? t : 'neutral')

/** Frame classes of the root element per variant. */
export const FRAME: Record<DiagramVariant, string> = {
  outline: 'rounded-lg border border-border bg-card',
  filled: 'rounded-lg border border-border bg-card',
  mono: 'rounded-lg border border-foreground bg-card',
  soft: 'rounded-lg bg-muted',
}

export function isVariant(v: unknown): v is DiagramVariant {
  return (DIAGRAM_VARIANTS as readonly unknown[]).includes(v)
}

export function shapeClass(variant: DiagramVariant, paint: Paint): string {
  const t = tone(paint.tone)
  const stroke = paint.stroke === 'none'
  switch (paint.fill) {
    case 'none':
      return `fill-none ${stroke ? 'stroke-none' : variant === 'mono' ? 'stroke-foreground' : STROKE[t]}`
    case 'canvas':
      return `${variant === 'soft' ? 'fill-muted' : 'fill-card'} stroke-none`
    case 'solid':
      return variant === 'mono' ? 'fill-foreground stroke-none' : `${SOLID[t]} stroke-none`
    case 'muted':
      if (variant === 'mono') return 'fill-none stroke-foreground'
      if (variant === 'soft') return `fill-card ${stroke ? 'stroke-none' : 'stroke-border'}`
      return `fill-muted/50 ${stroke ? 'stroke-none' : 'stroke-muted-foreground'}`
    default: // surface
      if (variant === 'mono') return `fill-card ${stroke ? 'stroke-none' : 'stroke-foreground'}`
      if (variant === 'outline') return `${t === 'warning' ? TINT.warning : 'fill-card'} ${stroke ? 'stroke-none' : STROKE[t]}`
      if (variant === 'soft') return `${t === 'neutral' ? 'fill-card' : TINT[t]} stroke-none`
      return `${TINT[t]} ${stroke ? 'stroke-none' : STROKE[t]}`
  }
}

export const STROKE_WIDTH: Record<Paint['stroke'], number> = { none: 0, thin: 1, normal: 1.5, thick: 3 }
export const DASH: Record<'dashed' | 'dotted', string> = { dashed: '6 4', dotted: '1.5 4' }

export function pathClass(variant: DiagramVariant, p: RPath): string {
  if (p.tone) return `fill-none ${variant === 'mono' ? 'stroke-foreground' : STROKE[tone(p.tone)]}`
  if (p.faint) return 'fill-none stroke-border'
  return variant === 'mono' ? 'fill-none stroke-foreground' : 'fill-none stroke-muted-foreground'
}

export function textClass(t: RText, variant: DiagramVariant): string {
  const font = t.mono ? 'font-mono' : ''
  const style = t.italic ? 'italic' : ''
  let fill = 'fill-foreground'
  if (t.onSolid) fill = variant === 'mono' ? 'fill-card' : ON_SOLID[tone(t.onSolid)]
  // muted ink over a tinted node fill drops below 4.5:1 in dark mode, so it lifts toward the ink colour there
  else if (t.muted) fill = variant === 'mono' ? 'fill-foreground' : 'fill-muted-foreground dark:fill-foreground/80'
  return [fill, font, style].filter(Boolean).join(' ')
}

export function shapeStrokeWidth(s: RShape): number {
  return STROKE_WIDTH[s.paint.stroke]
}

/** Marker geometry in a 0..W x 0..10 box; the reference point (refX) is where the path ends. */
export interface MarkerDef {
  id: Marker
  width: number
  refX: number
  /** Elements: [tag, attributes, filled]. Filled shapes use the ink fill, others are outlines. */
  parts: { tag: 'path' | 'circle'; d?: string; cx?: number; cy?: number; r?: number; fill: 'ink' | 'card' | 'none' }[]
}

export const MARKERS: MarkerDef[] = [
  { id: 'arrow', width: 10, refX: 10, parts: [{ tag: 'path', d: 'M0,1L10,5L0,9Z', fill: 'ink' }] },
  { id: 'open', width: 10, refX: 9, parts: [{ tag: 'path', d: 'M1,1L9,5L1,9', fill: 'none' }] },
  { id: 'cross', width: 10, refX: 9, parts: [{ tag: 'path', d: 'M1.5,1.5L8.5,8.5M8.5,1.5L1.5,8.5', fill: 'none' }] },
  { id: 'circle', width: 10, refX: 9, parts: [{ tag: 'circle', cx: 5, cy: 5, r: 3.6, fill: 'card' }] },
  { id: 'triangle', width: 10, refX: 9.5, parts: [{ tag: 'path', d: 'M0.5,1L9.5,5L0.5,9Z', fill: 'card' }] },
  { id: 'diamond', width: 12, refX: 12, parts: [{ tag: 'path', d: 'M0.5,5L6,1.2L11.5,5L6,8.8Z', fill: 'card' }] },
  { id: 'diamond-filled', width: 12, refX: 12, parts: [{ tag: 'path', d: 'M0.5,5L6,1.2L11.5,5L6,8.8Z', fill: 'ink' }] },
  { id: 'one', width: 16, refX: 16, parts: [{ tag: 'path', d: 'M12,1V9', fill: 'none' }] },
  { id: 'exactly-one', width: 16, refX: 16, parts: [{ tag: 'path', d: 'M10,1V9M14,1V9', fill: 'none' }] },
  { id: 'zero-one', width: 18, refX: 18, parts: [{ tag: 'circle', cx: 5, cy: 5, r: 3, fill: 'card' }, { tag: 'path', d: 'M14,1V9', fill: 'none' }] },
  { id: 'many', width: 16, refX: 16, parts: [{ tag: 'path', d: 'M16,1L4,5L16,9', fill: 'none' }] },
  { id: 'zero-many', width: 20, refX: 20, parts: [{ tag: 'circle', cx: 4, cy: 5, r: 3, fill: 'card' }, { tag: 'path', d: 'M20,1L9,5L20,9', fill: 'none' }] },
  { id: 'one-many', width: 20, refX: 20, parts: [{ tag: 'path', d: 'M6,1V9M20,1L9,5L20,9', fill: 'none' }] },
]
