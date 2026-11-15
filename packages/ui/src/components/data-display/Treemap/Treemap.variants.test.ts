import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Treemap from './Treemap.vue'
import { treemapCellVariants, treemapVariants, TREEMAP_GAPS, TREEMAP_GAP_PX, TREEMAP_HEIGHTS } from './variants'
import { TREEMAP_TONES } from './treemapTones'

const data = [
  { label: 'Cables', children: [{ label: 'Copper', value: 40 }, { label: 'Fibre', value: 20 }] },
  { label: 'Racks', children: [{ label: 'Rails', value: 18 }, { label: 'Shelves', value: 12 }] },
  { label: 'Tools', value: 10 },
]
const m = (props: Record<string, unknown> = {}) => mount(Treemap, { props: { data, label: 'Sample', ...props } as never })
type W = ReturnType<typeof m>
const tiles = (w: W) => w.findAll('[data-slot="treemap-tile"]')
const groups = (w: W) => w.findAll('[data-slot="treemap-group"]')
const box = (el: { attributes: (k: string) => string | undefined }) => ['x', 'y', 'width', 'height'].map((k) => Number(el.attributes(k)))
const stripIds = (h: string) => h.replace(/v-\d+-\d+/g, 'x')

describe('Treemap variants: defaults are unchanged', () => {
  it('pins the default markup', () => {
    const w = m()
    expect(w.classes()).toEqual(['flex', 'w-full', 'min-w-0', 'flex-col', 'gap-2'])
    expect(w.attributes('data-variant')).toBe('flat')
    expect(w.attributes('data-size')).toBe('md')
    expect(w.find('svg').attributes('viewBox')).toBe('0 0 480 300')
    expect(tiles(w)[0]!.classes().slice(0, 3)).toEqual(['stroke-background', 'stroke-1', 'fill-chart-1/25'])
    expect(groups(w)).toHaveLength(0)
    expect(w.find('[data-slot="treemap-legend"]').exists()).toBe(false)
  })
  it('explicit default values render exactly like omitted ones', () => {
    expect(stripIds(m({ variant: 'flat', size: 'md', gap: 'md', tone: 'chart-1', colorBy: 'depth', labels: 'auto', showValues: true, showLegend: 'auto', maxDepth: 4 }).html())).toBe(stripIds(m().html()))
  })
  it('the cva helpers keep the default strings for plain elements', () => {
    expect(treemapVariants()).toBe('flex w-full min-w-0 flex-col gap-2')
    expect(treemapCellVariants()).toBe('stroke-background stroke-1')
    expect(treemapCellVariants({ variant: 'outline' })).toBe('stroke-2')
    expect(treemapVariants({ class: 'p-2' })).toBe('flex w-full min-w-0 flex-col gap-2 p-2')
  })
})

