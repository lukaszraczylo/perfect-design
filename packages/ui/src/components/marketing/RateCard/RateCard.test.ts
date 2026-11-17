import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { RateCard, rateCardVariants, type RateCardItem } from './index'
import { buildSections } from './sections'
import * as barrel from '../index'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'

const ITEMS: RateCardItem[] = [
  { name: 'Sample requests', unit: 'per 1,000 requests', rate: 0.4, included: 'First 10,000 free' },
  { name: 'Sample storage', description: 'Sample unit', unit: 'per GB-month', rate: 0.02, overage: 'Billed at the rate shown', badge: 'Sample' },
  { name: 'Sample support', unit: 'per month', rate: 'Custom' },
]
const mountCard = (props: Record<string, unknown> = {}) => mount(RateCard, { props: { items: ITEMS, caption: 'Sample rates', ...props } as never })

describe('RateCard good path (table)', () => {
  it('renders a named table in a focusable scroll region', () => {
    const w = mountCard()
    expect(w.attributes('data-slot')).toBe('rate-card')
    const region = w.find('[data-slot=rate-card-scroll]')
    expect(region.attributes('role')).toBe('region')
    expect(region.attributes('tabindex')).toBe('0')
    expect(region.attributes('aria-label')).toBe('Sample rates')
    expect(region.classes()).toContain('overflow-x-auto')
    expect(w.find('caption').text()).toBe('Sample rates')
    expect(w.findAll('[data-slot=rate-card-row]')).toHaveLength(3)
    expect(w.findAll('th[scope=row]')).toHaveLength(3)
  })
  it('exports from the marketing barrel', () => expect(barrel.RateCard).toBe(RateCard))
  it('formats numeric rates with Price and shows text rates as written', () => {
    expect(w().findAll('[data-slot=rate-card-rate]').map((c) => c.text())).toEqual(['$0.40', '$0.02', 'Custom'])
    function w() {
      return mountCard()
    }
  })
  it('shows included and overage columns only when used', () => {
    const w = mountCard()
    expect(w.findAll('th[scope=col]').map((t) => t.text())).toEqual(['Item', 'Unit', 'Rate', 'Included', 'Beyond included'])
    const plain = mountCard({ items: [{ name: 'A', unit: 'per x', rate: 1 }] })
    expect(plain.findAll('th[scope=col]').map((t) => t.text())).toEqual(['Item', 'Unit', 'Rate'])
  })
  it('renders badge and description', () => {
    const w = mountCard()
    expect(w.find('[data-slot=rate-card-badge]').text()).toBe('Sample')
    expect(w.find('[data-slot=rate-card-description]').text()).toBe('Sample unit')
  })
  it('keeps tiny rates exact', () => {
    expect(mountCard({ items: [{ name: 'A', unit: 'u', rate: 0.0004 }] }).find('[data-slot=rate-card-rate]').text()).toBe('$0.0004')
  })
})

describe('RateCard groups', () => {
  const items: RateCardItem[] = [
    { name: 'Loose', unit: 'u', rate: 1 },
    { name: 'D1', unit: 'u', rate: 2, group: 'Data' },
    { name: 'C1', unit: 'u', rate: 3, group: 'Compute' },
    { name: 'O1', unit: 'u', rate: 4, group: 'Other' },
  ]
  it('orders ungrouped, then groups, then unlisted groups', () => {
    const w = mountCard({ items, groups: [{ group: 'Compute', description: 'Sample' }, { group: 'Data' }, { group: 'Empty' }] })
    expect(w.findAll('[data-slot=rate-card-group]').map((g) => g.text())).toEqual(['ComputeSample', 'Data', 'Other'])
    expect(w.findAll('[data-slot=rate-card-name]').map((n) => n.text())).toEqual(['Loose', 'C1', 'D1', 'O1'])
    expect(w.find('th[scope=rowgroup]').attributes('colspan')).toBe('3')
  })
  it('derives groups from items without a groups prop', () => {
    expect(mountCard({ items }).findAll('[data-slot=rate-card-group]').map((g) => g.text())).toEqual(['Data', 'Compute', 'Other'])
  })
  it('buildSections ignores bad input', () => {
    expect(buildSections(undefined, undefined)).toEqual([])
    expect(buildSections([{ name: '', unit: 'u', rate: 1 }, null, { name: 'ok', unit: 'u', rate: Number.NaN as never }] as never, [null, { group: ' ' }] as never).map((s) => s.items.length)).toEqual([1])
  })
  it('uses item ids as keys and handles duplicate names', () => {
    const s = buildSections([{ id: 'a', name: 'Same', unit: 'u', rate: 1 }, { name: 'Same', unit: 'u', rate: 2 }], undefined)
    expect(s[0].items.map((i) => i.key)).toEqual(['a', 'Same-1'])
  })
})

describe('RateCard list variant', () => {
  it('stacks rows as definition lists', () => {
    const w = mountCard({ variant: 'list' })
    expect(w.find('table').exists()).toBe(false)
    expect(w.find('[data-slot=rate-card-list]').attributes('aria-label')).toBe('Sample rates')
    expect(w.find('[data-slot=rate-card-list]').attributes('role')).toBe('group')
    expect(w.findAll('dl dt')).toHaveLength(3)
    expect(w.find('[data-slot=rate-card-rate]').text()).toContain('$0.40')
    expect(w.find('[data-slot=rate-card-rate]').text()).toContain('per 1,000 requests')
    expect(w.find('[data-slot=rate-card-included]').text()).toContain('Included: First 10,000 free')
    expect(w.find('[data-slot=rate-card-overage]').text()).toContain('Beyond included: Billed at the rate shown')
    expect(w.find('[data-slot=rate-card-badge]').exists()).toBe(true)
    expect(w.find('[data-slot=rate-card-scroll]').exists()).toBe(false)
  })
  it('names each group list by its heading', () => {
    const w = mountCard({ variant: 'list', items: [{ name: 'A', unit: 'u', rate: 1, group: 'Data', }], groups: [{ group: 'Data', description: 'Sample' }] })
    const section = w.find('[data-slot=rate-card-section]')
    const id = section.attributes('aria-labelledby')!
    expect(w.find(`#${CSS.escape(id)}`).text()).toContain('Data')
    expect(section.attributes('role')).toBe('group')
  })
  it('ungrouped section has no group role', () => {
    expect(mountCard({ variant: 'list' }).find('[data-slot=rate-card-section]').attributes('role')).toBeUndefined()
  })
})

