import { inject, provide, type ComputedRef, type InjectionKey } from 'vue'
import type { ToggleGroupGap, ToggleGroupShape, ToggleGroupSize, ToggleGroupTone, ToggleGroupVariant } from './variants'

/** Shared look-and-feel handed from ToggleGroup to its items. */
export interface ToggleGroupContext {
  variant: ComputedRef<ToggleGroupVariant>
  size: ComputedRef<ToggleGroupSize>
  orientation: ComputedRef<'horizontal' | 'vertical'>
  /** Items grow to share the group width. */
  fullWidth?: ComputedRef<boolean>
  shape?: ComputedRef<ToggleGroupShape>
  tone?: ComputedRef<ToggleGroupTone>
  gap?: ComputedRef<ToggleGroupGap>
  /** An item announces its value; returns how many items hold that value now (1 = unique) and a release function. */
  claim?: (value: string) => { count: number; release: () => void }
}

export const toggleGroupContextKey: InjectionKey<ToggleGroupContext> = Symbol('ToggleGroupContext')

export function provideToggleGroupContext(ctx: ToggleGroupContext) {
  provide(toggleGroupContextKey, ctx)
}

export function useToggleGroupContext(): ToggleGroupContext | null {
  return inject(toggleGroupContextKey, null)
}
