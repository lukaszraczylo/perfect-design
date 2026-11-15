<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useId, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { requireOneOf, violation } from '../../../lib/contract'
import { faMinus, faPlus } from '../../../lib/icons'
import Button from '../../primitives/Button/Button.vue'
import { hasText, useMountedCheck } from '../_shared/contract'
import { DIRECTION_PHRASE } from '../_diagram/graph'
import { DASH, shapeClass } from '../_diagram/palette'
import { measureText, plural, truncateToWidth, wrapText } from '../_diagram/text'
import type { Point } from '../_diagram/types'
import FlowCanvasMinimap from './FlowCanvasMinimap.vue'
import {
  boundsOf, centerOf, clamp, edgeAnchors, fitViewport, gridStep, hitNode, hitPort, LAYOUT_DIRECTIONS, layoutPositions, nearestInDirection, nearestNode,
  nodeRect, normalizeEdges, normalizeNodes, normRect, outlinePath, pick, portPoints, readingOrder, rectsIntersect, routeFlowEdge, routeLoop, snap, visibleRect, zoomAt, zoomLimits,
  type Arrow, type NormEdge, type NormNode, type PortPoint,
} from './flowGeometry'
import { cloneSnapshot, createHistory, historyLimit } from './flowHistory'
import type {
  FlowCanvasProps, FlowChangeEvent, FlowChangeReason, FlowConnectEvent, FlowDisconnectEvent, FlowEdge, FlowNode, FlowNodeMoveEvent, FlowNodeSlotProps, FlowSelection,
  FlowToolbarSlotProps, FlowViewport,
} from './types'
import { FLOW_EDGE_STYLES, FLOW_HEIGHTS, FLOW_SIZES, FLOW_VARIANTS, flowCanvasVariants, flowCanvasViewportVariants } from './variants'

const props = withDefaults(defineProps<FlowCanvasProps>(), {
  readonly: false,
  grid: false,
  variant: 'plain',
  size: 'md',
  edgeStyle: 'curved',
  direction: 'LR',
  toolbar: true,
  minimap: false,
  minZoom: 0.25,
  maxZoom: 2,
  historyLimit: 50,
  autoFit: true,
  emptyText: 'No nodes yet',
})
defineOptions({ inheritAttrs: false })

/** Nodes and connections. Controlled (`v-model:nodes`) or uncontrolled: without a binding the canvas keeps its own copy. */
const nodes = defineModel<FlowNode[]>('nodes', { default: () => [] })
const edges = defineModel<FlowEdge[]>('edges', { default: () => [] })

const emit = defineEmits<{
  /** Nodes were moved by drag, by the keyboard or by `autoLayout()`. */
  'node-move': [event: FlowNodeMoveEvent]
  /** A connection was made. */
  connect: [event: FlowConnectEvent]
  /** A connection was removed (also when its node was deleted). */
  disconnect: [event: FlowDisconnectEvent]
  /** The selection changed. */
  select: [event: FlowSelection]
  /** Nodes or connections changed (move, connect, delete, layout, undo, redo). */
  change: [event: FlowChangeEvent]
}>()

defineSlots<{
  node?: (props: FlowNodeSlotProps) => unknown
  toolbar?: (props: FlowToolbarSlotProps) => unknown
}>()

const attrs = useAttrs()
const uid = useId()
const helpId = `${uid}-help`
const textId = `${uid}-text`
const markerId = `${uid}-arrow`
const markerOnId = `${uid}-arrow-on`
const patternId = `${uid}-bg`

/* ------------------------------------------------------------------ contract */

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isId = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

useMountedCheck(
  () => {
    requireOneOf('FlowCanvas', { label: props.label, 'aria-label': attrs['aria-label'], 'aria-labelledby': attrs['aria-labelledby'] }, 'Name what the canvas shows, for example `label="Delivery workflow"`.')
    if (!Array.isArray(nodes.value)) {
      violation('FlowCanvas', 'requires-nodes', 'requires `nodes`, an array of `{ id, x, y, label? }`. An empty array shows the empty state.')
    } else {
      const seen = new Set<string>()
      nodes.value.forEach((n, i) => {
        if (!isRecord(n) || !isId(n.id)) return violation('FlowCanvas', 'node-id', `node ${i + 1} needs an \`id\` (a non-empty string): \`{ id: "pickup", x: 0, y: 0 }\`.`)
        if (seen.has(n.id)) violation('FlowCanvas', 'node-id-unique', `node ids must be unique, but "${n.id}" is used twice.`)
        seen.add(n.id)
        if (typeof n.x !== 'number' || !Number.isFinite(n.x) || typeof n.y !== 'number' || !Number.isFinite(n.y)) {
          violation('FlowCanvas', 'node-position', `node "${n.id}" needs numeric \`x\` and \`y\` (its top-left corner in canvas units).`)
        }
      })
    }
    if (!Array.isArray(edges.value)) {
      violation('FlowCanvas', 'requires-edges', 'expects `edges` to be an array of `{ id, from, to }` objects. Use an empty array for a canvas without connections.')
    } else {
      const seen = new Set<string>()
      edges.value.forEach((e, i) => {
        if (!isRecord(e) || !isId(e.id) || !isId(e.from) || !isId(e.to)) return violation('FlowCanvas', 'edge-shape', `connection ${i + 1} needs \`id\`, \`from\` and \`to\` (node ids): \`{ id: "e1", from: "pickup", to: "sort" }\`.`)
        if (seen.has(e.id)) violation('FlowCanvas', 'edge-id-unique', `connection ids must be unique, but "${e.id}" is used twice.`)
        seen.add(e.id)
      })
    }
  },
  [() => nodes.value, () => edges.value],
)

/* ------------------------------------------------------------------ settings */

const variantName = computed(() => pick(props.variant, FLOW_VARIANTS, 'plain'))
const sizeName = computed(() => pick(props.size, FLOW_SIZES, 'md'))
const edgeStyleName = computed(() => pick(props.edgeStyle, FLOW_EDGE_STYLES, 'curved'))
const directionName = computed(() => pick(props.direction, LAYOUT_DIRECTIONS, 'LR'))
const step = computed(() => gridStep(props.grid))
const limits = computed(() => zoomLimits(props.minZoom, props.maxZoom))
const locked = computed(() => props.readonly === true)
const name = computed(() => (hasText(props.label) ? props.label : hasText(attrs['aria-label']) ? (attrs['aria-label'] as string) : undefined))
const labelledby = computed(() => (hasText(attrs['aria-labelledby']) ? (attrs['aria-labelledby'] as string) : undefined))
const rootAttrs = computed(() => {
  const { 'aria-label': _l, 'aria-labelledby': _b, ...rest } = attrs
  return rest
})

/* ------------------------------------------------------------------ data */

const nodeList = computed(() => normalizeNodes(nodes.value))
const nodeMap = computed(() => new Map(nodeList.value.map((n) => [n.id, n])))
const edgeInfo = computed(() => normalizeEdges(edges.value, new Set(nodeMap.value.keys())))
const edgeList = computed(() => edgeInfo.value.edges)
const edgeMap = computed(() => new Map(edgeList.value.map((e) => [e.id, e])))
const rawNode = (id: string) => (Array.isArray(nodes.value) ? nodes.value.find((n) => isRecord(n) && n.id === id) : undefined)

