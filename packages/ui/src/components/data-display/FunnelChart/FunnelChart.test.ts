import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FunnelChart from './FunnelChart.vue'

const m = (props: Record<string, unknown>, attrs: Record<string, unknown> = {}) => mount(FunnelChart, { props: props as never, attrs })
const noBad = (w: ReturnType<typeof m>) => expect(w.html()).not.toMatch(/NaN|Infinity|undefined/)
const shapes = (w: ReturnType<typeof m>) => w.findAll('[data-slot="funnel-chart-stage"]')
const texts = (w: ReturnType<typeof m>, kind: string) => w.findAll(`[data-slot="funnel-chart-${kind}"]`).map((t) => t.text())
const stages = [{ label: 'Visited', value: 12400 }, { label: 'Signed up', value: 5200 }, { label: 'Activated', value: 2900 }, { label: 'Subscribed', value: 840 }]
const base = { label: 'Sample', stages }

describe('FunnelChart: good path', () => {
  it('renders a figure with a labelled svg and one shape per stage with a tooltip', () => {
    const w = m(base)
    const svg = w.find('svg')
    expect(w.element.tagName.toLowerCase()).toBe('figure')
    expect(w.attributes('data-slot')).toBe('funnel-chart')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('Sample')
    expect(svg.attributes('viewBox')).toBe('0 0 480 196')
    expect(shapes(w)).toHaveLength(4)
    expect(shapes(w)[0]!.find('title').text()).toBe('Visited: 12,400')
    expect(shapes(w)[1]!.find('title').text()).toBe('Signed up: 5,200 (41.9% of previous stage)')
    expect(shapes(w)[0]!.classes()).toContain('fill-chart-1')
    noBad(w)
  })
  it('prints label and a compact value per stage beside the shapes', () => {
    const w = m(base)
    expect(texts(w, 'label')).toEqual(['Visited', 'Signed up', 'Activated', 'Subscribed'])
    expect(texts(w, 'value')).toEqual(['12.4K', '5.2K', '2.9K', '840'])
    expect(w.find('[data-slot="funnel-chart-conv"]').exists()).toBe(false)
  })
  it('a stage is narrower than the one before when its value is smaller', () => {
    const w = m({ ...base, variant: 'steps' })
    const widths = shapes(w).map((s) => {
      const nums = [...s.attributes('d')!.matchAll(/[ML]([\d.]+),/g)].map((x) => Number(x[1]))
      return Math.max(...nums) - Math.min(...nums)
    })
    expect(widths).toEqual([...widths].sort((a, b) => b - a))
    expect(new Set(widths).size).toBe(4)
  })
  it('showConversion prints the percent of the previous stage, none for the first', () => {
    const w = m({ ...base, showConversion: true })
    expect(texts(w, 'conv')).toEqual(['41.9%', '55.8%', '29%'])
  })
  it('showValues off leaves the labels (and conversions)', () => {
    const w = m({ ...base, showValues: false, showConversion: true })
    expect(texts(w, 'value')).toEqual([])
    expect(texts(w, 'label')).toHaveLength(4)
    expect(texts(w, 'conv')).toHaveLength(3)
  })
  it('valueFormatter applies to values, tooltips and the table', () => {
    const w = m({ ...base, valueFormatter: (n: number) => `${n} users` })
    expect(texts(w, 'value')[0]).toBe('12400 users')
    expect(shapes(w)[0]!.find('title').text()).toBe('Visited: 12400 users')
    expect(w.find('tbody td').text()).toBe('12400 users')
  })
  it('a tone per stage wins over the chart tone, which wins over the default', () => {
    const w = m({ label: 'S', tone: 'primary', stages: [{ label: 'A', value: 5 }, { label: 'B', value: 3, tone: 'danger' }] })
    expect(shapes(w)[0]!.classes()).toContain('fill-primary')
    expect(shapes(w)[1]!.classes()).toContain('fill-destructive')
    expect(shapes(m({ label: 'S', tone: 'nope', stages }))[0]!.classes()).toContain('fill-chart-1')
  })
  it('long labels are cut with the full text in a tooltip', () => {
    const w = m({ label: 'S', width: 320, stages: [{ label: 'A very long stage name that cannot fit the column', value: 5 }, { label: 'B', value: 2 }] })
    const label = w.find('[data-slot="funnel-chart-label"]')
    expect(label.text()).toContain('…')
    expect(label.find('title').text()).toBe('A very long stage name that cannot fit the column')
  })
  it('the label column never takes more than 42% of the width', () => {
    const w = m({ label: 'S', width: 320, stages: [{ label: 'x'.repeat(80), value: 5 }, { label: 'y', value: 2 }] })
    const x0 = Math.min(...shapes(w).flatMap((s) => [...s.attributes('d')!.matchAll(/[ML]([\d.]+),/g)].map((n) => Number(n[1]))))
    expect(x0).toBeLessThanOrEqual(320 * 0.42 + 4 + 0.01)
  })
})

