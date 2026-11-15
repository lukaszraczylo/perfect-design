import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { PanelConfig } from './layout'
import type { ResizableOrientation } from './variants'

export interface ResizableItem {
  id: number
  kind: 'panel' | 'handle'
  el: Ref<HTMLElement | null>
  /** panels only: reactive config getter */
  config?: () => PanelConfig
  /** handles only */
  disabled?: () => boolean
}

export interface ResizableContext {
  orientation: ComputedRef<ResizableOrientation>
  disabled: ComputedRef<boolean>
  dragging: Ref<boolean>
  /** False until the root has mounted: SSR / first paint uses each panel's own defaultSize because the panel count is not known yet. */
  ready: Ref<boolean>
  /** Current layout (always sums to 100). Aligned with panels in DOM order. */
  layout: ComputedRef<number[]>
  register(item: ResizableItem): void
  unregister(id: number): void
  /** Re-sort registered items by DOM position (call after mount). */
  sort(): void
  panelIndex(id: number): number
  handleIndex(id: number): number
  isCollapsed(panelId: number): boolean
  collapse(panelId: number): void
  expand(panelId: number): void
  /** aria-valuenow / min / max for a handle, rounded. */
  handleValues(handleId: number): { now: number; min: number; max: number; usable: boolean }
  startDrag(handleId: number, event: PointerEvent): void
  keyDown(handleId: number, event: KeyboardEvent): void
}

export const resizableKey: InjectionKey<ResizableContext> = Symbol('ResizablePanels')

let counter = 0
/** Unique registry id for panels / handles. */
export const nextResizableId = () => ++counter