/** Drag in progress: the nodes that follow the pointer and by how much (not yet in the model). */
const drag = ref<{ ids: ReadonlySet<string>; dx: number; dy: number } | null>(null)
const liveNodes = computed<NormNode[]>(() => {
  const d = drag.value
  if (!d || (d.dx === 0 && d.dy === 0)) return nodeList.value
  return nodeList.value.map((n) => (d.ids.has(n.id) ? { ...n, x: n.x + d.dx, y: n.y + d.dy } : n))
})
const liveMap = computed(() => new Map(liveNodes.value.map((n) => [n.id, n])))

/* ------------------------------------------------------------------ viewport */

const vp = ref<FlowViewport>({ x: 0, y: 0, zoom: 1 })
const view = ref({ w: 0, h: 0 })
const viewportEl = ref<HTMLElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)
const vw = computed(() => view.value.w || 640)
const vh = computed(() => view.value.h || FLOW_HEIGHTS[sizeName.value])
const zoomPercent = computed(() => Math.round(vp.value.zoom * 100))
const handleScale = computed(() => 1 / clamp(vp.value.zoom, 0.5, 1.5))

function measure() {
  const el = viewportEl.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  if (w > 0 && h > 0) view.value = { w, h }
}
function fitView() {
  measure()
  vp.value = fitViewport(boundsOf(nodeList.value), vw.value, vh.value, 32, limits.value)
}
function zoomBy(factor: number, cx = vw.value / 2, cy = vh.value / 2) {
  vp.value = zoomAt(vp.value, factor, cx, cy, limits.value)
}
const zoomIn = () => zoomBy(1.25)
const zoomOut = () => zoomBy(0.8)
function zoomTo(zoom: number) {
  if (Number.isFinite(zoom)) zoomBy(zoom / vp.value.zoom)
}
function panBy(dx: number, dy: number) {
  vp.value = { ...vp.value, x: vp.value.x + dx, y: vp.value.y + dy }
}
function setViewport(next: Partial<FlowViewport>) {
  const zoom = clamp(typeof next.zoom === 'number' && Number.isFinite(next.zoom) ? next.zoom : vp.value.zoom, limits.value.min, limits.value.max)
  vp.value = { x: typeof next.x === 'number' && Number.isFinite(next.x) ? next.x : vp.value.x, y: typeof next.y === 'number' && Number.isFinite(next.y) ? next.y : vp.value.y, zoom }
}
function centerOn(p: Point) {
  vp.value = { ...vp.value, x: vw.value / 2 - p.x * vp.value.zoom, y: vh.value / 2 - p.y * vp.value.zoom }
}
/** Pan the least amount that brings a node fully into view (with a margin). */
function reveal(id: string) {
  const n = liveMap.value.get(id)
  if (!n) return
  const z = vp.value.zoom
  const m = 24
  let { x, y } = vp.value
  const left = n.x * z + x
  const right = (n.x + n.w) * z + x
  const top = n.y * z + y
  const bottom = (n.y + n.h) * z + y
  if (left < m) x += m - left
  else if (right > vw.value - m) x -= right - (vw.value - m)
  if (top < m) y += m - top
  else if (bottom > vh.value - m) y -= bottom - (vh.value - m)
  if (x !== vp.value.x || y !== vp.value.y) vp.value = { ...vp.value, x, y }
}

let ro: ResizeObserver | undefined
let fitted = false
function maybeFit() {
  if (props.autoFit && !fitted && view.value.w > 0 && nodeList.value.length > 0) {
    fitted = true
    fitView()
  }
}
onMounted(() => {
  measure()
  maybeFit()
  if (typeof ResizeObserver !== 'undefined' && viewportEl.value) {
    ro = new ResizeObserver(() => {
      measure()
      maybeFit()
    })
    ro.observe(viewportEl.value)
  }
})
onBeforeUnmount(() => ro?.disconnect())
watch(
  () => nodeList.value.length > 0,
  (has) => {
    if (has) maybeFit()
  },
)

/* ------------------------------------------------------------------ announcements and history */

const announcement = ref({ text: '', n: 0 })
const announce = (text: string) => {
  announcement.value = { text, n: announcement.value.n + 1 }
}
const history = createHistory(historyLimit(props.historyLimit))
watch(() => props.historyLimit, (v) => history.setLimit(historyLimit(v)))
const rev = ref(0)
const canUndo = computed(() => !locked.value && (rev.value, history.undoSize > 0))
const canRedo = computed(() => !locked.value && (rev.value, history.redoSize > 0))

function commit(reason: FlowChangeReason, label: string, next: { nodes?: FlowNode[]; edges?: FlowEdge[] }, key?: string) {
  history.record(cloneSnapshot(nodes.value, edges.value), label, Date.now(), key)
  rev.value++
  if (next.nodes) nodes.value = next.nodes
  if (next.edges) edges.value = next.edges
  emit('change', { reason, nodes: next.nodes ?? nodes.value, edges: next.edges ?? edges.value })
}

/* ------------------------------------------------------------------ selection */

const selNodes = shallowRef<ReadonlySet<string>>(new Set())
const selEdges = shallowRef<ReadonlySet<string>>(new Set())
const hasSelection = computed(() => selNodes.value.size + selEdges.value.size > 0)
const sameSet = (a: ReadonlySet<string>, b: ReadonlySet<string>) => a.size === b.size && [...a].every((id) => b.has(id))

function setSelection(n: Iterable<string>, e: Iterable<string>) {
  const ns = new Set(n)
  const es = new Set(e)
  if (sameSet(ns, selNodes.value) && sameSet(es, selEdges.value)) return
  selNodes.value = ns
  selEdges.value = es
  emit('select', { nodes: [...ns], edges: [...es] })
}
const selectOnly = (kind: 'node' | 'edge', id: string) => (kind === 'node' ? setSelection([id], []) : setSelection([], [id]))
function toggle(kind: 'node' | 'edge', id: string) {
  const ns = new Set(selNodes.value)
  const es = new Set(selEdges.value)
  const set = kind === 'node' ? ns : es
  if (!set.delete(id)) set.add(id)
  setSelection(ns, es)
}
function clearSelection() {
  setSelection([], [])
}
function selectAll() {
  setSelection(nodeList.value.map((n) => n.id), edgeList.value.map((e) => e.id))
  announce(`Selected ${plural(selNodes.value.size, 'node')} and ${plural(selEdges.value.size, 'connection')}.`)
}
watch([nodeMap, edgeMap], () => {
  const ns = [...selNodes.value].filter((id) => nodeMap.value.has(id))
  const es = [...selEdges.value].filter((id) => edgeMap.value.has(id))
  if (ns.length !== selNodes.value.size || es.length !== selEdges.value.size) setSelection(ns, es)
})

/* ------------------------------------------------------------------ roving focus */

const activeNodeId = ref<string | null>(null)
const activeEdgeId = ref<string | null>(null)
const tabNode = computed(() => (activeNodeId.value !== null && nodeMap.value.has(activeNodeId.value) ? activeNodeId.value : (nodeList.value[0]?.id ?? null)))
const tabEdge = computed(() => (activeEdgeId.value !== null && edgeMap.value.has(activeEdgeId.value) ? activeEdgeId.value : (edgeList.value[0]?.id ?? null)))

function findEl(slot: 'node' | 'edge', id: string): HTMLElement | null {
  const all = viewportEl.value?.querySelectorAll<HTMLElement>(`[data-slot="flow-canvas-${slot}"]`) ?? []
  for (const el of all) if (el.getAttribute('data-id') === id) return el
  return null
}
async function focusItem(slot: 'node' | 'edge', id: string, pan = true) {
  if (slot === 'node') {
    activeNodeId.value = id
    if (pan) reveal(id)
  } else activeEdgeId.value = id
  await nextTick()
  findEl(slot, id)?.focus({ preventScroll: true })
}

