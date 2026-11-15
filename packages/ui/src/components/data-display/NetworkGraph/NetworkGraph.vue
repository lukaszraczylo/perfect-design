<script setup lang="ts">
import { computed, ref } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { dimension, markerPath, oneOf, plural, seriesMarker, truncateLabel, type MarkerShape } from '../_chart/chartKit'
import { r2 } from '../_chart/chartMath'
import { useChartContract } from '../_chart/chartContract'
import { toneClasses, seriesTone, type ChartTone } from '../_chart/tones'
import { useMeasuredWidth } from '../_chart/useMeasuredWidth'
import { describeEdge, graphNotes, nodeId, normalizeGraph, type GraphEdge, type GraphNode } from './graphData'
import { edgeShape, edgeWidths, nodeRadii, radiusRange } from './networkGeometry'
import { NETWORK_LAYOUTS, computeNetworkLayout, convexHull, padPoints, type NetworkLayout } from './networkLayout'
import {
  NETWORK_EDGE_STYLES, NETWORK_HEIGHTS, NETWORK_SIZES, NETWORK_VARIANTS, networkGraphVariants,
  type NetworkGraphEdgeStyle, type NetworkGraphSize, type NetworkGraphVariant,
} from './variants'

export interface NetworkGraphProps extends BaseProps {
  /** Nodes `{ id, label?, group?, size? }`. Ids must be unique; a repeated id is ignored. */
  nodes: GraphNode[]
  /** Connections `{ from, to, weight?, directed?, label? }` between node ids. Unknown ids are skipped and counted. */
  edges?: GraphEdge[]
  /** How nodes are placed: `force` (spring simulation, fixed steps), `circular` ring, `grid`, or `layered` (left to right by direction). */
  layout?: NetworkLayout
  /** `plain` nodes and lines, `labelled` adds node and connection labels, `grouped` also outlines each group with a hull. */
  variant?: NetworkGraphVariant
  /** Drawing height when `height` is not set: 200 / 300 / 420. */
  size?: NetworkGraphSize
  /** `straight` lines or `curved` lines (a pair A to B and B to A then separates). */
  edgeStyle?: NetworkGraphEdgeStyle
  /** Draw an arrowhead on every connection that does not set its own `directed`. */
  directed?: boolean
  /** Group legend with each group's colour and marker shape. `auto` shows it when any node has a group. */
  showLegend?: boolean | 'auto'
  /** Most nodes drawn (1 to 5000). The rest are left out and a message says so. */
  maxNodes?: number
  /** Visible title above the drawing. Also names the graph when `label` is not set. */
  title?: string
  /** Visible description under the title. */
  description?: string
  /** Accessible name of the graph. Required unless `title`, `aria-label` or `aria-labelledby` is set. */
  label?: string
  /** Shown (as role="img") when there is nothing to draw. */
  emptyText?: string
  /** ViewBox width used until the container is measured. The graph then fills its container (1 unit = 1 CSS px). */
  width?: number
  /** ViewBox height. Overrides `size`. */
  height?: number
}

const props = withDefaults(defineProps<NetworkGraphProps>(), {
  edges: () => [],
  layout: 'force',
  variant: 'plain',
  size: 'md',
  edgeStyle: 'straight',
  directed: false,
  showLegend: 'auto',
  maxNodes: 300,
  emptyText: 'No data',
  width: 480,
})

