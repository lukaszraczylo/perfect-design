import { cn, type ClassValue } from '../../../lib/cn'
import { cva } from '../../../lib/cva'
import { buttonVariants, type ButtonRounded, type ButtonSize, type ButtonVariant } from '../Button/variants'

/** Button heights, square: `xs` 24px, `sm` 32px, `md` 36px (44px on coarse pointers), `lg` 44px, `xl` 48px. */
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
/** `rounded` (rounded-md, default), `circle` (fully round) or `square` (no rounding). */
export type IconButtonShape = 'rounded' | 'circle' | 'square'

export const ICON_BUTTON_SIZES: readonly IconButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'icon', 'icon-xs', 'icon-sm', 'icon-lg']
export const ICON_BUTTON_SHAPES: readonly IconButtonShape[] = ['rounded', 'circle', 'square']

/** `Button` sizes the friendly names map to. `xl` builds on `icon-lg` and widens it (see `iconButtonExtra`). */
export const ICON_BUTTON_SIZE_MAP: Record<IconButtonSize, ButtonSize> = {
  xs: 'icon-xs',
  sm: 'icon-sm',
  md: 'icon',
  lg: 'icon-lg',
  xl: 'icon-lg',
  icon: 'icon',
  'icon-xs': 'icon-xs',
  'icon-sm': 'icon-sm',
  'icon-lg': 'icon-lg',
}

/** `Button` corner radius per shape. */
export const ICON_BUTTON_SHAPE_MAP: Record<IconButtonShape, ButtonRounded> = { rounded: 'default', circle: 'full', square: 'none' }

/** Classes layered on top of `Button` (only `xl` needs any). Wrap with `cn()` so tailwind-merge drops the `icon-lg` size. */
export const iconButtonExtra = cva('', {
  variants: {
    size: {
      xs: '',
      sm: '',
      md: '',
      lg: '',
      xl: 'size-12 [&_svg:not([class*="size-"])]:size-5',
      icon: '',
      'icon-xs': '',
      'icon-sm': '',
      'icon-lg': '',
    },
  },
  defaultVariants: { size: 'md' },
})

export interface IconButtonVariantProps {
  variant?: ButtonVariant | null
  size?: IconButtonSize | null
  shape?: IconButtonShape | null
  class?: ClassValue
}

/** Classes of an icon-only button. Unknown size and shape fall back to the square `md` size and `rounded`. Use it on plain elements: `<a :class="iconButtonVariants({ variant: 'outline' })">`. */
export function iconButtonVariants(props: IconButtonVariantProps = {}): string {
  const size: IconButtonSize = props.size && ICON_BUTTON_SIZES.includes(props.size) ? props.size : 'icon'
  const shape: IconButtonShape = props.shape && ICON_BUTTON_SHAPES.includes(props.shape) ? props.shape : 'rounded'
  return cn(
    buttonVariants({ variant: props.variant ?? 'ghost', size: ICON_BUTTON_SIZE_MAP[size], rounded: ICON_BUTTON_SHAPE_MAP[shape] }),
    iconButtonExtra({ size }),
    props.class,
  )
}