describe('Treemap variants: variant', () => {
  it('flat draws leaves only', () => {
    const w = m({ variant: 'flat' })
    expect(groups(w)).toHaveLength(0)
    expect(tiles(w)).toHaveLength(5)
  })
  it('nested draws a container with a header label for every group and puts leaves inside it', () => {
    const w = m({ variant: 'nested' })
    expect(w.attributes('data-variant')).toBe('nested')
    expect(groups(w)).toHaveLength(2)
    expect(groups(w).map((g) => g.find('text').text())).toEqual(['Cables', 'Racks'])
    const [gx, gy, gw, gh] = box(groups(w)[0]!.find('rect'))
    const copper = box(w.find('[data-key="0.0"] rect'))
    expect(copper[0]).toBeGreaterThanOrEqual(gx!)
    expect(copper[1]).toBeGreaterThan(gy! + 17)
    expect(copper[0]! + copper[2]!).toBeLessThanOrEqual(gx! + gw! + 0.01)
    expect(copper[1]! + copper[3]!).toBeLessThanOrEqual(gy! + gh! + 0.01)
    expect(w.find('[data-slot="treemap-groups"]').attributes('aria-hidden')).toBe('true')
  })
  it('nested leaves are denser one level down', () => {
    const w = m({ variant: 'nested' })
    expect(w.find('[data-key="0.0"] rect').classes()).toContain('fill-chart-1/25')
    expect(w.find('[data-key="2"] rect').classes()).toContain('fill-chart-1/15')
  })
  it('nested leaves have less room than flat leaves', () => {
    const flat = box(m({ variant: 'flat' }).find('[data-key="0.0"] rect'))
    const nested = box(m({ variant: 'nested' }).find('[data-key="0.0"] rect'))
    expect(nested[2]! * nested[3]!).toBeLessThan(flat[2]! * flat[3]!)
  })
  it('a group too small for a header is drawn without a title', () => {
    const w = m({ variant: 'nested', width: 120, height: 60, data: [{ label: 'Big', value: 1000 }, { label: 'Tiny group', children: [{ label: 'a', value: 1 }, { label: 'b', value: 1 }] }] })
    const g = groups(w)
    expect(g.length === 0 || g.every((x) => x.find('text').exists() === false)).toBe(true)
  })
  it('outline uses a soft fill and a tone coloured edge', () => {
    const w = m({ variant: 'outline' })
    expect(w.attributes('data-variant')).toBe('outline')
    expect(tiles(w)[0]!.classes()).toEqual(expect.arrayContaining(['stroke-2', 'fill-chart-1/10', 'stroke-chart-1']))
    expect(tiles(w)[0]!.classes()).not.toContain('stroke-background')
  })
  it('the three variants give three different drawings of the same data', () => {
    const htmls = new Set(['flat', 'nested', 'outline'].map((variant) => stripIds(m({ variant }).html())))
    expect(htmls.size).toBe(3)
  })
  it('an unknown variant falls back to flat', () => {
    expect(stripIds(m({ variant: 'bogus' }).html())).toBe(stripIds(m().html()))
  })
  it('the data table and names do not depend on the variant', () => {
    const names = (w: W) => w.findAll('[data-slot="treemap-cell"]').map((c) => c.attributes('aria-label'))
    const table = (w: W) => w.find('[data-slot="chart-data-table"]').text()
    expect(names(m({ variant: 'nested' }))).toEqual(names(m()))
    expect(table(m({ variant: 'outline' }))).toBe(table(m()))
  })
})

describe('Treemap variants: size', () => {
  it.each([
    ['sm', '0 0 480 200'],
    ['md', '0 0 480 300'],
    ['lg', '0 0 480 420'],
  ])('%s sets the viewBox height', (size, viewBox) => {
    const w = m({ size })
    expect(w.find('svg').attributes('viewBox')).toBe(viewBox)
    expect(w.attributes('data-size')).toBe(size)
    expect(TREEMAP_HEIGHTS[size as 'sm']).toBe(Number(viewBox.split(' ')[3]))
  })
  it('an explicit height wins; an unknown size falls back to md', () => {
    expect(m({ size: 'lg', height: 100 }).find('svg').attributes('viewBox')).toBe('0 0 480 100')
    expect(m({ size: 'huge' }).find('svg').attributes('viewBox')).toBe('0 0 480 300')
    expect(m({ height: -5 }).find('svg').attributes('viewBox')).toBe('0 0 480 300')
  })
})

describe('Treemap variants: gap', () => {
  const first = (gap?: string) => box(m({ ...(gap ? { gap } : {}), data: [{ label: 'One', value: 1 }, { label: 'Two', value: 1 }] }).findAll('[data-slot="treemap-tile"]')[0]!)
  it.each([
    ['none', 0],
    ['sm', 1],
    ['md', 2],
    ['lg', 4],
  ])('%s leaves %ipx between tiles', (gap, px) => {
    expect(TREEMAP_GAP_PX[gap as 'sm']).toBe(px)
    const [x, y, w, h] = first(gap)
    expect(x).toBe(px / 2)
    expect(y).toBe(px / 2)
    expect(h).toBe(300 - px)
    expect(w).toBe(240 - px)
  })
  it('tiles shrink as the gap grows', () => {
    const area = (g: string) => first(g)[2]! * first(g)[3]!
    expect(area('none')).toBeGreaterThan(area('sm'))
    expect(area('sm')).toBeGreaterThan(area('md'))
    expect(area('md')).toBeGreaterThan(area('lg'))
  })
  it('md is the default and an unknown gap falls back to it', () => {
    expect(first('bogus')).toEqual(first())
    expect(first('md')).toEqual(first())
    expect(TREEMAP_GAPS).toEqual(['none', 'sm', 'md', 'lg'])
  })
})

