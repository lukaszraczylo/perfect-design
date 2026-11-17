import { cva, type VariantProps } from '../../../lib/cva'
import type { BadgeRounded, BadgeSize, BadgeTone, BadgeVariant } from '../Badge/variants'
import type { StatusDotSize } from '../StatusDot/variants'
import type { StatusBadgeTone } from './status'

/**
 * StatusBadge looks. The component renders a `Badge`, so these map onto `badgeVariants`:
 *
 * - `soft` (default): the original fixed-colour badges (tinted success, warning and info, solid danger, secondary neutral).
 * - `outline`: bordered, tone-coloured text.
 * - `solid`: filled with the tone colour (neutral is foreground on background).
 * - `plain`: tone-coloured text and dot with no border, fill or horizontal padding.
 * - `tinted`: every tone tinted, danger and primary included, for screens where many statuses sit side by side.
 */
export type StatusBadgeVariant = 'soft' | 'outline' | 'solid' | 'plain' | 'tinted'
export type StatusBadgeSize = 'sm' | 'md' | 'lg'
/** `rounded` is rounded-md (default), `pill` is fully round, `square` has no radius. */
export type StatusBadgeShape = 'pill' | 'rounded' | 'square'

export const STATUS_BADGE_VARIANTS: readonly StatusBadgeVariant[] = ['soft', 'outline', 'solid', 'plain', 'tinted']
export const STATUS_BADGE_SIZES: readonly StatusBadgeSize[] = ['sm', 'md', 'lg']
export const STATUS_BADGE_SHAPES: readonly StatusBadgeShape[] = ['pill', 'rounded', 'square']

/** Classes layered on the Badge: `solid` keeps a border in forced-colors mode (fills are dropped), `plain` removes box styling. */
export const statusBadgeVariants = cva('', {
  variants: {
    variant: {
      soft: '',
      outline: '',
      solid: 'forced-colors:border-current',
      plain: 'border-0 px-0',
    },
  },
  defaultVariants: { variant: 'soft' },
})

export type StatusBadgeVariants = VariantProps<typeof statusBadgeVariants>

const SOFT_VARIANT_BY_TONE: Record<StatusBadgeTone, BadgeVariant> = {
  neutral: 'secondary',
  primary: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  info: 'info',
}

/** The Badge `variant` and `tone` that draw a StatusBadge look for a status tone. */
export function statusBadgeLook(variant: StatusBadgeVariant, tone: StatusBadgeTone): { variant: BadgeVariant; tone?: BadgeTone } {
  if (variant === 'soft') return { variant: SOFT_VARIANT_BY_TONE[tone] }
  if (variant === 'tinted') return tone === 'primary' || tone === 'danger' ? { variant: 'soft', tone } : { variant: SOFT_VARIANT_BY_TONE[tone] }
  return { variant: variant === 'solid' ? 'solid' : 'outline', tone }
}

export const statusBadgeRounded: Readonly<Record<StatusBadgeShape, BadgeRounded>> = { pill: 'full', rounded: 'default', square: 'none' }
/** Badge size -> dot size (the dot is one step smaller than the text). */
export const statusBadgeDotSize: Readonly<Record<StatusBadgeSize, StatusDotSize>> = { sm: 'xs', md: 'sm', lg: 'md' }
export const statusBadgeSize: Readonly<Record<StatusBadgeSize, BadgeSize>> = { sm: 'sm', md: 'md', lg: 'lg' }
