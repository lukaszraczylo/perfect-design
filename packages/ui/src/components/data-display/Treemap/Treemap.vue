<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { formatNumber, r2 } from '../_chart/chartMath'
import { dimension, estimateTextWidth, oneOf, plural, truncateLabel } from '../_chart/chartKit'
import { seriesTone, toneClasses, type ChartTone } from '../_chart/tones'
import { useChartContract } from '../_chart/chartContract'
import ChartDataTable from '../_chart/ChartDataTable.vue'
import ChartLegend from '../_chart/ChartLegend.vue'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { headerFor, inset, layoutTree, normalizeDepth, normalizeTree, type Box, type TreeNode } from './treemapLayout'
import { TREEMAP_TONES } from './treemapTones'
import {
  TREEMAP_COLOR_BY, TREEMAP_GAPS, TREEMAP_GAP_PX, TREEMAP_HEIGHTS, TREEMAP_LABELS, TREEMAP_SIZES, TREEMAP_VARIANTS, treemapCellVariants, treemapVariants,
  type TreemapColorBy, type TreemapGap, type TreemapLabels, type TreemapSize, type TreemapVariant,
} from './variants'

export interface TreemapDatum {
  label: string
  /** Value of a leaf. A node with `children` takes the sum of them instead. */
  value?: number
  children?: TreemapDatum[]
}

export interface TreemapProps extends BaseProps {
  /** Hierarchy: `{ label, value?, children? }`. Tile area follows the value. */
  data: TreemapDatum[]
  /** `flat` tinted tiles, `nested` shows each group as a container with a header, `outline` soft tiles with a coloured edge. */
  variant?: 'flat' | 'nested' | 'outline'
  /** Height of the drawing: 200 / 300 / 420 (an explicit `height` wins). */
  size?: 'sm' | 'md' | 'lg'
  /** Space between tiles: none 0px, sm 1px, md 2px, lg 4px. */
  gap?: 'none' | 'sm' | 'md' | 'lg'
  /** Colour of the tiles with `colorBy="depth"`. Deeper levels are denser. */
  tone?: ChartTone
  /** `depth` uses `tone` for everything; `series` gives every top-level group its own chart colour. */
  colorBy?: 'depth' | 'series'
  /** `auto` writes a label into every tile that is big enough, `none` leaves tiles unlabelled. */
  labels?: 'auto' | 'none'
  /** Print the value under the label when the tile is tall enough. */
  showValues?: boolean
  /** Legend of the top-level groups. `'auto'` shows it with `colorBy="series"`. */
  showLegend?: boolean | 'auto'
  /** Levels drawn, 1 to 8. Deeper nodes are folded into the node at this level. */
  maxDepth?: number
  /** Formats values in labels, tooltips and the table. */
  valueFormatter?: (n: number) => string
  /** Accessible name. Without it `title` names the treemap. */
  label?: string
  /** Visible heading. */
  title?: string
  /** Visible sentence under the title. */
  description?: string
  /** Shown when there is nothing to draw. */
  emptyText?: string
  /** ViewBox width used until the container is measured. */
  width?: number
  /** ViewBox height. Overrides `size`. */
  height?: number
}

const props = withDefaults(defineProps<TreemapProps>(), {
  variant: 'flat',
  size: 'md',
  gap: 'md',
  tone: 'chart-1',
  colorBy: 'depth',
  labels: 'auto',
  showValues: true,
  showLegend: 'auto',
  maxDepth: 4,
  emptyText: 'No data',
  width: 480,
})

defineOptions({ inheritAttrs: false })
const { explicitName, labelledby, rootAttrs } = useChartContract(
  'Treemap',
  {
    get label() {
      return props.label || props.title
    },
  },
  () => {
    if (!Array.isArray(props.data)) violation('Treemap', 'requires-data', 'requires `data`, an array of `{ label, value?, children? }` nodes. An empty array shows the empty state.')
  },
  [() => props.data],
)

const FONT = 12
const HEADER = 18
const uid = useId()
const rootEl = ref<HTMLElement | null>(null)
const svgEl = ref<SVGElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))
const variant = computed<TreemapVariant>(() => oneOf(props.variant, TREEMAP_VARIANTS, 'flat'))
const size = computed<TreemapSize>(() => oneOf(props.size, TREEMAP_SIZES, 'md'))
const gap = computed<TreemapGap>(() => oneOf(props.gap, TREEMAP_GAPS, 'md'))
const colorBy = computed<TreemapColorBy>(() => oneOf(props.colorBy, TREEMAP_COLOR_BY, 'depth'))
const labelMode = computed<TreemapLabels>(() => oneOf(props.labels, TREEMAP_LABELS, 'auto'))
const baseTone = computed(() => oneOf(props.tone, Object.keys(TREEMAP_TONES) as ChartTone[], 'chart-1'))
const H = computed(() => dimension(props.height, TREEMAP_HEIGHTS[size.value]))
const fmt = (n: number) => (props.valueFormatter ?? formatNumber)(n)

