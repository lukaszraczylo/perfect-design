/**
 * FunnelChart contract: a missing name, a missing `stages` array or an unusable stage throws a ContractError that names
 * the component and the fix; every accepted alternative passes; 'warn' logs and 'off' is silent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import FunnelChart from './FunnelChart.vue'

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
        return () => h(FunnelChart as never, { label: 'Pipeline', stages: [{ label: 'Leads', value: 10 }, { label: 'Won', value: 2 }], ...props })
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

describe('FunnelChart contract', () => {
  it('requires a name and says how to give one', async () => {
    await fails({ label: undefined }, 'FunnelChart: requires `label` or `aria-label` or `aria-labelledby`', 'label="Requests per day"')
  })
  it('accepts label, title, aria-label and aria-labelledby as the name', async () => {
    await passes({})
    await passes({ label: undefined, title: 'Pipeline' })
    await passes({ label: undefined, 'aria-label': 'Pipeline' })
    expect(wrapper!.find('svg').attributes('aria-label')).toBe('Pipeline')
    await passes({ label: undefined, 'aria-labelledby': 'heading' })
    expect(wrapper!.find('svg').attributes('aria-labelledby')).toBe('heading')
  })
  it('requires `stages` to be an array', async () => {
    await fails({ stages: undefined }, 'FunnelChart: requires `stages`', 'An empty array shows the empty state')
    await fails({ stages: 'x' }, 'FunnelChart: requires `stages`')
  })
  it('requires a label and a numeric value on every stage', async () => {
    await fails({ stages: [{ label: 'A', value: 1 }, { label: 'B' }] }, 'stage 2 needs a `label` and a numeric `value`')
    await fails({ stages: [{ value: 1 }] }, 'stage 1 needs a `label`')
    await fails({ stages: [{ label: '  ', value: 1 }] }, 'stage 1 needs')
    await fails({ stages: [{ label: 'A', value: '5' }] }, 'stage 1 needs')
    await fails({ stages: [null] }, 'stage 1 needs')
  })
  it('accepts an empty array, NaN and negative values and an optional tone', async () => {
    await passes({ stages: [] })
    await passes({ label: undefined, 'aria-label': 'Pipeline', stages: [] })
    await passes({ stages: [{ label: 'A', value: Number.NaN }, { label: 'B', value: -1, tone: 'danger' }] })
    await passes({ loading: true })
  })
  it("'warn' logs the message and does not throw; 'off' is silent", async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open({ label: undefined, stages: undefined })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).startsWith('[perfect-design] FunnelChart:'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open({ label: undefined, stages: undefined })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('[perfect-design]'))).toBe(false)
    expect(wrapper!.find('[data-slot="funnel-chart-empty"]').exists()).toBe(true)
    spy.mockRestore()
  })
})
