/**
 * RadarChart contract: a missing name, bad `axes` or `series` throw a ContractError that names the component and the fix;
 * every accepted alternative passes; 'warn' logs and 'off' is silent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import RadarChart from './RadarChart.vue'

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
        return () => h(RadarChart as never, { label: 'Skills', axes: ['A', 'B', 'C'], series: [{ name: 'S', data: [1, 2, 3] }], ...props })
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

describe('RadarChart contract', () => {
  it('requires a name and says how to give one', async () => {
    await fails({ label: undefined }, 'RadarChart: requires `label` or `aria-label` or `aria-labelledby`', 'label="Requests per day"')
  })
  it('accepts label, title, aria-label and aria-labelledby as the name', async () => {
    await passes({})
    await passes({ label: undefined, title: 'Skills' })
    await passes({ label: undefined, 'aria-label': 'Skills' })
    expect(wrapper!.find('svg').attributes('aria-label')).toBe('Skills')
    await passes({ label: undefined, 'aria-labelledby': 'heading' })
    expect(wrapper!.find('svg').attributes('aria-labelledby')).toBe('heading')
  })
  it('requires `axes` to be an array of at least 3 names', async () => {
    await fails({ axes: undefined }, 'RadarChart: requires `axes`', 'at least 3')
    await fails({ axes: 'ABC' }, 'RadarChart: requires `axes`')
    await fails({ axes: ['A', 'B'], series: [{ name: 'S', data: [1, 2] }] }, 'RadarChart: needs at least 3 `axes`', 'got 2')
    await fails({ axes: ['A'], series: [] }, 'got 1')
  })
  it('requires `series` to be an array of objects with a data array', async () => {
    await fails({ series: undefined }, 'RadarChart: requires `series`', '{ name, data }')
    await fails({ series: [{ name: 'S' }] }, 'series 1 needs a `data` array')
    await fails({ series: [{ name: 'S', data: [1, 2, 3] }, 'x'] }, 'series 2 needs a `data` array')
    await fails({ series: [null] }, 'series 1 needs a `data` array')
  })
  it('accepts empty arrays and missing values', async () => {
    await passes({ axes: [], series: [] })
    await passes({ axes: ['A', 'B', 'C'], series: [] })
    await passes({ series: [{ name: 'S', data: [1, Number.NaN, null] }] })
    await passes({ loading: true })
  })
  it("'warn' logs the message and does not throw; 'off' is silent", async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open({ label: undefined, axes: ['A', 'B'] })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).startsWith('[perfect-design] RadarChart:'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open({ label: undefined, axes: ['A', 'B'] })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('[perfect-design]'))).toBe(false)
    expect(wrapper!.find('[data-slot="radar-chart-empty"]').exists()).toBe(true)
    spy.mockRestore()
  })
})
