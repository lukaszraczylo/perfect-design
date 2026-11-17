import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * ThemeToggle looks. `variant`: `icon` (default, square ghost button), `button` (outline button with the mode name), `switch`
 * (a light and dark switch with a sun or moon thumb) and `segmented` (a radio group of light, dark and system).
 * `size`: `sm` | `md` (default) | `lg`.
 */
export type ThemeToggleVariant = 'icon' | 'button' | 'switch' | 'segmented'
export const THEME_TOGGLE_VARIANTS: readonly ThemeToggleVariant[] = ['icon', 'button', 'switch', 'segmented']

/** Track of the `switch` variant. The thumb is the first child. */
export const themeSwitchVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-input bg-input p-0.5 shadow-xs motion-safe:transition-colors',
    // The pseudo-element grows the hit area to at least 24px tall, and about 40px on touch screens.
    'after:absolute after:inset-x-0 after:-inset-y-1 pointer-coarse:after:-inset-y-3',
    'forced-colors:border-[ButtonText]',
    'aria-checked:bg-primary',
    focusRing,
  ],
  {
    variants: { size: { sm: 'h-5 w-9', md: 'h-6 w-11', lg: 'h-7 w-13' } },
    defaultVariants: { size: 'md' },
  },
)

export const themeSwitchThumbVariants = cva(
  'pointer-events-none inline-flex items-center justify-center rounded-full bg-background text-foreground shadow-sm motion-safe:transition-transform',
  {
    variants: {
      size: { sm: 'size-4 [&_svg]:size-2.5', md: 'size-5 [&_svg]:size-3', lg: 'size-6 [&_svg]:size-4' },
      checked: { true: '', false: '' },
    },
    compoundVariants: [
      { size: 'sm', checked: true, class: 'translate-x-4 rtl:-translate-x-4' },
      { size: 'md', checked: true, class: 'translate-x-5 rtl:-translate-x-5' },
      { size: 'lg', checked: true, class: 'translate-x-6 rtl:-translate-x-6' },
    ],
    defaultVariants: { size: 'md', checked: false },
  },
)

/** Track holding the three radios of the `segmented` variant. */
export const themeSegmentedVariants = cva('inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5 text-foreground', {
  variants: { size: { sm: '', md: '', lg: '' } },
  defaultVariants: { size: 'md' },
})

export const themeSegmentVariants = cva(
  'inline-flex items-center justify-center rounded-md text-muted-foreground motion-safe:transition-colors hover:text-foreground aria-checked:bg-background aria-checked:text-foreground aria-checked:shadow-sm forced-colors:aria-checked:underline [&_svg]:pointer-events-none',
  {
    variants: {
      size: {
        sm: 'size-6 pointer-coarse:size-10 [&_svg]:size-3',
        md: 'size-8 pointer-coarse:size-11 [&_svg]:size-4',
        lg: 'size-10 pointer-coarse:size-11 [&_svg]:size-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export type ThemeToggleSize = NonNullable<VariantProps<typeof themeSwitchVariants>['size']>
export const THEME_TOGGLE_SIZES: readonly ThemeToggleSize[] = ['sm', 'md', 'lg']
