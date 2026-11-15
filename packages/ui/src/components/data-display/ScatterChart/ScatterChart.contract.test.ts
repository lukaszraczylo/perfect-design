/**
 * ScatterChart contract: a missing name, a missing `points` array or an unusable point throws a ContractError that names
 * the component and the fix; every accepted alternative passes; 'warn' logs and 'off' is silent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import ScatterChart from './ScatterChart.vue'

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
        return () => h(ScatterChart as never, { label: 'Orders', points: [{ x: 1, y: 2 }, { x: 3, y: 4 }], ...props })
      },
    }),
    { attachTo: document.body },
  )
  await settle()
}
const fails = async (props: Record<string, unknown>, ...fragments: string[]) => {
  await open(props)
  expect(errors.map((e) => e.message).join('\n')).not.toBe('')
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

describe('ScatterChart contract', () => {
  it('requires a name and says how to give one', async () => {
    await fails({ label: undefined }, 'ScatterChart: requires `label` or `aria-label` or `aria-labelledby`', 'label="Requests per day"')
    await fails({ label: '   ' }, 'ScatterChart: requires')
  })
  it('accepts label, title, aria-label and aria-labelledby as the name', async () => {
    await passes({})
    await passes({ label: undefined, title: 'Orders' })
    await passes({ label: undefined, 'aria-label': 'Orders' })
    expect(wrapper!.find('svg').attributes('aria-label')).toBe('Orders')
    await passes({ label: undefined, 'aria-labelledby': 'heading' })
    expect(wrapper!.find('svg').attributes('aria-labelledby')).toBe('heading')
  })
  it('requires `points` to be an array', async () => {
    await fails({ points: undefined }, 'ScatterChart: requires `points`', 'An empty array shows the empty state')
    await fails({ points: 'x' }, 'ScatterChart: requires `points`')
    await fails({ points: { x: 1, y: 2 } }, 'ScatterChart: requires `points`')
  })
  it('requires numeric x and y in every point', async () => {
    await fails({ points: [{ x: 1, y: 2 }, { x: '3', y: 4 }] }, 'point 2 needs numeric `x` and `y`')
    await fails({ points: [{ x: 1 }] }, 'point 1 needs numeric `x` and `y`')
    await fails({ points: [null] }, 'point 1 needs numeric `x` and `y`')
    await fails({ points: [[1, 2]] }, 'point 1 needs numeric `x` and `y`')
  })
  it('accepts an empty array, NaN and Infinity coordinates and optional fields', async () => {
    await passes({ points: [] })
    await passes({ label: undefined, 'aria-label': 'Orders', points: [] })
    await passes({ points: [{ x: Number.NaN, y: 1 }, { x: 1, y: Number.POSITIVE_INFINITY }, { x: 1, y: 2, size: 3, label: 'A', series: 'S' }] })
    await passes({ loading: true })
  })
  it('checks again when the data changes', async () => {
    const points = ref<unknown>([{ x: 1, y: 1 }])
    errors.length = 0
    wrapper = mount(
      defineComponent({
        setup() {
          onErrorCaptured((e) => {
            errors.push(e as Error)
            return false
          })
          return () => h(ScatterChart as never, { label: 'Orders', points: points.value })
        },
      }),
      { attachTo: document.body },
    )
    await settle()
    expect(errors).toEqual([])
    points.value = [{ x: 'bad', y: 1 }]
    await settle()
    expect(errors.map((e) => e.message).join()).toContain('point 1 needs numeric')
  })
  it("'warn' logs the message and does not throw; 'off' is silent", async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open({ label: undefined, points: undefined })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).startsWith('[perfect-design] ScatterChart:'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open({ label: undefined, points: undefined })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('[perfect-design]'))).toBe(false)
    expect(wrapper!.find('[data-slot="scatter-chart-empty"]').exists()).toBe(true)
    spy.mockRestore()
  })
})
