<script setup lang="ts">
import { computed } from 'vue'
/**
 * Internal visually hidden data table: the text alternative of an SVG chart (WCAG 1.1.1). Screen reader users can
 * read every value; the SVG itself is a single labelled image. Not part of the public API.
 */
export interface ChartDataTableSeries {
  name: string
  data: (number | null)[]
}

const props = defineProps<{
  caption: string
  /** Header of the first column (the category). */
  categoryHeader?: string
  categories: string[]
  series: ChartDataTableSeries[]
  format: (n: number) => string
  /** Optional formatter per series (same index as `series`); a missing entry falls back to `format`. */
  formats?: (((n: number) => string) | undefined)[]
}>()

/** Beyond this many rows the table is cut (a 10k-row table is no more usable than the chart itself). */
const MAX_ROWS = 200
const shown = computed(() => props.categories.slice(0, MAX_ROWS))
const title = computed(() => (props.categories.length > MAX_ROWS ? `${props.caption} (first ${MAX_ROWS} of ${props.categories.length} rows)` : props.caption))
</script>

<template>
  <!-- The wrapper, not the table, is sr-only: overflow clipping does not apply to table boxes, so a clipped table would still widen the page. -->
  <div data-slot="chart-data-table" class="sr-only">
    <table>
      <caption>{{ title }}</caption>
      <thead>
        <tr>
          <th scope="col">{{ categoryHeader ?? 'Category' }}</th>
          <th v-for="(s, i) in series" :key="i" scope="col">{{ s.name }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(c, ci) in shown" :key="ci">
          <th scope="row">{{ c }}</th>
          <td v-for="(s, si) in series" :key="si">{{ s.data[ci] === null || s.data[ci] === undefined ? 'n/a' : (formats?.[si] ?? format)(s.data[ci]!) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
