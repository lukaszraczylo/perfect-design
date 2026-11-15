/** Contract tests for ShowMore: the toggle needs visible text. Strict mode is switched on here. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import ShowMore from './ShowMore.vue'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

const errors: Error[] = []
let wrapper: VueWrapper | undefined
const mounted = (props: Record<string, unknown>, slots: Record<string, () => unknown> = {}) => {
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return () => h(ShowMore, props, { default: () => h('p', 'Sample content'), ...slots })
      },
    }),
    { attachTo: document.body },
  )
  return settle()
}

beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
  vi.restoreAllMocks()
})

describe('ShowMore contract', () => {
  it.each(['', '   '])('throws a ContractError when moreLabel is blank (%j)', async (moreLabel) => {
    await mounted({ moreLabel })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('ShowMore')
    expect(errors[0].message).toContain('requires a non-empty `moreLabel`')
  })

  it.each(['', '   '])('throws a ContractError when lessLabel is blank (%j)', async (lessLabel) => {
    await mounted({ lessLabel })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires a non-empty `lessLabel`')
  })

  it('reports the first blank label (the check stops at the first violation)', async () => {
    await mounted({ moreLabel: '', lessLabel: '' })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('moreLabel')
  })

  it('passes with the default labels, custom labels and no props', async () => {
    await mounted({})
    await mounted({ moreLabel: 'Read the full note', lessLabel: 'Collapse the note' })
    expect(errors).toEqual([])
  })

  it('accepts the more and less slots instead of the label props', async () => {
    await mounted({ moreLabel: '', lessLabel: '' }, { more: () => 'Open', less: () => 'Close' })
    expect(errors).toEqual([])
  })

  it('warn mode logs without throwing', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted({ moreLabel: '' })
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledTimes(1)
    expect(String(spy.mock.calls[0][0])).toContain('ShowMore')
  })

  it('off mode is silent', async () => {
    configureStrictMode('off')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted({ moreLabel: '', lessLabel: '' })
    expect(errors).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })
})
