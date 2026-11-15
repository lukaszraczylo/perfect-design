import { cva, type VariantProps } from '../../../lib/cva'

/**
 * InputGroup draws the field surface itself (layout `inset`), so the focus and invalid states are `has-*` selectors on the
 * group instead of `focus-visible:` on the control. The values mirror the text-field fragments in `Field/field-variants.ts`.
 * Layout `joined` draws no surface: each child keeps its own, the group only squares the touching edges.
 */
export const inputGroupVariants = cva('relative flex w-full min-w-0 items-center', {
  variants: {
    layout: {
      inset: [
        'gap-2 border border-input bg-transparent px-3 shadow-xs transition-[color,box-shadow] dark:bg-input/30',
        'has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:border-ring has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:ring-3 has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:ring-ring/40',
        'has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/20 dark:has-[[aria-invalid=true]]:ring-destructive/40',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 forced-colors:has-[[aria-invalid=true]]:border-dashed',
        '[&_input]:h-full! [&_input]:min-h-0! [&_input]:min-w-0 [&_input]:flex-1 [&_input]:rounded-none! [&_input]:border-0! [&_input]:bg-transparent! [&_input]:px-0! [&_input]:shadow-none! [&_input]:ring-0!',
        '[&_textarea]:rounded-none! [&_textarea]:border-0! [&_textarea]:bg-transparent! [&_textarea]:px-0! [&_textarea]:shadow-none! [&_textarea]:ring-0!',
      ],
      joined: [
        'items-stretch',
        '[&>*]:rounded-none! [&>*+*]:-ms-px [&>*]:focus-within:z-10 [&>input]:min-w-0 [&>input]:flex-1 [&>input]:w-auto',
      ],
    },
    variant: {
      outline: '',
      filled: 'bg-muted dark:bg-card',
      underline: 'rounded-none border-0 border-b bg-transparent px-0 shadow-none has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:border-b-2 has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:ring-0 dark:bg-transparent forced-colors:border-b-[ButtonText]',
      ghost: 'border-transparent bg-transparent shadow-none hover:border-input has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:bg-background dark:bg-transparent forced-colors:border-[ButtonText]',
    },
    size: {
      xs: 'min-h-7 text-md md:text-xs pointer-coarse:min-h-11',
      sm: 'min-h-8 text-md md:text-sm pointer-coarse:min-h-11',
      md: 'min-h-9 text-md md:text-base pointer-coarse:min-h-11',
      lg: 'min-h-11 text-md',
    },
    shape: {
      rounded: 'rounded-md',
      pill: 'rounded-full px-4',
      square: 'rounded-none',
    },
    status: {
      default: '',
      success: 'border-success has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:border-success has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:ring-success/30',
      warning: 'border-warning-foreground has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:border-warning-foreground has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:ring-warning-foreground/30 dark:border-warning dark:has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:border-warning',
      error: 'border-destructive has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:border-destructive has-[input:focus-visible,textarea:focus-visible,select:focus-visible]:ring-destructive/30',
    },
  },
  defaultVariants: { layout: 'inset', variant: 'outline', size: 'md', shape: 'rounded', status: 'default' },
  compoundVariants: [
    // Underline squares its own corners; a shape or padding would fight it.
    { variant: 'underline', layout: 'inset', class: 'rounded-none px-0' },
    // Joined: only the outer edges of the row are rounded, the control surfaces stay as they are.
    { layout: 'joined', shape: 'rounded', class: '[&>:first-child]:rounded-s-md! [&>:last-child]:rounded-e-md!' },
    { layout: 'joined', shape: 'pill', class: '[&>:first-child]:rounded-s-full! [&>:last-child]:rounded-e-full!' },
    // Joined rows have no group surface, so the group takes none of the inset-only padding or radius.
    { layout: 'joined', class: 'min-h-0 px-0 rounded-none' },
  ],
})

/**
 * Added to an inset group after the class merge (tailwind-merge drops it next to the status border classes). The group draws the
 * focus indicator; the inner control's own border colour (width 0) follows the ring so the control itself also reports focus.
 */
export const INNER_FOCUS = '[&_input:focus-visible]:border-ring! [&_textarea:focus-visible]:border-ring!'

export const inputGroupAddonVariants = cva('flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0', {
  variants: {
    layout: {
      inset: 'has-[>button]:-mx-2',
      joined: 'border border-input bg-muted px-3 dark:bg-input/30',
    },
  },
  defaultVariants: { layout: 'inset' },
})

export type InputGroupVariants = VariantProps<typeof inputGroupVariants>
export type InputGroupLayout = NonNullable<InputGroupVariants['layout']>
