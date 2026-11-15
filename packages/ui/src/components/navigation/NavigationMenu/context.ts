import type { ComputedRef, InjectionKey } from 'vue'
import type { NavigationMenuSize } from './variants'

/** Provided by `NavigationMenu` (already validated) so triggers and top-level links follow the menu size. */
export const NAVIGATION_MENU_SIZE_KEY: InjectionKey<ComputedRef<NavigationMenuSize>> = Symbol('pd-navigation-menu-size')
