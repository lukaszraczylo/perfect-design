<script setup lang="ts">
import { markerPath, type MarkerShape } from './chartKit'
import { FORCED_FILL, FORCED_STROKE } from './chartFrame'

/**
 * Internal HTML legend whose swatch repeats how the series is drawn: a marker, a line sample (solid or dashed), or both.
 * A reader tells series apart by shape and dash as well as colour. Not part of the public API.
 */
export interface ChartMarkerLegendItem {
  name: string
  /** Marker drawn in the swatch. */
  shape?: MarkerShape
  /** Literal `fill-*` class from tones.ts for the marker. */
  fill?: string
  /** Literal `stroke-*` class from tones.ts; draws a line sample. */
  stroke?: string
  /** `stroke-dasharray` of the line sample (`''` = solid). */
  dash?: string
}

defineProps<{ items: ChartMarkerLegendItem[]; dataSlot: string }>()
</script>

<template>
  <ul :data-slot="dataSlot" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
    <li v-for="(item, i) in items" :key="i" :data-slot="`${dataSlot}-item`" class="inline-flex items-center gap-1.5">
      <svg :viewBox="item.stroke ? '0 0 20 12' : '0 0 12 12'" :class="['h-3 shrink-0', item.stroke ? 'w-5' : 'w-3']" aria-hidden="true" focusable="false">
        <line
          v-if="item.stroke"
          x1="1" y1="6" x2="19" y2="6"
          stroke-width="2"
          stroke-linecap="round"
          :stroke-dasharray="item.dash || undefined"
          :class="[item.stroke, FORCED_STROKE]"
        />
        <template v-if="item.shape && item.fill">
          <circle v-if="item.shape === 'circle'" :cx="item.stroke ? 10 : 6" cy="6" r="3.6" :class="[item.fill, FORCED_FILL]" />
          <path v-else :d="markerPath(item.shape, item.stroke ? 10 : 6, 6, 3.6)" :class="[item.fill, FORCED_FILL]" />
        </template>
      </svg>
      <span>{{ item.name }}</span>
    </li>
  </ul>
</template>