/* ------------------------------------------------------------------ rendering model */

const CULL_AT = 120
const culling = computed(() => nodeList.value.length > CULL_AT)
const viewRect = computed(() => visibleRect(vp.value, vw.value, vh.value, 96))

const link = ref<{ from: LinkEnd; to: LinkEnd | null; point: Point | null; phase: 'drag' | 'pending' | 'keyboard' } | null>(null)
interface LinkEnd {
  nodeId: string
  portId?: string
}

const renderNodes = computed(() => {
  if (!culling.value) return liveNodes.value
  const keep = new Set<string>()
  if (tabNode.value) keep.add(tabNode.value)
  if (link.value) {
    keep.add(link.value.from.nodeId)
    if (link.value.to) keep.add(link.value.to.nodeId)
  }
  for (const id of drag.value?.ids ?? []) keep.add(id)
  return liveNodes.value.filter((n) => keep.has(n.id) || rectsIntersect(nodeRect(n), viewRect.value))
})

interface EdgeView {
  id: string
  d: string
  mid: Point
  name: string
  line: NormEdge['style']
  label: string
  plate: { w: number; h: number }
  full: string
}
const FONT = 13
const LABEL_FONT = 12

const edgeViews = computed<EdgeView[]>(() => {
  const out: EdgeView[] = []
  for (const e of edgeList.value) {
    const a = liveMap.value.get(e.from)!
    const b = liveMap.value.get(e.to)!
    if (culling.value && e.id !== tabEdge.value && !rectsIntersect(nodeRect(a), viewRect.value) && !rectsIntersect(nodeRect(b), viewRect.value)) {
      const x = Math.min(a.x, b.x)
      const y = Math.min(a.y, b.y)
      if (!rectsIntersect({ x, y, width: Math.max(a.x + a.w, b.x + b.w) - x, height: Math.max(a.y + a.h, b.y + b.h) - y }, viewRect.value)) continue
    }
    let route
    if (a.id === b.id) route = routeLoop(a)
    else {
      const { start, end } = edgeAnchors(a, b, e.fromPort, e.toPort)
      route = routeFlowEdge(start, end, edgeStyleName.value)
    }
    const label = e.label ? truncateToWidth(e.label.slice(0, 200), 160, LABEL_FONT) : ''
    out.push({
      id: e.id,
      d: route.d,
      mid: route.mid,
      name: `Edge ${a.label} to ${b.label}${e.label ? `: ${e.label}` : ''}`,
      line: e.style,
      label,
      plate: { w: Math.ceil(measureText(label, LABEL_FONT)) + 12, h: 20 },
      full: e.label,
    })
  }
  return out
})

const labelCache = new Map<string, { lines: string[]; cut: boolean }>()
function labelOf(n: NormNode) {
  const key = `${n.w}|${n.h}|${n.label}`
  const hit = labelCache.get(key)
  if (hit) return hit
  const LH = 17
  const maxLines = Math.max(1, Math.floor((n.h - 12) / LH))
  const text = n.label.slice(0, 240)
  let lines = wrapText(text, n.w - 24, FONT)
  let cut = text.length < n.label.length
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    lines[maxLines - 1] = truncateToWidth(`${lines[maxLines - 1]}…`, n.w - 24, FONT)
    cut = true
  } else if (cut) lines[lines.length - 1] = truncateToWidth(`${lines[lines.length - 1]}…`, n.w - 24, FONT)
  if (labelCache.size > 2000) labelCache.clear()
  const value = { lines, cut }
  labelCache.set(key, value)
  return value
}
const lineY = (n: NormNode, i: number, count: number) => n.h / 2 + (n.shape === 'cylinder' ? 5 : 0) + (i - (count - 1) / 2) * 17

const outlineCache = new Map<string, { d: string; inner: string[] }>()
function outlineOf(n: NormNode, grow = 0) {
  const key = `${n.shape}|${n.w + grow}|${n.h + grow}`
  let hit = outlineCache.get(key)
  if (!hit) {
    if (outlineCache.size > 500) outlineCache.clear()
    hit = outlinePath(n.shape, n.w + grow, n.h + grow)
    outlineCache.set(key, hit)
  }
  return hit
}
const nodeClass = (n: NormNode) => shapeClass('outline', { fill: 'surface', tone: n.tone, stroke: 'normal' })

const portsOf = (n: NormNode) => (locked.value ? [] : portPoints(n).map((p) => ({ id: p.port!.id, label: p.port!.label, x: p.x - n.x, y: p.y - n.y })))
const linkTargetId = computed(() => link.value?.to?.nodeId ?? null)

/** Preview of the connection being made. */
const preview = computed(() => {
  const l = link.value
  if (!l) return null
  const a = liveMap.value.get(l.from.nodeId)
  if (!a) return null
  const b = l.to ? liveMap.value.get(l.to.nodeId) : undefined
  let start: PortPoint
  let end: PortPoint
  if (b) ({ start, end } = edgeAnchors(a, b, l.from.portId, l.to?.portId))
  else if (l.point) {
    const free: PortPoint = { x: l.point.x, y: l.point.y, nx: 0, ny: 0 }
    const own = portPoints(a).filter((p) => p.port!.type !== 'target' && (!l.from.portId || p.port!.id === l.from.portId))
    start = own.sort((p, q) => Math.hypot(p.x - free.x, p.y - free.y) - Math.hypot(q.x - free.x, q.y - free.y))[0] ?? { ...centerOf(a), nx: 0, ny: 0 }
    end = free
  } else return null
  return routeFlowEdge(start, end, edgeStyleName.value).d
})

const marquee = ref<ReturnType<typeof normRect> | null>(null)
const marqueeMode = ref(false)
const gridSpacing = computed(() => step.value || 20)
const patternOn = computed(() => variantName.value !== 'plain' && gridSpacing.value * vp.value.zoom >= 6)
const bgTransform = computed(() => `translate(${vp.value.x} ${vp.value.y}) scale(${vp.value.zoom})`)

/* ------------------------------------------------------------------ pointer gestures */

type Gesture =
  | { kind: 'pan'; sx: number; sy: number; vx: number; vy: number; moved: boolean; additive: boolean }
  | { kind: 'marquee'; start: Point; additive: boolean; moved: boolean }
  | { kind: 'drag'; id: string; ids: Set<string>; sx: number; sy: number; origin: Point; moved: boolean; collapse: boolean }
  | { kind: 'connect'; from: LinkEnd; sx: number; sy: number; moved: boolean }
  | { kind: 'pinch'; dist: number; mid: Point; vp: FlowViewport }

let gesture: Gesture | null = null
const pointers = new Map<number, Point>()
const panning = ref(false)
const THRESHOLD = 3

function svgPoint(clientX: number, clientY: number): Point {
  const r = svgEl.value?.getBoundingClientRect()
  return { x: clientX - (r?.left ?? 0), y: clientY - (r?.top ?? 0) }
}
function toCanvas(clientX: number, clientY: number): Point {
  const s = svgPoint(clientX, clientY)
  return { x: (s.x - vp.value.x) / vp.value.zoom, y: (s.y - vp.value.y) / vp.value.zoom }
}
const idOf = (el: Element | null, slot: string) => el?.closest(`[data-slot="${slot}"]`)?.getAttribute('data-id') ?? null

