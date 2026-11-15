import { floatingSurface } from '../../lib/styles'

/**
 * Class fragments shared by DropdownMenu, ContextMenu (and reusable by Select/Menubar-like parts).
 * Stacking: menus must render above modal dialogs, so the z-index is bumped to `--z-modal`.
 */
export const menuContent =
  floatingSurface +
  ' z-(--z-modal) min-w-44 max-h-(--reka-popper-available-height) max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto overscroll-contain p-1 data-[state=open]:animate-ds-pop-in data-[state=closed]:animate-ds-pop-out'

/** Same surface as `menuContent`, used for sub-menus (slightly stronger shadow). */
export const menuSubContent = menuContent + ' shadow-lg'

/** Base style shared by every interactive row (Item, CheckboxItem, RadioItem, SubTrigger). */
export const menuItem =
  'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none ' +
  'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=open]:bg-accent ' +
  'forced-colors:data-[highlighted]:bg-[Highlight] forced-colors:data-[highlighted]:text-[HighlightText] forced-colors:data-[highlighted]:[&_svg]:text-[HighlightText] ' +
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 forced-colors:data-[disabled]:text-[GrayText] pointer-coarse:min-h-11 ' +
  '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4'

export const menuItemDestructive =
  'text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive [&_svg]:text-destructive'

/** Left padding that aligns un-iconed rows with rows that have a check/radio indicator. */
export const menuItemInset = 'pl-8 rtl:pr-8 rtl:pl-2'

/** Row with a leading check / radio indicator. */
export const menuIndicatorItem = menuItem + ' pl-8 pr-2 rtl:pr-8 rtl:pl-2'

export const menuIndicatorSlot = 'pointer-events-none absolute left-2 flex size-3.5 items-center justify-center rtl:right-2 rtl:left-auto'

export const menuLabel = 'px-2 py-1.5 text-xs font-medium text-muted-foreground'

export const menuSeparator = '-mx-1 my-1 h-px bg-border'

export const menuShortcut = 'ml-auto rtl:mr-auto rtl:ml-0 text-xs tracking-widest text-muted-foreground'

/* Compact density: tighter rows for dense toolbars and data tables. Compose AFTER the base fragments with `cn()`. */
export const menuContentCompact = 'min-w-36 p-0.5'

export const menuItemCompact = 'gap-1.5 px-1.5 py-1 text-xs'

export const menuItemInsetCompact = 'pl-7 rtl:pr-7 rtl:pl-1.5'

export const menuIndicatorItemCompact = menuItemCompact + ' pl-7 pr-1.5 rtl:pr-7 rtl:pl-1.5'

export const menuIndicatorSlotCompact = 'left-1.5 size-3 rtl:right-1.5 rtl:left-auto'

export const menuLabelCompact = 'px-1.5 py-1 text-2xs'

export const menuSeparatorCompact = '-mx-0.5 my-0.5'

/* ---------------------------------------------------------------------------------------------------------------------
 * Density and size. `density` sets the spacing (`default` | `compact` | `comfortable`); `size` sets the type scale and
 * the minimum width (`sm` | `md` | `lg`). The defaults (`default`, `md`) add no classes, so the base output is unchanged.
 * Order matters: base, then density, then size, so a size always wins over the type size a density sets (`compact` is text-xs).
 * ------------------------------------------------------------------------------------------------------------------- */
export const menuDensities = ['default', 'compact', 'comfortable'] as const
export type MenuDensity = (typeof menuDensities)[number]
export const menuSizes = ['sm', 'md', 'lg'] as const
export type MenuSize = (typeof menuSizes)[number]

export interface MenuLook {
  density: MenuDensity
  size: MenuSize
}

/** Unknown / missing values fall back to `default`. */
export const normalizeMenuDensity = (value: unknown): MenuDensity => (menuDensities as readonly unknown[]).includes(value) ? (value as MenuDensity) : 'default'
/** Unknown / missing values fall back to `md`. */
export const normalizeMenuSize = (value: unknown): MenuSize => (menuSizes as readonly unknown[]).includes(value) ? (value as MenuSize) : 'md'

/* Comfortable density: roomier rows for touch-first or low-density menus. */
export const menuContentComfortable = 'p-1.5'
export const menuItemComfortable = 'gap-3 px-3 py-2'
export const menuItemInsetComfortable = 'pl-9 rtl:pr-9 rtl:pl-3'
export const menuIndicatorItemComfortable = menuItemComfortable + ' pl-9 pr-3 rtl:pr-9 rtl:pl-3'
export const menuIndicatorSlotComfortable = 'left-3 rtl:right-3 rtl:left-auto'
export const menuLabelComfortable = 'px-3 py-2'
export const menuSeparatorComfortable = '-mx-1.5 my-1.5'

/* Size: type scale, icon size and minimum width. `md` is the default and adds nothing. */
const sizeParts = {
  sm: { content: 'min-w-40', item: 'text-xs [&_svg:not([class*="size-"])]:size-3.5', label: 'text-2xs', shortcut: 'text-2xs' },
  md: { content: '', item: '', label: '', shortcut: '' },
  lg: { content: 'min-w-56', item: 'text-base [&_svg:not([class*="size-"])]:size-5', label: 'text-sm', shortcut: 'text-sm' },
} as const

const join = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

/** Classes for the floating menu surface. Pass the result through `cn()` so later classes win. */
export const menuContentClass = ({ density, size }: MenuLook, sub = false) =>
  join(sub ? menuSubContent : menuContent, density === 'compact' && menuContentCompact, density === 'comfortable' && menuContentComfortable, sizeParts[size].content)

/** Classes for Item, SubTrigger and the other plain rows. */
export const menuItemClass = ({ density, size }: MenuLook, opts: { destructive?: boolean; inset?: boolean } = {}) =>
  join(
    menuItem,
    density === 'compact' && menuItemCompact,
    density === 'comfortable' && menuItemComfortable,
    opts.destructive && menuItemDestructive,
    opts.inset && menuItemInset,
    opts.inset && density === 'compact' && menuItemInsetCompact,
    opts.inset && density === 'comfortable' && menuItemInsetComfortable,
    sizeParts[size].item,
  )

/** Classes for CheckboxItem and RadioItem rows (they reserve room for the indicator). */
export const menuIndicatorItemClass = ({ density, size }: MenuLook) =>
  join(menuIndicatorItem, density === 'compact' && menuIndicatorItemCompact, density === 'comfortable' && menuIndicatorItemComfortable, sizeParts[size].item)

export const menuIndicatorSlotClass = ({ density }: MenuLook) =>
  join(menuIndicatorSlot, density === 'compact' && menuIndicatorSlotCompact, density === 'comfortable' && menuIndicatorSlotComfortable)

export const menuLabelClass = ({ density, size }: MenuLook, opts: { inset?: boolean } = {}) =>
  join(
    menuLabel,
    density === 'compact' && menuLabelCompact,
    density === 'comfortable' && menuLabelComfortable,
    opts.inset && menuItemInset,
    opts.inset && density === 'compact' && menuItemInsetCompact,
    opts.inset && density === 'comfortable' && menuItemInsetComfortable,
    sizeParts[size].label,
  )

export const menuSeparatorClass = ({ density }: MenuLook) =>
  join(menuSeparator, density === 'compact' && menuSeparatorCompact, density === 'comfortable' && menuSeparatorComfortable)

export const menuShortcutClass = ({ size }: MenuLook) => join(menuShortcut, sizeParts[size].shortcut)
