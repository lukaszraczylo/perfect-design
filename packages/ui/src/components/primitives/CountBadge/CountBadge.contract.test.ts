/** Contract tests for CountBadge: a rendered badge needs non-empty `label` text. Strict mode is switched on here. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, ref } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import CountBadge from './CountBadge.vue'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

const errors: Error[] = []
let wrapper: VueWrapper | undefined
const mounted = (props: Record<string, unknown>) => {
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return () => h(CountBadge, props)
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

describe('CountBadge contract', () => {
  it('throws a ContractError when a count has no label', async () => {
    await mounted({ count: 3 })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('CountBadge')
    expect(errors[0].message).toContain('requires a non-empty `label`')
  })

  it('throws when a dot has no label', async () => {
    await mounted({ dot: true })
    expect(errors.map((e) => e.message).join()).toContain('requires a non-empty `label`')
  })

  it.each(['', '   '])('throws for a blank label %j', async (label) => {
    await mounted({ count: 3, label })
    expect(errors).toHaveLength(1)
  })

  it('throws for a visible zero without a label', async () => {
    await mounted({ count: 0, showZero: true })
    expect(errors).toHaveLength(1)
  })

  it('passes with a label, for counts and dots', async () => {
    await mounted({ count: 3, label: '3 unread messages' })
    await mounted({ dot: true, label: 'New activity' })
    expect(errors).toEqual([])
  })

  it('does not check a badge that renders nothing', async () => {
    await mounted({ count: 0 })
    await mounted({})
    await mounted({ dot: true, count: 0 })
    await mounted({ count: Number.NaN })
    expect(errors).toEqual([])
  })

  it('checks when a hidden badge starts to render without a label', async () => {
    const count = ref(0)
    wrapper = mount(
      defineComponent({
        setup() {
          onErrorCaptured((e) => {
            errors.push(e as Error)
            return false
          })
          return () => h(CountBadge, { count: count.value })
        },
      }),
      { attachTo: document.body },
    )
    await settle()
    expect(errors).toEqual([])
    count.value = 2
    await settle()
    expect(errors).toHaveLength(1)
    count.value = 0
    await settle()
    expect(errors).toHaveLength(1)
  })

  it('warn mode logs without throwing', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted({ count: 3 })
    expect(errors).toEqual([])
    expect(spy).toHaveBeenCalledTimes(1)
    expect(String(spy.mock.calls[0][0])).toContain('CountBadge')
  })

  it('off mode is silent', async () => {
    configureStrictMode('off')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mounted({ count: 3 })
    expect(errors).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })
})
