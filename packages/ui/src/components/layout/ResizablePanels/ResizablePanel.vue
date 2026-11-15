<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { nextResizableId, resizableKey } from './context'
import { isValidSize, roundSize } from './layout'
import { resizablePanelVariants } from './variants'

export interface ResizablePanelProps extends BaseProps {
  /** Initial size in percent. Missing / invalid (NaN, negative) values share the remaining space equally. */
  defaultSize?: number
  /** Minimum size in percent. Invalid values fall back to 0. */
  minSize?: number
  /** Maximum size in percent. Invalid values fall back to 100; never below `minSize`. */
  maxSize?: number
  /** Allow the panel to collapse to `collapsedSize` when dragged below half of `minSize` (or with Enter on an adjacent handle). */
  collapsible?: boolean
  /** Size in percent while collapsed (0 .. minSize). */
  collapsedSize?: number
}

const props = withDefaults(defineProps<ResizablePanelProps>(), {
  defaultSize: undefined,
  minSize: undefined,
  maxSize: undefined,
  collapsible: false,
  collapsedSize: undefined,
})

const emit = defineEmits<{
  collapse: []
  expand: []
}>()

const ctx = inject(resizableKey, null)
const el = ref<HTMLElement | null>(null)
const uid = nextResizableId()

// Outside ResizablePanels the panel has no size to share, so it would stay unsized and inert.
onMounted(async () => {
  await nextTick()
  if (!ctx) violation('ResizablePanel', 'requires-parent', 'must be a child of ResizablePanels, which shares the available space between its panels.')
})

if (ctx) {
  ctx.register({
    id: uid,
    kind: 'panel',
    el,
    config: () => ({
      defaultSize: props.defaultSize,
      minSize: props.minSize,
      maxSize: props.maxSize,
      collapsible: props.collapsible,
      collapsedSize: props.collapsedSize,
    }),
  })
  onMounted(() => ctx.sort())
  onBeforeUnmount(() => ctx.unregister(uid))
}

/* v8 ignore next -- `?? 0` guards a panel that is mid-removal */
const size = computed(() => (ctx?.ready.value ? (ctx.layout.value[ctx.panelIndex(uid)] ?? 0) : undefined))
const collapsed = computed(() => !!ctx && ctx.isCollapsed(uid))
// before mount the panel count is unknown: use the panel's own defaultSize (flex normalises the proportions)
const style = computed(() => {
  if (!ctx) return undefined
  const grow = size.value ?? (isValidSize(props.defaultSize) ? props.defaultSize : 1)
  return { flex: `${grow} 1 0px` }
})

watch(collapsed, (now) => {
  if (now) emit('collapse')
  else emit('expand')
})

defineExpose({
  collapse: () => ctx?.collapse(uid),
  expand: () => ctx?.expand(uid),
  isCollapsed: () => collapsed.value,
})
</script>

<template>
  <div
    ref="el"
    data-slot="resizable-panel"
    :data-size="size === undefined ? undefined : roundSize(size)"
    :data-collapsed="collapsed ? '' : undefined"
    :class="cn(resizablePanelVariants(), props.class)"
    :style="style"
  >
    <slot />
  </div>
</template>
