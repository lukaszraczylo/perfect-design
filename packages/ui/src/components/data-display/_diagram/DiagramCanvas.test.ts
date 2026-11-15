import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import DiagramCanvas from './DiagramCanvas.vue'
import type { RenderModel } from './types'

const model = (over: Partial<RenderModel> = {}): RenderModel => ({
  type: 'flowchart',
  width: 200,
  height: 100,
  fontSize: 14,
  nodes: 1,
  edges: 1,
  summary: 'x',
  alt: { sections: [] },
  items: [
    { kind: 'shape', role: 'node', d: 'M0,0h10v10h-10Z', paint: { fill: 'surface', tone: 'primary', stroke: 'normal', dash: 'dashed' }, title: 'Tip' },
    { kind: 'shape', role: 'node', d: 'M0,0h10v10h-10Z', paint: { fill: 'canvas', tone: 'neutral', stroke: 'none' } },
    { kind: 'path', role: 'edge', d: 'M0,0L10,10', style: 'dashed', thick: true, markerEnd: 'arrow', markerStart: 'circle' },
    { kind: 'path', role: 'edge', d: 'M0,0L10,10', style: 'solid' },
    { kind: 'text', role: 'node-label', x: 50, y: 50, lines: ['one', 'two', 'three'], anchor: 'middle', size: 14, bold: true, rotate: 90, title: 'Full text' },
    { kind: 'text', role: 'node-label', x: 5, y: 5, lines: ['plain'], anchor: 'start', size: 12 },
  ],
  ...over,
})
const mountCanvas = (props: Record<string, unknown> = {}) => mount(DiagramCanvas, { props: { model: model(), variant: 'outline', fit: 'width', uid: 'u1', title: 'A title', ...props } as never })

describe('DiagramCanvas', () => {
  it('draws one image sized to the model', () => {
    const w = mountCanvas()
    const svg = w.find('svg')
    expect(svg.attributes()).toMatchObject({ role: 'img', width: '200', height: '100', viewBox: '0 0 200 100', focusable: 'false', 'data-slot': 'mermaid-diagram-svg', 'data-type': 'flowchart' })
  })
  it('names the image with title and optional description', () => {
    expect(mountCanvas().find('svg').attributes('aria-labelledby')).toBe('u1-title')
    const w = mountCanvas({ description: 'Longer' })
    expect(w.find('svg').attributes('aria-labelledby')).toBe('u1-title u1-desc')
    expect(w.find('#u1-title').text()).toBe('A title')
    expect(w.find('#u1-desc').text()).toBe('Longer')
    expect(mountCanvas().find('desc').exists()).toBe(false)
  })
  it('fit width shrinks, fit scroll keeps the natural size', () => {
    expect(mountCanvas().find('svg').classes()).toEqual(['block', 'h-auto', 'max-w-full'])
    expect(mountCanvas({ fit: 'scroll' }).find('svg').classes()).toEqual(['block', 'max-w-none', 'shrink-0'])
  })
  it('an unknown variant draws like outline', () => {
    expect(mountCanvas({ variant: 'neon' }).html()).toBe(mountCanvas({ variant: 'outline' }).html())
  })
  it('draws shapes with dashes, tooltips and widths', () => {
    const w = mountCanvas()
    const shapes = w.findAll('path[data-role="node"]')
    expect(shapes[0]!.attributes()).toMatchObject({ 'stroke-width': '1.5', 'stroke-dasharray': '6 4', class: 'fill-card stroke-primary' })
    expect(shapes[0]!.find('title').text()).toBe('Tip')
    expect(shapes[1]!.attributes('stroke-width')).toBeUndefined()
    expect(shapes[1]!.attributes('stroke-dasharray')).toBeUndefined()
  })
  it('draws edges with weight, dashes and markers that exist', () => {
    const w = mountCanvas()
    const [a, b] = w.findAll('path[data-role="edge"]')
    expect(a!.attributes()).toMatchObject({ 'stroke-width': '3', 'stroke-dasharray': '6 4', 'marker-end': 'url(#u1-m-arrow)', 'marker-start': 'url(#u1-m-circle)' })
    expect(b!.attributes('stroke-width')).toBe('1.5')
    expect(b!.attributes('stroke-dasharray')).toBeUndefined()
    expect(b!.attributes('marker-end')).toBeUndefined()
    expect(w.findAll('marker').map((m) => m.attributes('id'))).toEqual(['u1-m-arrow', 'u1-m-circle'])
  })
  it('scales markers with the font size and keeps them in user units', () => {
    const w = mountCanvas({ model: model({ fontSize: 16 }) })
    const marker = w.find('marker')
    expect(marker.attributes()).toMatchObject({ markerUnits: 'userSpaceOnUse', markerHeight: '12', markerWidth: '12', orient: 'auto-start-reverse' })
  })
  it('draws multi-line text with absolute y per line, text only', () => {
    const w = mountCanvas()
    const t = w.findAll('text')[0]!
    expect(t.attributes()).toMatchObject({ 'text-anchor': 'middle', 'font-size': '14', 'font-weight': '600', transform: 'rotate(90 50 50)', 'dominant-baseline': 'central' })
    const spans = t.findAll('tspan')
    expect(spans.map((s) => s.text())).toEqual(['one', 'two', 'three'])
    expect(spans.map((s) => Number(s.attributes('y')))).toEqual([30.4, 50, 69.6])
    expect(t.find('title').text()).toBe('Full text')
    const plain = w.findAll('text')[1]!
    expect(plain.attributes('transform')).toBeUndefined()
    expect(plain.attributes('font-weight')).toBeUndefined()
  })
  it('renders hostile text as text', () => {
    const w = mountCanvas({ model: model({ items: [{ kind: 'text', role: 'x', x: 0, y: 0, lines: ['<img src=x onerror=alert(1)>', '"><script>1</script>'], anchor: 'start', size: 14 }] }), title: '<b>t</b>', description: '<i>d</i>' })
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('script').exists()).toBe(false)
    expect(w.find('b').exists()).toBe(false)
    expect(w.findAll('tspan').map((s) => s.text())).toEqual(['<img src=x onerror=alert(1)>', '"><script>1</script>'])
    expect(w.find('title').text()).toBe('<b>t</b>')
  })
  it('an empty model draws an empty image', () => {
    const w = mountCanvas({ model: model({ items: [], width: 0, height: 0 }) })
    expect(w.findAll('path, text, marker')).toHaveLength(0)
  })
})
