import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import DataGrid from './DataGrid.vue'
import { DATA_GRID_DENSITIES, DATA_GRID_SIZES, DATA_GRID_VARIANTS, dataGridVariants } from './variants'

const columns = [{ key: 'name', label: 'Name', width: 120 }, { key: 'qty', label: 'Qty', type: 'number', width: 80 }]
const rows = [{ id: 1, name: 'a', qty: 1 }, { id: 2, name: 'b', qty: 2 }, { id: 3, name: 'c', qty: 3 }]
type W = VueWrapper<any>
let wrappers: W[] = []
const mnt = (props: Record<string, unknown> = {}): W => {
  const w = mount(DataGrid as any, { props: { label: 'Sample', columns, rows, ...props } }) as W
  wrappers.push(w)
  return w
}
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
})
const rowEls = (w: W) => w.findAll('[data-slot=data-grid-row]')

describe('DataGrid variations', () => {
  describe('default output is unchanged', () => {
    it('is bordered, md and default density', () => {
      const w = mnt()
      expect(w.attributes('data-variant')).toBe('bordered')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.attributes('data-density')).toBe('default')
      expect(w.classes()).toEqual(expect.arrayContaining(['group/grid', 'rounded-md', 'border', 'text-sm']))
      expect(rowEls(w)[0].attributes('style')).toContain('height: 36px')
      expect(dataGridVariants()).toBe(w.attributes('class')!.split(' ').filter((c) => dataGridVariants().split(' ').includes(c)).join(' '))
    })
  })

  describe('variant', () => {
    it('lists exactly the documented values', () => expect([...DATA_GRID_VARIANTS]).toEqual(['bordered', 'striped', 'borderless']))
    it('bordered draws the frame and column rules', () => {
      const w = mnt({ variant: 'bordered' })
      expect(w.classes()).toContain('border')
      expect(w.find('[data-row="1"][data-col="0"]').classes()).toContain('border-e')
      expect(w.find('[data-row="1"][data-col="1"]').classes()).not.toContain('border-e')
    })
    it('striped frames the grid and tints only every second row', () => {
      const w = mnt({ variant: 'striped' })
      expect(w.classes()).toContain('border')
      expect(rowEls(w).map((r) => r.classes().includes('bg-muted/30'))).toEqual([false, true, false])
      expect(w.find('[data-row="1"][data-col="0"]').classes()).not.toContain('border-e')
    })
    it('borderless has no frame and no column rules but keeps the row rules', () => {
      const w = mnt({ variant: 'borderless' })
      expect(w.classes()).not.toContain('border')
      expect(w.find('[data-row="1"][data-col="0"]').classes()).not.toContain('border-e')
      expect(rowEls(w)[0].classes()).toContain('border-b')
      expect(rowEls(w).some((r) => r.classes().includes('bg-muted/30'))).toBe(false)
    })
    it('falls back to bordered for unknown values', () => {
      expect(mnt({ variant: 'fancy' }).attributes('data-variant')).toBe('bordered')
      expect(mnt({ variant: null }).attributes('data-variant')).toBe('bordered')
    })
  })

  describe('size', () => {
    it.each([['sm', 'text-xs'], ['md', 'text-sm'], ['lg', 'text-base']] as const)('%s sets %s', (size, cls) => {
      const w = mnt({ size })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes()).toContain(cls)
    })
    it('lists the documented values and falls back', () => {
      expect([...DATA_GRID_SIZES]).toEqual(['sm', 'md', 'lg'])
      expect(mnt({ size: 'xl' }).classes()).toContain('text-sm')
    })
    it('keeps editor text at 16px below md for every size', async () => {
      for (const size of ['sm', 'md', 'lg']) {
        const w = mount(DataGrid as any, { props: { label: 'x', columns: [{ key: 'a', label: 'A', editable: true }], rows: [{ id: 1, a: 'v' }], size }, attachTo: document.body }) as W
        wrappers.push(w)
        await w.find('[data-row="1"][data-col="0"]').trigger('dblclick')
        expect(w.find('[data-slot=data-grid-editor]').classes()).toContain('text-base')
      }
    })
  })

  describe('density', () => {
    it.each([['compact', 28, 'px-2'], ['default', 36, 'px-3'], ['comfortable', 48, 'px-4']] as const)('%s uses %ipx rows and %s cells', (density, height, pad) => {
      const w = mnt({ density })
      expect(w.attributes('data-density')).toBe(density)
      expect(rowEls(w)[0].attributes('style')).toContain(`height: ${height}px`)
      expect(w.find('[data-row="1"][data-col="0"]').classes()).toContain(pad)
      expect(w.find('[data-slot=data-grid-header-row]').attributes('style')).toContain(`height: ${height}px`)
      expect(w.find('[data-slot=data-grid-body]').attributes('style')).toContain(`height: ${height * 3}px`)
    })
    it('lists the documented values and falls back', () => {
      expect([...DATA_GRID_DENSITIES]).toEqual(['compact', 'default', 'comfortable'])
      expect(mnt({ density: 'tight' }).attributes('data-density')).toBe('default')
    })
    it('raises rows to 44px on a coarse pointer', async () => {
      const original = window.matchMedia
      window.matchMedia = ((q: string) => ({ matches: q.includes('coarse'), media: q, addEventListener() {}, removeEventListener() {} })) as never
      const w = mnt({ density: 'compact' })
      await w.vm.$nextTick()
      expect(rowEls(w)[0].attributes('style')).toContain('height: 44px')
      window.matchMedia = original
    })
  })

  describe('combinations', () => {
    it.each(DATA_GRID_VARIANTS.flatMap((v) => DATA_GRID_DENSITIES.map((d) => [v, d] as const)))('variant %s with density %s renders every part', (variant, density) => {
      const w = mnt({ variant, density, selectable: true, size: 'lg' })
      expect(w.findAll('[role=columnheader]')).toHaveLength(3)
      expect(rowEls(w)).toHaveLength(3)
      expect(w.attributes('data-variant')).toBe(variant)
      expect(w.attributes('data-density')).toBe(density)
    })
    it('class wins over the variant classes', () => {
      expect(mnt({ class: 'rounded-none border-0' }).classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-0']))
      expect(mnt({ class: 'rounded-none' }).classes()).not.toContain('rounded-md')
    })
  })

  describe('dataGridVariants for plain elements', () => {
    it('returns the classes for a value and the default for none', () => {
      expect(dataGridVariants({ variant: 'borderless', size: 'sm' })).toContain('text-xs')
      expect(dataGridVariants({ variant: 'borderless' })).not.toContain('border-border')
      expect(dataGridVariants()).toContain('rounded-md')
    })
  })
})