defineOptions({ inheritAttrs: false })

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const { explicitName, labelledby, rootAttrs } = useChartContract(
  'NetworkGraph',
  {
    get label() {
      return props.label || props.title
    },
  },
  () => {
    if (!Array.isArray(props.nodes)) {
      violation('NetworkGraph', 'requires-nodes', 'requires `nodes`, an array of `{ id, label?, group?, size? }`. An empty array shows the empty state.')
    } else {
      props.nodes.forEach((n, i) => {
        if (!isRecord(n) || nodeId(n.id) === null) violation('NetworkGraph', 'node-id', `node ${i + 1} needs an \`id\` (a non-empty string): \`{ id: "depot-1", label: "Depot" }\`.`)
      })
    }
    if (props.edges !== undefined && !Array.isArray(props.edges)) {
      violation('NetworkGraph', 'requires-edges', 'expects `edges` to be an array of `{ from, to }` objects. Omit it or pass an empty array for a graph without connections.')
    } else {
      props.edges?.forEach((e, i) => {
        if (!isRecord(e) || nodeId(e.from) === null || nodeId(e.to) === null) violation('NetworkGraph', 'edge-shape', `connection ${i + 1} needs \`from\` and \`to\` (node ids): \`{ from: "depot-1", to: "depot-2" }\`.`)
      })
    }
  },
  [() => props.nodes, () => props.edges],
)

const rootEl = ref<HTMLElement | null>(null)
const measured = useMeasuredWidth(rootEl)
const W = computed(() => (measured.value > 0 ? measured.value : dimension(props.width, 480)))
const sizeName = computed(() => oneOf<NetworkGraphSize>(props.size, NETWORK_SIZES, 'md'))
const H = computed(() => dimension(props.height, NETWORK_HEIGHTS[sizeName.value]))
const layoutName = computed(() => oneOf<NetworkLayout>(props.layout, NETWORK_LAYOUTS, 'force'))
const variantName = computed(() => oneOf<NetworkGraphVariant>(props.variant, NETWORK_VARIANTS, 'plain'))
const edgeStyleName = computed(() => oneOf<NetworkGraphEdgeStyle>(props.edgeStyle, NETWORK_EDGE_STYLES, 'straight'))

const graph = computed(() => normalizeGraph(props.nodes, props.edges, props.maxNodes, props.directed === true))
const empty = computed(() => graph.value.nodes.length === 0)
const layoutResult = computed(() => (empty.value ? { points: [], order: [], uniform: false } : computeNetworkLayout(graph.value, layoutName.value)))
const radii = computed(() => nodeRadii(graph.value))
const widths = computed(() => edgeWidths(graph.value))
/** Labels need room and stay readable only for a modest number of nodes. */
const labelsOn = computed(() => variantName.value === 'labelled' && graph.value.nodes.length <= 120)

const FONT = 12
const points = computed(() => {
  const g = graph.value
  const rMax = radiusRange(g.nodes.length).max
  const hasSelf = g.edges.some((e) => e.self)
  const padX = rMax + (labelsOn.value ? 40 : 8)
  const padTop = rMax + (hasSelf ? 50 : 6)
  const padBottom = rMax + (labelsOn.value ? 20 : 6)
  const w = Math.max(1, W.value - 2 * padX)
  const h = Math.max(1, H.value - padTop - padBottom)
  const { uniform, points: unit } = layoutResult.value
  if (uniform) {
    const side = Math.min(w, h)
    const ox = padX + (w - side) / 2
    const oy = padTop + (h - side) / 2
    return unit.map((p) => ({ x: r2(ox + p.x * side), y: r2(oy + p.y * side) }))
  }
  return unit.map((p) => ({ x: r2(padX + p.x * w), y: r2(padTop + p.y * h) }))
})

const incident = computed(() => {
  const inc: number[][] = graph.value.nodes.map(() => [])
  graph.value.edges.forEach((e, k) => {
    inc[e.from]!.push(k)
    if (!e.self) inc[e.to]!.push(k)
  })
  return inc
})
const neighbours = computed(() =>
  incident.value.map((ks, i) => {
    const set = new Set<number>()
    for (const k of ks) {
      const e = graph.value.edges[k]!
      set.add(e.from === i ? e.to : e.from)
    }
    return [...set]
  }),
)

const hovered = ref<number | null>(null)
const focused = ref<number | null>(null)
const stopIndex = ref<number | null>(null)
const active = computed(() => {
  const i = hovered.value ?? focused.value
  return i !== null && i < graph.value.nodes.length ? i : null
})
const keep = computed(() => (active.value === null ? null : new Set([active.value, ...neighbours.value[active.value]!])))
const stop = computed(() => (stopIndex.value !== null && stopIndex.value < graph.value.nodes.length ? stopIndex.value : (layoutResult.value.order[0] ?? 0)))

