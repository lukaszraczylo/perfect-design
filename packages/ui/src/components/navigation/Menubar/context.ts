import type { ComputedRef, InjectionKey } from 'vue'
import type { MenubarSize } from './variants'

/** Provided by `Menubar` (already validated) so every trigger follows the bar size. */
export const MENUBAR_SIZE_KEY: InjectionKey<ComputedRef<MenubarSize>> = Symbol('pd-menubar-size')