function dropTarget(p: Point, from: LinkEnd): LinkEnd | null {
  const others = liveNodes.value.filter((n) => n.id !== from.nodeId)
  const port = hitPort(others, p, 12 * handleScale.value)
  if (port) {
    const n = liveMap.value.get(port.nodeId)!
    const pd = n.ports.find((q) => q.id === port.portId)!
    if (pd.type !== 'source') return { nodeId: port.nodeId, portId: port.portId }
  }
  const n = hitNode(others, p)
  return n && n.canTarget ? { nodeId: n.id } : null
}

function startPinch() {
  gesture = null
  drag.value = null
  marquee.value = null
  panning.value = false
  if (link.value?.phase === 'drag') link.value = null
  const [a, b] = [...pointers.values()]
  const pa = svgPoint(a!.x, a!.y)
  const pb = svgPoint(b!.x, b!.y)
  gesture = { kind: 'pinch', dist: Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1, mid: { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }, vp: { ...vp.value } }
}

function onPointerDown(e: PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  try {
    svgEl.value?.setPointerCapture?.(e.pointerId)
  } catch {
    // capture is an optimisation: some environments refuse it for synthetic pointers
  }
  if (pointers.size >= 2) {
    if (pointers.size === 2) startPinch()
    return
  }
  measure()
  const target = e.target as Element | null
  const p = toCanvas(e.clientX, e.clientY)
  const additive = e.shiftKey || e.ctrlKey || e.metaKey

  // second click of a click-to-connect
  if (link.value && link.value.phase !== 'drag') {
    const to = dropTarget(p, link.value.from)
    if (to) completeLink(link.value.from, to)
    else cancelLink('Connection cancelled.')
    return
  }

  const handle = target?.closest('[data-slot="flow-canvas-port"]')
  if (handle && !locked.value) {
    const nodeId = handle.getAttribute('data-node')!
    const portId = handle.getAttribute('data-port')!
    const n = nodeMap.value.get(nodeId)
    const pd = n?.ports.find((q) => q.id === portId)
    if (n && pd && pd.type !== 'target') {
      const from = { nodeId, portId }
      link.value = { from, to: null, point: p, phase: 'drag' }
      gesture = { kind: 'connect', from, sx: e.clientX, sy: e.clientY, moved: false }
    }
    return
  }

  const nodeId = idOf(target, 'flow-canvas-node')
  if (nodeId !== null && nodeMap.value.has(nodeId)) {
    findEl('node', nodeId)?.focus({ preventScroll: true })
    let collapse = false
    if (additive) {
      toggle('node', nodeId)
      if (!selNodes.value.has(nodeId)) return
    } else if (!selNodes.value.has(nodeId)) selectOnly('node', nodeId)
    else collapse = selNodes.value.size > 1 || selEdges.value.size > 0
    if (locked.value) return
    const n = liveMap.value.get(nodeId)!
    gesture = { kind: 'drag', id: nodeId, ids: new Set(selNodes.value), sx: e.clientX, sy: e.clientY, origin: { x: n.x, y: n.y }, moved: false, collapse }
    return
  }

  const edgeId = idOf(target, 'flow-canvas-edge')
  if (edgeId !== null && edgeMap.value.has(edgeId)) {
    findEl('edge', edgeId)?.focus({ preventScroll: true })
    if (additive) toggle('edge', edgeId)
    else selectOnly('edge', edgeId)
    return
  }

  viewportEl.value?.focus({ preventScroll: true })
  if (e.shiftKey || marqueeMode.value) gesture = { kind: 'marquee', start: p, additive: e.ctrlKey || e.metaKey, moved: false }
  else {
    gesture = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: vp.value.x, vy: vp.value.y, moved: false, additive }
    panning.value = true
  }
}

function onPointerMove(e: PointerEvent) {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  const g = gesture
  if (!g) {
    if (link.value && link.value.phase !== 'drag') link.value = { ...link.value, point: toCanvas(e.clientX, e.clientY) }
    return
  }
  if (g.kind === 'pinch') {
    if (pointers.size < 2) return
    const [a, b] = [...pointers.values()]
    const pa = svgPoint(a!.x, a!.y)
    const pb = svgPoint(b!.x, b!.y)
    const mid = { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }
    const zoom = clamp(g.vp.zoom * (Math.hypot(pb.x - pa.x, pb.y - pa.y) / g.dist), limits.value.min, limits.value.max)
    const k = zoom / g.vp.zoom
    vp.value = { zoom, x: mid.x - (g.mid.x - g.vp.x) * k, y: mid.y - (g.mid.y - g.vp.y) * k }
    return
  }
  if (g.kind === 'pan') {
    const dx = e.clientX - g.sx
    const dy = e.clientY - g.sy
    if (!g.moved && Math.hypot(dx, dy) < THRESHOLD) return
    g.moved = true
    vp.value = { ...vp.value, x: g.vx + dx, y: g.vy + dy }
    return
  }
  if (g.kind === 'drag') {
    const dx = e.clientX - g.sx
    const dy = e.clientY - g.sy
    if (!g.moved && Math.hypot(dx, dy) < THRESHOLD) return
    g.moved = true
    const z = vp.value.zoom
    // snap the pressed node; the others keep their offset to it
    const ex = snap(g.origin.x + dx / z, step.value) - g.origin.x
    const ey = snap(g.origin.y + dy / z, step.value) - g.origin.y
    drag.value = { ids: g.ids, dx: ex, dy: ey }
    return
  }
  const p = toCanvas(e.clientX, e.clientY)
  if (g.kind === 'marquee') {
    g.moved = true
    marquee.value = normRect(g.start, p)
    return
  }
  if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < THRESHOLD) return
  g.moved = true
  link.value = { from: g.from, to: dropTarget(p, g.from), point: p, phase: 'drag' }
}

function endPointer(e: PointerEvent, cancelled: boolean) {
  pointers.delete(e.pointerId)
  try {
    svgEl.value?.releasePointerCapture?.(e.pointerId)
  } catch {
    // nothing to release
  }
  const g = gesture
  if (!g) return
  if (g.kind === 'pinch') {
    if (pointers.size < 2) gesture = null
    return
  }
  gesture = null
  if (g.kind === 'pan') {
    panning.value = false
    if (!g.moved && !cancelled && !g.additive) {
      clearSelection()
      if (link.value) link.value = null
    }
  } else if (g.kind === 'marquee') {
    const rect = marquee.value
    marquee.value = null
    if (cancelled) return
    if (!g.moved || !rect) {
      if (!g.additive) clearSelection()
      return
    }
    const hit = liveNodes.value.filter((n) => rectsIntersect(nodeRect(n), rect)).map((n) => n.id)
    setSelection(g.additive ? [...selNodes.value, ...hit] : hit, g.additive ? selEdges.value : [])
    announce(`Selected ${plural(selNodes.value.size, 'node')}.`)
  } else if (g.kind === 'drag') {
    const d = drag.value
    drag.value = null
    if (cancelled) return
    if (g.moved && d && (d.dx !== 0 || d.dy !== 0)) moveNodes(d.ids, d.dx, d.dy, 'move')
    else if (!g.moved && g.collapse) selectOnly('node', g.id)
  } else {
    if (cancelled) {
      link.value = null
      return
    }
    const l = link.value
    if (g.moved && l?.to) completeLink(l.from, l.to)
    else if (g.moved) cancelLink('Connection cancelled.')
    else if (l) {
      // a click on a port: keep the connection open and finish it with a second click or the keyboard
      link.value = { ...l, phase: 'pending' }
      announce(`Connecting from ${nodeMap.value.get(l.from.nodeId)?.label ?? ''}. Click another node to connect, or press Escape to cancel.`)
    }
  }
}
const onPointerUp = (e: PointerEvent) => endPointer(e, false)
const onPointerCancel = (e: PointerEvent) => endPointer(e, true)

