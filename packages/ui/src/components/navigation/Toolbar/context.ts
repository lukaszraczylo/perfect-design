import type { ComputedRef, InjectionKey } from 'vue'
import type { ToolbarDensity, ToolbarGap, ToolbarOrientation, ToolbarOverflow, ToolbarSize, ToolbarVariant } from './variants'

/** Provided by `Toolbar` (values already validated) so every part follows the bar. */
export interface ToolbarContext {
  variant: ComputedRef<ToolbarVariant>
  size: ComputedRef<ToolbarSize>
  density: ComputedRef<ToolbarDensity>
  orientation: ComputedRef<ToolbarOrientation>
  gap: ComputedRef<ToolbarGap>
  overflow: ComputedRef<ToolbarOverflow>
}

export const TOOLBAR_KEY: InjectionKey<ToolbarContext> = Symbol('pd-toolbar')
