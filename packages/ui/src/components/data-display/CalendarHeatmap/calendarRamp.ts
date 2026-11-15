import type { ChartTone } from '../_chart/tones'

/**
 * Seven opacity steps per tone (20, 30, 40, 55, 70, 85, 100 percent), as literal class names so Tailwind's scanner emits them.
 * A calendar with fewer levels picks evenly spaced steps from this ramp.
 */
export const CALENDAR_RAMP: Record<ChartTone, readonly [string, string, string, string, string, string, string]> = {
  'chart-1': ['fill-chart-1/20', 'fill-chart-1/30', 'fill-chart-1/40', 'fill-chart-1/55', 'fill-chart-1/70', 'fill-chart-1/85', 'fill-chart-1'],
  'chart-2': ['fill-chart-2/20', 'fill-chart-2/30', 'fill-chart-2/40', 'fill-chart-2/55', 'fill-chart-2/70', 'fill-chart-2/85', 'fill-chart-2'],
  'chart-3': ['fill-chart-3/20', 'fill-chart-3/30', 'fill-chart-3/40', 'fill-chart-3/55', 'fill-chart-3/70', 'fill-chart-3/85', 'fill-chart-3'],
  'chart-4': ['fill-chart-4/20', 'fill-chart-4/30', 'fill-chart-4/40', 'fill-chart-4/55', 'fill-chart-4/70', 'fill-chart-4/85', 'fill-chart-4'],
  'chart-5': ['fill-chart-5/20', 'fill-chart-5/30', 'fill-chart-5/40', 'fill-chart-5/55', 'fill-chart-5/70', 'fill-chart-5/85', 'fill-chart-5'],
  primary: ['fill-primary/20', 'fill-primary/30', 'fill-primary/40', 'fill-primary/55', 'fill-primary/70', 'fill-primary/85', 'fill-primary'],
  success: ['fill-success/20', 'fill-success/30', 'fill-success/40', 'fill-success/55', 'fill-success/70', 'fill-success/85', 'fill-success'],
  warning: ['fill-warning/20', 'fill-warning/30', 'fill-warning/40', 'fill-warning/55', 'fill-warning/70', 'fill-warning/85', 'fill-warning'],
  danger: ['fill-destructive/20', 'fill-destructive/30', 'fill-destructive/40', 'fill-destructive/55', 'fill-destructive/70', 'fill-destructive/85', 'fill-destructive'],
  info: ['fill-info/20', 'fill-info/30', 'fill-info/40', 'fill-info/55', 'fill-info/70', 'fill-info/85', 'fill-info'],
  muted: ['fill-muted-foreground/20', 'fill-muted-foreground/30', 'fill-muted-foreground/40', 'fill-muted-foreground/55', 'fill-muted-foreground/70', 'fill-muted-foreground/85', 'fill-muted-foreground'],
}
