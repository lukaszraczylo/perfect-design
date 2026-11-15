import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Heatmap from './Heatmap.vue'
import { heatmapCellVariants, heatmapTableVariants } from './variants'

const values = [[0, 3, 5], [2, 8, 9]]
const m = (props: Record<string, unknown> = {}) => mount(Heatmap, { props: { values, label: 'Sample', rowLabels: ['Mon', 'Tue'], colLabels: ['9', '12', '15'], ...props } as never })
const swatches = (w: ReturnType<typeof m>) => w.findAll('[data-slot="heatmap-swatch"]')
const legend = (w: ReturnType<typeof m>) => w.findAll('[data-slot="heatmap-legend-swatch"]')
const table = (w: ReturnType<typeof m>) => w.find('[data-slot="heatmap-table"]')

describe('Heatmap variants: defaults are unchanged', () => {
  it('keeps today\'s class strings', () => {
    const w = m()
    expect(table(w).attributes('class')).toBe('border-separate border-spacing-0.5 text-xs text-muted-foreground')
    expect(swatches(w)[0]!.attributes('class')).toBe('block rounded-xs size-4 bg-muted')
    expect(swatches(w)[5]!.attributes('class')).toBe('block rounded-xs size-4 bg-chart-1')
    expect(legend(w)[0]!.attributes('class')).toBe('block rounded-xs size-4 bg-muted')
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(m({ shape: 'square', gap: 'md', size: 'md' }).html()).toBe(m().html())
  })
  it('the cva helpers keep the default strings for plain elements', () => {
    expect(heatmapCellVariants()).toBe('block rounded-xs size-4')
    expect(heatmapTableVariants()).toBe('border-separate border-spacing-0.5')
  })
})

describe('Heatmap variants: shape', () => {
  it('circle makes every swatch and legend swatch round', () => {
    const w = m({ shape: 'circle' })
    expect(swatches(w).every((s) => s.classes().includes('rounded-full') && !s.classes().includes('rounded-xs'))).toBe(true)
    expect(legend(w).every((s) => s.classes().includes('rounded-full'))).toBe(true)
  })
  it('only the shape changes: size and intensity classes are the same', () => {
    const sq = m()
    const ci = m({ shape: 'circle' })
    expect(swatches(ci).map((s) => s.classes().filter((c) => c !== 'rounded-full'))).toEqual(swatches(sq).map((s) => s.classes().filter((c) => c !== 'rounded-xs')))
  })
  it('the table text alternative is identical for both shapes', () => {
    const cells = (w: ReturnType<typeof m>) => w.findAll('[data-slot="heatmap-cell"]').map((c) => c.text())
    expect(cells(m({ shape: 'circle' }))).toEqual(cells(m()))
    expect(m({ shape: 'circle' }).find('table caption').text()).toBe('Sample')
  })
  it('swatches stay decorative with a native tooltip', () => {
    const s = swatches(m({ shape: 'circle' }))[1]!
    expect(s.attributes('aria-hidden')).toBe('true')
    expect(s.attributes('title')).toBe('Mon, 12: 3')
  })
  it('an unknown shape falls back to square', () => {
    expect(m({ shape: 'hexagon' }).html()).toBe(m().html())
  })
})

describe('Heatmap variants: gap', () => {
  it.each([
    ['sm', 'border-spacing-px'],
    ['md', 'border-spacing-0.5'],
    ['lg', 'border-spacing-1'],
  ])('%s sets %s on the table', (gap, cls) => {
    expect(table(m({ gap })).classes()).toEqual(['border-separate', cls, 'text-xs', 'text-muted-foreground'])
  })
  it('an unknown gap falls back to md', () => {
    expect(m({ gap: 'huge' }).html()).toBe(m().html())
  })
})

describe('Heatmap variants: combinations and customisation', () => {
  it('circle at each size keeps the size class', () => {
    for (const [size, cls] of [['sm', 'size-3'], ['md', 'size-4'], ['lg', 'size-6']] as const) {
      const w = m({ shape: 'circle', size })
      expect(swatches(w).every((s) => s.classes().includes(cls) && s.classes().includes('rounded-full'))).toBe(true)
      expect(legend(w).every((s) => s.classes().includes(cls))).toBe(true)
    }
  })
  it('an unknown size falls back to md', () => {
    expect(swatches(m({ size: 'xl' }))[0]!.classes()).toContain('size-4')
  })
  it('circle with tone, levels, a wide gap and no legend', () => {
    const w = m({ shape: 'circle', tone: 'success', levels: 3, gap: 'lg', showLegend: false })
    expect(table(w).classes()).toContain('border-spacing-1')
    expect(w.find('[data-slot="heatmap-legend"]').exists()).toBe(false)
    expect(swatches(w).some((s) => s.classes().includes('bg-success'))).toBe(true)
  })
  it('the class prop is merged onto the focusable region', () => {
    const w = m({ shape: 'circle', class: 'max-w-xs' })
    expect(w.classes()).toContain('max-w-xs')
    expect(w.attributes('role')).toBe('region')
    expect(w.attributes('tabindex')).toBe('0')
  })
  it('empty values show the empty state whatever the shape', () => {
    const w = m({ values: [], shape: 'circle', gap: 'lg' })
    expect(w.find('[data-slot="heatmap-empty"]').exists()).toBe(true)
    expect(w.find('table').exists()).toBe(false)
  })
  it('a single cell and ragged rows render with circles', () => {
    expect(swatches(m({ values: [[4]], rowLabels: undefined, colLabels: undefined, shape: 'circle' }))).toHaveLength(1)
    expect(swatches(m({ values: [[1, 2, 3], [4]], shape: 'circle' }))).toHaveLength(6)
  })
})
