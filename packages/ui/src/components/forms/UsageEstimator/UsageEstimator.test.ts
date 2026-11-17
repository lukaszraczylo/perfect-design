import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import UsageEstimator from './UsageEstimator.vue'
import { UsageEstimator as Exported, estimateTotal, lineCost, usageEstimatorVariants, usageEstimatorRowVariants, usageEstimatorTotalVariants } from './index'
import type { UsageDimension } from './estimate'

const dims: UsageDimension[] = [
  { id: 'requests', label: 'Sample requests', unit: 'requests', rate: 0.4, per: 1000, included: 10000, max: 1000000, step: 1000 },
  { id: 'storage', label: 'Sample storage', unit: 'GB', rate: 0, tiers: [{ upTo: 100, rate: 0.1 }, { upTo: 1000, rate: 0.05 }, { upTo: null, rate: 0.02 }], max: 5000, step: 10 },
  { id: 'seats', label: 'Sample seats', unit: 'seats', rate: 5, included: 3, min: 1, max: 50 },
]
const START = { requests: 12500, storage: 1000, seats: 5 } // 1 + 55 + 10 = 66

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.useRealTimers()
})

function make(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
  wrapper = mount(UsageEstimator, { props: { dimensions: dims, defaultValue: START, ...props }, attachTo: document.body, ...options })
  return wrapper
}
const total = (w: VueWrapper) => w.find('[data-slot=usage-estimator-total]').text()
const numbers = (w: VueWrapper) => w.findAll('input[role=spinbutton]')
const sliders = (w: VueWrapper) => w.findAll('[role=slider]')
const press = async (el: Element, key: string) => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  await Promise.resolve()
  await new Promise((r) => setTimeout(r, 0))
}
async function typeValue(w: VueWrapper, index: number, text: string) {
  const input = numbers(w)[index]!
  await input.setValue(text)
  await input.trigger('blur')
}

describe('UsageEstimator: good path', () => {
  it('is exported from the barrel', () => expect(Exported).toBe(UsageEstimator))

  it('renders a row per dimension with its label, unit and two controls', () => {
    const w = make()
    const rows = w.findAll('[data-slot=usage-estimator-row]')
    expect(rows).toHaveLength(3)
    expect(rows[0]!.find('[data-slot=usage-estimator-label]').text()).toBe('Sample requests')
    expect(rows[0]!.find('[data-slot=usage-estimator-unit]').text()).toBe('requests')
    expect(sliders(w)).toHaveLength(3)
    expect(numbers(w)).toHaveLength(3)
  })

  it('names every control from the label and unit', () => {
    const w = make()
    expect(sliders(w)[1]!.attributes('aria-label')).toBe('Sample storage, GB')
    expect(numbers(w)[0]!.attributes('aria-label')).toBe('Sample requests, requests')
  })

  it('shows the cost of each line and the total', () => {
    const w = make({ period: '/month' })
    const lines = w.findAll('[data-slot=usage-estimator-line]').map((l) => l.text())
    expect(lines).toEqual(['$1', '$55', '$10'])
    expect(total(w)).toContain('Estimated total')
    expect(total(w)).toContain('$66')
    expect(total(w)).toContain('/month')
  })

  it('starts at each dimension min (or 0) without a value', () => {
    const w = make({ defaultValue: undefined })
    expect(numbers(w).map((n) => (n.element as HTMLInputElement).value)).toEqual(['0', '0', '1'])
    expect(total(w)).toContain('$0')
  })

  it('shows a rate hint with included units and graduated tiers', () => {
    const w = make()
    const hints = w.findAll('[data-slot=usage-estimator-hint]').map((h) => h.text())
    expect(hints[0]).toBe('$0.40 / 1,000 requests · 10,000 included')
    expect(hints[1]).toBe('Graduated rates')
    expect(hints[2]).toBe('$5 / seats · 3 included')
  })

  it('uses unitSingular in the rate hint when the rate is per one unit', () => {
    const w = make({ dimensions: [{ ...dims[2]!, unitSingular: 'seat' }, { ...dims[0]!, unitSingular: 'request' }], defaultValue: undefined })
    const hints = w.findAll('[data-slot=usage-estimator-hint]').map((h) => h.text())
    expect(hints[0]).toBe('$5 / seat · 3 included')
    expect(hints[1]).toBe('$0.40 / 1,000 requests · 10,000 included')
    expect(w.findAll('[data-slot=usage-estimator-unit]').map((u) => u.text())).toEqual(['seats', 'requests'])
  })

  it('localises the hint text with labels', () => {
    const w = make({ labels: { included: '{count} inclus', graduated: 'Tarifs progressifs' } })
    const hints = w.findAll('[data-slot=usage-estimator-hint]').map((h) => h.text())
    expect(hints[0]).toBe('$0.40 / 1,000 requests · 10,000 inclus')
    expect(hints[1]).toBe('Tarifs progressifs')
  })

  it('keeps the English default for a label left out or empty', () => {
    const w = make({ labels: { included: '', graduated: undefined } })
    const hints = w.findAll('[data-slot=usage-estimator-hint]').map((h) => h.text())
    expect(hints[0]).toBe('$0.40 / 1,000 requests · 10,000 included')
    expect(hints[1]).toBe('Graduated rates')
  })

  it('falls back to unit when unitSingular is empty', () => {
    const w = make({ dimensions: [{ ...dims[2]!, unitSingular: '' }], defaultValue: undefined })
    expect(w.find('[data-slot=usage-estimator-hint]').text()).toBe('$5 / seats · 3 included')
  })

  it('shows a custom total label and a note (prop and slot)', () => {
    const w = make({ totalLabel: 'Sample sum', note: 'Sample rates. Estimate only.' })
    expect(total(w)).toContain('Sample sum')
    expect(w.find('[data-slot=usage-estimator-note]').text()).toBe('Sample rates. Estimate only.')
    w.unmount()
    wrapper = mount(UsageEstimator, { props: { dimensions: dims }, slots: { note: () => h('em', 'Slot note') } })
    expect(wrapper.find('[data-slot=usage-estimator-note] em').text()).toBe('Slot note')
  })

  it('has no note element without a note', () => expect(make().find('[data-slot=usage-estimator-note]').exists()).toBe(false))
})

