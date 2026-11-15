import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Grid from './Grid.vue'
import { gridLayouts, gridVariantNames, gridVariants } from './variants'

const CELL = ['[&>*]:rounded-lg', '[&>*]:border', '[&>*]:border-border', '[&>*]:p-4', '[&>*]:min-w-0']
const hasCell = (c: string[]) => c.some((x) => x.startsWith('[&>*]:'))

describe('Grid variant and layout', () => {
  it('default output is unchanged: no cell or span classes', () => {
    const w = mount(Grid)
    expect(w.classes().sort()).toEqual(['gap-4', 'grid', 'grid-cols-1'])
    expect(w.attributes('style')).toBeUndefined()
    expect(gridVariants()).toBe('grid')
  })

  describe('variant', () => {
    it('plain leaves the cells alone', () => {
      expect(hasCell(mount(Grid, { props: { variant: 'plain' } }).classes())).toBe(false)
    })
    it('bordered draws every direct child with a hairline border and p-4', () => {
      const c = mount(Grid, { props: { variant: 'bordered' } }).classes()
      expect(c).toEqual(expect.arrayContaining(CELL))
      expect(c).not.toContain('[&>*]:bg-card')
    })
    it('card adds the card token pair to the cells', () => {
      const c = mount(Grid, { props: { variant: 'card' } }).classes()
      expect(c).toEqual(expect.arrayContaining([...CELL, '[&>*]:bg-card', '[&>*]:text-card-foreground']))
    })
    it('cells can shrink (min-w-0) so long content cannot widen a track at 320px', () => {
      for (const variant of ['bordered', 'card'] as const) expect(mount(Grid, { props: { variant } }).classes()).toContain('[&>*]:min-w-0')
    })
    it('unknown variant falls back to plain', () => {
      expect(mount(Grid, { props: { variant: 'masonry' as never } }).classes()).toEqual(mount(Grid).classes())
    })
    it('uses no shadow, gradient or large radius', () => {
      for (const variant of gridVariantNames) expect(mount(Grid, { props: { variant } }).classes().join(' ')).not.toMatch(/shadow|gradient|rounded-(xl|2xl|3xl)|backdrop/)
    })
  })

  describe('layout', () => {
    it('uniform adds no span classes', () => {
      expect(mount(Grid, { props: { layout: 'uniform' } }).classes().some((x) => /col-span|row-span/.test(x))).toBe(false)
    })
    it('lead makes the first item span the full row at every width', () => {
      const c = mount(Grid, { props: { layout: 'lead', cols: 1, sm: 3 } }).classes()
      expect(c).toContain('[&>:first-child]:col-span-full')
      expect(c).toEqual(expect.arrayContaining(['grid-cols-1', 'sm:grid-cols-3']))
    })
    it('feature spans 2 columns and 2 rows only from md up, so 320px stays one column', () => {
      const c = mount(Grid, { props: { layout: 'feature', cols: 1, md: 3 } }).classes()
      expect(c).toEqual(expect.arrayContaining(['md:[&>:first-child]:col-span-2', 'md:[&>:first-child]:row-span-2', 'md:auto-cols-fr', 'grid-cols-1', 'md:grid-cols-3']))
      expect(c.some((x) => /^\[&>:first-child\]:(col|row)-span/.test(x))).toBe(false)
    })
    it('unknown layout falls back to uniform', () => {
      expect(mount(Grid, { props: { layout: 'bento' as never } }).classes()).toEqual(mount(Grid).classes())
    })
  })

  describe('combinations', () => {
    it('every variant x layout mounts with the grid, column and gap classes intact', () => {
      for (const variant of gridVariantNames)
        for (const layout of gridLayouts) {
          const w = mount(Grid, { props: { variant, layout, cols: 2, gap: 6 }, slots: { default: '<div>a</div><div>b</div>' } })
          expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'grid-cols-2', 'gap-6']))
          expect(w.element.children).toHaveLength(2)
        }
    })
    it('works with minItemWidth (auto-fit) and keeps the inline template variables', () => {
      const w = mount(Grid, { props: { minItemWidth: '12rem', variant: 'card', layout: 'lead' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['grid-cols-(--grid-template)', '[&>:first-child]:col-span-full', '[&>*]:bg-card']))
      expect(w.attributes('style')).toContain('--grid-min: 12rem')
      expect(w.attributes('data-auto')).toBe('fit')
    })
    it('class prop wins over the cell padding', () => {
      const c = mount(Grid, { props: { variant: 'bordered', class: '[&>*]:p-6' } }).classes()
      expect(c).toContain('[&>*]:p-6')
      expect(c).not.toContain('[&>*]:p-4')
    })
    it('as="ul" and asChild keep the variants', () => {
      expect(mount(Grid, { props: { as: 'ul', variant: 'card' } }).element.tagName).toBe('UL')
      const w = mount(Grid, { props: { asChild: true, layout: 'lead' }, slots: { default: '<section>x</section>' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.classes()).toContain('[&>:first-child]:col-span-full')
    })
    it('empty grids and a single child render in feature and lead layouts', () => {
      for (const layout of ['lead', 'feature'] as const) {
        expect(mount(Grid, { props: { layout } }).text()).toBe('')
        expect(mount(Grid, { props: { layout }, slots: { default: '<div>only</div>' } }).text()).toBe('only')
      }
    })
    it('gridVariants is reusable', () => {
      expect(gridVariants({ variant: 'card', layout: 'feature' })).toEqual(expect.stringContaining('md:[&>:first-child]:col-span-2'))
    })
  })
})
