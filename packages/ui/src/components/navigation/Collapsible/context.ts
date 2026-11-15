import type { ComputedRef, InjectionKey } from 'vue'
import type { CollapsibleSize } from './variants'

/** Provided by `Collapsible` (already validated) so the content follows the size set on the root. */
export const COLLAPSIBLE_SIZE_KEY: InjectionKey<ComputedRef<CollapsibleSize>> = Symbol('pd-collapsible-size')