const toneOf = (groupIndex: number): ChartTone => (groupIndex < 0 ? 'muted' : seriesTone(groupIndex))
const markerOf = (groupIndex: number): MarkerShape => (groupIndex < 0 ? 'circle' : seriesMarker(groupIndex))
const noGroup = computed(() => graph.value.groups.length > 0 && graph.value.nodes.some((n) => n.groupIndex < 0))

const nodeViews = computed(() =>
  layoutResult.value.order.map((i, slot) => {
    const n = graph.value.nodes[i]!
    const p = points.value[i]!
    const r = radii.value[i]!
    const tone = toneOf(n.groupIndex)
    const marker = markerOf(n.groupIndex)
    const near = neighbours.value[i]!.map((k) => graph.value.nodes[k]!.label)
    const shown = near.slice(0, 5)
    const aria = `${n.label}${n.group ? `, group ${n.group}` : ''}, ${plural(n.connections, 'connection')}${shown.length ? `: ${shown.join(', ')}${near.length > shown.length ? ` and ${near.length - shown.length} more` : ''}` : ''}`
    return {
      i,
      slot,
      x: p.x,
      y: p.y,
      r,
      fill: toneClasses[tone].fill,
      marker,
      d: marker === 'circle' ? '' : markerPath(marker, p.x, p.y, r),
      stroke: r < 4 ? 1 : 2,
      label: n.label,
      text: truncateLabel(n.label, 12),
      aria,
      group: n.group,
    }
  }),
)

const edgeViews = computed(() =>
  graph.value.edges.map((e, k) => {
    const a = points.value[e.from]!
    const b = points.value[e.to]!
    const shape = edgeShape({ ...a, r: radii.value[e.from]! }, { ...b, r: radii.value[e.to]! }, { curved: edgeStyleName.value === 'curved', directed: e.directed, self: e.self })
    return { k, from: e.from, to: e.to, d: shape.d, arrow: shape.arrow, mid: shape.mid, width: widths.value[k]!, label: truncateLabel(e.label, 12) }
  }),
)

const hulls = computed(() => {
  if (variantName.value !== 'grouped') return []
  return graph.value.groups.map((name, gi) => {
    const members = graph.value.nodes.flatMap((n, i) => (n.groupIndex === gi ? [i] : []))
    const pad = Math.max(...members.map((i) => radii.value[i]!)) + 8
    const hull = convexHull(padPoints(members.map((i) => points.value[i]!), pad))
    return { gi, name, d: `M${hull.map((p) => `${r2(p.x)},${r2(p.y)}`).join(' L')} Z`, tone: toneClasses[toneOf(gi)] }
  })
})

const legendItems = computed(() => {
  const items = graph.value.groups.map((name, gi) => ({ name, fill: toneClasses[toneOf(gi)].fill, marker: markerOf(gi) }))
  if (noGroup.value) items.push({ name: 'No group', fill: toneClasses.muted.fill, marker: 'circle' })
  return items
})
const legendVisible = computed(() => props.showLegend !== false && graph.value.groups.length > 0)

const summary = computed(() => {
  const g = graph.value
  return `Network graph: ${plural(g.nodes.length, 'node')}, ${plural(g.edges.length, 'connection')}, ${plural(g.groups.length, 'group')}`
})
const notes = computed(() => graphNotes(graph.value))
const tableCaption = computed(() => explicitName.value || 'Network graph')

