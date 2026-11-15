/**
 * Chart colour tokens. Class names are written out literally so Tailwind's scanner emits them.
 * `chart-1..5` come from theme.css; semantic tones are provided for status-coloured sparklines/bars.
 */
export type ChartTone =
  | 'chart-1'
  | 'chart-2'
  | 'chart-3'
  | 'chart-4'
  | 'chart-5'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted'

export const CHART_TONES: readonly ChartTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']

export interface ToneClasses {
  stroke: string
  fill: string
  fillSoft: string
  bg: string
}

export const toneClasses: Record<ChartTone, ToneClasses> = {
  'chart-1': { stroke: 'stroke-chart-1', fill: 'fill-chart-1', fillSoft: 'fill-chart-1/15', bg: 'bg-chart-1' },
  'chart-2': { stroke: 'stroke-chart-2', fill: 'fill-chart-2', fillSoft: 'fill-chart-2/15', bg: 'bg-chart-2' },
  'chart-3': { stroke: 'stroke-chart-3', fill: 'fill-chart-3', fillSoft: 'fill-chart-3/15', bg: 'bg-chart-3' },
  'chart-4': { stroke: 'stroke-chart-4', fill: 'fill-chart-4', fillSoft: 'fill-chart-4/15', bg: 'bg-chart-4' },
  'chart-5': { stroke: 'stroke-chart-5', fill: 'fill-chart-5', fillSoft: 'fill-chart-5/15', bg: 'bg-chart-5' },
  primary: { stroke: 'stroke-primary', fill: 'fill-primary', fillSoft: 'fill-primary/15', bg: 'bg-primary' },
  success: { stroke: 'stroke-success', fill: 'fill-success', fillSoft: 'fill-success/15', bg: 'bg-success' },
  warning: { stroke: 'stroke-warning', fill: 'fill-warning', fillSoft: 'fill-warning/15', bg: 'bg-warning' },
  danger: { stroke: 'stroke-destructive', fill: 'fill-destructive', fillSoft: 'fill-destructive/15', bg: 'bg-destructive' },
  info: { stroke: 'stroke-info', fill: 'fill-info', fillSoft: 'fill-info/15', bg: 'bg-info' },
  muted: { stroke: 'stroke-muted-foreground', fill: 'fill-muted-foreground', fillSoft: 'fill-muted-foreground/15', bg: 'bg-muted-foreground' },
}

/** Tone for the n-th series: an explicit valid tone wins, otherwise cycle chart-1..5. */
export function seriesTone(index: number, tone?: ChartTone | null): ChartTone {
  if (tone && tone in toneClasses) return tone
  const i = Number.isFinite(index) ? Math.abs(Math.floor(index)) : 0
  return CHART_TONES[i % CHART_TONES.length]!
}