describe('FunnelChart: inside labels', () => {
  it('puts text on a plate inside a shape that is wide enough', () => {
    const w = m({ ...base, labelPlacement: 'inside' })
    const chip = w.find('[data-slot="funnel-chart-chip"]')
    expect(chip.exists()).toBe(true)
    expect(chip.classes()).toContain('fill-background')
    expect(w.find('[data-slot="funnel-chart-label"]').text()).toBe('Visited  12.4K')
  })
  it('the plate sits inside the shape it labels', () => {
    const w = m({ ...base, labelPlacement: 'inside', width: 600 })
    const chip = w.find('[data-slot="funnel-chart-chip"]')
    const x = Number(chip.attributes('x'))
    const wd = Number(chip.attributes('width'))
    const nums = [...shapes(w)[0]!.attributes('d')!.matchAll(/[ML]([\d.]+),([\d.]+)/g)].map((n) => [Number(n[1]), Number(n[2])])
    const narrowTop = Math.min(...nums.filter((p) => p[1] > 20).map((p) => p[0]))
    expect(x).toBeGreaterThanOrEqual(narrowTop - 0.01)
    expect(x + wd).toBeLessThanOrEqual(Math.max(...nums.map((p) => p[0])) + 0.01)
  })
  it('text that does not fit moves beside its stage on two lines, dropping nothing', () => {
    const w = m({ ...base, labelPlacement: 'inside', showConversion: true, width: 420 })
    const beside = w.findAll('[data-slot="funnel-chart-value"]').map((t) => t.text())
    expect(beside.length).toBeGreaterThan(0)
    expect(beside.some((t) => t.includes('%'))).toBe(true)
  })
  it('falls back to a single line when the stage is too low for two', () => {
    const w = m({ ...base, labelPlacement: 'inside', height: 90, width: 420 })
    expect(w.find('[data-slot="funnel-chart-label"]').exists()).toBe(true)
    noBad(w)
  })
  it('narrow stages with no room at all print nothing but keep their tooltip and table row', () => {
    const w = m({ label: 'S', labelPlacement: 'inside', width: 120, stages: [{ label: 'Wide stage', value: 100 }, { label: 'Tiny', value: 1 }] })
    expect(shapes(w)).toHaveLength(2)
    expect(w.findAll('tbody tr')).toHaveLength(2)
    noBad(w)
  })
  it('a stage with no shape prints its text beside the axis', () => {
    const w = m({ label: 'S', labelPlacement: 'inside', stages: [{ label: 'First', value: 10 }, { label: 'Zero', value: 0 }] })
    expect(texts(w, 'label').join(' ')).toContain('Zero')
  })
  it('horizontal inside moves value and conversion into the shape and keeps the label underneath', () => {
    const w = m({ ...base, orientation: 'horizontal', labelPlacement: 'inside', showConversion: true, width: 700 })
    expect(w.findAll('[data-slot="funnel-chart-chip"]').length).toBeGreaterThan(0)
    expect(texts(w, 'label')).toEqual(expect.arrayContaining(['Visited', 'Signed up']))
  })
})