const tree = computed(() => normalizeTree(props.data, normalizeDepth(props.maxDepth)))
const empty = computed(() => tree.value.roots.length === 0)
const g = computed(() => TREEMAP_GAP_PX[gap.value])
const nested = computed(() => variant.value === 'nested')

const placed = computed(() => layoutTree(tree.value.roots, { x: 0, y: 0, w: W.value, h: H.value }, { nested: nested.value, pad: Math.max(2, g.value), header: HEADER }))

const toneOf = (node: TreeNode): ChartTone => (colorBy.value === 'series' ? seriesTone(node.branch) : baseTone.value)
const pct = (node: TreeNode) => (tree.value.total > 0 ? Math.round((node.value / tree.value.total) * 1000) / 10 : 0)
const describe = (node: TreeNode) => `${node.path.join(' / ')}: ${fmt(node.value)} (${formatNumber(pct(node))}% of total)`

/** Smallest tile side that is still drawn. */
const MIN_SIDE = 2

interface LeafCell {
  key: string
  index: number
  box: Box
  cls: string
  text: string
  lines: { x: number; y: number; text: string; strong: boolean }[]
}

interface GroupCell {
  key: string
  box: Box
  title: { x: number; y: number; text: string } | null
}

const showLabels = computed(() => labelMode.value === 'auto')

function leafLines(node: TreeNode, b: Box): LeafCell['lines'] {
  if (!showLabels.value || b.h < FONT + 8) return []
  const room = b.w - 8
  const chars = Math.floor(room / (FONT * 0.6))
  if (chars < 3) return []
  const out: LeafCell['lines'] = [{ x: r2(b.x + 4), y: r2(b.y + 4 + FONT / 2 + 1), text: truncateLabel(node.label, chars), strong: true }]
  if (props.showValues && b.h >= 2 * FONT + 12) {
    const v = fmt(node.value)
    if (estimateTextWidth(v, FONT) <= room) out.push({ x: r2(b.x + 4), y: r2(b.y + 4 + FONT * 1.5 + 4), text: v, strong: false })
  }
  return out
}

const drawn = computed(() => {
  const leaves: LeafCell[] = []
  const groups: GroupCell[] = []
  let hidden = 0
  for (const p of placed.value) {
    const b = inset(p.box, g.value / 2)
    if (p.leaf) {
      if (b.w < MIN_SIDE || b.h < MIN_SIDE) {
        hidden++
        continue
      }
      const t = TREEMAP_TONES[toneOf(p.node)]
      const fill = variant.value === 'outline' ? `${t.soft} ${t.stroke}` : t.steps[Math.min(3, p.node.depth - 1)]!
      leaves.push({
        key: p.node.key,
        index: leaves.length,
        box: b,
        cls: `${treemapCellVariants({ variant: variant.value })} ${fill}`,
        text: describe(p.node),
        lines: leafLines(p.node, b),
      })
    } else if (nested.value && b.w >= MIN_SIDE && b.h >= MIN_SIDE) {
      const withHeader = headerFor(p.box, HEADER) > 0
      const chars = Math.floor((b.w - 8) / (FONT * 0.6))
      groups.push({
        key: p.node.key,
        box: b,
        title: withHeader && showLabels.value && chars >= 3 ? { x: r2(b.x + 4), y: r2(b.y + HEADER / 2 + 1), text: truncateLabel(p.node.label, chars) } : null,
      })
    }
  }
  return { leaves, groups, hidden }
})

/** Roving tabindex: one tile is in the tab order, the arrow keys move between tiles. */
const current = ref(0)
const rover = computed(() => Math.min(current.value, Math.max(0, drawn.value.leaves.length - 1)))
const active = ref<string | null>(null)
const readout = computed(() => drawn.value.leaves.find((l) => l.key === active.value)?.text ?? '')

function onKeydown(e: KeyboardEvent) {
  const root = svgEl.value
  if (!root) return
  const cells = Array.from(root.querySelectorAll<SVGElement>('[data-slot="treemap-cell"]'))
  const from = cells.indexOf(e.target as SVGElement)
  if (from < 0) return
  const last = cells.length - 1
  const to = e.key === 'Home' ? 0 : e.key === 'End' ? last : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? Math.min(last, from + 1) : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? Math.max(0, from - 1) : -1
  if (to < 0) return
  e.preventDefault()
  cells[to]!.focus()
}

const summary = computed(() => {
  const t = tree.value
  return `Treemap: ${plural(t.leaves, 'item')}, ${plural(t.roots.length, 'top-level group')}, total ${fmt(t.total)}`
})

