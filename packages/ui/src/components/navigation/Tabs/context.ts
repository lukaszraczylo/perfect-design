import type { ComputedRef, InjectionKey } from 'vue'
import type { TabsSize, TabsVariant } from './variants'

/** Provided by `Tabs`, read by `TabsList` and `TabsTrigger` so the variant is set once on the root. */
export const TABS_VARIANT_KEY: InjectionKey<ComputedRef<TabsVariant>> = Symbol('pd-tabs-variant')

export interface TabsOptions {
  variant: TabsVariant
  size: TabsSize
  fullWidth: boolean
}
/** Everything `Tabs` passes down: variant, size and fullWidth (already validated). */
export const TABS_OPTIONS_KEY: InjectionKey<ComputedRef<TabsOptions>> = Symbol('pd-tabs-options')
