import type { ChartTone } from '../_chart/tones'

/**
 * Colours of nodes and ribbons per tone. Ribbons are a tint of the tone (soft, medium or strong) so the labels that sit
 * over them keep their contrast; nodes are the solid tone (flat) or an outlined box (outline). Class names are literal
 * so Tailwind emits them.
 */
export interface SankeyToneClasses {
  /** Solid node. */
  node: string
  /** Edge of an outlined node. */
  nodeStroke: string
  /** Ribbon fill by opacity step. */
  link: { soft: string; medium: string; strong: string }
  /** Hairline edge of ribbons in the outline variant. */
  linkStroke: string
}

export const SANKEY_TONES: Record<ChartTone, SankeyToneClasses> = {
  'chart-1': { node: 'fill-chart-1', nodeStroke: 'stroke-chart-1', link: { soft: 'fill-chart-1/15', medium: 'fill-chart-1/30', strong: 'fill-chart-1/45' }, linkStroke: 'stroke-chart-1/50' },
  'chart-2': { node: 'fill-chart-2', nodeStroke: 'stroke-chart-2', link: { soft: 'fill-chart-2/15', medium: 'fill-chart-2/30', strong: 'fill-chart-2/45' }, linkStroke: 'stroke-chart-2/50' },
  'chart-3': { node: 'fill-chart-3', nodeStroke: 'stroke-chart-3', link: { soft: 'fill-chart-3/15', medium: 'fill-chart-3/30', strong: 'fill-chart-3/45' }, linkStroke: 'stroke-chart-3/50' },
  'chart-4': { node: 'fill-chart-4', nodeStroke: 'stroke-chart-4', link: { soft: 'fill-chart-4/15', medium: 'fill-chart-4/30', strong: 'fill-chart-4/45' }, linkStroke: 'stroke-chart-4/50' },
  'chart-5': { node: 'fill-chart-5', nodeStroke: 'stroke-chart-5', link: { soft: 'fill-chart-5/15', medium: 'fill-chart-5/30', strong: 'fill-chart-5/45' }, linkStroke: 'stroke-chart-5/50' },
  'primary': { node: 'fill-primary', nodeStroke: 'stroke-primary', link: { soft: 'fill-primary/15', medium: 'fill-primary/30', strong: 'fill-primary/45' }, linkStroke: 'stroke-primary/50' },
  'success': { node: 'fill-success', nodeStroke: 'stroke-success', link: { soft: 'fill-success/15', medium: 'fill-success/30', strong: 'fill-success/45' }, linkStroke: 'stroke-success/50' },
  'warning': { node: 'fill-warning', nodeStroke: 'stroke-warning', link: { soft: 'fill-warning/15', medium: 'fill-warning/30', strong: 'fill-warning/45' }, linkStroke: 'stroke-warning/50' },
  'danger': { node: 'fill-destructive', nodeStroke: 'stroke-destructive', link: { soft: 'fill-destructive/15', medium: 'fill-destructive/30', strong: 'fill-destructive/45' }, linkStroke: 'stroke-destructive/50' },
  'info': { node: 'fill-info', nodeStroke: 'stroke-info', link: { soft: 'fill-info/15', medium: 'fill-info/30', strong: 'fill-info/45' }, linkStroke: 'stroke-info/50' },
  'muted': { node: 'fill-muted-foreground', nodeStroke: 'stroke-muted-foreground', link: { soft: 'fill-muted-foreground/15', medium: 'fill-muted-foreground/30', strong: 'fill-muted-foreground/45' }, linkStroke: 'stroke-muted-foreground/50' },
}
