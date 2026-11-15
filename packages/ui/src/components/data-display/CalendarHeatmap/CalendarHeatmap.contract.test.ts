import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref, type VNodeChild } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import CalendarHeatmap from './CalendarHeatmap.vue'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

const errors: Error[] = []
let wrapper: VueWrapper | undefined
const open = async (root: () => VNodeChild) => {
  errors.length = 0
  wrapper?.unmount()
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return root
      },
    }),
    { attachTo: document.body },
  )
  await settle()
}

const chart = (props: Record<string, unknown> = {}) => () => h(CalendarHeatmap as never, { label: 'Sample', data: [{ date: '2025-03-03', value: 2 }], ...props })

beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
})

describe('CalendarHeatmap contract', () => {
  it('needs an accessible name: label, title, aria-label or aria-labelledby', async () => {
    await open(chart({ label: undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('CalendarHeatmap: requires `label` or `aria-label` or `aria-labelledby`')
    for (const ok of [{ label: undefined, title: 'Deploys' }, { label: undefined, 'aria-label': 'Deploys' }, { label: undefined, 'aria-labelledby': 'heading' }, { label: 'Deploys' }]) {
      await open(chart(ok))
      expect(errors.map((e) => e.message)).toEqual([])
    }
  })
  it('needs `data` to be an array, and an empty array is fine', async () => {
    await open(chart({ data: undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('CalendarHeatmap: requires `data`')
    await open(chart({ data: 'nope' }))
    expect(errors[0]!.message).toContain('requires `data`')
    await open(chart({ data: [] }))
    expect(errors).toEqual([])
  })
  it('needs start and end to be real YYYY-MM-DD dates when set', async () => {
    await open(chart({ start: '2025-02-30' }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('`start` must be a real date written `YYYY-MM-DD`')
    await open(chart({ end: 'tomorrow' }))
    expect(errors[0]!.message).toContain('`end` must be a real date')
    await open(chart({ start: '2025-03-01', end: '2025-03-31' }))
    expect(errors).toEqual([])
    await open(chart({ start: null, end: undefined }))
    expect(errors).toEqual([])
  })
  it('does not complain about invalid entries (those are data, counted inline)', async () => {
    await open(chart({ data: [{ date: 'x', value: 1 }, { date: '2025-03-03', value: Number.NaN }, null] , start: '2025-03-03', end: '2025-03-09' }))
    expect(errors).toEqual([])
  })
  it('checks data and range that change after mount', async () => {
    const start = ref<string | undefined>('2025-03-01')
    await open(() => h(CalendarHeatmap as never, { label: 'Sample', data: [], start: start.value, end: '2025-03-09' }))
    expect(errors).toEqual([])
    start.value = 'later'
    await settle()
    expect(errors.map((e) => e.message).join()).toContain('`start` must be a real date')
  })
  it('warn mode logs without throwing, off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await open(chart({ label: undefined }))
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalled()
    spy.mockClear()
    configureStrictMode('off')
    await open(chart({ label: undefined }))
    expect(errors).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })
  it('the empty state still needs a name', async () => {
    await open(chart({ label: undefined, data: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
  })
})
