<script setup lang="ts">
import { markerPath, type MarkerShape } from './chartKit'

/** Internal HTML legend (swatch + name) shared by BarChart and LineChart. Not part of the public API. */
export interface ChartLegendItem {
  name: string
  /** Literal `bg-*` class from tones.ts. */
  bg: string
  /** Literal `stroke-*` class from tones.ts. With `dash` the swatch is a line sample instead of a square. */
  stroke?: string
  /** SVG `stroke-dasharray` of the series line (`''` = solid). Lets line series differ by more than colour. */
  dash?: string
  /** Marker drawn on the line sample when markers differ per series. Needs `stroke` and `fill`. */
  marker?: MarkerShape
  /** Literal `fill-*` class from tones.ts for the marker. */
  fill?: string
}

defineProps<{ items: ChartLegendItem[]; dataSlot: string }>()
</script>

<template>
  <ul :data-slot="dataSlot" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
    <li v-for="(item, i) in items" :key="i" :data-slot="`${dataSlot}-item`" class="inline-flex items-center gap-1.5">
      <svg v-if="item.dash !== undefined && item.stroke" viewBox="0 0 20 10" class="h-2.5 w-5 shrink-0" aria-hidden="true" focusable="false">
        <line x1="1" y1="5" x2="19" y2="5" stroke-width="2" stroke-linecap="round" :stroke-dasharray="item.dash || undefined" :class="item.stroke" />
        <template v-if="item.marker && item.fill">
          <circle v-if="item.marker === 'circle'" cx="10" cy="5" r="3" stroke-width="1.5" :class="[item.fill, 'stroke-background']" />
          <path v-else :d="markerPath(item.marker, 10, 5, 3)" stroke-width="1.5" :class="[item.fill, 'stroke-background']" />
        </template>
      </svg>
      <span v-else :class="['size-2.5 shrink-0 rounded-sm', item.bg]" aria-hidden="true" />
      <span>{{ item.name }}</span>
    </li>
  </ul>
</template>
