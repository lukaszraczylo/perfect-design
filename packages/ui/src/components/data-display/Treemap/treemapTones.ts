import type { ChartTone } from '../_chart/tones'

/**
 * Cell colours per tone. A cell is a tint of its tone (15 to 45 percent) so the label, drawn in the foreground colour,
 * keeps its contrast in light and dark. Deeper levels are denser. Class names are literal so Tailwind emits them.
 */
export interface TreemapToneClasses {
  /** Fill per depth step (index 0 = top level), faintest first. */
  steps: readonly [string, string, string, string]
  /** Soft fill of an outlined cell. */
  soft: string
  stroke: string
}

export const TREEMAP_TONES: Record<ChartTone, TreemapToneClasses> = {
  'chart-1': { steps: ['fill-chart-1/15', 'fill-chart-1/25', 'fill-chart-1/35', 'fill-chart-1/45'], soft: 'fill-chart-1/10', stroke: 'stroke-chart-1' },
  'chart-2': { steps: ['fill-chart-2/15', 'fill-chart-2/25', 'fill-chart-2/35', 'fill-chart-2/45'], soft: 'fill-chart-2/10', stroke: 'stroke-chart-2' },
  'chart-3': { steps: ['fill-chart-3/15', 'fill-chart-3/25', 'fill-chart-3/35', 'fill-chart-3/45'], soft: 'fill-chart-3/10', stroke: 'stroke-chart-3' },
  'chart-4': { steps: ['fill-chart-4/15', 'fill-chart-4/25', 'fill-chart-4/35', 'fill-chart-4/45'], soft: 'fill-chart-4/10', stroke: 'stroke-chart-4' },
  'chart-5': { steps: ['fill-chart-5/15', 'fill-chart-5/25', 'fill-chart-5/35', 'fill-chart-5/45'], soft: 'fill-chart-5/10', stroke: 'stroke-chart-5' },
  'primary': { steps: ['fill-primary/15', 'fill-primary/25', 'fill-primary/35', 'fill-primary/45'], soft: 'fill-primary/10', stroke: 'stroke-primary' },
  'success': { steps: ['fill-success/15', 'fill-success/25', 'fill-success/35', 'fill-success/45'], soft: 'fill-success/10', stroke: 'stroke-success' },
  'warning': { steps: ['fill-warning/15', 'fill-warning/25', 'fill-warning/35', 'fill-warning/45'], soft: 'fill-warning/10', stroke: 'stroke-warning' },
  'danger': { steps: ['fill-destructive/15', 'fill-destructive/25', 'fill-destructive/35', 'fill-destructive/45'], soft: 'fill-destructive/10', stroke: 'stroke-destructive' },
  'info': { steps: ['fill-info/15', 'fill-info/25', 'fill-info/35', 'fill-info/45'], soft: 'fill-info/10', stroke: 'stroke-info' },
  'muted': { steps: ['fill-muted-foreground/15', 'fill-muted-foreground/25', 'fill-muted-foreground/35', 'fill-muted-foreground/45'], soft: 'fill-muted-foreground/10', stroke: 'stroke-muted-foreground' },
}
