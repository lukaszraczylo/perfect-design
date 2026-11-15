import type { InjectionKey } from 'vue'

/** Provided by `TooltipProvider`: lets `Tooltip` tell a missing provider apart from a present one. */
export const TOOLTIP_PROVIDER_KEY: InjectionKey<true> = Symbol('perfect-design:tooltip-provider')

/** Provided by `Tooltip`: lets `TooltipTrigger` and `TooltipContent` tell when they sit outside a `Tooltip`. */
export const TOOLTIP_ROOT_KEY: InjectionKey<{ disabled: () => boolean }> = Symbol('perfect-design:tooltip-root')
