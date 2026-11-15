<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../../lib/cn'
import { DASH, MARKERS, isVariant, pathClass, shapeClass, shapeStrokeWidth, textClass, type DiagramVariant } from './palette'
import type { Marker, RenderModel } from './types'

/**
 * Internal: draws a RenderModel as one SVG image. All text goes through Vue text nodes (never innerHTML), so hostile
 * diagram source can only ever appear as inert text. Not part of the public API.
 */
const props = defineProps<{
  model: RenderModel
  variant: DiagramVariant | string
  fit: 'width' | 'scroll'
  /** Unique prefix for marker and label ids. */
  uid: string
  title: string
  description?: string
}>()

const variant = computed<DiagramVariant>(() => (isVariant(props.variant) ? props.variant : 'outline'))
const markerId = (m: Marker) => `${props.uid}-m-${m}`
const url = (m: Marker | undefined) => (m ? `url(#${markerId(m)})` : undefined)
const titleId = computed(() => `${props.uid}-title`)
const descId = computed(() => `${props.uid}-desc`)
const labelledby = computed(() => (props.description ? `${titleId.value} ${descId.value}` : titleId.value))
const markerSize = computed(() => Math.round(props.model.fontSize * 0.75))
/** Only the markers the drawing uses are defined, so a small diagram stays small in the DOM. */
const markers = computed(() => {
  const used = new Set<Marker>()
  for (const it of props.model.items) if (it.kind === 'path') for (const m of [it.markerStart, it.markerEnd]) if (m) used.add(m)
  return MARKERS.filter((m) => used.has(m.id))
})

const classes = computed(() => cn('block', props.fit === 'width' ? 'h-auto max-w-full' : 'max-w-none shrink-0'))
const lineHeight = (size: number) => size * 1.4
const lineY = (y: number, size: number, i: number, n: number) => Math.round((y + (i - (n - 1) / 2) * lineHeight(size)) * 100) / 100
</script>

<template>
  <svg
    data-slot="mermaid-diagram-svg"
    role="img"
    focusable="false"
    :aria-labelledby="labelledby"
    :width="model.width"
    :height="model.height"
    :viewBox="`0 0 ${model.width} ${model.height}`"
    :data-type="model.type"
    :class="classes"
  >
    <title :id="titleId">{{ title }}</title>
    <desc v-if="description" :id="descId">{{ description }}</desc>
    <defs>
      <marker
        v-for="m in markers"
        :id="markerId(m.id)"
        :key="m.id"
        :viewBox="`0 0 ${m.width} 10`"
        :refX="m.refX"
        refY="5"
        :markerWidth="(m.width / 10) * markerSize"
        :markerHeight="markerSize"
        markerUnits="userSpaceOnUse"
        orient="auto-start-reverse"
      >
        <template v-for="(part, i) in m.parts" :key="i">
          <circle
            v-if="part.tag === 'circle'"
            :cx="part.cx"
            :cy="part.cy"
            :r="part.r"
            stroke-width="1.2"
            :class="part.fill === 'ink' ? 'fill-muted-foreground stroke-muted-foreground' : 'fill-card stroke-muted-foreground'"
          />
          <path
            v-else
            :d="part.d"
            stroke-width="1.2"
            stroke-linejoin="round"
            stroke-linecap="round"
            :class="part.fill === 'ink' ? 'fill-muted-foreground stroke-muted-foreground' : part.fill === 'card' ? 'fill-card stroke-muted-foreground' : 'fill-none stroke-muted-foreground'"
          />
        </template>
      </marker>
    </defs>
    <g data-slot="mermaid-diagram-content">
      <template v-for="(it, i) in model.items" :key="i">
        <path
          v-if="it.kind === 'shape'"
          :data-role="it.role"
          :d="it.d"
          :class="shapeClass(variant, it.paint)"
          :stroke-width="shapeStrokeWidth(it) || undefined"
          :stroke-dasharray="it.paint.dash ? DASH[it.paint.dash] : undefined"
          stroke-linejoin="round"
        ><title v-if="it.title">{{ it.title }}</title></path>
        <path
          v-else-if="it.kind === 'path'"
          :data-role="it.role"
          :d="it.d"
          :class="pathClass(variant, it)"
          :stroke-width="it.thick ? 3 : 1.5"
          :stroke-dasharray="it.style === 'solid' ? undefined : DASH[it.style]"
          stroke-linejoin="round"
          stroke-linecap="round"
          :marker-start="url(it.markerStart)"
          :marker-end="url(it.markerEnd)"
        />
        <text
          v-else
          :data-role="it.role"
          :x="it.x"
          :y="it.y"
          :text-anchor="it.anchor"
          :font-size="it.size"
          :font-weight="it.bold ? 600 : undefined"
          :transform="it.rotate ? `rotate(${it.rotate} ${it.x} ${it.y})` : undefined"
          dominant-baseline="central"
          :class="textClass(it, variant)"
        >
          <tspan v-for="(line, li) in it.lines" :key="li" :x="it.x" :y="lineY(it.y, it.size, li, it.lines.length)">{{ line }}</tspan>
          <title v-if="it.title">{{ it.title }}</title>
        </text>
      </template>
    </g>
  </svg>
</template>