/** The hidden tables are cut here: a 10k-row table is no more usable than the drawing. */
const MAX_ROWS = 200
const MAX_CONNECTIONS_PER_NODE = 10
const nodeRows = computed(() =>
  layoutResult.value.order.slice(0, MAX_ROWS).map((i) => {
    const n = graph.value.nodes[i]!
    const ks = incident.value[i]!
    const text = ks.slice(0, MAX_CONNECTIONS_PER_NODE).map((k) => describeEdge(graph.value, graph.value.edges[k]!)).join('; ')
    return { id: n.id, label: n.label, group: n.group ?? 'none', connections: ks.length === 0 ? 'none' : ks.length > MAX_CONNECTIONS_PER_NODE ? `${text}; and ${ks.length - MAX_CONNECTIONS_PER_NODE} more` : text }
  }),
)
const edgeRows = computed(() =>
  graph.value.edges.slice(0, MAX_ROWS).map((e) => ({
    pair: `${graph.value.nodes[e.from]!.label} ${e.directed ? 'to' : 'and'} ${graph.value.nodes[e.to]!.label}`,
    weight: e.weight === null ? 'n/a' : String(e.weight),
    label: e.label || 'none',
  })),
)
const nodeCaption = computed(() => `${tableCaption.value}: nodes${graph.value.nodes.length > MAX_ROWS ? ` (first ${MAX_ROWS} of ${graph.value.nodes.length} rows)` : ''}`)
const edgeCaption = computed(() => `${tableCaption.value}: connections${graph.value.edges.length > MAX_ROWS ? ` (first ${MAX_ROWS} of ${graph.value.edges.length} rows)` : ''}`)

function focusNode(i: number) {
  rootEl.value?.querySelector<SVGGElement>(`[data-slot="network-graph-node"][data-index="${i}"]`)?.focus()
}
function onKey(e: KeyboardEvent, slot: number) {
  const last = layoutResult.value.order.length - 1
  let next: number
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = Math.min(last, slot + 1)
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      next = Math.max(0, slot - 1)
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
    default:
      return
  }
  e.preventDefault()
  focusNode(layoutResult.value.order[next]!)
}
function onFocus(i: number) {
  focused.value = i
  stopIndex.value = i
}

const rootClass = computed(() => cn(networkGraphVariants({ size: sizeName.value }), props.class))
</script>