function onWheel(e: WheelEvent) {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  const s = svgPoint(e.clientX, e.clientY)
  zoomBy(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025)), s.x, s.y)
}

/** A click that did not come from a pointer (screen reader activation). */
function onItemClick(e: MouseEvent, kind: 'node' | 'edge', id: string) {
  if (e.detail !== 0) return
  if (e.shiftKey || e.ctrlKey || e.metaKey) toggle(kind, id)
  else selectOnly(kind, id)
}

/* ------------------------------------------------------------------ editing */

const r2 = (n: number) => Math.round(n * 100) / 100

function moveNodes(ids: ReadonlySet<string>, dx: number, dy: number, reason: 'move' | 'layout', label?: string, key?: string) {
  const moves = new Map<string, Point>()
  for (const id of ids) {
    const n = nodeMap.value.get(id)
    if (n) moves.set(id, { x: r2(n.x + dx), y: r2(n.y + dy) })
  }
  commitMoves(moves, reason, label ?? (moves.size === 1 ? `Move ${nodeMap.value.get([...moves.keys()][0]!)!.label}` : `Move ${plural(moves.size, 'node')}`), key)
}
function commitMoves(moves: Map<string, Point>, reason: 'move' | 'layout', label: string, key?: string) {
  if (!moves.size) return
  const next = (nodes.value as FlowNode[]).map((n) => (isRecord(n) && moves.has(n.id) ? { ...n, x: moves.get(n.id)!.x, y: moves.get(n.id)!.y } : n))
  commit(reason, label, { nodes: next }, key)
  emit('node-move', { nodes: [...moves].map(([id, p]) => ({ id, x: p.x, y: p.y })) })
}

function moveByKeys(id: string, dx: number, dy: number) {
  const ids = selNodes.value.has(id) ? new Set(selNodes.value) : new Set([id])
  const key = `keys:${[...ids].sort().join('|')}`
  moveNodes(ids, dx, dy, 'move', undefined, key)
  const n = nodeMap.value.get(id)
  announce(ids.size === 1 && n ? `Moved ${n.label} to ${r2(n.x + dx)}, ${r2(n.y + dy)}.` : `Moved ${plural(ids.size, 'node')}.`)
  reveal(id)
}

function autoLayout() {
  const list = nodeList.value
  if (!list.length) return announce('There are no nodes to arrange.')
  const at = layoutPositions(list, edgeList.value, directionName.value, step.value)
  const moves = new Map<string, Point>()
  for (const n of list) {
    const p = at.get(n.id)
    if (p && (p.x !== n.x || p.y !== n.y)) moves.set(n.id, { x: r2(p.x), y: r2(p.y) })
  }
  commitMoves(moves, 'layout', 'Auto layout')
  fitView()
  announce(`Arranged ${plural(list.length, 'node')}, ${DIRECTION_PHRASE[directionName.value]}.`)
}

function deleteSelected() {
  if (locked.value) return
  const ns = selNodes.value
  const es = selEdges.value
  if (ns.size + es.size === 0) return announce('Nothing is selected to delete.')
  const removed = (edges.value as FlowEdge[]).filter((e) => isRecord(e) && (es.has(e.id) || ns.has(e.from) || ns.has(e.to)))
  const gone = new Set(removed.map((e) => e.id))
  const nextNodes = (nodes.value as FlowNode[]).filter((n) => !(isRecord(n) && ns.has(n.id)))
  const nextEdges = (edges.value as FlowEdge[]).filter((e) => !(isRecord(e) && gone.has(e.id)))
  const label = ns.size ? nodeMap.value.get([...ns][0]!)?.label : ''
  const nodeCount = ns.size
  const edgeCount = gone.size
  commit('delete', 'Delete', { nodes: nextNodes, edges: nextEdges })
  for (const edge of removed) emit('disconnect', { edge })
  setSelection([], [])
  announce(
    nodeCount === 1 ? `Deleted ${label} and ${plural(edgeCount, 'connection')}.` : nodeCount > 1 ? `Deleted ${plural(nodeCount, 'node')} and ${plural(edgeCount, 'connection')}.` : `Deleted ${plural(edgeCount, 'connection')}.`,
  )
  viewportEl.value?.focus({ preventScroll: true })
}

function applySnapshot(entry: { state: { nodes: FlowNode[]; edges: FlowEdge[] }; label: string } | null, reason: 'undo' | 'redo') {
  if (!entry) return announce(reason === 'undo' ? 'Nothing to undo.' : 'Nothing to redo.')
  rev.value++
  nodes.value = entry.state.nodes
  edges.value = entry.state.edges
  emit('change', { reason, nodes: entry.state.nodes, edges: entry.state.edges })
  announce(`${reason === 'undo' ? 'Undid' : 'Redid'}: ${entry.label}.`)
}
function undo() {
  if (!locked.value) applySnapshot(history.undo(cloneSnapshot(nodes.value, edges.value)), 'undo')
}
function redo() {
  if (!locked.value) applySnapshot(history.redo(cloneSnapshot(nodes.value, edges.value)), 'redo')
}

/* ------------------------------------------------------------------ connecting */

const labelOfId = (id: string) => nodeMap.value.get(id)?.label ?? id

function checkLink(from: LinkEnd, to: LinkEnd): string | null {
  const a = nodeMap.value.get(from.nodeId)
  const b = nodeMap.value.get(to.nodeId)
  if (!a || !b) return 'That node no longer exists.'
  if (a.id === b.id) return 'A node cannot connect to itself.'
  const fp = from.portId ? a.ports.find((p) => p.id === from.portId) : undefined
  const tp = to.portId ? b.ports.find((p) => p.id === to.portId) : undefined
  if (!a.canSource || (from.portId && (!fp || fp.type === 'target'))) return `${a.label} has no port that can start a connection.`
  if (!b.canTarget || (to.portId && (!tp || tp.type === 'source'))) return `${b.label} has no port that can receive a connection.`
  const dup = edgeList.value.some((e) => e.from === a.id && e.to === b.id && (e.fromPort ?? '') === (from.portId ?? '') && (e.toPort ?? '') === (to.portId ?? ''))
  return dup ? `${a.label} is already connected to ${b.label}.` : null
}
function newEdgeId(from: string, to: string): string {
  const taken = new Set(edgeList.value.map((e) => e.id))
  let id = `${from}-${to}`
  for (let i = 2; taken.has(id); i++) id = `${from}-${to}-${i}`
  return id
}
function cancelLink(message?: string) {
  const from = link.value?.from.nodeId
  link.value = null
  if (message) announce(message)
  if (from) void focusItem('node', from, false)
}
function completeLink(from: LinkEnd, to: LinkEnd) {
  const problem = checkLink(from, to)
  if (problem) return cancelLink(problem)
  const edge: FlowEdge = { id: newEdgeId(from.nodeId, to.nodeId), from: from.nodeId, to: to.nodeId }
  if (from.portId) edge.fromPort = from.portId
  if (to.portId) edge.toPort = to.portId
  link.value = null
  commit('connect', `Connect ${labelOfId(from.nodeId)} to ${labelOfId(to.nodeId)}`, { edges: [...(edges.value as FlowEdge[]), edge] })
  emit('connect', { edge })
  announce(`Connected ${labelOfId(from.nodeId)} to ${labelOfId(to.nodeId)}.`)
  void focusItem('node', from.nodeId, false)
}

