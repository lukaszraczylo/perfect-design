import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Sankey from './Sankey.vue'
import { sankeyLinkVariants, sankeyNodeVariants, sankeyVariants, SANKEY_GAP_PX, SANKEY_HEIGHTS } from './variants'
import { SANKEY_TONES } from './sankeyTones'

const links = [
  { source: 'Orders', target: 'Shipped', value: 80 },
  { source: 'Orders', target: 'Returned', value: 20 },
  { source: 'Shipped', target: 'Delivered', value: 70 },
  { source: 'Shipped', target: 'Lost', value: 10 },
]
const m = (props: Record<string, unknown> = {}) => mount(Sankey, { props: { links, label: 'Sample', ...props } as never })
type W = ReturnType<typeof m>
const nodes = (w: W) => w.findAll('[data-slot="sankey-node"]')
const ribbons = (w: W) => w.findAll('[data-slot="sankey-link"]')
const stripIds = (h: string) => h.replace(/v-\d+-\d+/g, 'x')

describe('Sankey variants: defaults are unchanged', () => {
  it('pins the default markup', () => {
    const w = m()
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    expect(w.attributes('data-variant')).toBe('flat')
    expect(w.attributes('data-size')).toBe('md')
    expect(nodes(w)[0]!.classes()).toEqual(['stroke-transparent', 'fill-chart-1'])
    expect(ribbons(w)[0]!.classes()).toEqual(['fill-chart-1/30'])
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(stripIds(m({ variant: 'flat', size: 'md', gap: 'md', tone: 'auto', linkOpacity: 'medium', showValues: true }).html())).toBe(stripIds(m().html()))
  })
  it('the cva helpers keep the default strings for plain elements', () => {
    expect(sankeyVariants()).toBe('flex w-full min-w-0 flex-col gap-2')
    expect(sankeyNodeVariants()).toBe('stroke-transparent')
    expect(sankeyNodeVariants({ variant: 'outline' })).toBe('fill-background stroke-2')
    expect(sankeyLinkVariants()).toBe('')
    expect(sankeyLinkVariants({ variant: 'outline' })).toBe('stroke-1')
    expect(sankeyVariants({ class: 'p-2' })).toContain('p-2')
  })
})

describe('Sankey variants: variant', () => {
  it('outline draws empty nodes with a coloured edge and ribbons with a hairline edge', () => {
    const w = m({ variant: 'outline' })
    expect(w.attributes('data-variant')).toBe('outline')
    expect(nodes(w)[0]!.classes()).toEqual(['fill-background', 'stroke-2', 'stroke-chart-1'])
    expect(ribbons(w)[0]!.classes()).toEqual(['stroke-1', 'fill-chart-1/30', 'stroke-chart-1/50'])
  })
  it('flat and outline differ but keep the same geometry, names and table', () => {
    const flat = m()
    const outline = m({ variant: 'outline' })
    expect(stripIds(flat.html())).not.toBe(stripIds(outline.html()))
    expect(flat.findAll('path').map((p) => p.attributes('d'))).toEqual(outline.findAll('path').map((p) => p.attributes('d')))
    expect(flat.find('[data-slot="sankey-data-table"]').html()).toBe(outline.find('[data-slot="sankey-data-table"]').html())
  })
  it('an unknown variant falls back to flat', () => {
    expect(stripIds(m({ variant: 'bogus' }).html())).toBe(stripIds(m().html()))
  })
})

describe('Sankey variants: size', () => {
  it.each([
    ['sm', '0 0 480 220'],
    ['md', '0 0 480 320'],
    ['lg', '0 0 480 440'],
  ])('%s sets the viewBox height', (size, viewBox) => {
    const w = m({ size })
    expect(w.find('svg').attributes('viewBox')).toBe(viewBox)
    expect(w.attributes('data-size')).toBe(size)
    expect(SANKEY_HEIGHTS[size as 'sm']).toBe(Number(viewBox.split(' ')[3]))
  })
  it('taller drawings give taller nodes', () => {
    const h = (size: string) => Number(nodes(m({ size }))[0]!.attributes('height'))
    expect(h('sm')).toBeLessThan(h('md'))
    expect(h('md')).toBeLessThan(h('lg'))
  })
  it('an unknown size falls back to md', () => {
    expect(m({ size: 'huge' }).find('svg').attributes('viewBox')).toBe('0 0 480 320')
  })
})