describe('Treemap variants: tone and colorBy', () => {
  it('every tone paints the tiles with its own class', () => {
    for (const tone of Object.keys(TREEMAP_TONES)) {
      const cls = tiles(m({ tone }))[0]!.classes()
      expect(cls).toContain(TREEMAP_TONES[tone as 'primary'].steps[1])
    }
    expect(new Set(Object.keys(TREEMAP_TONES).map((t) => tiles(m({ tone: t }))[0]!.attributes('class'))).size).toBe(Object.keys(TREEMAP_TONES).length)
  })
  it('danger maps to the destructive token', () => {
    expect(tiles(m({ tone: 'danger' }))[0]!.classes()).toContain('fill-destructive/25')
  })
  it('an unknown tone falls back to chart-1', () => {
    expect(stripIds(m({ tone: 'bogus' }).html())).toBe(stripIds(m().html()))
  })
  it('depth mode: deeper levels are denser in one tone', () => {
    const w = m()
    expect(w.find('[data-key="2"] rect').classes()).toContain('fill-chart-1/15')
    expect(w.find('[data-key="0.0"] rect').classes()).toContain('fill-chart-1/25')
  })
  it('depth steps stop at the densest level', () => {
    let node: Record<string, unknown> = { label: 'leaf', value: 3 }
    for (let i = 0; i < 6; i++) node = { label: `n${i}`, children: [node, { label: `s${i}`, value: 1 }] }
    const classes = new Set(tiles(m({ data: [node], maxDepth: 8, height: 900, width: 900 })).flatMap((t) => t.classes().filter((c) => c.startsWith('fill-'))))
    expect([...classes].sort()).toEqual(['fill-chart-1/25', 'fill-chart-1/35', 'fill-chart-1/45'])
  })
  it('series mode gives each top-level group its own chart colour and shows a legend', () => {
    const w = m({ colorBy: 'series' })
    expect(w.find('[data-key="0.0"] rect').classes()).toContain('fill-chart-1/25')
    expect(w.find('[data-key="1.0"] rect').classes()).toContain('fill-chart-2/25')
    expect(w.find('[data-key="2"] rect').classes()).toContain('fill-chart-3/15')
    const legend = w.find('[data-slot="treemap-legend"]')
    expect(legend.findAll('li').map((l) => l.text())).toEqual(['Cables', 'Racks', 'Tools'])
  })
  it('colours follow the input order, not the value order', () => {
    const w = m({ colorBy: 'series', data: [{ label: 'Small', value: 1 }, { label: 'Big', value: 9 }] })
    expect(w.find('[data-key="0"] rect').classes()).toContain('fill-chart-1/15')
    expect(w.find('[data-key="1"] rect').classes()).toContain('fill-chart-2/15')
  })
  it('series mode ignores tone, and cycles after five groups', () => {
    expect(stripIds(m({ colorBy: 'series', tone: 'success' }).html())).toBe(stripIds(m({ colorBy: 'series' }).html()))
    const six = Array.from({ length: 6 }, (_, i) => ({ label: `G${i}`, value: 6 - i }))
    const w = m({ colorBy: 'series', data: six })
    expect(w.find('[data-key="5"] rect').classes()).toContain('fill-chart-1/15')
  })
  it('an unknown colorBy falls back to depth', () => {
    expect(stripIds(m({ colorBy: 'bogus' }).html())).toBe(stripIds(m().html()))
  })
  it('colour is never the only signal: every cell has a name and the table lists the groups', () => {
    const w = m({ colorBy: 'series' })
    expect(w.findAll('[data-slot="treemap-cell"]').every((c) => (c.attributes('aria-label') ?? '').includes(':'))).toBe(true)
    expect(w.findAll('tbody th').map((t) => t.text())).toContain('Cables')
  })
  it('outline in series mode uses the group tone for edge and fill', () => {
    const w = m({ variant: 'outline', colorBy: 'series' })
    expect(w.find('[data-key="1.0"] rect').classes()).toEqual(expect.arrayContaining(['stroke-chart-2', 'fill-chart-2/10']))
  })
})

describe('Treemap variants: legend', () => {
  it('auto shows it only in series mode with two or more groups', () => {
    expect(m({ colorBy: 'series' }).find('[data-slot="treemap-legend"]').exists()).toBe(true)
    expect(m({ colorBy: 'series', data: [{ label: 'One', value: 1 }] }).find('[data-slot="treemap-legend"]').exists()).toBe(false)
    expect(m().find('[data-slot="treemap-legend"]').exists()).toBe(false)
  })
  it('true forces it (also for depth mode), false hides it', () => {
    expect(m({ showLegend: true }).find('[data-slot="treemap-legend"]').exists()).toBe(true)
    expect(m({ colorBy: 'series', showLegend: false }).find('[data-slot="treemap-legend"]').exists()).toBe(false)
  })
})

