import { computed, type ComputedRef } from 'vue'
import { injectMenuDensity, provideMenuDensity } from '../menuContext'
import { menuDensities, normalizeMenuDensity, type MenuDensity } from '../menuStyles'

/** Density helpers kept here for existing imports. The shared implementation lives in `../menuContext` and `../menuStyles`. */
export { menuDensities, injectMenuDensity, provideMenuDensity }
export type { MenuDensity }

/** Unknown / missing values fall back to `default`. */
export const normalizeDensity = normalizeMenuDensity

/** `true` while the nearest menu is compact. */
export function useCompactMenu(): ComputedRef<boolean> {
  const density = injectMenuDensity()
  return computed(() => density.value === 'compact')
}