/** Nodes that could receive a connection from `fromId`, in reading order. */
const targetsFor = (fromId: string) => readingOrder(nodeList.value.filter((n) => n.id !== fromId && n.canTarget))

function startKeyboardLink(fromId: string) {
  const a = nodeMap.value.get(fromId)
  if (!a || locked.value) return
  if (!a.canSource) return announce(`${a.label} has no port that can start a connection.`)
  const candidates = nodeList.value.filter((n) => n.id !== fromId && n.canTarget)
  const first = nearestNode(a, candidates)
  if (!first) return announce('There is no other node to connect to.')
  link.value = { from: { nodeId: fromId }, to: { nodeId: first.id }, point: null, phase: 'keyboard' }
  announce(`Connecting from ${a.label}. Target: ${first.label}. Arrow keys or Tab change the target, Enter confirms, Escape cancels.`)
  void focusItem('node', first.id)
}
function moveLinkTarget(next: NormNode | null) {
  if (!next || !link.value) return
  link.value = { ...link.value, to: { nodeId: next.id }, phase: 'keyboard' }
  announce(`Target: ${next.label}.`)
  void focusItem('node', next.id)
}
/** Keys while a connection is open. Returns true when the key was handled. */
function linkKey(e: KeyboardEvent): boolean {
  const l = link.value
  if (!l || l.phase === 'drag') return false
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  const from = nodeMap.value.get(l.from.nodeId)
  if (!from) {
    link.value = null
    return false
  }
  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      cancelLink('Connection cancelled.')
      return true
    case 'Enter':
    case ' ': {
      e.preventDefault()
      if (l.to) completeLink(l.from, l.to)
      else announce('Choose a target with the arrow keys or Tab first.')
      return true
    }
    case 'Tab': {
      e.preventDefault()
      const order = targetsFor(l.from.nodeId)
      if (!order.length) return true
      const at = l.to ? order.indexOf(l.to.nodeId) : -1
      const next = order[at === -1 ? (e.shiftKey ? order.length - 1 : 0) : (at + (e.shiftKey ? order.length - 1 : 1)) % order.length]!
      moveLinkTarget(nodeMap.value.get(next)!)
      return true
    }
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'ArrowUp':
    case 'ArrowDown': {
      e.preventDefault()
      const current = (l.to && nodeMap.value.get(l.to.nodeId)) || from
      moveLinkTarget(nearestInDirection(current, nodeList.value.filter((n) => n.id !== from.id && n.canTarget), e.key as Arrow))
      return true
    }
    default:
      return false
  }
}

/* ------------------------------------------------------------------ keyboard */

const PAN_STEP = 48
const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])

function onKeydown(e: KeyboardEvent) {
  const target = e.target as Element | null
  const nodeId = idOf(target, 'flow-canvas-node')
  const edgeId = idOf(target, 'flow-canvas-edge')
  const mod = e.ctrlKey || e.metaKey
  const key = e.key

  if (key === 'Escape' && gesture && gesture.kind !== 'pinch') {
    // abandon a drag, marquee or connection in progress
    e.preventDefault()
    gesture = null
    drag.value = null
    marquee.value = null
    panning.value = false
    if (link.value?.phase === 'drag') link.value = null
    return
  }
  if (linkKey(e)) return
  if (mod && (key === 'z' || key === 'Z')) {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
    return
  }
  if (mod && (key === 'y' || key === 'Y')) {
    e.preventDefault()
    redo()
    return
  }
  if (mod && (key === 'a' || key === 'A')) {
    e.preventDefault()
    selectAll()
    return
  }
  if (mod) return
  if (key === 'Delete' || key === 'Backspace') {
    e.preventDefault()
    deleteSelected()
    return
  }
  if (key === '+' || key === '=') return e.preventDefault(), zoomIn()
  if (key === '-' || key === '_') return e.preventDefault(), zoomOut()
  if (key === '0') return e.preventDefault(), fitView()
  if (key === 'Escape') {
    clearSelection()
    return
  }

  if (nodeId !== null && nodeMap.value.has(nodeId)) {
    const n = liveMap.value.get(nodeId)!
    if (key === 'Enter' || key === ' ') {
      e.preventDefault()
      if (e.shiftKey) toggle('node', nodeId)
      else selectOnly('node', nodeId)
    } else if ((key === 'c' || key === 'C') && !e.altKey) {
      e.preventDefault()
      startKeyboardLink(nodeId)
    } else if (ARROWS.has(key) && e.altKey) {
      e.preventDefault()
      if (locked.value) return
      const d = (step.value || 10) * (e.shiftKey ? 5 : 1)
      moveByKeys(nodeId, key === 'ArrowLeft' ? -d : key === 'ArrowRight' ? d : 0, key === 'ArrowUp' ? -d : key === 'ArrowDown' ? d : 0)
    } else if (ARROWS.has(key)) {
      e.preventDefault()
      const next = nearestInDirection(n, nodeList.value, key as Arrow)
      if (next) void focusItem('node', next.id)
    } else if (key === 'Home' || key === 'End') {
      e.preventDefault()
      const order = readingOrder(nodeList.value)
      void focusItem('node', key === 'Home' ? order[0]! : order[order.length - 1]!)
    }
    return
  }

  if (edgeId !== null && edgeMap.value.has(edgeId)) {
    const ids = edgeList.value.map((x) => x.id)
    const at = ids.indexOf(edgeId)
    if (key === 'Enter' || key === ' ') {
      e.preventDefault()
      if (e.shiftKey) toggle('edge', edgeId)
      else selectOnly('edge', edgeId)
    } else if (key === 'ArrowDown' || key === 'ArrowRight') {
      e.preventDefault()
      void focusItem('edge', ids[Math.min(ids.length - 1, at + 1)]!)
    } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
      e.preventDefault()
      void focusItem('edge', ids[Math.max(0, at - 1)]!)
    } else if (key === 'Home' || key === 'End') {
      e.preventDefault()
      void focusItem('edge', key === 'Home' ? ids[0]! : ids[ids.length - 1]!)
    }
    return
  }

  if (target === viewportEl.value) {
    if (ARROWS.has(key)) {
      e.preventDefault()
      const d = PAN_STEP * (e.shiftKey ? 4 : 1)
      panBy(key === 'ArrowLeft' ? d : key === 'ArrowRight' ? -d : 0, key === 'ArrowUp' ? d : key === 'ArrowDown' ? -d : 0)
    } else if ((key === 'c' || key === 'C') && selNodes.value.size === 1) {
      e.preventDefault()
      startKeyboardLink([...selNodes.value][0]!)
    }
  }
}

/* ------------------------------------------------------------------ text alternative */

const textOpen = ref(false)
const LIST_MAX = 500
const connectionCount = computed(() => {
  const counts = new Map<string, number>()
  for (const e of edgeList.value) {
    counts.set(e.from, (counts.get(e.from) ?? 0) + 1)
    if (e.to !== e.from) counts.set(e.to, (counts.get(e.to) ?? 0) + 1)
  }
  return counts
})
const listNodes = computed(() => nodeList.value.slice(0, LIST_MAX).map((n) => ({ id: n.id, text: `${n.label} (${plural(connectionCount.value.get(n.id) ?? 0, 'connection')})` })))
const listEdges = computed(() => edgeList.value.slice(0, LIST_MAX).map((e) => ({ id: e.id, text: `Edge ${labelOfId(e.from)} to ${labelOfId(e.to)}${e.label ? `: ${e.label}` : ''}` })))
const helpText = computed(() =>
  locked.value
    ? 'Flow canvas, read only. Tab moves between the canvas, nodes and connections. Arrow keys pan the canvas; on a node they move focus to the nearest node. Enter selects, Shift plus Enter adds to the selection. Plus and minus zoom, 0 fits the view.'
    : 'Flow canvas. Tab moves between the canvas, nodes and connections. Arrow keys pan the canvas; on a node they move focus to the nearest node. Enter selects, Shift plus Enter adds to the selection. C starts a connection from the focused node: arrow keys or Tab choose the target, Enter confirms, Escape cancels. Alt plus an arrow key moves the selected nodes. Delete removes the selection. Control or Command plus Z undoes, with Shift it redoes. Plus and minus zoom, 0 fits the view.',
)