<template>
  <div
    v-if="empty"
    v-bind="rootAttrs"
    data-slot="network-graph"
    role="img"
    :aria-label="explicitName || emptyText"
    :aria-labelledby="labelledby"
    :class="cn('flex min-h-32 w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground', $props.class)"
  >
    <span data-slot="network-graph-empty">{{ emptyText }}</span>
  </div>
  <div
    v-else
    ref="rootEl"
    v-bind="rootAttrs"
    data-slot="network-graph"
    :data-layout="layoutName"
    :data-variant="variantName"
    :data-edge-style="edgeStyleName"
    :class="rootClass"
  >
    <p v-if="title" data-slot="network-graph-title" class="text-sm font-medium text-foreground">{{ title }}</p>
    <p v-if="description" data-slot="network-graph-description" class="text-xs text-muted-foreground">{{ description }}</p>
    <svg
      data-slot="network-graph-svg"
      role="group"
      :aria-label="explicitName || summary"
      :aria-labelledby="labelledby"
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full"
    >
      <g v-if="hulls.length" data-slot="network-graph-hulls">
        <path
          v-for="h in hulls"
          :key="h.gi"
          data-slot="network-graph-hull"
          :data-group="h.name"
          :d="h.d"
          stroke-width="1.5"
          stroke-dasharray="4 3"
          stroke-linejoin="round"
          :class="[h.tone.fillSoft, h.tone.stroke]"
        />
      </g>
      <g data-slot="network-graph-edges">
        <g
          v-for="e in edgeViews"
          :key="e.k"
          data-slot="network-graph-edge"
          :data-from="e.from"
          :data-to="e.to"
          :class="['motion-safe:transition-opacity', keep && active !== e.from && active !== e.to ? 'opacity-30' : '']"
        >
          <path :d="e.d" fill="none" :stroke-width="e.width" stroke-linecap="round" :class="active === e.from || active === e.to ? 'stroke-foreground' : 'stroke-muted-foreground/60'" />
          <polygon v-if="e.arrow" data-slot="network-graph-arrow" :points="e.arrow" :class="active === e.from || active === e.to ? 'fill-foreground' : 'fill-muted-foreground/60'" />
          <text
            v-if="labelsOn && e.label"
            data-slot="network-graph-edge-label"
            :x="e.mid.x"
            :y="e.mid.y"
            text-anchor="middle"
            dominant-baseline="middle"
            stroke-width="3"
            stroke-linejoin="round"
            class="fill-muted-foreground stroke-background text-xs [paint-order:stroke]"
          >{{ e.label }}</text>
        </g>
      </g>
      <g data-slot="network-graph-nodes" class="text-xs tabular-nums">
        <g
          v-for="n in nodeViews"
          :key="n.i"
          data-slot="network-graph-node"
          :data-index="n.i"
          role="img"
          :tabindex="n.i === stop ? 0 : -1"
          :aria-label="n.aria"
          :class="['outline-hidden motion-safe:transition-opacity', keep && !keep.has(n.i) ? 'opacity-30' : '']"
          @focus="onFocus(n.i)"
          @blur="focused = null"
          @mouseenter="hovered = n.i"
          @mouseleave="hovered = null"
          @keydown="onKey($event, n.slot)"
        >
          <title>{{ n.label }}</title>
          <circle v-if="n.marker === 'circle'" :cx="n.x" :cy="n.y" :r="n.r" :stroke-width="n.stroke" :class="[n.fill, 'stroke-background forced-colors:stroke-[CanvasText]']" />
          <path v-else :d="n.d" :stroke-width="n.stroke" stroke-linejoin="round" :class="[n.fill, 'stroke-background forced-colors:stroke-[CanvasText]']" />
          <circle v-if="focused === n.i" data-slot="network-graph-focus" :cx="n.x" :cy="n.y" :r="n.r + 4" fill="none" stroke-width="2" class="stroke-ring" />
          <text
            v-if="labelsOn"
            data-slot="network-graph-node-label"
            :x="n.x"
            :y="r2(n.y + n.r + FONT + 2)"
            text-anchor="middle"
            stroke-width="3"
            stroke-linejoin="round"
            class="fill-foreground stroke-background [paint-order:stroke]"
          >{{ n.text }}</text>
        </g>
      </g>
    </svg>
    <ul v-if="legendVisible" data-slot="network-graph-legend" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <li v-for="(item, i) in legendItems" :key="i" data-slot="network-graph-legend-item" class="inline-flex items-center gap-1.5">
        <svg viewBox="-8 -8 16 16" class="size-3.5 shrink-0" aria-hidden="true" focusable="false">
          <circle v-if="item.marker === 'circle'" cx="0" cy="0" r="5" stroke-width="1.5" :class="[item.fill, 'stroke-background forced-colors:stroke-[CanvasText]']" />
          <path v-else :d="markerPath(item.marker, 0, 0, 5)" stroke-width="1.5" stroke-linejoin="round" :class="[item.fill, 'stroke-background forced-colors:stroke-[CanvasText]']" />
        </svg>
        <span>{{ item.name }}</span>
      </li>
    </ul>
    <p v-for="(note, i) in notes" :key="i" data-slot="network-graph-message" class="text-xs text-muted-foreground">{{ note }}</p>
    <div data-slot="network-graph-table" class="sr-only">
      <table>
        <caption>{{ nodeCaption }}</caption>
        <thead>
          <tr>
            <th scope="col">Node</th>
            <th scope="col">Group</th>
            <th scope="col">Connections</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in nodeRows" :key="i">
            <th scope="row">{{ row.label }}</th>
            <td>{{ row.group }}</td>
            <td>{{ row.connections }}</td>
          </tr>
        </tbody>
      </table>
      <table v-if="edgeRows.length">
        <caption>{{ edgeCaption }}</caption>
        <thead>
          <tr>
            <th scope="col">Connection</th>
            <th scope="col">Weight</th>
            <th scope="col">Label</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in edgeRows" :key="i">
            <th scope="row">{{ row.pair }}</th>
            <td>{{ row.weight }}</td>
            <td>{{ row.label }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
