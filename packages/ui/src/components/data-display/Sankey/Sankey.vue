<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { formatNumber, r2 } from '../_chart/chartMath'
import { dimension, oneOf, plural, truncateLabel } from '../_chart/chartKit'
import { seriesTone, type ChartTone } from '../_chart/tones'
import { useChartContract } from '../_chart/chartContract'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { buildGraph, layoutSankey, ribbonPath } from './sankeyLayout'
import { SANKEY_TONES } from './sankeyTones'
import {
  SANKEY_GAPS, SANKEY_GAP_PX, SANKEY_HEIGHTS, SANKEY_LINK_OPACITIES, SANKEY_NODE_WIDTH, SANKEY_SIZES, SANKEY_VARIANTS, sankeyLinkVariants, sankeyNodeVariants, sankeyVariants,
  type SankeyGap, type SankeyLinkOpacity, type SankeySize, type SankeyVariant,
} from './variants'

export interface SankeyNode {
  id: string
  /** Text shown for the node. Defaults to the id. */
  label?: string
}

export interface SankeyLink {
  /** Id of the node the flow leaves. */
  source: string
  /** Id of the node the flow enters. */
  target: string
  /** Amount of flow, a number above zero. */
  value: number
}

export interface SankeyProps extends BaseProps {
  /** Flows between nodes. Repeated source and target pairs are added up. */
  links: SankeyLink[]
  /** Optional node list to set labels and the order of ties. Ids that only appear in `links` become nodes labelled with the id. */
  nodes?: SankeyNode[]
  /** `flat` solid nodes and tinted ribbons, `outline` empty nodes with a coloured edge and ribbons with a hairline edge. */
  variant?: 'flat' | 'outline'
  /** Height of the drawing: 220 / 320 / 440 (an explicit `height` wins). */
  size?: 'sm' | 'md' | 'lg'
  /** Vertical space between the nodes of one layer: 6, 12 or 22 px. */
  gap?: 'sm' | 'md' | 'lg'
  /** `auto` gives each node the next chart colour and colours a ribbon like its source; a tone paints everything in that tone. */
  tone?: 'auto' | ChartTone
  /** Opacity of the ribbons: soft 15, medium 30, strong 45 percent. */
  linkOpacity?: 'soft' | 'medium' | 'strong'
  /** Print the node value after its label. */
  showValues?: boolean
  /** Formats values in labels, tooltips and the table. */
  valueFormatter?: (n: number) => string
  /** Accessible name. Without it `title` names the diagram. */
  label?: string
  /** Visible heading. */
  title?: string
  /** Visible sentence under the title. */
  description?: string
  /** Shown when there is no flow to draw. */
  emptyText?: string
  /** ViewBox width used until the container is measured. */
  width?: number
  /** ViewBox height. Overrides `size`. */
  height?: number
}

const props = withDefaults(defineProps<SankeyProps>(), {
  variant: 'flat',
  size: 'md',
  gap: 'md',
  tone: 'auto',
  linkOpacity: 'medium',
  showValues: true,
  emptyText: 'No data',
  width: 480,
})

defineOptions({ inheritAttrs: false })
const { explicitName, labelledby, rootAttrs } = useChartContract(
  'Sankey',
  {
    get label() {
      return props.label || props.title
    },
  },
  () => {
    if (!Array.isArray(props.links)) violation('Sankey', 'requires-links', 'requires `links`, an array of `{ source, target, value }` flows. An empty array shows the empty state.')
  },
  [() => props.links],
)

const FONT = 12
const MARGIN = 4
const MAX_ROWS = 200
const uid = useId()
const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))
const variant = computed<SankeyVariant>(() => oneOf(props.variant, SANKEY_VARIANTS, 'flat'))
const size = computed<SankeySize>(() => oneOf(props.size, SANKEY_SIZES, 'md'))
const gap = computed<SankeyGap>(() => oneOf(props.gap, SANKEY_GAPS, 'md'))
const linkOpacity = computed<SankeyLinkOpacity>(() => oneOf(props.linkOpacity, SANKEY_LINK_OPACITIES, 'medium'))
const fixedTone = computed<ChartTone | null>(() => (props.tone === 'auto' ? null : oneOf(props.tone, Object.keys(SANKEY_TONES) as ChartTone[], 'chart-1')))
const H = computed(() => dimension(props.height, SANKEY_HEIGHTS[size.value]))
const fmt = (n: number) => (props.valueFormatter ?? formatNumber)(n)

const graph = computed(() => {
  const g = buildGraph(props.nodes, props.links)
  return layoutSankey(g, { width: W.value, height: Math.max(1, H.value - 2 * MARGIN), nodeWidth: SANKEY_NODE_WIDTH, padding: SANKEY_GAP_PX[gap.value] })
})
const empty = computed(() => graph.value.links.length === 0)
const nodeW = computed(() => Math.min(SANKEY_NODE_WIDTH, W.value / (2 * Math.max(1, graph.value.layers))))
const toneOf = (index: number): ChartTone => fixedTone.value ?? seriesTone(index)

const ribbons = computed(() =>
  graph.value.links.map((l, i) => {
    const t = SANKEY_TONES[toneOf(l.source.index)]
    return {
      key: i,
      d: ribbonPath(l, nodeW.value),
      cls: `${sankeyLinkVariants({ variant: variant.value })} ${t.link[linkOpacity.value]}${variant.value === 'outline' ? ` ${t.linkStroke}` : ''}`,
      title: `${l.source.label} to ${l.target.label}: ${fmt(l.value)}`,
    }
  }),
)

