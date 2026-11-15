import { cva, type VariantProps } from '../../../lib/cva'
import { cn } from '../../../lib/cn'
import type { Tone } from '../../../lib/types'
import type { ChartTone } from '../_chart/tones'

/** Extra tile surface on top of the Card variants (`inverted` = high-contrast foreground surface). */
export type KpiTileSurface = 'inverted'

const base = cva('', {
  variants: {
    size: {
      default: 'gap-2 p-4',
      compact: 'gap-1 p-3',
      lg: 'gap-3 p-6',
    },
    /** `stacked` is the default column; `split` puts label start and value end on one row; `centered` centres everything. */
    layout: {
      stacked: '',
      split: 'grid grid-cols-[minmax(0,1fr)_auto] items-baseline',
      centered: 'items-center text-center',
    },
    variant: {
      default: '',
      inverted: 'border-transparent bg-foreground text-background',
    },
    tone: {
      neutral: '',
      primary: '',
      success: '',
      warning: '',
      danger: '',
      info: '',
    },
  },
  defaultVariants: { size: 'default', layout: 'stacked', variant: 'default', tone: 'primary' },
})

/** Padding / surface classes applied on top of `Card` by `KpiTile` (merged with tailwind-merge). */
export const kpiTileVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type KpiTileVariants = VariantProps<typeof base>
export type KpiTileSize = NonNullable<KpiTileVariants['size']>
export type KpiTileLayout = NonNullable<KpiTileVariants['layout']>
export type KpiTileTone = Tone
export const KPI_TILE_SIZES = ['default', 'compact', 'lg'] as const
export const KPI_TILE_LAYOUTS = ['stacked', 'split', 'centered'] as const

/** Progress-bar fill colour per tone. */
export const kpiProgressFill: Record<Tone, string> = {
  neutral: 'bg-muted-foreground',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
}

/** Sparkline colour per tone. */
export const kpiSparklineTone: Record<Tone, ChartTone> = {
  neutral: 'muted',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
}
