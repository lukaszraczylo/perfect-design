import { cn } from '../../../lib/cn'
import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'
import type { FieldSize, FieldStatus } from '../Field/field-variants'

export const FILE_DROPZONE_VARIANTS = ['outline', 'solid', 'filled', 'ghost'] as const
export type FileDropzoneVariant = (typeof FILE_DROPZONE_VARIANTS)[number]

/** Area height and padding. `md` is the default 128px area. Text stays 12px or larger. */
export const FILE_DROPZONE_SIZES: Record<FieldSize, string> = {
  xs: 'min-h-16 gap-1 py-3 text-xs',
  sm: 'min-h-24 py-5',
  md: 'min-h-32 py-8',
  lg: 'min-h-48 gap-3 py-12 text-base',
}

/** Size of the default upload icon by `size`. */
export const FILE_DROPZONE_ICON_SIZES = { xs: 'md', sm: 'lg', md: 'xl', lg: 'xl' } as const

/**
 * Surface treatment. `outline` is the default dashed border. `solid` keeps the border and draws it as a continuous line,
 * `filled` replaces it with a muted fill, `ghost` shows the border only on hover, focus and while dragging. Forced-colors
 * mode always draws a border (a transparent one would disappear). Every variant keeps the drag highlight and the focus ring.
 */
export const FILE_DROPZONE_VARIANT_CLASSES: Record<FileDropzoneVariant, string> = {
  outline: '',
  solid: 'border-solid',
  filled: 'border-solid border-transparent bg-muted text-foreground hover:bg-muted disabled:hover:border-transparent disabled:hover:bg-muted forced-colors:border-[ButtonText]',
  ghost: 'border-transparent hover:bg-transparent disabled:hover:border-transparent forced-colors:border-[ButtonText]',
}

/** Status colouring on the border. The icon and text carry the status for people who do not see colour, see `FieldStatusIcon`. */
export const FILE_DROPZONE_STATUS_CLASSES: Record<FieldStatus, string> = {
  default: '',
  success: 'border-success hover:border-success focus-visible:border-success focus-visible:ring-success/30 dark:focus-visible:ring-success/40',
  warning:
    'border-warning-foreground hover:border-warning-foreground focus-visible:border-warning-foreground focus-visible:ring-warning-foreground/30 dark:border-warning dark:hover:border-warning dark:focus-visible:border-warning dark:focus-visible:ring-warning/40',
  error: 'border-destructive hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40',
}

const base = cva(
  [
    'flex w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-transparent px-4 text-center text-sm text-muted-foreground transition-colors hover:border-ring/60 hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input disabled:hover:bg-transparent data-dragging:border-primary data-dragging:bg-accent forced-colors:data-dragging:outline-2 forced-colors:data-dragging:outline-offset-2 sm:px-6',
    focusRing,
  ],
  {
    variants: {
      size: FILE_DROPZONE_SIZES,
      variant: FILE_DROPZONE_VARIANT_CLASSES,
      status: FILE_DROPZONE_STATUS_CLASSES,
    },
    defaultVariants: { size: 'md', variant: 'outline', status: 'default' },
    // Room for the status icon in the top corner when the area is short.
    compoundVariants: [{ size: ['xs', 'sm'], status: ['success', 'warning', 'error'], class: 'px-9 sm:px-9' }],
  },
)

/**
 * Class list of the FileDropzone drop area: size, variant and status. Conflicting utilities are resolved (later wins), so it
 * can be put on a plain `<button>` or `<label>`.
 */
export const fileDropzoneVariants = (props?: Parameters<typeof base>[0]): string => cn(base(props))

export type FileDropzoneVariants = VariantProps<typeof fileDropzoneVariants>
