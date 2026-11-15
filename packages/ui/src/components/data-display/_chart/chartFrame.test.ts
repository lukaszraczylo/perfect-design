import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { clampCentre, overlaps, textBox, useChartFrame } from './chartFrame'
import { wrapLabel } from './chartText'
import ChartCaption from './ChartCaption.vue'
import ChartDataTable from './ChartDataTable.vue'
import ChartMarkerLegend from './ChartMarkerLegend.vue'
import ChartPlaceholder from './ChartPlaceholder.vue'

describe('label boxes', () => {
  it('textBox anchors the box on the start, middle or end of the text', () => {
    expect(textBox(100, 50, 40, 12, 'start')).toEqual({ x0: 100, y0: 44, x1: 140, y1: 56 })
    expect(textBox(100, 50, 40, 12, 'middle')).toEqual({ x0: 80, y0: 44, x1: 120, y1: 56 })
    expect(textBox(100, 50, 40, 12, 'end')).toEqual({ x0: 60, y0: 44, x1: 100, y1: 56 })
  })
  it('overlaps is true only for boxes that share area (touching edges do not)', () => {
    const a = { x0: 0, y0: 0, x1: 10, y1: 10 }
    expect(overlaps(a, { x0: 5, y0: 5, x1: 15, y1: 15 })).toBe(true)
    expect(overlaps(a, { x0: 10, y0: 0, x1: 20, y1: 10 })).toBe(false)
    expect(overlaps(a, { x0: 0, y0: 10, x1: 10, y1: 20 })).toBe(false)
    expect(overlaps(a, { x0: 20, y0: 20, x1: 30, y1: 30 })).toBe(false)
  })
  it('clampCentre keeps a centred label inside the width', () => {
    expect(clampCentre(50, 20, 200)).toBe(50)
    expect(clampCentre(2, 20, 200)).toBe(10)
    expect(clampCentre(199, 20, 200)).toBe(190)
    expect(clampCentre(5, 300, 200)).toBe(100)
  })
})

describe('wrapLabel', () => {
  it('keeps a short name on one line', () => {
    expect(wrapLabel('Speed', 8)).toEqual(['Speed'])
    expect(wrapLabel('  Speed  ', 8)).toEqual(['Speed'])
  })
  it('breaks at a space and cuts what still does not fit', () => {
    expect(wrapLabel('Customer satisfaction', 12)).toEqual(['Customer', 'satisfaction'])
    expect(wrapLabel('Customer satisfaction survey results', 12)).toEqual(['Customer', 'satisfactio…'])
    expect(wrapLabel('Ab Cd Ef', 5)).toEqual(['Ab Cd', 'Ef'])
  })
  it('cuts a single long word and survives bad limits', () => {
    expect(wrapLabel('Internationalisation', 8)).toEqual(['Interna…'])
    expect(wrapLabel('Internationalisation', Number.NaN)[0]!.length).toBe(3)
    expect(wrapLabel('', 5)).toEqual([''])
  })
})

describe('ChartPlaceholder', () => {
  it('empty is a labelled image carrying the message', () => {
    const w = mount(ChartPlaceholder, { props: { dataSlot: 'x-chart', kind: 'empty', text: 'No data', name: 'Orders', userClass: 'max-w-sm' } })
    expect(w.attributes('role')).toBe('img')
    expect(w.attributes('aria-label')).toBe('Orders')
    expect(w.attributes('data-slot')).toBe('x-chart')
    expect(w.find('[data-slot="x-chart-empty"]').text()).toBe('No data')
    expect(w.classes()).toContain('max-w-sm')
  })
  it('empty falls back to the message as its name and accepts aria-labelledby', () => {
    expect(mount(ChartPlaceholder, { props: { dataSlot: 'x-chart', kind: 'empty', text: 'Nothing' } }).attributes('aria-label')).toBe('Nothing')
    const by = mount(ChartPlaceholder, { props: { dataSlot: 'x-chart', kind: 'empty', text: 'Nothing', labelledby: 'h1' } })
    expect(by.attributes('aria-labelledby')).toBe('h1')
  })
  it('loading is a busy status region and its class wins', () => {
    const w = mount(ChartPlaceholder, { props: { dataSlot: 'x-chart', kind: 'loading', text: 'Loading chart', userClass: 'min-h-48' } })
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.find('[data-slot="x-chart-loading"]').text()).toBe('Loading chart')
    expect(w.classes()).toContain('min-h-48')
    expect(w.classes()).not.toContain('min-h-32')
    expect(w.classes().some((c) => c.includes('animate'))).toBe(false)
  })
})