describe('RateCard customisation', () => {
  it('merges class last, passes attributes', () => {
    const w = mountCard({ class: 'gap-10', id: 'rates', 'data-testid': 'r' })
    expect(w.classes()).toContain('gap-10')
    expect(w.classes()).not.toContain('gap-3')
    expect(w.attributes('id')).toBe('rates')
    expect(w.attributes('data-testid')).toBe('r')
  })
  it.each(['sm', 'md', 'lg'])('size %s', (size) => expect(mountCard({ size }).attributes('data-size')).toBe(size))
  it('variant and size change the output', () => {
    expect(mountCard({ variant: 'list' }).html()).not.toBe(mountCard().html())
    expect(mountCard({ size: 'lg' }).html()).not.toBe(mountCard({ size: 'sm' }).html())
    expect(rateCardVariants({ size: 'lg' })).toContain('text-base')
  })
  it('aria-label and aria-labelledby can name the list', () => {
    const a = mountCard({ caption: undefined, 'aria-label': 'By attribute' })
    expect(a.find('[data-slot=rate-card-scroll]').attributes('aria-label')).toBe('By attribute')
    const b = mountCard({ caption: undefined, 'aria-labelledby': 'h' })
    expect(b.find('[data-slot=rate-card-scroll]').attributes('aria-labelledby')).toBe('h')
    expect(b.find('[data-slot=rate-card-scroll]').attributes('aria-label')).toBeUndefined()
  })
  it('uses the ConfigProvider locale and labels', () => {
    const w = mount({
      components: { ConfigProvider, RateCard },
      template: `<ConfigProvider locale="de-DE" :labels="{ 'RateCard.item': 'Posten' }"><RateCard caption="x" currency="EUR" :items="items" /></ConfigProvider>`,
      data: () => ({ items: ITEMS }),
    })
    expect(w.find('[data-slot=rate-card-rate]').text()).toBe('0,40 €')
    expect(w.find('th[scope=col]').text()).toBe('Posten')
  })
})

describe('RateCard bad path', () => {
  it('empty or missing items render a message', () => {
    for (const items of [[], undefined, null]) {
      const w = mountCard({ items })
      expect(w.find('[data-slot=rate-card-empty]').text()).toBe('No rates listed.')
      expect(w.find('table').exists()).toBe(false)
    }
  })
  it('skips items without a name or a rate', () => {
    const w = mountCard({ items: [{ name: '', unit: 'u', rate: 1 }, { name: 'No rate', unit: 'u' }, { name: 'Good', unit: 'u', rate: 1 }] })
    expect(w.findAll('[data-slot=rate-card-row]')).toHaveLength(1)
  })
  it('unknown variant and size fall back', () => {
    const w = mountCard({ variant: 'grid', size: 'huge' })
    expect(w.attributes('data-variant')).toBe('table')
    expect(w.attributes('data-size')).toBe('md')
  })
  it('invalid currency and NaN rate do not throw', () => {
    expect(mountCard({ currency: 'nope' }).find('[data-slot=rate-card-rate]').text()).toBe('0.40')
    expect(mountCard({ items: [{ name: 'X', unit: 'u', rate: Number.NaN }] }).find('[data-slot=rate-card-rate]').text()).toBe('—')
  })
  it('falls back to a default name when none is given', () => {
    expect(mountCard({ caption: ' ' }).find('[data-slot=rate-card-scroll]').attributes('aria-label')).toBe('Rates')
  })
})

describe('RateCard edge cases', () => {
  it('huge rates and long text', () => {
    const w = mountCard({ items: [{ name: 'N'.repeat(300), unit: 'per ' + 'x'.repeat(200), rate: 1e15, included: 'ünïcödé 日本語 العربية' }] })
    expect(w.find('[data-slot=rate-card-rate]').text()).toBe('$1,000,000,000,000,000.00')
    expect(w.find('[data-slot=rate-card-included]').text()).toContain('日本語')
  })
  it('right-to-left container renders with logical alignment', () => {
    const w = mount({ components: { RateCard }, template: '<div dir="rtl"><RateCard caption="x" :items="items" /></div>', data: () => ({ items: ITEMS }) })
    expect(w.find('th[scope=col]').classes()).toContain('text-start')
    expect(w.findAll('th[scope=col]')[2].classes()).toContain('text-end')
  })
  it('one item and many items', () => {
    expect(mountCard({ items: [ITEMS[0]] }).findAll('[data-slot=rate-card-row]')).toHaveLength(1)
    const many = Array.from({ length: 200 }, (_, i) => ({ name: `Sample ${i}`, unit: 'u', rate: i }))
    expect(mountCard({ items: many }).findAll('[data-slot=rate-card-row]')).toHaveLength(200)
  })
  it('updates when items change', async () => {
    const w = mountCard({ items: [ITEMS[0]] })
    await w.setProps({ items: ITEMS })
    expect(w.findAll('[data-slot=rate-card-row]')).toHaveLength(3)
  })
})