describe('Sankey variants: gap', () => {
  const lastColumn = (gap?: string) => nodes(m({ ...(gap ? { gap } : {}) })).filter((n) => n.attributes('x') === '470').map((n) => [Number(n.attributes('y')), Number(n.attributes('height'))]).sort((a, b) => a[0]! - b[0]!)
  const space = (gap?: string) => {
    const c = lastColumn(gap)
    return c[1]![0]! - (c[0]![0]! + c[0]![1]!)
  }
  it.each([['sm', 6], ['md', 12], ['lg', 22]])('%s leaves %ipx between nodes of a layer', (gap, px) => {
    expect(SANKEY_GAP_PX[gap as 'sm']).toBe(px)
    expect(space(gap)).toBeGreaterThanOrEqual(px - 0.1)
  })
  it('a wider gap makes nodes shorter', () => {
    expect(lastColumn('lg').reduce((a, b) => a + b[1]!, 0)).toBeLessThan(lastColumn('sm').reduce((a, b) => a + b[1]!, 0))
  })
  it('an unknown gap falls back to md', () => {
    expect(lastColumn('bogus')).toEqual(lastColumn())
  })
})

describe('Sankey variants: tone and linkOpacity', () => {
  it('auto gives each node the next chart colour and ribbons the colour of their source', () => {
    const w = m()
    expect(nodes(w).map((n) => n.classes()[1])).toEqual(['fill-chart-1', 'fill-chart-2', 'fill-chart-4', 'fill-chart-3', 'fill-chart-5'])
    expect(ribbons(w).map((r) => r.classes()[0])).toEqual(['fill-chart-1/30', 'fill-chart-1/30', 'fill-chart-2/30', 'fill-chart-2/30'])
  })
  it('colour is never the only signal: nodes are labelled and every flow is in the table', () => {
    const w = m()
    expect(w.findAll('[data-slot="sankey-label"]').length).toBe(5)
    expect(w.findAll('tbody tr')).toHaveLength(4)
  })
  it('a tone paints nodes and ribbons in that tone', () => {
    for (const tone of Object.keys(SANKEY_TONES)) {
      const w = m({ tone })
      expect(new Set(nodes(w).map((n) => n.classes()[1]))).toEqual(new Set([SANKEY_TONES[tone as 'primary'].node]))
      expect(new Set(ribbons(w).map((r) => r.classes()[0]))).toEqual(new Set([SANKEY_TONES[tone as 'primary'].link.medium]))
    }
    expect(nodes(m({ tone: 'danger' }))[0]!.classes()).toContain('fill-destructive')
  })
  it('an unknown tone falls back to chart-1 for everything', () => {
    expect(stripIds(m({ tone: 'bogus' }).html())).toBe(stripIds(m({ tone: 'chart-1' }).html()))
  })
  it.each([['soft', '15'], ['medium', '30'], ['strong', '45']])('%s ribbons use %s percent opacity from the token', (linkOpacity, pct) => {
    expect(ribbons(m({ linkOpacity }))[0]!.classes()).toEqual([`fill-chart-1/${pct}`])
  })
  it('an unknown linkOpacity falls back to medium', () => {
    expect(ribbons(m({ linkOpacity: 'bogus' }))[0]!.classes()).toEqual(['fill-chart-1/30'])
  })
  it('no gradients anywhere: ribbons are flat fills', () => {
    expect(m().html()).not.toMatch(/gradient/i)
  })
})

describe('Sankey variants: showValues', () => {
  it('false drops the value from the labels', () => {
    const w = m({ showValues: false })
    expect(w.findAll('[data-slot="sankey-label"]').map((t) => t.text())).toEqual(['Orders', 'Shipped', 'Delivered', 'Returned', 'Lost'])
    expect(w.find('[data-slot="sankey-label"] tspan').exists()).toBe(false)
  })
})

describe('Sankey variants: cross products', () => {
  const variants = ['flat', 'outline']
  const sizes = ['sm', 'md', 'lg']
  const gaps = ['sm', 'md', 'lg']
  it.each(variants.flatMap((v) => sizes.flatMap((s) => gaps.map((g) => [v, s, g] as const))))('%s, size %s, gap %s: finite and complete', (variant, size, gap) => {
    const w = m({ variant, size, gap, linkOpacity: 'strong', tone: 'chart-2' })
    expect(w.html()).not.toMatch(/\b(NaN|Infinity|undefined)\b/)
    expect(nodes(w)).toHaveLength(5)
    expect(ribbons(w)).toHaveLength(4)
    const [, , vw, vh] = (w.find('svg').attributes('viewBox') ?? '').split(' ').map(Number)
    for (const n of nodes(w)) expect(Number(n.attributes('y')) + Number(n.attributes('height'))).toBeLessThanOrEqual(vh! + 0.01)
    for (const n of nodes(w)) expect(Number(n.attributes('x')) + 10).toBeLessThanOrEqual(vw! + 0.01)
  })
  it('class wins over variant classes and the layout is deterministic', () => {
    expect(m({ variant: 'outline', class: 'gap-8' }).classes()).toContain('gap-8')
    expect(stripIds(m({ variant: 'outline', gap: 'lg' }).html())).toBe(stripIds(m({ variant: 'outline', gap: 'lg' }).html()))
  })
})
