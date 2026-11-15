/**
 * WaterfallChart contract: a missing name, a missing `items` array or an unusable item throws a ContractError that names
 * the component and the fix; every accepted alternative passes; 'warn' logs and 'off' is silent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import WaterfallChart from './WaterfallChart.vue'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
const errors: Error[] = []
let wrapper: VueWrapper | undefined
const open = async (props: Record<string, unknown>) => {
  errors.length = 0
  wrapper?.unmount()
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return () => h(WaterfallChart as never, { label: 'Budget', items: [{ label: 'Open', value: 10 }, { label: 'Sales', value: 5 }, { label: 'End', type: 'total' }], ...props })
      },
    }),
    { attachTo: document.body },
  )
  await settle()
}
const fails = async (props: Record<string, unknown>, ...fragments: string[]) => {
  await open(props)
  expect(errors.length, 'expected a ContractError').toBeGreaterThan(0)
  expect(errors[0]!.name).toBe('ContractError')
  for (const f of fragments) expect(errors[0]!.message).toContain(f)
}
const passes = async (props: Record<string, unknown>) => {
  await open(props)
  expect(errors.map((e) => e.message)).toEqual([])
}

beforeEach(() => {
  configureStrictMode('throw')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.mocked(console.warn).mockRestore()
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
})

describe('WaterfallChart contract', () => {
  it('requires a name and says how to give one', async () => {
    await fails({ label: undefined }, 'WaterfallChart: requires `label` or `aria-label` or `aria-labelledby`', 'label="Requests per day"')
  })
  it('accepts label, title, aria-label and aria-labelledby as the name', async () => {
    await passes({})
    await passes({ label: undefined, title: 'Budget' })
    await passes({ label: undefined, 'aria-label': 'Budget' })
    expect(wrapper!.find('svg').attributes('aria-label')).toBe('Budget')
    await passes({ label: undefined, 'aria-labelledby': 'heading' })
    expect(wrapper!.find('svg').attributes('aria-labelledby')).toBe('heading')
  })
  it('requires `items` to be an array', async () => {
    await fails({ items: undefined }, 'WaterfallChart: requires `items`', 'An empty array shows the empty state')
    await fails({ items: 'x' }, 'WaterfallChart: requires `items`')
  })
  it('requires a label on every item', async () => {
    await fails({ items: [{ label: 'A', value: 1 }, { value: 2 }] }, 'item 2 needs a `label`')
    await fails({ items: [{ label: '  ', value: 1 }] }, 'item 1 needs a `label`')
    await fails({ items: [null] }, 'item 1 needs a `label`')
  })
  it('requires a known type', async () => {
    await fails({ items: [{ label: 'A', value: 1 }, { label: 'B', value: 1, type: 'bonus' }] }, 'item 2 has the unknown type "bonus"', 'start, delta, subtotal or total')
  })
  it('requires a numeric value for a start or a delta, but not for subtotals and totals', async () => {
    await fails({ items: [{ label: 'A' }] }, 'item 1 ("A") needs a numeric `value`')
    await fails({ items: [{ label: 'A', value: 1 }, { label: 'B', value: '5' }] }, 'item 2 ("B") needs a numeric `value`')
    await fails({ items: [{ label: 'A', value: 1, type: 'delta' }, { label: 'B', type: 'delta' }] }, 'item 2 ("B") needs a numeric `value`')
    await fails({ items: [{ label: 'A', type: 'start' }] }, 'item 1 ("A") needs a numeric `value`')
    await passes({ items: [{ label: 'A', value: 1 }, { label: 'Sub', type: 'subtotal' }, { label: 'T', type: 'total' }] })
  })
  it('accepts an empty array and NaN values', async () => {
    await passes({ items: [] })
    await passes({ label: undefined, 'aria-label': 'Budget', items: [] })
    await passes({ items: [{ label: 'A', value: Number.NaN }, { label: 'B', value: 2 }] })
    await passes({ loading: true })
  })
  it("'warn' logs the message and does not throw; 'off' is silent", async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open({ label: undefined, items: undefined })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).startsWith('[perfect-design] WaterfallChart:'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open({ label: undefined, items: undefined })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('[perfect-design]'))).toBe(false)
    expect(wrapper!.find('[data-slot="waterfall-chart-empty"]').exists()).toBe(true)
    spy.mockRestore()
  })
})
