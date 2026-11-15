import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

/**
 * Menubar bar and trigger sizes. `md` (default) is the original 36px bar. Size classes conflict with the base on
 * purpose: pass the result through `cn()` (the components do).
 */
export const menubarVariants = cva('flex h-9 max-w-full items-center gap-1 overflow-x-auto rounded-md border bg-background p-1 shadow-xs', {
  variants: { size: { sm: 'h-8', md: '', lg: 'h-11' } },
  defaultVariants: { size: 'md' },
})

export const menubarTriggerVariants = cva(
  [
    'flex shrink-0 items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none',
    'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-11',
    focusRing,
  ],
  {
    variants: { size: { sm: 'px-1.5 text-xs', md: '', lg: 'px-3 py-1.5 text-base' } },
    defaultVariants: { size: 'md' },
  },
)

export type MenubarVariants = VariantProps<typeof menubarVariants>
export type MenubarSize = NonNullable<MenubarVariants['size']>
export const MENUBAR_SIZES: readonly MenubarSize[] = ['sm', 'md', 'lg']