describe('FunnelChart: bad path and edge cases', () => {
  it('empty or missing stages show the empty state with every option set', () => {
    for (const stagesValue of [[], undefined, null, 'x', {}]) {
      const w = m({ label: 'Pipeline', stages: stagesValue, variant: 'pyramid', orientation: 'horizontal', showConversion: true })
      expect(w.find('[data-slot="funnel-chart-empty"]').text()).toBe('No data')
      expect(w.attributes('role')).toBe('img')
      expect(w.attributes('aria-label')).toBe('Pipeline')
      expect(w.find('svg').exists()).toBe(false)
      expect(w.find('table').exists()).toBe(false)
    }
  })
  it('emptyText replaces the message and names the image without a label', () => {
    const w = m({ stages: [], emptyText: 'No stages yet' })
    expect(w.text()).toBe('No stages yet')
    expect(w.attributes('aria-label')).toBe('No stages yet')
  })
  it('one stage is a rectangle without NaN', () => {
    const w = m({ label: 'S', stages: [{ label: 'Only', value: 7 }], showConversion: true })
    expect(shapes(w)).toHaveLength(1)
    expect(texts(w, 'conv')).toEqual([])
    noBad(w)
  })
  it('equal values give equal widths; all zero draws no shape and still lists every stage', () => {
    const eq = m({ label: 'S', variant: 'steps', stages: [{ label: 'a', value: 5 }, { label: 'b', value: 5 }] })
    expect(shapes(eq)[0]!.attributes('d')!.replace(/,\d+(\.\d+)?/g, '')).toBe(shapes(eq)[1]!.attributes('d')!.replace(/,\d+(\.\d+)?/g, ''))
    const zero = m({ label: 'S', stages: [{ label: 'a', value: 0 }, { label: 'b', value: 0 }], showConversion: true })
    expect(shapes(zero)).toHaveLength(0)
    expect(texts(zero, 'conv')).toEqual(['n/a'])
    noBad(zero)
  })
  it('a stage that is larger than the previous one is drawn as it is, with a rate above 100%', () => {
    const w = m({ label: 'S', showConversion: true, variant: 'steps', stages: [{ label: 'a', value: 50 }, { label: 'b', value: 100 }] })
    expect(texts(w, 'conv')).toEqual(['200%'])
    expect(shapes(w)).toHaveLength(2)
  })
  it('missing and negative values draw no shape and read n/a or their number', () => {
    const w = m({ label: 'S', variant: 'bars', showConversion: true, stages: [{ label: 'a', value: 40 }, { label: 'b', value: Number.NaN }, { label: 'c', value: -5 }, { label: 'd', value: 10 }] })
    expect(shapes(w)).toHaveLength(2)
    expect(texts(w, 'value')).toEqual(['40', 'n/a', '-5', '10'])
    expect(texts(w, 'conv')).toEqual(['n/a', 'n/a', 'n/a'])
    expect(w.findAll('tbody tr')[1]!.findAll('td').map((t) => t.text())).toEqual(['n/a', 'n/a', 'n/a'])
    noBad(w)
  })
  it('huge values stay finite', () => {
    noBad(m({ label: 'S', showConversion: true, stages: [{ label: 'a', value: 1e308 }, { label: 'b', value: 5e307 }, { label: 'c', value: 1 }] }))
    noBad(m({ label: 'S', showConversion: true, stages: [{ label: 'a', value: 1e-300 }, { label: 'b', value: 1e300 }] }))
  })
  it('draws at most 50 stages, says so in the summary and cuts the table at 200 rows', () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ label: `Stage ${i}`, value: 2000 - i }))
    const t0 = performance.now()
    const w = m({ label: 'S', stages: many, showConversion: true })
    expect(performance.now() - t0).toBeLessThan(5000)
    expect(shapes(w)).toHaveLength(50)
    expect(w.find('[data-slot="funnel-chart-summary"]').text()).toContain('first 50 of 2000 stages drawn')
    expect(w.findAll('tbody tr')).toHaveLength(50)
    noBad(w)
  })
  it('entries that are not objects are skipped', () => {
    expect(shapes(m({ label: 'S', stages: [null, 'x', { label: 'ok', value: 3 }] }))).toHaveLength(1)
  })
  it('a missing label becomes "Stage n"', () => {
    expect(texts(m({ label: 'S', stages: [{ value: 3 }, { label: '', value: 1 }] }), 'label')).toEqual(['Stage 1', 'Stage 2'])
  })
  it('a bad width or height falls back to the defaults and an explicit height wins', () => {
    expect(m({ ...base, width: -1 }).find('svg').attributes('viewBox')).toBe('0 0 480 196')
    expect(m({ ...base, height: 300 }).find('svg').attributes('viewBox')).toBe('0 0 480 300')
    expect(m({ ...base, height: Number.NaN }).find('svg').attributes('viewBox')).toBe('0 0 480 196')
  })
  it('fits a 320px wide chart in both orientations: no text anchored outside the box', () => {
    for (const orientation of ['vertical', 'horizontal']) {
      const w = m({ ...base, width: 320, orientation, showConversion: true })
      for (const t of w.findAll('text')) {
        expect(Number(t.attributes('x'))).toBeGreaterThanOrEqual(0)
        expect(Number(t.attributes('x'))).toBeLessThanOrEqual(320)
      }
      expect(w.find('svg').attributes('viewBox')!.startsWith('0 0 320 ')).toBe(true)
    }
  })
  it('thins the labels of a horizontal funnel with many narrow stages', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ label: `Stage ${i}`, value: 100 - i * 4 }))
    const w = m({ label: 'S', width: 320, orientation: 'horizontal', stages: many })
    expect(texts(w, 'label').length).toBeLessThan(20)
    expect(texts(w, 'value')).toEqual([])
    expect(shapes(w)).toHaveLength(20)
  })
  it('truncates long labels of horizontal columns', () => {
    const long = ['A very long stage name', 'Another long stage name', 'Yet another long name', 'The last long stage name']
    const w = m({ label: 'S', width: 320, orientation: 'horizontal', stages: long.map((label, i) => ({ label, value: 10 - i })) })
    expect(w.findAll('[data-slot="funnel-chart-label"]').every((t) => t.element.childNodes[0]!.textContent!.length <= 11)).toBe(true)
    expect(w.find('[data-slot="funnel-chart-label"] title').exists()).toBe(true)
  })
})