/* ------------------------------------------------------------------ view parts */

const rootClass = computed(() => cn(flowCanvasVariants({ size: sizeName.value }), props.class))
const viewportClass = computed(() => flowCanvasViewportVariants({ size: sizeName.value, variant: variantName.value }))
const slotProps = (n: NormNode): FlowNodeSlotProps => ({
  node: { ...(rawNode(n.id) as FlowNode), x: n.x, y: n.y },
  selected: selNodes.value.has(n.id),
  active: tabNode.value === n.id,
  connecting: link.value?.from.nodeId === n.id || linkTargetId.value === n.id,
  width: n.w,
  height: n.h,
})
const toolbarApi = computed<FlowToolbarSlotProps>(() => ({
  zoom: vp.value.zoom,
  readonly: locked.value,
  canUndo: canUndo.value,
  canRedo: canRedo.value,
  hasSelection: hasSelection.value,
  zoomIn,
  zoomOut,
  fit: fitView,
  autoLayout,
  undo,
  redo,
  deleteSelected,
}))
const minimapView = computed(() => visibleRect(vp.value, vw.value, vh.value, 0))
const dash = (line: NormEdge['style']) => (line === 'solid' ? undefined : DASH[line])

defineExpose({
  /** Fit every node into view. */
  fit: fitView,
  zoomIn,
  zoomOut,
  zoomTo,
  /** Arrange the nodes with the layered layout (also available while `readonly`: the caller asked for it). */
  autoLayout,
  undo,
  redo,
  deleteSelected,
  selectAll,
  clearSelection,
  getViewport: () => ({ ...vp.value }),
  setViewport,
})
</script>

