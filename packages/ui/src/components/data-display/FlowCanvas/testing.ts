/** Shared helpers of the FlowCanvas tests: mounting with a working v-model and simulated pointer and keyboard input. */
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import FlowCanvas from './FlowCanvas.vue'
import type { FlowEdge, FlowNode } from './types'

export const NODES = (): FlowNode[] => [
  { id: 'a', label: 'Alpha', x: 0, y: 0 },
  { id: 'b', label: 'Beta', x: 300, y: 0 },
  { id: 'c', label: 'Gamma', x: 0, y: 200 },
]
export const EDGES = (): FlowEdge[] => [{ id: 'e1', from: 'a', to: 'b' }]

export const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

const mounted: VueWrapper[] = []
export function unmountAll() {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
}

/** Mounts with `v-model:nodes` and `v-model:edges` wired to the props, so changes flow back like in an app. */
export function mountCanvas(props: Record<string, unknown> = {}, slots?: Record<string, unknown>) {
  const w: VueWrapper = mount(FlowCanvas, {
    props: {
      label: 'Sample flow',
      nodes: NODES(),
      edges: EDGES(),
      ...props,
      'onUpdate:nodes': (v: FlowNode[]) => w.setProps({ nodes: v } as never),
      'onUpdate:edges': (v: FlowEdge[]) => w.setProps({ edges: v } as never),
    } as never,
    slots: slots as never,
    attachTo: document.body,
  })
  mounted.push(w)
  return w
}

export const viewport = (w: VueWrapper) => w.find('[data-slot="flow-canvas-viewport"]')
export const svgOf = (w: VueWrapper) => w.find('[data-slot="flow-canvas-svg"]').element as SVGSVGElement
export const nodeEl = (w: VueWrapper, id: string) => w.findAll('[data-slot="flow-canvas-node"]').find((n) => n.attributes('data-id') === id)!.element as SVGGElement
export const edgeEl = (w: VueWrapper, id: string) => w.findAll('[data-slot="flow-canvas-edge"]').find((n) => n.attributes('data-id') === id)!.element as SVGGElement
export const portEl = (w: VueWrapper, node: string, port: string) =>
  w.findAll('[data-slot="flow-canvas-port"]').find((p) => p.attributes('data-node') === node && p.attributes('data-port') === port)!.element as SVGGElement
export const status = (w: VueWrapper) => w.find('[data-slot="flow-canvas-status"]').text()
export const content = (w: VueWrapper) => w.find('[data-slot="flow-canvas-content"]').attributes('transform')
export const nodeIds = (w: VueWrapper) => w.findAll('[data-slot="flow-canvas-node"]').map((n) => n.attributes('data-id'))
export const selected = (w: VueWrapper) => w.findAll('[data-slot="flow-canvas-node"][data-selected]').map((n) => n.attributes('data-id'))
export const nodesProp = (w: VueWrapper) => (w.props() as { nodes: FlowNode[] }).nodes
export const edgesProp = (w: VueWrapper) => (w.props() as { edges: FlowEdge[] }).edges

export function pointer(target: Element, type: string, init: PointerEventInit = {}) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, ...init }))
}
/** Press on `from`, move on the svg (the pointer is captured there) and release. */
export async function dragTo(from: Element, svg: Element, start: [number, number], ...path: [number, number][]) {
  pointer(from, 'pointerdown', { clientX: start[0], clientY: start[1] })
  await nextTick()
  for (const [x, y] of path) {
    pointer(svg, 'pointermove', { clientX: x, clientY: y })
    await nextTick()
  }
  const last = path[path.length - 1] ?? start
  pointer(svg, 'pointerup', { clientX: last[0], clientY: last[1] })
  await nextTick()
}

export function key(target: Element, k: string, init: KeyboardEventInit = {}) {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(e)
  return e
}
