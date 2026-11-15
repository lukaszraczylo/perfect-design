import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatGroup from './StatGroup.vue'
import { statGroupVariants } from './index'

describe('StatGroup', () => {
  it('renders a grouped grid with slot content', () => {
    const w = mount(StatGroup, { slots: { default: '<div>a</div><div>b</div>' } })
    expect(w.attributes('data-slot')).toBe('stat-group')
    expect(w.attributes('role')).toBe('group')
    expect(w.classes()).toContain('grid')
    expect(w.element.children).toHaveLength(2)
  })
  it('defaults to auto-fit columns', () => {
    expect(mount(StatGroup).classes().join(' ')).toContain('auto-fit')
  })
  it.each([1, 2, 3, 4, 5, 6] as const)('supports %s columns', (columns) => {
    const w = mount(StatGroup, { props: { columns } })
    expect(w.classes().join(' ')).not.toContain('auto-fit')
    expect(w.classes().join(' ')).toContain('grid-cols-')
  })
  it('invalid columns fall back to auto', () => {
    expect(mount(StatGroup, { props: { columns: 9 as never } }).classes().join(' ')).toContain('auto-fit')
  })
  it('merges class and passes aria attributes', () => {
    const w = mount(StatGroup, { props: { class: 'gap-8 custom' }, attrs: { 'aria-label': 'Key metrics' } })
    expect(w.classes()).toContain('gap-8')
    expect(w.classes()).not.toContain('gap-4')
    expect(w.classes()).toContain('custom')
    expect(w.attributes('aria-label')).toBe('Key metrics')
  })
  it('renders empty', () => {
    expect(mount(StatGroup).text()).toBe('')
  })

  describe('layouts', () => {
    it('default grid output is unchanged', () => {
      const w = mount(StatGroup)
      expect(w.classes().join(' ')).toBe('grid gap-4 grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]')
      expect(w.attributes('data-layout')).toBeUndefined()
      expect(statGroupVariants()).toBe('grid gap-4')
    })
    it('explicit grid equals default', () => {
      expect(mount(StatGroup, { props: { layout: 'grid', columns: 3 } }).classes().join(' ')).toBe(mount(StatGroup, { props: { columns: 3 } }).classes().join(' '))
    })
    it('inline is a wrapping flex row and ignores columns', () => {
      const w = mount(StatGroup, { props: { layout: 'inline', columns: 4 }, slots: { default: '<div>a</div><div>b</div>' } })
      expect(w.attributes('data-layout')).toBe('inline')
      expect(w.classes()).toContain('flex')
      expect(w.classes()).toContain('flex-wrap')
      expect(w.classes()).not.toContain('grid')
      expect(w.classes().join(' ')).not.toContain('grid-cols')
      expect(w.classes()).toContain('[&>*]:flex-1')
      expect(w.element.children).toHaveLength(2)
    })
    it('divided is one bordered surface with hairline gaps and honours columns', () => {
      const w = mount(StatGroup, { props: { layout: 'divided', columns: 3 } })
      expect(w.attributes('data-layout')).toBe('divided')
      for (const c of ['grid', 'gap-px', 'border', 'rounded-xl', 'bg-border', 'overflow-hidden', '[&>*]:bg-card', '[&>*]:border-0']) expect(w.classes(), c).toContain(c)
      expect(w.classes()).not.toContain('gap-4')
      expect(w.classes()).toContain('lg:grid-cols-3')
    })
    it('divided with KpiTile-like children keeps role and aria-label', () => {
      const w = mount(StatGroup, { props: { layout: 'divided' }, attrs: { 'aria-label': 'Totals' } })
      expect(w.attributes('role')).toBe('group')
      expect(w.attributes('aria-label')).toBe('Totals')
    })
    it('class overrides layout utilities', () => {
      const w = mount(StatGroup, { props: { layout: 'divided', class: 'gap-2 rounded-none' } })
      expect(w.classes()).toContain('gap-2')
      expect(w.classes()).not.toContain('gap-px')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-xl')
    })
    it('unknown layout falls back to grid', () => {
      const w = mount(StatGroup, { props: { layout: 'masonry' as never } })
      expect(w.classes()).toContain('grid')
      expect(w.attributes('data-layout')).toBeUndefined()
    })
    it('empty slots render for every layout', () => {
      for (const layout of ['grid', 'inline', 'divided'] as const) expect(mount(StatGroup, { props: { layout } }).text()).toBe('')
    })
  })
})