const nodesDrawn = computed(() => {
  const g = graph.value
  const step = g.layers > 1 ? (W.value - nodeW.value) / (g.layers - 1) : 0
  const room = Math.max(0, step - nodeW.value - 12)
  const lastBottom = new Map<number, number>()
  return [...g.nodes]
    .sort((a, b) => a.layer - b.layer || a.y - b.y)
    .map((n) => {
      const t = SANKEY_TONES[toneOf(n.index)]
      const onRight = n.layer < g.layers - 1
      const cy = n.y + n.h / 2 + MARGIN
      const value = fmt(n.value)
      const suffix = props.showValues ? ` ${value}` : ''
      const chars = Math.floor(room / (FONT * 0.6)) - suffix.length
      const prev = lastBottom.get(n.layer) ?? -Infinity
      const fits = chars >= 3 && cy - FONT / 2 >= prev && n.h >= 4
      if (fits) lastBottom.set(n.layer, cy + FONT / 2)
      return {
        id: n.id,
        x: r2(n.x),
        y: r2(n.y + MARGIN),
        h: Math.max(1, n.h),
        cls: `${sankeyNodeVariants({ variant: variant.value })} ${variant.value === 'outline' ? t.nodeStroke : t.node}`,
        title: `${n.label}: ${value}`,
        text: fits ? { x: r2(onRight ? n.x + nodeW.value + 6 : n.x - 6), y: r2(cy), anchor: onRight ? 'start' : 'end', label: truncateLabel(n.label, chars), value: props.showValues ? value : '' } : null,
      }
    })
})

const flowRows = computed(() => graph.value.links.map((l) => ({ from: l.source.label, to: l.target.label, value: fmt(l.value) })))
const shownRows = computed(() => flowRows.value.slice(0, MAX_ROWS))
const summary = computed(() => `Sankey diagram: ${plural(graph.value.nodes.length, 'node')}, ${plural(graph.value.links.length, 'flow')}, ${plural(graph.value.layers, 'layer')}`)
const tableCaption = computed(() => {
  const base = `${explicitName.value || 'Sankey diagram'}: flows`
  return flowRows.value.length > MAX_ROWS ? `${base} (first ${MAX_ROWS} of ${flowRows.value.length} rows)` : base
})

const message = computed(() => {
  const s = graph.value.skipped
  const parts: string[] = []
  if (s.invalid > 0) parts.push(`${plural(s.invalid, 'flow')} left out: a flow needs a source, a target and a value above zero.`)
  if (s.self > 0) parts.push(`${plural(s.self, 'flow')} from a node to itself left out.`)
  if (s.cycle > 0) parts.push(`${plural(s.cycle, 'flow')} left out because they close a loop.`)
  return parts.join(' ')
})
const rootClass = computed(() => cn(sankeyVariants({ variant: variant.value, size: size.value }), props.class))
</script>

<template>
  <div
    v-if="empty"
    v-bind="rootAttrs"
    data-slot="sankey"
    role="img"
    :aria-label="explicitName || emptyText"
    :aria-labelledby="labelledby"
    :class="cn('flex min-h-32 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed px-3 text-center text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="sankey-empty">{{ emptyText }}</span>
    <span v-if="message" data-slot="sankey-message" class="text-xs">{{ message }}</span>
  </div>
  <div v-else ref="rootEl" v-bind="rootAttrs" data-slot="sankey" :data-variant="variant" :data-size="size" :class="rootClass">
    <p v-if="title" data-slot="sankey-title" class="text-sm font-medium text-foreground">{{ title }}</p>
    <p v-if="description" data-slot="sankey-description" class="text-xs text-muted-foreground">{{ description }}</p>
    <svg
      data-slot="sankey-svg"
      role="img"
      :aria-label="explicitName || summary"
      :aria-labelledby="labelledby"
      :aria-describedby="`${uid}-summary`"
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full"
    >
      <g data-slot="sankey-links" :transform="`translate(0 ${MARGIN})`">
        <path v-for="r in ribbons" :key="r.key" data-slot="sankey-link" :d="r.d" :class="r.cls"><title>{{ r.title }}</title></path>
      </g>
      <g data-slot="sankey-nodes">
        <rect v-for="n in nodesDrawn" :key="n.id" data-slot="sankey-node" :x="n.x" :y="n.y" :width="nodeW" :height="n.h" rx="1" :class="n.cls"><title>{{ n.title }}</title></rect>
      </g>
      <g data-slot="sankey-labels" class="fill-foreground text-xs">
        <template v-for="n in nodesDrawn" :key="n.id">
          <text v-if="n.text" data-slot="sankey-label" :x="n.text.x" :y="n.text.y" :text-anchor="n.text.anchor" dominant-baseline="middle">{{ n.text.label }}<tspan v-if="n.text.value" class="tabular-nums" dx="4">{{ n.text.value }}</tspan></text>
        </template>
      </g>
    </svg>
    <p v-if="message" data-slot="sankey-message" class="text-xs text-muted-foreground">{{ message }}</p>
    <p :id="`${uid}-summary`" data-slot="sankey-summary" class="sr-only">{{ summary }}</p>
    <div data-slot="sankey-data-table" class="sr-only">
      <table>
        <caption>{{ tableCaption }}</caption>
        <thead>
          <tr>
            <th scope="col">From</th>
            <th scope="col">To</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in shownRows" :key="i">
            <th scope="row">{{ row.from }}</th>
            <td>{{ row.to }}</td>
            <td>{{ row.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
