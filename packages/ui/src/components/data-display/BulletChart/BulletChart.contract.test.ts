import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, type VNodeChild } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import BulletChart from './BulletChart.vue'

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

const chart = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => () =>
  h(BulletChart as never, { label: 'Sample', bullets: [{ label: 'Orders', value: 70, target: 80, ranges: [50, 100] }], ...props, ...attrs })

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

describe('BulletChart contract', () => {
  it('needs an accessible name: label, title, aria-label or aria-labelledby', async () => {
    await open(chart({ label: undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('BulletChart: requires `label` or `aria-label` or `aria-labelledby`')
    expect(errors[0]!.message).toContain('name what it shows')
    for (const ok of [{ label: undefined, title: 'Warehouse' }, { label: undefined, 'aria-label': 'Warehouse' }, { label: undefined, 'aria-labelledby': 'heading' }, { label: 'Warehouse' }]) {
      await open(chart(ok))
      expect(errors.map((e) => e.message)).toEqual([])
    }
  })
  it('needs `bullets` to be an array, and an empty array is fine', async () => {
    await open(chart({ bullets: undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('BulletChart: requires `bullets`')
    await open(chart({ bullets: 'nope' }))
    expect(errors[0]!.message).toContain('requires `bullets`')
    await open(chart({ bullets: [] }))
    expect(errors).toEqual([])
  })
  it('needs a label text on every measure', async () => {
    await open(chart({ bullets: [{ label: 'Ok', value: 1 }, { label: '', value: 2 }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('measure 2 needs a `label` text')
    await open(chart({ bullets: [null] }))
    expect(errors[0]!.message).toContain('measure 1 needs a `label` text')
    await open(chart({ bullets: [{ label: 'Ok', value: 1 }] }))
    expect(errors).toEqual([])
  })
  it('does not complain about missing values, targets or ranges (those are data, not wiring)', async () => {
    await open(chart({ bullets: [{ label: 'A', value: Number.NaN }, { label: 'B', value: 1 }] }))
    expect(errors).toEqual([])
  })
  it('checks bullets that arrive after mount', async () => {
    const { ref } = await import('vue')
    const bullets = ref<unknown[]>([{ label: 'Ok', value: 1 }])
    await open(() => h(BulletChart as never, { label: 'Sample', bullets: bullets.value }))
    expect(errors).toEqual([])
    bullets.value = [{ label: '', value: 1 }]
    await settle()
    expect(errors.map((e) => e.message).join()).toContain('needs a `label` text')
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
    await open(chart({ label: undefined, bullets: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
  })
})
