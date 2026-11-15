import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import PricingTable from './PricingTable.vue'
import { pricingTableVariants } from './variants'

const plans = [
  { name: 'Free', price: '$0', period: '/mo', description: 'Hobby' },
  { id: 'pro', name: 'Pro', price: '$29', period: '/mo', yearlyPrice: '$24', yearlyPeriod: '/mo, billed yearly', yearlyNote: 'Billed $290', highlighted: true, badge: 'Popular' },
  { name: 'Team', price: 'Custom' },
]
const rows = [
  { label: 'Projects', values: ['1', '10', 'Unlimited'] },
  { group: 'Security' },
  { label: 'SSO', values: [false, false, true] },
  { label: 'Audit log', values: [false, true, true] },
]

describe('PricingTable', () => {
  describe('good path', () => {
    it('renders a comparison table with plan headers', () => {
      const w = mount(PricingTable, { props: { plans, rows } })
      expect(w.attributes('data-slot')).toBe('pricing-table')
      expect(w.find('[data-slot="comparison-table"]').exists()).toBe(true)
      expect(w.find('table').exists()).toBe(true)
      const heads = w.findAll('thead th[scope="col"]')
      expect(heads).toHaveLength(4)
      expect(w.findAll('[data-slot="pricing-table-name"]').map((n) => n.text())).toEqual(['Free', 'Pro', 'Team'])
      expect(w.findAll('[data-slot="pricing-table-amount"]').map((n) => n.text())).toEqual(['$0', '$29', 'Custom'])
      expect(w.findAll('[data-slot="pricing-table-period"]').map((n) => n.text())).toEqual(['/mo', '/mo'])
      expect(w.find('[data-slot="pricing-table-description"]').text()).toBe('Hobby')
      expect(w.find('[data-slot="pricing-table-badge"]').text()).toBe('Popular')
      expect(w.find('thead th[data-highlighted]').text()).toContain('Pro')
      expect(w.find('caption').text()).toBe('Plan comparison')
    })
    it('renders feature rows, groups and check/cross cells', () => {
      const w = mount(PricingTable, { props: { plans, rows } })
      expect(w.findAll('tbody th[scope="row"]').map((h) => h.text())).toEqual(['Projects', 'SSO', 'Audit log'])
      expect(w.find('tbody th[scope="rowgroup"]').text()).toBe('Security')
      const kinds = w.findAll('[data-slot="comparison-table-value"]').map((c) => c.attributes('data-kind'))
      expect(kinds).toEqual(['text', 'text', 'text', 'no', 'no', 'yes', 'no', 'yes', 'yes'])
    })
    it('cta slot renders under each price with plan, index and billing', () => {
      const w = mount(PricingTable, {
        props: { plans, rows },
        slots: { cta: '<template #cta="{ plan, index, billing }"><button>{{ index }}:{{ plan.name }}:{{ billing }}</button></template>' },
      })
      expect(w.findAll('[data-slot="pricing-table-cta"] button').map((b) => b.text())).toEqual(['0:Free:monthly', '1:Pro:monthly', '2:Team:monthly'])
      expect(w.find('tfoot').exists()).toBe(false)
    })
    it('repeatCta also fills a footer row', () => {
      const w = mount(PricingTable, { props: { plans, rows, repeatCta: true }, slots: { cta: '<template #cta="{ plan }"><button>{{ plan.name }}</button></template>' } })
      expect(w.findAll('tfoot button').map((b) => b.text())).toEqual(['Free', 'Pro', 'Team'])
      const noSlot = mount(PricingTable, { props: { plans, rows, repeatCta: true } })
      expect(noSlot.find('tfoot').exists()).toBe(false)
    })
    it('forwards corner, cell and row-label slots', () => {
      const w = mount(PricingTable, {
        props: { plans: plans.slice(0, 1), rows: rows.slice(0, 1) },
        slots: {
          corner: '<i class="corner">Compare</i>',
          cell: '<template #cell="{ value }"><u class="c">{{ value }}</u></template>',
          'row-label': '<template #row-label="{ row }"><s class="l">{{ row.label }}</s></template>',
        },
      })
      expect(w.find('.corner').text()).toBe('Compare')
      expect(w.find('.c').text()).toBe('1')
      expect(w.find('.l').text()).toBe('Projects')
    })
    it('tableClass lands on the scroll region, class on the root', () => {
      const w = mount(PricingTable, { props: { plans, rows, class: 'root-x', tableClass: 'max-h-96 rounded-none' } })
      expect(w.classes()).toContain('root-x')
      const region = w.find('[data-slot="comparison-table"]')
      expect(region.classes()).toEqual(expect.arrayContaining(['max-h-96', 'rounded-none']))
      expect(region.classes()).not.toContain('rounded-xl')
      expect(region.classes()).not.toContain('root-x')
    })
    it('passes table options through', () => {
      const w = mount(PricingTable, {
        props: { plans, rows, variant: 'striped', size: 'lg', stickyHeader: true, stickyFirstColumn: true, caption: 'Vergleich', cornerLabel: 'Funktionen', includedLabel: 'Ja', excludedLabel: 'Nein' },
      })
      const t = w.find('[data-slot="comparison-table"]')
      expect(t.attributes('data-variant')).toBe('striped')
      expect(t.attributes('data-size')).toBe('lg')
      expect(t.attributes('data-sticky-header')).toBeDefined()
      expect(w.find('caption').text()).toBe('Vergleich')
      expect(w.find('thead th').text()).toBe('Funktionen')
      expect(w.find('tbody th').classes()).toContain('sticky')
      expect(w.findAll('.sr-only').map((s) => s.text())).toEqual(expect.arrayContaining(['Ja', 'Nein']))
    })
  })
  describe('billing', () => {
    const radios = (w: ReturnType<typeof mount>) => w.findAll('[role="radio"]')
    const amounts = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="pricing-table-amount"]').map((a) => a.text())
    it('shows a toggle when a plan has a yearly price; hides it otherwise', () => {
      expect(mount(PricingTable, { props: { plans, rows } }).find('[role="radiogroup"]').exists()).toBe(true)
      expect(mount(PricingTable, { props: { plans: [plans[0]], rows } }).find('[role="radiogroup"]').exists()).toBe(false)
      expect(mount(PricingTable, { props: { plans, rows, showToggle: false } }).find('[role="radiogroup"]').exists()).toBe(false)
      expect(mount(PricingTable, { props: { plans: [plans[0]], rows, showToggle: true } }).find('[role="radiogroup"]').exists()).toBe(true)
    })
    it('uncontrolled switching updates prices, period, note and emits', async () => {
      const w = mount(PricingTable, { props: { plans, rows, yearlyDiscountLabel: 'Save 17%' } })
      expect(w.find('[data-slot="pricing-billing-discount"]').text()).toBe('Save 17%')
      expect(w.find('[data-slot="pricing-table-note"]').exists()).toBe(false)
      await radios(w)[1].trigger('click')
      expect(amounts(w)).toEqual(['$0', '$24', 'Custom'])
      expect(w.findAll('[data-slot="pricing-table-period"]')[1].text()).toBe('/mo, billed yearly')
      expect(w.find('[data-slot="pricing-table-note"]').text()).toBe('Billed $290')
      expect(w.attributes('data-billing')).toBe('yearly')
      expect(w.emitted('update:billing')).toEqual([['yearly']])
      expect(radios(w).map((r) => r.attributes('aria-checked'))).toEqual(['false', 'true'])
    })
    it('controlled mode only follows the prop', async () => {
      const w = mount(PricingTable, { props: { plans, rows, billing: 'monthly' } })
      await radios(w)[1].trigger('click')
      expect(amounts(w)[1]).toBe('$29')
      await w.setProps({ billing: 'yearly' })
      expect(amounts(w)[1]).toBe('$24')
    })
    it('defaultBilling seeds and v-model:billing works', async () => {
      expect(amounts(mount(PricingTable, { props: { plans, rows, defaultBilling: 'yearly' } }))[1]).toBe('$24')
      const Host = defineComponent({
        components: { PricingTable },
        setup: () => ({ plans, rows, b: ref<'monthly' | 'yearly'>('monthly') }),
        template: '<PricingTable :plans="plans" :rows="rows" v-model:billing="b" /><output>{{ b }}</output>',
      })
      const w = mount(Host)
      await w.findAll('[role="radio"]')[1].trigger('click')
      expect(w.find('output').text()).toBe('yearly')
    })
    it('rapid toggles and keyboard are safe', async () => {
      const w = mount(PricingTable, { props: { plans, rows }, attachTo: document.body })
      for (let i = 0; i < 40; i++) await radios(w)[i % 2 === 0 ? 1 : 0].trigger('click')
      expect(amounts(w)[1]).toBe('$29')
      await w.find('[role="radiogroup"]').trigger('keydown', { key: 'ArrowRight' })
      expect(amounts(w)[1]).toBe('$24')
      w.unmount()
    })
    it('cta slot sees the active billing', async () => {
      const w = mount(PricingTable, { props: { plans, rows, defaultBilling: 'yearly' }, slots: { cta: '<template #cta="{ billing }"><i class="b">{{ billing }}</i></template>' } })
      expect(w.findAll('i.b').map((b) => b.text())).toEqual(['yearly', 'yearly', 'yearly'])
    })
  })
  describe('customisation', () => {
    it('merges class and passes attrs to the root', () => {
      const w = mount(PricingTable, { props: { class: 'gap-2 custom' }, attrs: { id: 't', 'data-x': '1' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('id')).toBe('t')
      expect(w.attributes('data-x')).toBe('1')
      expect(pricingTableVariants({ class: 'x' })).toContain('x')
    })
  })
  describe('bad path', () => {
    it('empty plans and rows render an empty table', () => {
      const w = mount(PricingTable)
      expect(w.find('table').exists()).toBe(true)
      expect(w.findAll('thead th')).toHaveLength(1)
      expect(w.find('[role="radiogroup"]').exists()).toBe(false)
    })
    it('malformed plans are skipped; plan without name/price still renders', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(PricingTable, { props: { plans: [null, 'x', {}, { name: 'N', price: '' }], rows: [{ label: 'a', values: [true, true] }] } })
      expect(w.findAll('thead th[scope="col"]')).toHaveLength(3)
      expect(w.find('[data-slot="pricing-table-price"]').exists()).toBe(false)
      expect(w.find('[data-slot="pricing-table-period"]').exists()).toBe(false)
    })
    it('unknown billing, variant and size fall back', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(PricingTable, { props: { plans, rows, billing: 'weekly', variant: 'neon', size: 'xxl' } })
      expect(w.findAll('[data-slot="pricing-table-amount"]')[1].text()).toBe('$29')
      expect(w.find('[data-slot="comparison-table"]').attributes('data-variant')).toBe('default')
      expect(w.find('[data-slot="comparison-table"]').attributes('data-size')).toBe('md')
    })
    it('rows with fewer values than plans show dashes', () => {
      const w = mount(PricingTable, { props: { plans, rows: [{ label: 'x', values: [true] }] } })
      expect(w.findAll('[data-slot="comparison-table-value"]').map((c) => c.attributes('data-kind'))).toEqual(['yes', 'none', 'none'])
    })
    it('yearlyNote is ignored for plans without a yearly price', () => {
      const w = mount(PricingTable, { props: { plans: [{ name: 'A', price: '$1', yearlyNote: 'x' }], rows, defaultBilling: 'yearly', showToggle: true } })
      expect(w.find('[data-slot="pricing-table-note"]').exists()).toBe(false)
    })
  })
  describe('edge cases', () => {
    it('1 plan and 100 plans x 50 rows', () => {
      expect(mount(PricingTable, { props: { plans: [plans[0]], rows } }).findAll('thead th')).toHaveLength(2)
      const many = Array.from({ length: 100 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, price: `$${i}` }))
      const rs = Array.from({ length: 50 }, (_, i) => ({ label: `R${i}`, values: many.map((_, j) => (i + j) % 2 === 0) }))
      const w = mount(PricingTable, { props: { plans: many, rows: rs } })
      expect(w.findAll('tbody td')).toHaveLength(5000)
    })
    it('long and unicode plan content', () => {
      const w = mount(PricingTable, { props: { plans: [{ name: '名'.repeat(300), price: '€1.000,00', description: '🎉 مرحبا', badge: 'B'.repeat(200) }], rows } })
      expect(w.find('[data-slot="pricing-table-name"]').text()).toHaveLength(300)
      expect(w.text()).toContain('🎉')
    })
    it('plan changes are reflected and unmount is safe', async () => {
      const w = mount(PricingTable, { props: { plans, rows } })
      await w.setProps({ plans: plans.slice(0, 1) })
      expect(w.findAll('[data-slot="pricing-table-name"]')).toHaveLength(1)
      expect(w.find('[role="radiogroup"]').exists()).toBe(false)
      expect(() => w.unmount()).not.toThrow()
    })
  })
})
