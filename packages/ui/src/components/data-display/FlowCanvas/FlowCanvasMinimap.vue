<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Point } from '../_diagram/types'
import { nodeRect, type NormNode, type Rect } from './flowGeometry'

/**
 * Internal overview of the canvas: every node as a small box and the visible area as an outline. Pressing or dragging
 * on it asks the canvas to centre on that point. It is a pointer shortcut only (hidden from assistive technology); the
 * keyboard pans and fits with the canvas itself.
 */
const props = defineProps<{
  nodes: readonly NormNode[]
  /** The part of the canvas that is visible, in canvas units. */
  view: Rect
}>()
const emit = defineEmits<{ center: [point: Point] }>()

const W = 144
const H = 96
const PAD = 8

const world = computed<Rect>(() => {
  let x0 = props.view.x
  let y0 = props.view.y
  let x1 = props.view.x + props.view.width
  let y1 = props.view.y + props.view.height
  for (const n of props.nodes) {
    const r = nodeRect(n)
    x0 = Math.min(x0, r.x)
    y0 = Math.min(y0, r.y)
    x1 = Math.max(x1, r.x + r.width)
    y1 = Math.max(y1, r.y + r.height)
  }
  return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0) }
})
const scale = computed(() => Math.min((W - 2 * PAD) / world.value.width, (H - 2 * PAD) / world.value.height))
const ox = computed(() => (W - world.value.width * scale.value) / 2 - world.value.x * scale.value)
const oy = computed(() => (H - world.value.height * scale.value) / 2 - world.value.y * scale.value)
const boxes = computed(() => props.nodes.map((n) => ({ id: n.id, x: n.x * scale.value + ox.value, y: n.y * scale.value + oy.value, w: Math.max(2, n.w * scale.value), h: Math.max(2, n.h * scale.value) })))
const frame = computed(() => ({ x: props.view.x * scale.value + ox.value, y: props.view.y * scale.value + oy.value, w: props.view.width * scale.value, h: props.view.height * scale.value }))

const svg = ref<SVGSVGElement | null>(null)
let pressed = false
function centreAt(e: PointerEvent) {
  const r = svg.value?.getBoundingClientRect()
  const sx = r && r.width > 0 ? W / r.width : 1
  const sy = r && r.height > 0 ? H / r.height : 1
  const x = (e.clientX - (r?.left ?? 0)) * sx
  const y = (e.clientY - (r?.top ?? 0)) * sy
  emit('center', { x: (x - ox.value) / scale.value, y: (y - oy.value) / scale.value })
}
function down(e: PointerEvent) {
  pressed = true
  svg.value?.setPointerCapture?.(e.pointerId)
  centreAt(e)
}
function move(e: PointerEvent) {
  if (pressed) centreAt(e)
}
function up() {
  pressed = false
}
</script>

<template>
  <svg
    ref="svg"
    data-slot="flow-canvas-minimap"
    aria-hidden="true"
    focusable="false"
    :viewBox="`0 0 ${W} ${H}`"
    class="absolute end-2 bottom-2 h-24 w-36 touch-none rounded-md border border-border bg-card forced-colors:border-[CanvasText]"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @pointercancel="up"
  >
    <rect
      v-for="b in boxes"
      :key="b.id"
      data-slot="flow-canvas-minimap-node"
      :x="b.x"
      :y="b.y"
      :width="b.w"
      :height="b.h"
      rx="1"
      class="fill-muted-foreground forced-colors:fill-[CanvasText]"
    />
    <rect data-slot="flow-canvas-minimap-view" :x="frame.x" :y="frame.y" :width="frame.w" :height="frame.h" fill="none" stroke-width="1.5" class="stroke-primary forced-colors:stroke-[Highlight]" />
  </svg>
</template>