describe('ChartCaption', () => {
  it('renders title and description and wires the description id', () => {
    const w = mount(ChartCaption, { props: { dataSlot: 'x-chart', title: 'T', description: 'D', descriptionId: 'desc-1' } })
    expect(w.find('figcaption').attributes('data-slot')).toBe('x-chart-caption')
    expect(w.find('[data-slot="x-chart-title"]').text()).toBe('T')
    expect(w.find('#desc-1').text()).toBe('D')
  })
  it('renders nothing without a title or description, and either one alone', () => {
    expect(mount(ChartCaption, { props: { dataSlot: 'x-chart', descriptionId: 'd' } }).find('figcaption').exists()).toBe(false)
    expect(mount(ChartCaption, { props: { dataSlot: 'x-chart', title: 'T', descriptionId: 'd' } }).find('[data-slot="x-chart-description"]').exists()).toBe(false)
    expect(mount(ChartCaption, { props: { dataSlot: 'x-chart', description: 'D', descriptionId: 'd' } }).find('[data-slot="x-chart-title"]').exists()).toBe(false)
  })
})

describe('ChartMarkerLegend', () => {
  it('draws a marker, a line sample, or both per item', () => {
    const w = mount(ChartMarkerLegend, {
      props: {
        dataSlot: 'x-legend',
        items: [
          { name: 'Circle', shape: 'circle', fill: 'fill-chart-1' },
          { name: 'Square', shape: 'square', fill: 'fill-chart-2' },
          { name: 'Line', stroke: 'stroke-chart-3', dash: '4 2' },
          { name: 'Both', shape: 'diamond', fill: 'fill-chart-4', stroke: 'stroke-chart-4', dash: '' },
        ],
      },
    })
    const items = w.findAll('[data-slot="x-legend-item"]')
    expect(items).toHaveLength(4)
    expect(items[0]!.find('circle').classes()).toContain('fill-chart-1')
    expect(items[1]!.find('path').attributes('d')).toMatch(/Z$/)
    expect(items[2]!.find('line').attributes('stroke-dasharray')).toBe('4 2')
    expect(items[2]!.find('circle, path').exists()).toBe(false)
    expect(items[3]!.find('line').attributes('stroke-dasharray')).toBeUndefined()
    expect(items[3]!.find('path').exists()).toBe(true)
    expect(items.map((i) => i.text())).toEqual(['Circle', 'Square', 'Line', 'Both'])
    expect(w.findAll('svg').every((s) => s.attributes('aria-hidden') === 'true')).toBe(true)
  })
  it('a swatch with no marker and no line is empty but keeps the name', () => {
    const w = mount(ChartMarkerLegend, { props: { dataSlot: 'x-legend', items: [{ name: 'Plain' }] } })
    expect(w.find('svg').element.children).toHaveLength(0)
    expect(w.text()).toBe('Plain')
  })
})

describe('ChartDataTable formats', () => {
  it('formats each column with its own formatter and falls back to the shared one', () => {
    const w = mount(ChartDataTable, {
      props: {
        caption: 'T',
        categories: ['a', 'b'],
        series: [{ name: 'One', data: [1, null] }, { name: 'Two', data: [2, 3] }, { name: 'Three', data: [4, 5] }],
        format: (n: number) => `f${n}`,
        formats: [(n: number) => `$${n}`, undefined],
      },
    })
    expect(w.findAll('tbody tr')[0]!.findAll('td').map((t) => t.text())).toEqual(['$1', 'f2', 'f4'])
    expect(w.findAll('tbody tr')[1]!.findAll('td').map((t) => t.text())).toEqual(['n/a', 'f3', 'f5'])
  })
})

