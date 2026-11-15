<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, useAttrs } from 'vue'
import { cn } from '../../../lib/cn'
import { requireOneOf, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { nextResizableId, resizableKey } from './context'
import { resizableHandleSizes, resizableHandleVariants, type ResizableHandleSize, type ResizableHandleVariant } from './variants'

export interface ResizableHandleProps extends BaseProps {
  /** `line` = hairline with a wide hit area, `bar` = thicker muted track. Unknown values fall back to `line`. */
  variant?: ResizableHandleVariant
  /** Visible thickness. `line`: `sm` and `md` 1px, `lg` 2px. `bar`: `sm` 4px, `md` 8px (default), `lg` 12px. The 24px hit area never changes. Unknown values fall back to `md`. */
  size?: ResizableHandleSize
  /** Show a small grip in the middle of the handle (the default slot replaces it). */
  grip?: boolean
  /** Disable this handle (pointer and keyboard). It leaves the tab order and gets `aria-disabled`. */
  disabled?: boolean
  /** Accessible name of the separator. REQUIRED (or `aria-label` / `aria-labelledby`): say which panels it resizes. */
  label?: string
}

const props = withDefaults(defineProps<ResizableHandleProps>(), { variant: 'line', size: 'md', grip: false, disabled: false, label: undefined })

const ctx = inject(resizableKey, null)
const attrs = useAttrs()
onMounted(async () => {
  await nextTick()
  if (!ctx) return violation('ResizableHandle', 'requires-parent', 'must be placed between two ResizablePanel children of ResizablePanels.')
  requireOneOf(
    'ResizableHandle',
    { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] },
    'Name what it resizes, e.g. aria-label="Resize sidebar". The rendered fallback is "Resize panels".',
  )
})
const el = ref<HTMLElement | null>(null)
const uid = nextResizableId()

if (ctx) {
  ctx.register({ id: uid, kind: 'handle', el, disabled: () => props.disabled })
  onMounted(() => ctx.sort())
  onBeforeUnmount(() => ctx.unregister(uid))
}

const orientation = computed(() => ctx?.orientation.value ?? 'horizontal')
// only read once `ready` (i.e. inside a ResizablePanels)
const values = computed(() => ctx!.handleValues(uid))
const ready = computed(() => !!ctx?.ready.value)
const blocked = computed(() => props.disabled || !!ctx?.disabled.value || (ready.value ? !values.value.usable : !ctx))
const variant = computed<ResizableHandleVariant>(() => (props.variant === 'bar' ? 'bar' : 'line'))
const size = computed<ResizableHandleSize>(() => (resizableHandleSizes.includes(props.size) ? props.size : 'md'))
const dragging = computed(() => !!ctx?.dragging.value)

// ResizablePanels re-checks disabled / usable state, so these only forward
function onPointerDown(e: PointerEvent) {
  ctx?.startDrag(uid, e)
}
function onKeyDown(e: KeyboardEvent) {
  ctx?.keyDown(uid, e)
}
</script>

<template>
  <div
    ref="el"
    data-slot="resizable-handle"
    role="separator"
    :aria-label="label || 'Resize panels'"
    :aria-orientation="orientation === 'horizontal' ? 'vertical' : 'horizontal'"
    :aria-valuenow="ready ? values.now : undefined"
    :aria-valuemin="ready ? values.min : undefined"
    :aria-valuemax="ready ? values.max : undefined"
    :aria-disabled="blocked ? 'true' : undefined"
    :tabindex="blocked ? -1 : 0"
    :data-orientation="orientation"
    :data-disabled="blocked ? '' : undefined"
    :data-dragging="dragging ? '' : undefined"
    :class="cn(resizableHandleVariants({ orientation, variant, size }), props.class)"
    @pointerdown="onPointerDown"
    @keydown="onKeyDown"
  >
    <slot>
      <span
        v-if="grip"
        data-slot="resizable-handle-grip"
        aria-hidden="true"
        :class="
          cn(
            'z-10 flex items-center justify-center rounded-sm border bg-border',
            orientation === 'horizontal' ? 'h-6 w-3 flex-col gap-0.5' : 'h-3 w-6 flex-row gap-0.5',
          )
        "
      >
        <span class="size-0.5 rounded-full bg-muted-foreground" />
        <span class="size-0.5 rounded-full bg-muted-foreground" />
        <span class="size-0.5 rounded-full bg-muted-foreground" />
      </span>
    </slot>
  </div>
</template>