describe('Treemap variants: labels and values', () => {
  const texts = (w: W) => w.findAll('[data-slot="treemap-label"]').map((t) => t.text())
  it('none leaves tiles unlabelled but keeps names and titles', () => {
    const w = m({ labels: 'none', variant: 'nested' })
    expect(texts(w)).toEqual([])
    expect(w.findAll('[data-slot="treemap-group"] text')).toHaveLength(0)
    expect(w.findAll('[data-slot="treemap-cell"]')[0]!.attributes('aria-label')).toContain('Copper')
    expect(w.findAll('[data-slot="treemap-cell"] title').length).toBe(5)
  })
  it('auto hides labels of tiles that are too small and keeps the rest', () => {
    const w = m({ data: [{ label: 'Large item', value: 1000 }, { label: 'Tiny', value: 20 }, { label: 'Tiny too', value: 20 }], width: 200, height: 120 })
    const cell = (k: string) => w.find(`[data-key="${k}"]`).findAll('[data-slot="treemap-label"]')
    expect(cell('0').length).toBeGreaterThan(0)
    expect(cell('1')).toHaveLength(0)
    expect(w.find('[data-key="1"]').exists()).toBe(true)
  })
  it('a tile that is wide but short shows the label without the value', () => {
    const w = m({ data: [{ label: 'Wide', value: 100 }], height: 24, width: 300 })
    expect(texts(w)).toEqual(['Wide'])
  })
  it('a tile that is tall but narrow shows nothing', () => {
    const w = m({ data: [{ label: 'Narrow', value: 100 }], height: 300, width: 24 })
    expect(texts(w)).toEqual([])
  })
  it('showValues=false drops the value line', () => {
    expect(texts(m({ showValues: false }))).not.toContain('40')
    expect(texts(m({ showValues: false })).length).toBeLessThan(texts(m()).length)
  })
  it('a value that does not fit the tile width is left out', () => {
    const w = m({ data: [{ label: 'Wide enough', value: 123456789.123 }], width: 60, height: 200, valueFormatter: (n: number) => `${n} very long unit text` })
    expect(w.findAll('[data-slot="treemap-label"]').map((t) => t.text())).toHaveLength(1)
  })
  it('an unknown labels value behaves like auto', () => {
    expect(stripIds(m({ labels: 'bogus' }).html())).toBe(stripIds(m().html()))
  })
})

describe('Treemap variants: cross products', () => {
  const variants = ['flat', 'nested', 'outline']
  const gaps = ['none', 'sm', 'md', 'lg']
  const sizes = ['sm', 'md', 'lg']
  it.each(variants.flatMap((v) => gaps.map((g) => [v, g] as const)))('%s with gap %s renders finite, labelled cells', (variant, gap) => {
    const w = m({ variant, gap, colorBy: 'series' })
    expect(w.html()).not.toMatch(/\b(NaN|Infinity|undefined)\b/)
    expect(w.findAll('[data-slot="treemap-cell"]')).toHaveLength(5)
  })
  it.each(variants.flatMap((v) => sizes.map((s) => [v, s] as const)))('%s at size %s keeps tiles inside the viewBox', (variant, size) => {
    const w = m({ variant, size })
    const [, , vw, vh] = (w.find('svg').attributes('viewBox') ?? '').split(' ').map(Number)
    for (const t of tiles(w)) {
      const [x, y, width, height] = box(t)
      expect(x! + width!).toBeLessThanOrEqual(vw! + 0.01)
      expect(y! + height!).toBeLessThanOrEqual(vh! + 0.01)
    }
  })
  it('nested, outline, series, large gap and no labels together', () => {
    const w = m({ variant: 'nested', colorBy: 'series', gap: 'lg', labels: 'none', size: 'lg', class: 'max-w-md' })
    expect(w.classes()).toContain('max-w-md')
    expect(w.attributes('data-variant')).toBe('nested')
    expect(groups(w)).toHaveLength(2)
  })
  it('class wins over the variant classes', () => {
    expect(m({ class: 'gap-8' }).classes()).toContain('gap-8')
    expect(m({ class: 'gap-8' }).classes()).not.toContain('gap-2')
  })
  it('layout is deterministic for every variant', () => {
    for (const variant of variants) expect(stripIds(m({ variant }).html())).toBe(stripIds(m({ variant }).html()))
  })
  it('the same data in every variant has the same text alternative', () => {
    const t = (w: W) => w.find('[data-slot="chart-data-table"]').html()
    expect(new Set(variants.map((variant) => t(m({ variant, colorBy: 'series' }))))).toEqual(new Set([t(m())]))
  })
})