<template>
  <div
    v-bind="rootAttrs"
    data-slot="flow-canvas"
    :data-variant="variantName"
    :data-size="sizeName"
    :data-edge-style="edgeStyleName"
    :data-readonly="locked ? '' : undefined"
    :class="rootClass"
  >
    <div v-if="toolbar" role="group" aria-label="Canvas controls" data-slot="flow-canvas-toolbar" class="flex flex-wrap items-center gap-1">
      <slot name="toolbar" v-bind="toolbarApi">
        <Button variant="outline" size="icon-sm" aria-label="Zoom out" :icon-start="faMinus" :disabled="vp.zoom <= limits.min" @click="zoomOut" />
        <span data-slot="flow-canvas-zoom" class="min-w-12 text-center text-sm tabular-nums text-muted-foreground">{{ zoomPercent }}%</span>
        <Button variant="outline" size="icon-sm" aria-label="Zoom in" :icon-start="faPlus" :disabled="vp.zoom >= limits.max" @click="zoomIn" />
        <Button variant="outline" size="sm" @click="fitView">Fit view</Button>
        <template v-if="!locked">
          <Button variant="outline" size="sm" :disabled="nodeList.length === 0" @click="autoLayout">Auto layout</Button>
          <Button variant="outline" size="sm" :disabled="!canUndo" @click="undo">Undo</Button>
          <Button variant="outline" size="sm" :disabled="!canRedo" @click="redo">Redo</Button>
          <Button variant="outline" size="sm" :disabled="!hasSelection" @click="deleteSelected">Delete</Button>
        </template>
        <Button :variant="marqueeMode ? 'secondary' : 'outline'" size="sm" :aria-pressed="marqueeMode" @click="marqueeMode = !marqueeMode">Select area</Button>
      </slot>
    </div>

    <div
      ref="viewportEl"
      role="application"
      tabindex="0"
      dir="ltr"
      data-slot="flow-canvas-viewport"
      :aria-label="name"
      :aria-labelledby="labelledby"
      :aria-describedby="helpId"
      :data-panning="panning ? '' : undefined"
      :class="viewportClass"
      @keydown="onKeydown"
    >
      <svg
        ref="svgEl"
        data-slot="flow-canvas-svg"
        focusable="false"
        :class="cn('absolute inset-0 size-full', panning ? 'cursor-grabbing' : 'cursor-grab')"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
        @wheel="onWheel"
      >
        <defs>
          <marker :id="markerId" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
            <path d="M0,1L10,5L0,9Z" class="fill-muted-foreground stroke-muted-foreground forced-colors:fill-[CanvasText] forced-colors:stroke-[CanvasText]" stroke-width="1" stroke-linejoin="round" />
          </marker>
          <marker :id="markerOnId" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
            <path d="M0,1L10,5L0,9Z" class="fill-primary stroke-primary forced-colors:fill-[Highlight] forced-colors:stroke-[Highlight]" stroke-width="1" stroke-linejoin="round" />
          </marker>
          <pattern v-if="variantName === 'dots'" :id="patternId" :width="gridSpacing" :height="gridSpacing" patternUnits="userSpaceOnUse" :patternTransform="bgTransform">
            <circle :cx="gridSpacing / 2" :cy="gridSpacing / 2" r="1" class="fill-muted-foreground/50 forced-colors:fill-[CanvasText]" />
          </pattern>
          <pattern v-else-if="variantName === 'grid'" :id="patternId" :width="gridSpacing" :height="gridSpacing" patternUnits="userSpaceOnUse" :patternTransform="bgTransform">
            <path :d="`M${gridSpacing},0V${gridSpacing}H0`" fill="none" stroke-width="1" vector-effect="non-scaling-stroke" class="stroke-border forced-colors:stroke-[CanvasText]" />
          </pattern>
        </defs>
        <rect v-if="patternOn" data-slot="flow-canvas-background" width="100%" height="100%" :fill="`url(#${patternId})`" />

        <g data-slot="flow-canvas-content" :transform="`translate(${vp.x} ${vp.y}) scale(${vp.zoom})`">
          <g data-slot="flow-canvas-edges">
            <g
              v-for="ev in edgeViews"
              :key="ev.id"
              data-slot="flow-canvas-edge"
              role="button"
              :tabindex="ev.id === tabEdge ? 0 : -1"
              :aria-label="ev.name"
              :aria-pressed="selEdges.has(ev.id)"
              :data-id="ev.id"
              :data-selected="selEdges.has(ev.id) ? '' : undefined"
              class="cursor-pointer outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              @focus="activeEdgeId = ev.id"
              @click="onItemClick($event, 'edge', ev.id)"
            >
              <path :d="ev.d" fill="none" stroke-width="16" vector-effect="non-scaling-stroke" class="stroke-transparent" />
              <path
                data-slot="flow-canvas-edge-line"
                :d="ev.d"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
                :stroke-width="selEdges.has(ev.id) ? 3 : 1.5"
                :stroke-dasharray="dash(ev.line)"
                :marker-end="`url(#${selEdges.has(ev.id) ? markerOnId : markerId})`"
                :class="selEdges.has(ev.id) ? 'stroke-primary forced-colors:stroke-[Highlight]' : 'stroke-muted-foreground forced-colors:stroke-[CanvasText]'"
              />
              <g v-if="ev.label" data-slot="flow-canvas-edge-label" :transform="`translate(${ev.mid.x} ${ev.mid.y})`">
                <rect :x="-ev.plate.w / 2" :y="-ev.plate.h / 2" :width="ev.plate.w" :height="ev.plate.h" rx="3" class="fill-card" />
                <text text-anchor="middle" dominant-baseline="central" font-size="12" unicode-bidi="plaintext" class="fill-foreground">
                  {{ ev.label }}
                  <title v-if="ev.label !== ev.full">{{ ev.full }}</title>
                </text>
              </g>
            </g>
          </g>

          <path v-if="preview" data-slot="flow-canvas-link-preview" :d="preview" fill="none" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" class="pointer-events-none stroke-primary forced-colors:stroke-[Highlight]" :marker-end="`url(#${markerOnId})`" />

          <g data-slot="flow-canvas-nodes">
            <g v-for="n in renderNodes" :key="n.id" data-slot="flow-canvas-node-wrap" :transform="`translate(${n.x} ${n.y})`" class="group/wrap">
              <g
                data-slot="flow-canvas-node"
                role="button"
                :tabindex="n.id === tabNode ? 0 : -1"
                :aria-label="n.label"
                :aria-pressed="selNodes.has(n.id)"
                :data-id="n.id"
                :data-tone="n.tone === 'neutral' ? undefined : n.tone"
                :data-selected="selNodes.has(n.id) ? '' : undefined"
                :data-connecting="link && (link.from.nodeId === n.id || linkTargetId === n.id) ? '' : undefined"
                class="cursor-pointer outline-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                @focus="activeNodeId = n.id"
                @click="onItemClick($event, 'node', n.id)"
              >
                <path
                  v-if="selNodes.has(n.id)"
                  data-slot="flow-canvas-node-selection"
                  :d="outlineOf(n, 10).d"
                  transform="translate(-5 -5)"
                  fill="none"
                  stroke-width="2"
                  stroke-dasharray="5 3"
                  vector-effect="non-scaling-stroke"
                  class="pointer-events-none stroke-primary forced-colors:stroke-[Highlight]"
                />
                <path
                  v-if="link && (link.from.nodeId === n.id || linkTargetId === n.id)"
                  data-slot="flow-canvas-node-link"
                  :d="outlineOf(n, 10).d"
                  transform="translate(-5 -5)"
                  fill="none"
                  :stroke-width="linkTargetId === n.id ? 3 : 2"
                  :stroke-dasharray="linkTargetId === n.id ? undefined : '2 3'"
                  vector-effect="non-scaling-stroke"
                  class="pointer-events-none stroke-primary forced-colors:stroke-[Highlight]"
                />
                <path :d="outlineOf(n).d" :stroke-width="selNodes.has(n.id) ? 2.5 : 1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round" :class="[nodeClass(n), 'forced-colors:stroke-[CanvasText]']" />
                <path v-for="(inner, i) in outlineOf(n).inner" :key="i" :d="inner" fill="none" stroke-width="1.5" vector-effect="non-scaling-stroke" class="stroke-muted-foreground forced-colors:stroke-[CanvasText]" />
                <slot name="node" v-bind="slotProps(n)">
                  <text
                    data-slot="flow-canvas-node-label"
                    :x="n.w / 2"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :font-size="FONT"
                    unicode-bidi="plaintext"
                    class="pointer-events-none fill-foreground"
                  >
                    <tspan v-for="(line, i) in labelOf(n).lines" :key="i" :x="n.w / 2" :y="lineY(n, i, labelOf(n).lines.length)">{{ line }}</tspan>
                  </text>
                </slot>
                <title v-if="labelOf(n).cut">{{ n.label }}</title>
              </g>
              <g
                v-if="!locked"
                data-slot="flow-canvas-ports"
                aria-hidden="true"
                :class="selNodes.has(n.id) || link ? 'opacity-100' : 'opacity-0 group-hover/wrap:opacity-100 group-focus-within/wrap:opacity-100'"
              >
                <g
                  v-for="p in portsOf(n)"
                  :key="p.id"
                  data-slot="flow-canvas-port"
                  :data-node="n.id"
                  :data-port="p.id"
                  :transform="`translate(${p.x} ${p.y})`"
                  class="cursor-crosshair"
                >
                  <circle :r="14 * handleScale" class="fill-transparent" />
                  <circle
                    :r="(linkTargetId === n.id && link?.to?.portId === p.id ? 6 : 4.5) * handleScale"
                    stroke-width="1.5"
                    vector-effect="non-scaling-stroke"
                    :class="linkTargetId === n.id && link?.to?.portId === p.id ? 'fill-primary stroke-primary forced-colors:fill-[Highlight]' : 'fill-card stroke-muted-foreground forced-colors:stroke-[CanvasText]'"
                  />
                  <title v-if="p.label">{{ p.label }}</title>
                </g>
              </g>
            </g>
          </g>

          <rect
            v-if="marquee"
            data-slot="flow-canvas-marquee"
            :x="marquee.x"
            :y="marquee.y"
            :width="marquee.width"
            :height="marquee.height"
            stroke-width="1.5"
            stroke-dasharray="4 3"
            vector-effect="non-scaling-stroke"
            class="pointer-events-none fill-primary/10 stroke-primary forced-colors:stroke-[Highlight]"
          />
        </g>
      </svg>
      <p v-if="nodeList.length === 0" data-slot="flow-canvas-empty" class="pointer-events-none absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">{{ emptyText }}</p>
      <FlowCanvasMinimap v-if="minimap && nodeList.length" :nodes="liveNodes" :view="minimapView" @center="centerOn" />
    </div>

    <p :id="helpId" data-slot="flow-canvas-help" class="sr-only">{{ helpText }}</p>
    <div role="status" data-slot="flow-canvas-status" class="sr-only"><span :key="announcement.n">{{ announcement.text }}</span></div>
    <p v-if="edgeInfo.skipped > 0" data-slot="flow-canvas-message" class="text-xs text-muted-foreground">{{ plural(edgeInfo.skipped, 'connection') }} {{ edgeInfo.skipped === 1 ? 'was' : 'were' }} not drawn because a node is missing.</p>

    <div
      :id="textId"
      data-slot="flow-canvas-text"
      :role="textOpen ? 'region' : undefined"
      :tabindex="textOpen ? 0 : undefined"
      :aria-label="textOpen ? `${name ?? 'Flow canvas'}, list of nodes and connections` : undefined"
      :class="textOpen ? cn('max-h-64 min-w-0 overflow-auto rounded-md border border-border bg-background p-3 text-sm', 'outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40') : 'sr-only'"
    >
      <p class="font-medium">Nodes: {{ nodeList.length }}</p>
      <ul class="mb-2 list-disc ps-5">
        <li v-for="item in listNodes" :key="item.id">{{ item.text }}</li>
      </ul>
      <p class="font-medium">Connections: {{ edgeList.length }}</p>
      <ul class="list-disc ps-5">
        <li v-for="item in listEdges" :key="item.id">{{ item.text }}</li>
      </ul>
      <p v-if="nodeList.length > LIST_MAX || edgeList.length > LIST_MAX" class="mt-2 text-muted-foreground">Lists are cut at {{ LIST_MAX }} entries.</p>
    </div>
    <div data-slot="flow-canvas-controls" class="flex flex-wrap items-center gap-1">
      <Button variant="ghost" size="xs" :aria-expanded="textOpen" :aria-controls="textId" @click="textOpen = !textOpen">{{ textOpen ? 'Hide list' : 'Show as list' }}</Button>
    </div>
  </div>
</template>
