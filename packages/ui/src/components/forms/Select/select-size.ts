import type { InjectionKey } from 'vue'

export type SelectItemSize = 'sm' | 'md' | 'lg'

/** `SelectContent` provides its `size`; each `SelectItem` uses it unless it sets its own. */
export const SELECT_ITEM_SIZE_KEY: InjectionKey<() => SelectItemSize | undefined> = Symbol('perfect-design:select-item-size')

/**
 * Item padding and text size by `size`. `md` is the default and adds nothing. The 44px touch height of the item base stays
 * for every size (a `pointer-coarse:min-h-11` min-height wins over the padding).
 */
export const SELECT_ITEM_SIZE_CLASSES: Record<SelectItemSize, string> = {
  sm: 'py-1 text-xs',
  md: '',
  lg: 'py-2.5 text-base',
}

export const normalizeSelectItemSize = (v: unknown): SelectItemSize => (v === 'sm' || v === 'lg' ? v : 'md')
