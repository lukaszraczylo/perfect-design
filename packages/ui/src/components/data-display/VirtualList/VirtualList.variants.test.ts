import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { VIRTUAL_LIST_VARIANTS, VirtualList, virtualListRowVariants, virtualListVariants } from './index'

const items = Array.from({ length: 40 }, (_, i) => ({ id: i, name: `Row ${i}` }))
const mk = (props: Record<string, unknown> = {}) =>
  mount(VirtualList as never, {
    props: { items, itemHeight: 20, height: 100, label: 'Rows', ...props } as never,
    slots: { default: ({ item }: { item: { name: string } }) => h('span', item.name) },
  }) as ReturnType<typeof mount>
const rows = (w: ReturnType<typeof mk>) => w.findAll('[data-slot="virtual-list-item"]')

describe('VirtualList variant dimension', () => {
  it('lists the values', () => expect([...VIRTUAL_LIST_VARIANTS]).toEqual(['plain', 'bordered', 'divided', 'striped']))

  it('plain keeps the original class strings and no data-variant', () => {
    const w = mk()
    expect(w.attributes('class')).toBe('relative overflow-auto focus-visible:ring-inset outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40')
    expect(w.attributes('data-variant')).toBeUndefined()
    expect(rows(w)[0].attributes('class')).toBe('absolute inset-x-0 overflow-hidden')
    expect(virtualListVariants()).toBe('relative overflow-auto')
  })

  it('bordered frames the viewport', () => {
    const w = mk({ variant: 'bordered' })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-md', 'border']))
    expect(w.attributes('data-variant')).toBe('bordered')
  })

  it('divided puts a rule under every row', () => {
    for (const r of rows(mk({ variant: 'divided' }))) expect(r.classes()).toContain('border-b')
  })

  it('striped tints odd indexes only and keeps the stripe tied to the index', () => {
    const r = rows(mk({ variant: 'striped' }))
    expect(r[0].classes()).not.toContain('bg-muted/30')
    expect(r[1].classes()).toContain('bg-muted/30')
    expect(r[2].classes()).not.toContain('bg-muted/30')
  })

  it('unknown variant falls back to plain', () => {
    expect(mk({ variant: 'neon' }).html()).toBe(mk().html())
  })

  it('class wins over the variant and combines with it', () => {
    const w = mk({ variant: 'bordered', class: 'rounded-none border-0' })
    expect(w.classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-0']))
    expect(w.classes()).not.toContain('rounded-md')
  })

  it.each(VIRTUAL_LIST_VARIANTS)('%s keeps list semantics, name, focusability and row positions', (variant) => {
    const w = mk({ variant })
    expect(w.attributes('role')).toBe('list')
    expect(w.attributes('aria-label')).toBe('Rows')
    expect(w.attributes('tabindex')).toBe('0')
    expect(rows(w)[3].attributes('aria-posinset')).toBe('4')
    expect(rows(w)[3].attributes('role')).toBe('listitem')
  })

  it('the empty state renders in every variant', () => {
    for (const variant of VIRTUAL_LIST_VARIANTS) {
      const w = mk({ variant, items: [] })
      expect(w.attributes('role')).toBe('group')
      expect(w.find('[data-slot="virtual-list-empty"]').text()).toBe('No items')
    }
  })

  it('exports row helpers', () => {
    expect(virtualListRowVariants({ variant: 'striped', odd: true })).toContain('bg-muted/30')
    expect(virtualListRowVariants({ variant: 'striped', odd: false })).not.toContain('bg-muted/30')
  })
})