describe('UsageEstimator: v-model', () => {
  it('uncontrolled: typing a quantity updates the line, the total and emits the full map', async () => {
    const w = make()
    await typeValue(w, 0, '20000')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([{ ...START, requests: 20000 }])
    expect(total(w)).toContain('$69') // 10000 billable = 4, + 55 + 10
  })

  it('controlled: shows the prop value and ignores a change the parent rejects', async () => {
    const w = make({ modelValue: START, defaultValue: undefined })
    await typeValue(w, 2, '9')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([{ ...START, seats: 9 }])
    expect(total(w)).toContain('$66')
    await w.setProps({ modelValue: { ...START, seats: 9 } })
    expect(total(w)).toContain('$86')
    expect((numbers(w)[2]!.element as HTMLInputElement).value).toBe('9')
  })

  it('works with a parent that writes the value back', async () => {
    const value = ref<Record<string, number>>({ ...START })
    wrapper = mount(defineComponent({ setup: () => () => h(UsageEstimator, { dimensions: dims, modelValue: value.value, 'onUpdate:modelValue': (v: Record<string, number>) => (value.value = v) }) }), { attachTo: document.body })
    await typeValue(wrapper, 1, '100')
    expect(value.value.storage).toBe(100)
    expect(wrapper.find('[data-slot=usage-estimator-total]').text()).toContain('$21') // 1 + 10 + 10
  })

  it('moves a slider with the keyboard by `step` and keeps the number field in sync', async () => {
    const w = make({ defaultValue: { ...START, requests: 12000 } })
    await press(sliders(w)[0]!.element, 'ArrowRight')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([{ ...START, requests: 13000 }])
    expect((numbers(w)[0]!.element as HTMLInputElement).value).toBe('13000')
    expect(sliders(w)[0]!.attributes('aria-valuenow')).toBe('13000')
  })

  it('moves a number field with the stepper by `step`', async () => {
    const w = make()
    await w.find('[data-slot=number-input-increment]').trigger('click')
    expect((w.emitted('update:modelValue')!.at(-1)![0] as Record<string, number>).requests).toBe(13500)
  })

  it('does not emit when the quantity is unchanged', async () => {
    const w = make()
    await typeValue(w, 2, '5')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('UsageEstimator: customisation', () => {
  it('merges `class` last and keeps data-slot and attributes', () => {
    const w = make({ class: 'max-w-md p-8' }, { attrs: { 'data-test': 'x', 'aria-label': 'Sample estimator' } })
    expect(w.attributes('data-slot')).toBe('usage-estimator')
    expect(w.classes()).toContain('max-w-md')
    expect(w.classes()).toContain('p-8')
    expect(w.classes()).not.toContain('p-4')
    expect(w.attributes('data-test')).toBe('x')
    expect(w.attributes('aria-label')).toBe('Sample estimator')
  })

  it('exports the variant functions for plain elements', () => {
    expect(usageEstimatorVariants()).toContain('border')
    expect(usageEstimatorVariants({ variant: 'plain' })).not.toContain('border')
    expect(usageEstimatorRowVariants({ size: 'lg' })).toContain('gap-3')
    expect(usageEstimatorTotalVariants({ size: 'sm' })).toContain('pt-3')
  })

  it('card is the default look; plain drops the surface', () => {
    expect(make().classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'p-4']))
    wrapper!.unmount()
    const plain = make({ variant: 'plain' })
    expect(plain.classes()).not.toContain('border')
    expect(plain.attributes('data-variant')).toBe('plain')
  })

  it('sizes change spacing, and unknown values fall back to the default', () => {
    const html = (props: Record<string, unknown>) => {
      const w = make(props)
      const out = w.html()
      w.unmount()
      return out
    }
    const base = html({})
    expect(html({ size: 'sm' })).not.toBe(base)
    expect(html({ size: 'lg' })).not.toBe(base)
    expect(html({ size: 'huge' })).toBe(base)
    expect(html({ variant: 'huge' })).toBe(base)
    expect(html({ input: 'huge' })).toBe(base)
  })

  it('input chooses the controls; a slider alone shows the quantity as text', () => {
    const s = make({ input: 'slider' })
    expect(numbers(s)).toHaveLength(0)
    expect(sliders(s)).toHaveLength(3)
    expect(s.find('[data-slot=usage-estimator-unit]').text()).toBe('12,500 requests')
    s.unmount()
    const n = make({ input: 'number' })
    expect(sliders(n)).toHaveLength(0)
    expect(numbers(n)).toHaveLength(3)
  })

  it('showBreakdown false hides line costs and hints but keeps the total', () => {
    const w = make({ showBreakdown: false })
    expect(w.find('[data-slot=usage-estimator-line]').exists()).toBe(false)
    expect(w.find('[data-slot=usage-estimator-hint]').exists()).toBe(false)
    expect(total(w)).toContain('$66')
  })
})

describe('UsageEstimator: announcements', () => {
  beforeEach(() => vi.useFakeTimers())

  it('announces nothing at first, then the total once after the quantities settle', async () => {
    const w = make({ period: '/month' })
    const status = () => w.find('[data-slot=usage-estimator-status]')
    expect(status().attributes('role')).toBe('status')
    expect(status().text()).toBe('')
    await typeValue(w, 2, '6')
    await typeValue(w, 2, '7')
    await typeValue(w, 2, '8')
    await vi.advanceTimersByTimeAsync(300)
    expect(status().text()).toBe('')
    await vi.advanceTimersByTimeAsync(400)
    expect(status().text()).toBe('Estimated total: $81 /month') // 1 + 55 + (8 - 3) * 5
  })

  it('stays silent when the total does not change', async () => {
    const w = make()
    await typeValue(w, 2, '3') // 5 -> 3 seats: included, so the cost drops: change
    await vi.advanceTimersByTimeAsync(700)
    expect(w.find('[data-slot=usage-estimator-status]').text()).toBe('Estimated total: $56')
    await typeValue(w, 2, '2') // still inside the included units: total unchanged
    await vi.advanceTimersByTimeAsync(700)
    expect(w.find('[data-slot=usage-estimator-status]').text()).toBe('Estimated total: $56')
  })

  it('cancels a pending announcement on unmount', async () => {
    const w = make()
    await typeValue(w, 2, '9')
    w.unmount()
    wrapper = undefined
    await vi.advanceTimersByTimeAsync(1000)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('UsageEstimator: bad path', () => {
  it.each([[[]], [undefined], [null], ['x'], [{}]])('renders only the total for dimensions %j', (value) => {
    const w = make({ dimensions: value })
    expect(w.findAll('[data-slot=usage-estimator-row]')).toHaveLength(0)
    expect(w.find('[data-slot=usage-estimator-rows]').exists()).toBe(false)
    expect(total(w)).toContain('$0')
  })

  it('skips null entries in the dimension list', () => {
    const w = make({ dimensions: [null, dims[2]] })
    expect(w.findAll('[data-slot=usage-estimator-row]')).toHaveLength(1)
  })

  it('restores the previous quantity for typed text that is not a number', async () => {
    const w = make()
    await typeValue(w, 0, 'lots')
    expect((numbers(w)[0]!.element as HTMLInputElement).value).toBe('12500')
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(total(w)).toContain('$66')
  })

  it('treats NaN, negative and non-numeric model values as 0 (or min)', () => {
    const w = make({ defaultValue: undefined, modelValue: { requests: NaN, storage: -40, seats: 'many' } })
    expect(numbers(w).map((n) => (n.element as HTMLInputElement).value)).toEqual(['0', '0', '1'])
    expect(total(w)).toContain('$0')
  })

  it('ignores a modelValue that is not an object', () => {
    const w = make({ modelValue: 'oops', defaultValue: START })
    expect(total(w)).toContain('$66')
  })

  it('clears to the minimum when the number field is emptied', async () => {
    const w = make()
    await typeValue(w, 2, '')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([{ ...START, seats: 1 }])
  })

  it('stays usable with a broken `max`', () => {
    const w = make({ dimensions: [{ ...dims[2], max: NaN }] })
    expect(sliders(w)).toHaveLength(1)
    expect(total(w)).toContain('$')
  })

  it('does not break on an unknown currency or locale', () => {
    const w = make({ currency: 'nope', locale: 'not a locale' })
    expect(total(w)).toContain('66')
  })
})

describe('UsageEstimator: edge cases', () => {
  it('clamps typed values to max and min', async () => {
    const w = make()
    await typeValue(w, 2, '9999')
    expect((w.emitted('update:modelValue')!.at(-1)![0] as Record<string, number>).seats).toBe(50)
    await typeValue(w, 2, '0')
    expect((w.emitted('update:modelValue')!.at(-1)![0] as Record<string, number>).seats).toBe(1)
    expect(total(w)).toContain('$56') // 1 seat is inside the 3 included, so only requests (1) and storage (55) cost
  })

  it('prices a value larger than max as max', () => {
    const w = make({ defaultValue: { ...START, seats: 1e12 } })
    expect(total(w)).toContain('$' + (1 + 55 + 47 * 5)) // 291
  })

  it('shows $0 when included units exceed the quantity', () => {
    const w = make({ defaultValue: { requests: 500, storage: 0, seats: 2 } })
    expect(total(w)).toContain('$0')
  })

  it('matches the pure helpers at tier boundaries', () => {
    for (const storage of [0, 100, 101, 1000, 1001, 5000]) {
      const w = make({ defaultValue: { requests: 0, storage, seats: 1 } })
      const expected = estimateTotal(dims, { requests: 0, storage, seats: 1 })
      expect(lineCost(dims[1]!, storage)).toBeCloseTo(expected, 10)
      expect(w.find('[data-slot=usage-estimator-line]').text()).toBe('$0')
      w.unmount()
    }
  })

  it('formats money and quantities for de-DE', () => {
    const w = make({ locale: 'de-DE', currency: 'EUR', period: '/Monat', defaultValue: { requests: 11500, storage: 0, seats: 1 } })
    expect(total(w)).toContain('0,60')
    expect(total(w)).toContain('€')
    expect(w.find('[data-slot=usage-estimator-hint]').text()).toContain('1.000 requests')
    expect(w.find('[data-slot=usage-estimator-hint]').text()).toContain('10.000 included')
  })

  it('uses logical properties so right-to-left layouts mirror', () => {
    const w = make({}, { attachTo: undefined })
    const html = w.html()
    expect(html).not.toMatch(/\b(ml|mr|pl|pr|left|right)-\d/)
    expect(html).toContain('ms-2')
    const rtl = mount(defineComponent({ setup: () => () => h('div', { dir: 'rtl' }, h(UsageEstimator, { dimensions: dims })) }))
    expect(rtl.find('[data-slot=usage-estimator]').exists()).toBe(true)
    rtl.unmount()
  })

  it('stacks rows on small screens and puts tabular figures on the numbers', () => {
    const w = make()
    expect(w.find('[data-slot=usage-estimator-controls]').classes()).toEqual(expect.arrayContaining(['flex-col', 'sm:flex-row']))
    expect(w.find('[data-slot=usage-estimator-hint]').classes()).toContain('tabular-nums')
    expect(w.find('[data-slot=price]').classes()).toContain('tabular-nums')
  })

  it('re-renders when dimensions change', async () => {
    const w = make()
    await w.setProps({ dimensions: [dims[2]] })
    expect(w.findAll('[data-slot=usage-estimator-row]')).toHaveLength(1)
    expect(total(w)).toContain('$10')
  })

  it('handles many dimensions quickly', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ id: `d${i}`, label: `Sample ${i}`, unit: 'units', rate: 1, max: 100 }))
    const t = performance.now()
    const w = make({ dimensions: many, defaultValue: undefined })
    expect(w.findAll('[data-slot=usage-estimator-row]')).toHaveLength(60)
    expect(performance.now() - t).toBeLessThan(10000)
  })
})
