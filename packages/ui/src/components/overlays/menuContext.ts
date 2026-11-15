import { computed, inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { normalizeMenuDensity, normalizeMenuSize, type MenuDensity, type MenuLook, type MenuSize } from './menuStyles'

const DENSITY_KEY: InjectionKey<Ref<MenuDensity>> = Symbol('perfect-design:menu-density')
const SIZE_KEY: InjectionKey<Ref<MenuSize>> = Symbol('perfect-design:menu-size')

/** Provide a density to every menu part rendered below (works through portals; Vue context follows the component tree). */
export function provideMenuDensity(density: Ref<MenuDensity>): void {
  provide(DENSITY_KEY, density)
}

/** Density provided by the nearest menu root or content, `default` when none. */
export function injectMenuDensity(): Ref<MenuDensity> {
  return inject(DENSITY_KEY, null) ?? computed(() => 'default' as MenuDensity)
}

export function provideMenuSize(size: Ref<MenuSize>): void {
  provide(SIZE_KEY, size)
}

/** Size provided by the nearest menu root or content, `md` when none. */
export function injectMenuSize(): Ref<MenuSize> {
  return inject(SIZE_KEY, null) ?? computed(() => 'md' as MenuSize)
}

/** `{ density, size }` of the nearest menu, for the class helpers in `menuStyles`. */
export function useMenuLook(): ComputedRef<MenuLook> {
  const density = injectMenuDensity()
  const size = injectMenuSize()
  return computed(() => ({ density: density.value, size: size.value }))
}

/**
 * For a menu ROOT (`density` / `size` props): provides the normalised values to every part below.
 * For a menu CONTENT: pass the root's values as the fallback; a prop set on the content wins over the root.
 */
export function provideMenuLook(props: { density?: unknown; size?: unknown }, inherit = false): ComputedRef<MenuLook> {
  const inheritedDensity = inherit ? injectMenuDensity() : null
  const inheritedSize = inherit ? injectMenuSize() : null
  const density = computed(() => (props.density === undefined && inheritedDensity ? inheritedDensity.value : normalizeMenuDensity(props.density)))
  const size = computed(() => (props.size === undefined && inheritedSize ? inheritedSize.value : normalizeMenuSize(props.size)))
  provideMenuDensity(density)
  provideMenuSize(size)
  return computed(() => ({ density: density.value, size: size.value }))
}
