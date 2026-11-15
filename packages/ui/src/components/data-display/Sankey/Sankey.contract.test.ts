import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref, type VNodeChild } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Sankey from './Sankey.vue'

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
const flow = (props: Record<string, unknown> = {}) => () => h(Sankey as never, { label: 'Sample orders', links: [{ source: 'a', target: 'b', value: 2 }], ...props })

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

describe('Sankey contract (ContractError)', () => {
  it('needs a name: label, title, aria-label or aria-labelledby', async () => {
    await open(flow({ label: undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('Sankey: requires `label` or `aria-label` or `aria-labelledby`')
    for (const accepted of [{ label: undefined, title: 'Order outcomes' }, { label: undefined, 'aria-label': 'Orders' }, { label: undefined, 'aria-labelledby': 'heading' }, {}]) {
      await open(flow(accepted))
      expect(errors.map((e) => e.message)).toEqual([])
    }
  })
  it('a blank label does not count as a name', async () => {
    await open(flow({ label: ' ' }))
    expect(errors).toHaveLength(1)
  })
  it('needs `links` to be an array; an empty array is the empty state', async () => {
    await open(flow({ links: undefined }))
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    expect(errors[0]!.message).toContain('Sankey: requires `links`, an array of `{ source, target, value }` flows')
    await open(flow({ links: 'nope' }))
    expect(errors).toHaveLength(1)
    await open(flow({ links: [] }))
    expect(errors.map((e) => e.message)).toEqual([])
  })
  it('re-checks when the links change after mount', async () => {
    const links = ref<unknown>([{ source: 'a', target: 'b', value: 1 }])
    await open(() => h(Sankey as never, { label: 'Sample', links: links.value }))
    expect(errors).toEqual([])
    links.value = undefined
    await settle()
    expect(errors).toHaveLength(1)
  })
  it('warn mode logs without throwing, off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(flow({ label: undefined, links: undefined }))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).startsWith('[perfect-design] Sankey:'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(flow({ label: undefined, links: undefined }))
    expect(errors).toEqual([])
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
