import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref, type VNodeChild } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Treemap from './Treemap.vue'

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
const tree = (props: Record<string, unknown> = {}) => () => h(Treemap as never, { label: 'Sample stock', data: [{ label: 'A', value: 2 }], ...props })

beforeEach(() => {
  errors.length = 0
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

describe('Treemap contract (ContractError)', () => {
  it('needs a name: label, title, aria-label or aria-labelledby', async () => {
    await open(tree({ label: undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('Treemap: requires `label` or `aria-label` or `aria-labelledby`')
    expect(errors[0]!.message).toContain('label="Requests per day"')
    for (const accepted of [{ label: undefined, title: 'Stock by area' }, { label: undefined, 'aria-label': 'Stock' }, { label: undefined, 'aria-labelledby': 'heading' }, {}]) {
      await open(tree(accepted))
      expect(errors.map((e) => e.message)).toEqual([])
    }
  })
  it('a blank label or title does not count as a name', async () => {
    await open(tree({ label: '  ', title: '' }))
    expect(errors).toHaveLength(1)
  })
  it('needs `data` to be an array; an empty array is the empty state', async () => {
    await open(tree({ data: undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('Treemap: requires `data`, an array of `{ label, value?, children? }` nodes')
    await open(tree({ data: 'nope' }))
    expect(errors).toHaveLength(1)
    await open(tree({ data: [] }))
    expect(errors.map((e) => e.message)).toEqual([])
  })
  it('re-checks when the data changes after mount', async () => {
    const data = ref<unknown>([{ label: 'A', value: 2 }])
    await open(() => h(Treemap as never, { label: 'Sample stock', data: data.value }))
    expect(errors).toEqual([])
    data.value = undefined
    await settle()
    expect(errors).toHaveLength(1)
    expect(errors[0]!.message).toContain('requires `data`')
  })
  it('warn mode logs without throwing, off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(tree({ label: undefined, data: undefined }))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).startsWith('[perfect-design] Treemap:'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(tree({ label: undefined, data: undefined }))
    expect(errors).toEqual([])
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
