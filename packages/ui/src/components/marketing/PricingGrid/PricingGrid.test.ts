import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import PricingGrid from './PricingGrid.vue'
import { useBillingState } from './billing'
import { pricingGridVariants } from './variants'

const plans = [
  { name: 'Free', price: '$0', features: ['a'] },
  { name: 'Pro', price: '$29', highlighted: true, badge: 'Popular' },
  { name: 'Team', price: 'Custom' },
]

describe('PricingGrid', () => {
  describe('good path', () => {
    it('renders a card per plan inside a native list (ul > li > article)', () => {
      const w = mount(PricingGrid, { props: { plans } })
      expect(w.attributes('data-slot')).toBe('pricing-grid')
      expect(w.element.tagName).toBe('UL')
      expect(w.attributes('role')).toBe('list')
      expect(w.findAll('[data-slot="pricing-card"]')).toHaveLength(3)
      // regression: role=listitem on <article> is rejected by axe (aria-allowed-role); the wrapper is an <li>
      expect(w.find('[role="listitem"]').exists()).toBe(false)
      expect(w.findAll(':scope > li[data-slot="pricing-grid-item"] > article[data-slot="pricing-card"]')).toHaveLength(3)
      expect(w.findAll('[data-highlighted]')).toHaveLength(1)
    })
    it('scoped cta slot gets plan and index', () => {
      const w = mount(PricingGrid, {
        props: { plans },
        slots: { cta: '<template #cta="{ plan, index }"><button>{{ index }}-{{ plan.name }}</button></template>' },
      })
      expect(w.findAll('button').map((b) => b.text())).toEqual(['0-Free', '1-Pro', '2-Team'])
    })
    it('no cta region without a cta slot', () => {
      expect(mount(PricingGrid, { props: { plans } }).find('[data-slot="pricing-card-cta"]').exists()).toBe(false)
    })
    it.each([
      [1, 'max-w-md'],
      [2, 'sm:grid-cols-2'],
      [3, 'lg:grid-cols-3'],
      [4, 'xl:grid-cols-4'],
    ] as const)('columns %s', (columns, cls) => {
      expect(mount(PricingGrid, { props: { columns } }).classes()).toContain(cls)
    })
    it('slot mode is a plain container (no list role without li children)', () => {
      const w = mount(PricingGrid, { slots: { default: '<article id="a"/>' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.attributes('role')).toBeUndefined()
      const toggled = mount(PricingGrid, { props: { plans: [{ name: 'A', price: '$1', yearlyPrice: '$2' }] }, slots: { default: '<article id="a"/>' } })
      expect(toggled.find('[data-slot="pricing-grid-items"]').element.tagName).toBe('DIV')
      expect(toggled.find('[data-slot="pricing-grid-items"]').attributes('role')).toBeUndefined()
    })
    it('default slot renders custom cards', () => {
      const w = mount(PricingGrid, { props: { plans }, slots: { default: '<div id="c"/>' } })
      expect(w.find('#c').exists()).toBe(true)
      expect(w.findAll('[data-slot="pricing-card"]')).toHaveLength(0)
    })
  })
  describe('customisation', () => {
    it('merges class and attrs', () => {
      const w = mount(PricingGrid, { props: { class: 'gap-2 custom' }, attrs: { id: 'p' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-6')
      expect(w.attributes('id')).toBe('p')
    })
  })
  describe('bad path', () => {
    it('empty plans renders an empty grid', () => {
      expect(mount(PricingGrid, { props: { plans: [] } }).element.children).toHaveLength(0)
    })
    it('invalid columns fall back to 3', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(PricingGrid, { props: { columns: 6 } }).attributes('data-columns')).toBe('3')
    })
  })
  describe('edge cases', () => {
    it('single plan and 100 plans', () => {
      expect(mount(PricingGrid, { props: { plans: [plans[0]] } }).findAll('article')).toHaveLength(1)
      const many = Array.from({ length: 100 }, (_, i) => ({ name: `P${i}` }))
      expect(mount(PricingGrid, { props: { plans: many } }).findAll('article')).toHaveLength(100)
    })
    it('duplicate plan names do not break keys', () => {
      expect(mount(PricingGrid, { props: { plans: [{ name: 'A' }, { name: 'A' }] } }).findAll('article')).toHaveLength(2)
    })
  })

  describe('billing toggle', () => {
    const yearlyPlans = [
      { name: 'Free', price: 'Free' },
      { name: 'Pro', price: '$29', period: '/mo', yearlyPrice: '$24', yearlyPeriod: '/mo, billed yearly', highlighted: true },
      { name: 'Team', price: '$99', yearlyPrice: '$79' },
    ]
    const amounts = (w: ReturnType<typeof mount>) => w.findAll('[data-slot="pricing-card-amount"]').map((a) => a.text())
    const radios = (w: ReturnType<typeof mount>) => w.findAll('[role="radio"]')

    it('is hidden when no plan has a yearly price', () => {
      const w = mount(PricingGrid, { props: { plans } })
      expect(w.find('[data-slot="pricing-billing-toggle"]').exists()).toBe(false)
      expect(w.attributes('role')).toBe('list')
    })
    it('appears automatically with yearly prices, wrapping an items list', () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans } })
      expect(w.attributes('data-slot')).toBe('pricing-grid')
      expect(w.attributes('role')).toBeUndefined()
      const group = w.find('[role="radiogroup"]')
      expect(group.attributes('aria-label')).toBe('Billing period')
      expect(radios(w).map((r) => r.text())).toEqual(['Monthly', 'Yearly'])
      expect(radios(w).map((r) => r.attributes('aria-checked'))).toEqual(['true', 'false'])
      expect(radios(w).map((r) => r.attributes('tabindex'))).toEqual(['0', '-1'])
      const list = w.find('[data-slot="pricing-grid-items"]')
      expect(list.element.tagName).toBe('UL')
      expect(list.attributes('role')).toBe('list')
      expect(list.findAll(':scope > li')).toHaveLength(3)
      expect(list.find('[role="listitem"]').exists()).toBe(false)
      expect(list.classes()).toContain('lg:grid-cols-3')
      expect(amounts(w)).toEqual(['Free', '$29', '$99'])
    })
    it('discount badge uses the tested success/success-foreground pair (4.5:1) instead of 12px text-success on a tint', () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans, yearlyDiscountLabel: 'Save 20%' } })
      const badge = w.find('[data-slot="pricing-billing-discount"]')
      expect(badge.classes()).toEqual(expect.arrayContaining(['bg-success', 'text-success-foreground']))
      expect(badge.classes().join(' ')).not.toMatch(/bg-success\/|(^| )text-success( |$)/)
    })
    it('toggle options keep a border (checked one outlined in forced colors) and cast no shadow', () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans } })
      for (const r of radios(w)) {
        expect(r.classes()).toContain('border')
        expect(r.classes()).toContain('forced-colors:data-[state=checked]:outline-2')
        expect(r.classes().join(' ')).not.toContain('shadow')
      }
      expect(radios(w)[0].classes()).toContain('border-border')
      expect(radios(w)[1].classes()).toContain('border-transparent')
    })
    it('uncontrolled: clicking yearly switches prices, emits and updates aria', async () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans } })
      await radios(w)[1].trigger('click')
      expect(amounts(w)).toEqual(['Free', '$24', '$79'])
      expect(w.emitted('update:billing')).toEqual([['yearly']])
      expect(radios(w).map((r) => r.attributes('aria-checked'))).toEqual(['false', 'true'])
      expect(w.attributes('data-billing')).toBe('yearly')
      expect(w.find('[data-slot="pricing-card-period"]').text()).toBe('/mo, billed yearly')
      await radios(w)[0].trigger('click')
      expect(amounts(w)).toEqual(['Free', '$29', '$99'])
      expect(w.emitted('update:billing')).toEqual([['yearly'], ['monthly']])
    })
    it('defaultBilling seeds uncontrolled state', () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans, defaultBilling: 'yearly' } })
      expect(amounts(w)[1]).toBe('$24')
      expect(radios(w)[1].attributes('aria-checked')).toBe('true')
    })
    it('controlled: only the prop changes the view', async () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans, billing: 'monthly' } })
      await radios(w)[1].trigger('click')
      expect(w.emitted('update:billing')).toEqual([['yearly']])
      expect(amounts(w)[1]).toBe('$29') // parent did not accept the change
      await w.setProps({ billing: 'yearly' })
      expect(amounts(w)[1]).toBe('$24')
    })
    it('works with v-model:billing', async () => {
      const Host = defineComponent({
        components: { PricingGrid },
        setup: () => ({ plans: yearlyPlans, b: ref<'monthly' | 'yearly'>('monthly') }),
        template: '<PricingGrid :plans="plans" v-model:billing="b" /><output>{{ b }}</output>',
      })
      const w = mount(Host)
      await w.findAll('[role="radio"]')[1].trigger('click')
      expect(w.find('output').text()).toBe('yearly')
      expect(w.findAll('[data-slot="pricing-card-amount"]')[1].text()).toBe('$24')
    })
    it('clicking the active option does not emit', async () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans } })
      await radios(w)[0].trigger('click')
      expect(w.emitted('update:billing')).toBeUndefined()
    })
    it('rapid toggles settle on the last value and emit once per change', async () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans } })
      for (let i = 0; i < 101; i++) await radios(w)[i % 2 === 0 ? 1 : 0].trigger('click')
      expect(w.emitted('update:billing')).toHaveLength(101)
      expect(amounts(w)[1]).toBe('$24')
    })
    it('keyboard: arrows, Home and End move selection and focus', async () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans }, attachTo: document.body })
      const group = w.find('[role="radiogroup"]')
      await group.trigger('keydown', { key: 'ArrowRight' })
      expect(radios(w)[1].attributes('aria-checked')).toBe('true')
      expect(document.activeElement).toBe(radios(w)[1].element)
      await group.trigger('keydown', { key: 'ArrowRight' }) // wraps
      expect(radios(w)[0].attributes('aria-checked')).toBe('true')
      await group.trigger('keydown', { key: 'ArrowLeft' }) // wraps back
      expect(radios(w)[1].attributes('aria-checked')).toBe('true')
      await group.trigger('keydown', { key: 'ArrowDown' })
      await group.trigger('keydown', { key: 'ArrowUp' })
      expect(radios(w)[1].attributes('aria-checked')).toBe('true')
      await group.trigger('keydown', { key: 'Home' })
      expect(radios(w)[0].attributes('aria-checked')).toBe('true')
      await group.trigger('keydown', { key: 'End' })
      expect(radios(w)[1].attributes('aria-checked')).toBe('true')
      const before = w.emitted('update:billing')!.length
      await group.trigger('keydown', { key: 'a' })
      expect(w.emitted('update:billing')).toHaveLength(before)
      w.unmount()
    })
    it('discount label, custom labels and toggle name', () => {
      const w = mount(PricingGrid, {
        props: { plans: yearlyPlans, yearlyDiscountLabel: 'Save 20%', monthlyLabel: 'Monat', yearlyLabel: 'Jahr', billingLabel: 'Abrechnung' },
      })
      expect(w.find('[data-slot="pricing-billing-discount"]').text()).toBe('Save 20%')
      expect(radios(w).map((r) => r.text())).toEqual(['Monat', 'Jahr Save 20%'])
      expect(w.find('[role="radiogroup"]').attributes('aria-label')).toBe('Abrechnung')
      expect(mount(PricingGrid, { props: { plans: yearlyPlans } }).find('[data-slot="pricing-billing-discount"]').exists()).toBe(false)
    })
    it('showToggle forces on/off', () => {
      expect(mount(PricingGrid, { props: { plans, showToggle: true } }).find('[role="radiogroup"]').exists()).toBe(true)
      expect(mount(PricingGrid, { props: { plans: yearlyPlans, showToggle: false } }).find('[role="radiogroup"]').exists()).toBe(false)
    })
    it('toggle visibility follows plan changes', async () => {
      const w = mount(PricingGrid, { props: { plans } })
      await w.setProps({ plans: yearlyPlans })
      expect(w.find('[role="radiogroup"]').exists()).toBe(true)
      await w.setProps({ plans })
      expect(w.find('[role="radiogroup"]').exists()).toBe(false)
    })
    it('class merges onto the wrapper and attrs fall through', () => {
      const w = mount(PricingGrid, { props: { plans: yearlyPlans, class: 'gap-2 custom' }, attrs: { id: 'p' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('gap-8')
      expect(w.attributes('id')).toBe('p')
    })
    it('slots get billing; cta slot gets billing too', () => {
      const w = mount(PricingGrid, {
        props: { plans: yearlyPlans, defaultBilling: 'yearly' },
        slots: { cta: '<template #cta="{ plan, billing }"><button>{{ plan.name }}:{{ billing }}</button></template>' },
      })
      expect(w.findAll('button:not([role])').map((b) => b.text())).toEqual(['Free:yearly', 'Pro:yearly', 'Team:yearly'])
      const c = mount(PricingGrid, {
        props: { plans: yearlyPlans },
        slots: { default: '<template #default="{ billing }"><i class="b">{{ billing }}</i></template>' },
      })
      expect(c.find('i.b').text()).toBe('monthly')
    })
    it('passes the grid variant to cards; a plan variant wins', () => {
      const w = mount(PricingGrid, { props: { variant: 'outline', plans: [{ name: 'a' }, { name: 'b', variant: 'compact' }] } })
      expect(w.findAll('article').map((a) => a.attributes('data-variant'))).toEqual(['outline', 'compact'])
    })
    it('highlighted variant plans set data-highlighted', () => {
      const w = mount(PricingGrid, { props: { plans: [{ name: 'a', variant: 'highlighted' }] } })
      expect(w.find('[data-highlighted]').exists()).toBe(true)
    })
  })
  describe('billing toggle: bad path and edge cases', () => {
    const yp = [{ name: 'A', price: '$1', yearlyPrice: '$2' }]
    it('unknown billing and defaultBilling fall back to monthly', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(PricingGrid, { props: { plans: yp, billing: 'weekly' } }).find('[data-slot="pricing-card-amount"]').text()).toBe('$1')
      // @ts-expect-error deliberately invalid
      expect(mount(PricingGrid, { props: { plans: yp, defaultBilling: 'forever' } }).find('[data-slot="pricing-card-amount"]').text()).toBe('$1')
    })
    it('empty plans with showToggle render the toggle and an empty list', () => {
      const w = mount(PricingGrid, { props: { plans: [], showToggle: true } })
      expect(w.find('[data-slot="pricing-grid-items"]').element.children).toHaveLength(0)
    })
    it('100 plans with yearly prices and a very long discount label', () => {
      const many = Array.from({ length: 100 }, (_, i) => ({ name: `P${i}`, price: '$1', yearlyPrice: '$2' }))
      const w = mount(PricingGrid, { props: { plans: many, yearlyDiscountLabel: 'S'.repeat(500), defaultBilling: 'yearly' } })
      expect(w.findAll('article')).toHaveLength(100)
      expect(w.findAll('[data-slot="pricing-card-amount"]').every((a) => a.text() === '$2')).toBe(true)
    })
    it('unicode labels', () => {
      const w = mount(PricingGrid, { props: { plans: yp, monthlyLabel: '毎月', yearlyLabel: '毎年 🎉' } })
      expect(w.findAll('[role="radio"]').map((r) => r.text())).toEqual(['毎月', '毎年 🎉'])
    })
    it('columns variant still applies in the wrapper', () => {
      const w = mount(PricingGrid, { props: { plans: yp, columns: 4 } })
      expect(w.find('[data-slot="pricing-grid-items"]').classes()).toContain('xl:grid-cols-4')
      expect(pricingGridVariants({ columns: 2 })).toContain('sm:grid-cols-2')
    })
    it('null entries in plans do not crash toggle detection', () => {
      // @ts-expect-error deliberately invalid
      const w = mount(PricingGrid, { props: { plans: [null, ...yp] } })
      expect(w.find('[role="radiogroup"]').exists()).toBe(true)
    })
    it('unmounts cleanly after toggling', async () => {
      const w = mount(PricingGrid, { props: { plans: yp }, attachTo: document.body })
      await w.find('[role="radiogroup"]').trigger('keydown', { key: 'End' })
      expect(() => w.unmount()).not.toThrow()
    })
    it('useBillingState ignores junk and repeated values', () => {
      const seen: string[] = []
      const controlled = ref<unknown>(undefined)
      const s = useBillingState(() => controlled.value, () => 'monthly', (v) => seen.push(v))
      s.set('nope')
      s.set('monthly')
      s.set('yearly')
      s.set('yearly')
      expect(seen).toEqual(['yearly'])
      expect(s.billing.value).toBe('yearly')
      controlled.value = 'monthly'
      expect(s.billing.value).toBe('monthly')
      s.set('yearly')
      expect(s.billing.value).toBe('monthly') // controlled: no internal write
      expect(seen).toEqual(['yearly', 'yearly'])
    })
  })
})
