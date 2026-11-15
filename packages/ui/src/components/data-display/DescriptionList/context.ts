import type { InjectionKey } from 'vue'
import type { DescriptionListDensity, DescriptionListVariant } from './variants'

/** Internal: DescriptionList tells its items which variant is active so items can adapt without changing default output. */
export const descriptionListKey: InjectionKey<() => DescriptionListVariant> = Symbol('description-list')

/** Internal: the list's spacing scale, read by items for their own padding. */
export const descriptionListDensityKey: InjectionKey<() => DescriptionListDensity> = Symbol('description-list-density')
