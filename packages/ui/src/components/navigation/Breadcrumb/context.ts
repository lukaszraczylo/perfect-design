import type { ComputedRef, InjectionKey } from 'vue'
import type { BreadcrumbSeparatorKind, BreadcrumbSize } from './variants'

export interface BreadcrumbOptions {
  size: BreadcrumbSize
  separator: BreadcrumbSeparatorKind
}
/** Provided by `Breadcrumb`, read by `BreadcrumbList` and `BreadcrumbSeparator` so compound parts follow the root. */
export const BREADCRUMB_OPTIONS_KEY: InjectionKey<ComputedRef<BreadcrumbOptions>> = Symbol('pd-breadcrumb-options')