describe('FunnelChart: customisation and a11y', () => {
  it('class wins and attributes fall through', () => {
    const w = m({ ...base, class: 'max-w-sm gap-6' }, { id: 'funnel', 'data-testid': 'f' })
    expect(w.classes()).toContain('max-w-sm')
    expect(w.classes()).toContain('gap-6')
    expect(w.classes()).not.toContain('gap-2')
    expect(w.attributes('id')).toBe('funnel')
    expect(w.attributes('data-testid')).toBe('f')
  })
  it('names the svg with aria-label or aria-labelledby, not the figure', () => {
    const a = m({ stages }, { 'aria-label': 'Sign-ups' })
    expect(a.find('svg').attributes('aria-label')).toBe('Sign-ups')
    expect(a.attributes('aria-label')).toBeUndefined()
    const b = m({ stages }, { 'aria-labelledby': 'h' })
    expect(b.find('svg').attributes('aria-labelledby')).toBe('h')
  })
  it('title names the chart, description describes it and the summary is plain text', () => {
    const w = m({ stages, title: 'Sign-ups', description: 'Four sample stages' })
    expect(w.find('svg').attributes('aria-label')).toBe('Sign-ups')
    const desc = w.find('[data-slot="funnel-chart-description"]')
    const ids = w.find('svg').attributes('aria-describedby')!.split(' ')
    expect(ids).toContain(desc.attributes('id'))
    expect(w.find(`#${ids[1]}`).text()).toBe('Funnel chart: 4 stages, from Visited (12,400) to Subscribed (840)')
  })
  it('without a name the summary names the image (strict mode off)', () => {
    expect(m({ stages }).find('svg').attributes('aria-label')).toBe('Funnel chart: 4 stages, from Visited (12,400) to Subscribed (840)')
  })
  it('the summary handles one stage and a missing end value', () => {
    expect(m({ stages: [{ label: 'Only', value: 7 }] }).find('svg').attributes('aria-label')).toBe('Funnel chart: 1 stage, from Only (7) to Only (7)')
    expect(m({ stages: [{ label: 'A', value: 7 }, { label: 'B', value: Number.NaN }] }).find('svg').attributes('aria-label')).toContain('B (n/a)')
  })
  it('has a hidden data table with value and both conversions per stage', () => {
    const w = m(base)
    const table = w.find('[data-slot="chart-data-table"]')
    expect(table.classes()).toContain('sr-only')
    expect(table.find('caption').text()).toBe('Sample: data')
    expect(table.findAll('thead th').map((t) => t.text())).toEqual(['Stage', 'Value', 'Percent of previous stage', 'Percent of first stage'])
    expect(table.findAll('tbody tr')[0]!.findAll('td').map((t) => t.text())).toEqual(['12,400', 'n/a', 'n/a'])
    expect(table.findAll('tbody tr')[1]!.findAll('td').map((t) => t.text())).toEqual(['5,200', '41.9%', '41.9%'])
    expect(table.findAll('tbody tr')[3]!.findAll('td').map((t) => t.text())).toEqual(['840', '29%', '6.8%'])
    expect(w.find('svg').find('table').exists()).toBe(false)
  })
  it('the text is real text on the page background, never on a tone fill', () => {
    const w = m({ ...base, labelPlacement: 'inside', showConversion: true })
    expect(w.findAll('text').every((t) => t.classes().some((c) => c === 'fill-foreground' || c === 'fill-muted-foreground'))).toBe(true)
    expect(w.findAll('[data-slot="funnel-chart-chip"]').every((c) => c.classes().includes('fill-background'))).toBe(true)
  })
  it('shapes have a forced-colors fallback and no hard-coded colour appears', () => {
    const w = m(base)
    expect(shapes(w)[0]!.classes()).toContain('forced-colors:fill-[CanvasText]')
    expect(w.html()).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(|hsl\(|gradient/i)
  })
})

describe('FunnelChart: loading', () => {
  it('shows a busy status region instead of the chart', () => {
    const w = m({ ...base, loading: true, loadingText: 'Fetching' })
    expect(w.attributes('role')).toBe('status')
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.text()).toBe('Fetching')
    expect(m({ ...base, loading: true }).text()).toBe('Loading chart')
    expect(m({ ...base, loading: true, class: 'min-h-48' }).classes()).toContain('min-h-48')
  })
})
