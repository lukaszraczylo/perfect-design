import { cn, type ClassValue } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'
import { toggleVariants, type ToggleSize } from '../Toggle/variants'

/** `default` flat joined buttons, `outline` bordered joined buttons, `segmented` pill-in-track control (iOS / tabs-like). */
export type ToggleGroupVariant = 'default' | 'outline' | 'segmented'
export type ToggleGroupSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** Corner shape: `rounded` (default, rounded-md), `pill` (fully rounded ends) or `square` (no rounding). */
export type ToggleGroupShape = 'rounded' | 'pill' | 'square'
/** Colour of the pressed item: `neutral` (default, accent fill) or a solid `primary` / `success` / `danger` / `info` fill. */
export type ToggleGroupTone = 'neutral' | 'primary' | 'success' | 'danger' | 'info'
/** Space between items: `none` (joined, default), `sm` (4px) or `md` (8px, separate buttons). */
export type ToggleGroupGap = 'none' | 'sm' | 'md'

export const TOGGLE_GROUP_VARIANTS: readonly ToggleGroupVariant[] = ['default', 'outline', 'segmented']
export const TOGGLE_GROUP_SIZES: readonly ToggleGroupSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
export const TOGGLE_GROUP_SHAPES: readonly ToggleGroupShape[] = ['rounded', 'pill', 'square']
export const TOGGLE_GROUP_TONES: readonly ToggleGroupTone[] = ['neutral', 'primary', 'success', 'danger', 'info']
export const TOGGLE_GROUP_GAPS: readonly ToggleGroupGap[] = ['none', 'sm', 'md']

/** Group root. `segmented` draws the muted track the items sit on. */
export const toggleGroupVariants = cva('inline-flex w-fit items-center rounded-md', {
  variants: {
    variant: {
      default: '',
      outline: '',
      segmented: 'gap-0.5 rounded-lg bg-muted p-0.5',
    },
    orientation: {
      horizontal: '',
      vertical: 'flex-col items-stretch',
    },
    fullWidth: {
      true: 'flex w-full',
      false: '',
    },
    /** Radius of the group (the track of `segmented`). Joined items round their own outer corners. */
    shape: {
      rounded: '',
      pill: 'rounded-full',
      square: 'rounded-none',
    },
    /** Space between items. `none` joins them; `sm` and `md` make separate buttons. */
    gap: {
      none: '',
      sm: 'gap-1',
      md: 'gap-2',
    },
  },
  defaultVariants: { variant: 'default', orientation: 'horizontal', fullWidth: false, shape: 'rounded', gap: 'none' },
})

// Toggle only ships sm/md/lg; the two extra sizes are layered on top of the md classes.
const extraSizes: Partial<Record<ToggleGroupSize, string>> = {
  xs: 'h-7 min-w-7 px-1.5 text-xs',
  xl: 'h-11 min-w-11 px-4 text-base',
}

const joinedItem = 'rounded-none shadow-none focus:z-10 focus-visible:z-10'
const segmentedItem =
  'rounded-md text-muted-foreground focus:z-10 focus-visible:z-10 hover:bg-background/60 hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-background'

/** Pressed-state colours. Every pair is a solid status fill with its `-foreground` token (covered by contrast.test.ts). */
const toneItem: Record<Exclude<ToggleGroupTone, 'neutral'>, string> = {
  primary:
    'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground',
  success:
    'data-[state=on]:bg-success data-[state=on]:text-success-foreground data-[state=on]:hover:bg-success data-[state=on]:hover:text-success-foreground',
  danger:
    'data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground data-[state=on]:hover:bg-destructive data-[state=on]:hover:text-destructive-foreground',
  info: 'data-[state=on]:bg-info data-[state=on]:text-info-foreground data-[state=on]:hover:bg-info data-[state=on]:hover:text-info-foreground',
}

/** Radius of a standalone (segmented or spaced) item per shape. `rounded` keeps the base rounded-md. */
const standaloneRadius: Record<ToggleGroupShape, string> = { rounded: '', pill: 'rounded-full', square: 'rounded-none' }

export interface ToggleGroupItemVariantProps {
  variant?: ToggleGroupVariant | null
  size?: ToggleGroupSize | null
  orientation?: 'horizontal' | 'vertical' | null
  fullWidth?: boolean | null
  shape?: ToggleGroupShape | null
  tone?: ToggleGroupTone | null
  gap?: ToggleGroupGap | null
  class?: ClassValue
}

const pick = <T extends string>(value: T | null | undefined, allowed: readonly T[], fallback: T): T => (value && allowed.includes(value) ? value : fallback)

/** Rounded outer corners of a joined item, in logical directions so the group mirrors in RTL. Written out so Tailwind sees every class. */
const joinedCorners: Record<ToggleGroupShape, { horizontal: string; vertical: string }> = {
  rounded: { horizontal: 'first:rounded-s-md last:rounded-e-md', vertical: 'first:rounded-t-md last:rounded-b-md' },
  pill: { horizontal: 'first:rounded-s-full last:rounded-e-full', vertical: 'first:rounded-t-full last:rounded-b-full' },
  square: { horizontal: '', vertical: '' },
}

/** Classes of one item. Unknown values fall back to the defaults (`default`, `md`, `rounded`, `neutral`, `none`). */
export function toggleGroupItemVariants(props: ToggleGroupItemVariantProps = {}): string {
  const variant = pick(props.variant, TOGGLE_GROUP_VARIANTS, 'default')
  const size = pick(props.size, TOGGLE_GROUP_SIZES, 'md')
  const shape = pick(props.shape, TOGGLE_GROUP_SHAPES, 'rounded')
  const tone = pick(props.tone, TOGGLE_GROUP_TONES, 'neutral')
  const gap = pick(props.gap, TOGGLE_GROUP_GAPS, 'none')
  const vertical = props.orientation === 'vertical'
  const baseSize: ToggleSize = size === 'xs' || size === 'xl' ? 'md' : size
  const joined = variant !== 'segmented' && gap === 'none'
  return cn(
    toggleVariants({ variant: variant === 'outline' ? 'outline' : 'default', size: baseSize }),
    extraSizes[size],
    variant === 'segmented'
      ? [segmentedItem, standaloneRadius[shape]]
      : joined
        ? [
            joinedItem,
            joinedCorners[shape][vertical ? 'vertical' : 'horizontal'],
            variant === 'outline' && (vertical ? 'border-t-0 first:border-t' : 'border-s-0 first:border-s'),
          ]
        : ['focus:z-10 focus-visible:z-10', standaloneRadius[shape]],
    tone !== 'neutral' && toneItem[tone],
    props.fullWidth && !vertical && 'flex-1',
    props.class,
  )
}

export type ToggleGroupVariants = VariantProps<typeof toggleGroupVariants>
