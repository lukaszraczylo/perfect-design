import { cva, type VariantProps } from '../../../lib/cva'

export const avatarVariants = cva('relative inline-flex shrink-0 select-none items-center justify-center bg-muted font-medium text-muted-foreground', {
  variants: {
    size: {
      xs: 'size-6 text-2xs',
      sm: 'size-8 text-xs',
      md: 'size-10 text-sm',
      lg: 'size-12 text-base',
      xl: 'size-16 text-lg',
      '2xl': 'size-24 text-2xl',
    },
    shape: {
      circle: 'rounded-full',
      /** Softly rounded square (squircle-like). */
      rounded: 'rounded-xl',
      /** Square with small corner radius (rounded-md). */
      square: 'rounded-md',
    },
    /** Optional decorative ring with an offset gap, e.g. to mark the current user. */
    ring: {
      none: '',
      border: 'ring-2 ring-border ring-offset-2 ring-offset-background',
      primary: 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      success: 'ring-2 ring-success ring-offset-2 ring-offset-background',
      warning: 'ring-2 ring-warning ring-offset-2 ring-offset-background',
      danger: 'ring-2 ring-destructive ring-offset-2 ring-offset-background',
      info: 'ring-2 ring-info ring-offset-2 ring-offset-background',
    },
  },
  defaultVariants: { size: 'md', shape: 'circle', ring: 'none' },
})

export const avatarStatusVariants = cva('absolute block rounded-full ring-2 ring-background', {
  variants: {
    size: {
      xs: 'size-1.5',
      sm: 'size-2',
      md: 'size-2.5',
      lg: 'size-3',
      xl: 'size-4',
      '2xl': 'size-5',
    },
    position: {
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0',
    },
    status: {
      neutral: 'bg-muted-foreground',
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-destructive',
      info: 'bg-info',
    },
  },
  defaultVariants: { size: 'md', status: 'neutral', position: 'bottom-right' },
})

export type AvatarVariants = VariantProps<typeof avatarVariants>
export type AvatarSize = NonNullable<AvatarVariants['size']>
export type AvatarShape = NonNullable<AvatarVariants['shape']>
export type AvatarRing = NonNullable<AvatarVariants['ring']>
export type AvatarStatusPosition = NonNullable<VariantProps<typeof avatarStatusVariants>['position']>
export type AvatarStatus = NonNullable<VariantProps<typeof avatarStatusVariants>['status']>