describe('useChartFrame', () => {
  beforeEach(() => configureStrictMode('throw'))
  afterEach(() => configureStrictMode('off'))
  const errors: Error[] = []
  const probe = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => {
    errors.length = 0
    let frame!: ReturnType<typeof useChartFrame>
    const Inner = defineComponent({
      inheritAttrs: false,
      props: { label: String, title: String, description: String },
      setup(p) {
        frame = useChartFrame('Probe', p, () => {}, [])
        return () => h('div')
      },
    })
    const w = mount(defineComponent({ setup() { onErrorCaptured((e) => { errors.push(e as Error); return false }); return () => h(Inner, { ...props, ...attrs }) } }))
    return { w, frame }
  }
  const settle = async () => { for (let i = 0; i < 4; i++) await nextTick(); await new Promise((r) => setTimeout(r, 0)) }

  it('accepts label, title, aria-label or aria-labelledby as the name', async () => {
    for (const props of [{ label: 'L' }, { title: 'T' }, { 'aria-label': 'A' }, { 'aria-labelledby': 'x' }]) {
      probe(props)
      await settle()
      expect(errors.map((e) => e.message)).toEqual([])
    }
  })
  it('throws a ContractError naming the component when nothing names the chart', async () => {
    probe({})
    await settle()
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('Probe: requires `label` or `aria-label` or `aria-labelledby`')
    probe({ label: '  ', title: '   ' })
    await settle()
    expect(errors).toHaveLength(1)
  })
  it('the name is the label, then the title, then aria-label; blank text counts as missing', () => {
    expect(probe({ label: 'L', title: 'T' }).frame.explicitName.value).toBe('L')
    expect(probe({ title: 'T' }).frame.explicitName.value).toBe('T')
    expect(probe({}, { 'aria-label': 'A' }).frame.explicitName.value).toBe('A')
    expect(probe({ label: ' ' }).frame.explicitName.value).toBeUndefined()
  })
  it('describedby lists the description (when given) and the summary, with unique ids', () => {
    const a = probe({ label: 'L', description: 'D' }).frame
    expect(a.describedby.value).toBe(`${a.ids.description} ${a.ids.summary}`)
    expect(a.hasDescription.value).toBe(true)
    expect(a.hasTitle.value).toBe(false)
    const b = probe({ label: 'L', title: 'T' }).frame
    expect(b.describedby.value).toBe(b.ids.summary)
    expect(b.hasTitle.value).toBe(true)
    expect(new Set(Object.values(a.ids)).size).toBe(3)
  })
  it('removes the naming attributes from the root attributes', () => {
    const { frame } = probe({ label: 'L' }, { 'aria-label': 'A', 'aria-labelledby': 'x', id: 'root', 'data-x': '1' })
    expect(frame.rootAttrs.value).toEqual({ id: 'root', 'data-x': '1' })
    expect(frame.labelledby.value).toBe('x')
  })
})

describe('the newer charts fill their container', () => {
  const sample: [string, unknown, Record<string, unknown>][] = []
  it('uses the measured width as the viewBox width (1 unit = 1 CSS px) and follows resizes', async () => {
    const [{ default: ScatterChart }, { default: RadarChart }, { default: FunnelChart }, { default: WaterfallChart }] = await Promise.all([
      import('../ScatterChart/ScatterChart.vue'),
      import('../RadarChart/RadarChart.vue'),
      import('../FunnelChart/FunnelChart.vue'),
      import('../WaterfallChart/WaterfallChart.vue'),
    ])
    sample.push(
      ['ScatterChart', ScatterChart, { points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] }],
      ['RadarChart', RadarChart, { axes: ['A', 'B', 'C'], series: [{ name: 's', data: [1, 2, 3] }] }],
      ['FunnelChart', FunnelChart, { stages: [{ label: 'A', value: 5 }, { label: 'B', value: 2 }] }],
      ['WaterfallChart', WaterfallChart, { items: [{ label: 'A', value: 5 }, { label: 'B', value: -2 }] }],
    )
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth')
    const observers: ((entries: unknown[]) => void)[] = []
    const RO = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      constructor(cb: (entries: unknown[]) => void) {
        observers.push(cb)
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    } as never
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 300 })
    try {
      for (const [, Chart, props] of sample) {
        observers.length = 0
        const w = mount(Chart as never, { props: { label: 'Sample', ...props } as never, attachTo: document.body })
        await nextTick()
        expect(w.find('svg').attributes('viewBox')!.startsWith('0 0 300 ')).toBe(true)
        observers[0]!([{ contentRect: { width: 250 } }])
        await nextTick()
        expect(w.find('svg').attributes('viewBox')!.startsWith('0 0 250 ')).toBe(true)
        observers[0]!([{ contentRect: { width: 0 } }])
        await nextTick()
        expect(w.find('svg').attributes('viewBox')!.startsWith('0 0 250 ')).toBe(true)
        w.unmount()
      }
    } finally {
      globalThis.ResizeObserver = RO
      if (original) Object.defineProperty(HTMLElement.prototype, 'clientWidth', original)
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth
    }
  })
})