const rows = computed(() => {
  const out: { path: string; value: number }[] = []
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      out.push({ path: n.path.join(' / '), value: n.value })
      walk(n.children)
    }
  }
  walk(tree.value.roots)
  return out
})
const tableSeries = computed(() => [{ name: 'Value', data: rows.value.map((r) => r.value) }])
const tableCategories = computed(() => rows.value.map((r) => r.path))
const tableCaption = computed(() => `${explicitName.value || 'Treemap'}: data`)

const legendItems = computed(() => {
  const seen = new Map<number, { name: string; bg: string }>()
  for (const r of tree.value.roots) if (!seen.has(r.branch)) seen.set(r.branch, { name: r.label, bg: toneClasses[seriesTone(r.branch)].bg })
  return [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v)
})
const legendVisible = computed(() => (props.showLegend === 'auto' ? colorBy.value === 'series' && legendItems.value.length > 1 : !!props.showLegend && legendItems.value.length > 0))

const message = computed(() => {
  const parts: string[] = []
  if (tree.value.ignored > 0) parts.push(`${plural(tree.value.ignored, 'entry', 'entries')} left out: a value must be a number above zero.`)
  if (drawn.value.hidden > 0) parts.push(`${plural(drawn.value.hidden, 'item')} too small to draw.`)
  return parts.join(' ')
})
const rootClass = computed(() => cn(treemapVariants({ variant: variant.value, size: size.value }), props.class))
</script>

<template>
  <div
    v-if="empty"
    v-bind="rootAttrs"
    data-slot="treemap"
    role="img"
    :aria-label="explicitName || emptyText"
    :aria-labelledby="labelledby"
    :class="cn('flex min-h-32 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed px-3 text-center text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="treemap-empty">{{ emptyText }}</span>
    <span v-if="message" data-slot="treemap-message" class="text-xs">{{ message }}</span>
  </div>
  <div v-else ref="rootEl" v-bind="rootAttrs" data-slot="treemap" :data-variant="variant" :data-size="size" :class="rootClass">
    <p v-if="title" data-slot="treemap-title" class="text-sm font-medium text-foreground">{{ title }}</p>
    <p v-if="description" data-slot="treemap-description" class="text-xs text-muted-foreground">{{ description }}</p>
    <svg
      ref="svgEl"
      data-slot="treemap-svg"
      role="group"
      :aria-label="explicitName || summary"
      :aria-labelledby="labelledby"
      :aria-describedby="`${uid}-summary`"
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full"
      @keydown="onKeydown"
    >
      <g data-slot="treemap-groups" aria-hidden="true">
        <g v-for="grp in drawn.groups" :key="grp.key" data-slot="treemap-group">
          <rect :x="grp.box.x" :y="grp.box.y" :width="grp.box.w" :height="grp.box.h" rx="3" class="fill-muted stroke-border" stroke-width="1" />
          <text v-if="grp.title" :x="grp.title.x" :y="grp.title.y" dominant-baseline="middle" class="fill-foreground text-xs font-medium">{{ grp.title.text }}</text>
        </g>
      </g>
      <g data-slot="treemap-cells">
        <g
          v-for="c in drawn.leaves"
          :key="c.key"
          data-slot="treemap-cell"
          :data-key="c.key"
          role="img"
          :aria-label="c.text"
          :tabindex="c.index === rover ? 0 : -1"
          class="group outline-hidden"
          @focus="((current = c.index), (active = c.key))"
          @blur="active = null"
          @mouseenter="active = c.key"
          @mouseleave="active = null"
        >
          <rect
            data-slot="treemap-tile"
            :x="c.box.x" :y="c.box.y" :width="c.box.w" :height="c.box.h"
            :rx="c.box.w > 8 && c.box.h > 8 ? 2 : 0"
            :class="[c.cls, 'group-hover:stroke-foreground group-focus-visible:stroke-ring group-focus-visible:stroke-3']"
          />
          <text
            v-for="(l, i) in c.lines"
            :key="i"
            data-slot="treemap-label"
            :x="l.x" :y="l.y"
            dominant-baseline="middle"
            :class="['fill-foreground text-xs tabular-nums', l.strong ? 'font-medium' : '']"
          >{{ l.text }}</text>
          <title>{{ c.text }}</title>
        </g>
      </g>
    </svg>
    <p data-slot="treemap-readout" aria-hidden="true" class="min-h-4 text-xs text-foreground tabular-nums">{{ readout }}</p>
    <ChartLegend v-if="legendVisible" :items="legendItems" data-slot="treemap-legend" />
    <p v-if="message" data-slot="treemap-message" class="text-xs text-muted-foreground">{{ message }}</p>
    <p :id="`${uid}-summary`" data-slot="treemap-summary" class="sr-only">{{ summary }}</p>
    <ChartDataTable :caption="tableCaption" category-header="Item" :categories="tableCategories" :series="tableSeries" :format="fmt" />
  </div>
</template>
