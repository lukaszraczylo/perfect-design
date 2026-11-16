/** Test harness for contract tests of marketing components: strict mode on, errors captured from the mount hooks. Not exported from the barrel. */
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, type Component } from 'vue'
import { afterEach, beforeEach, vi } from 'vitest'
import { configureStrictMode } from '../../../../lib/contract'

export const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

/**
 * Registers beforeEach/afterEach (strict mode 'throw' while a test runs, 'off' afterwards) and returns `open`, which mounts a
 * component inside a wrapper that records the errors Vue routes out of lifecycle hooks, plus `messages()` for assertions.
 */
export function useContractHarness() {
  const errors: Error[] = []
  let wrapper: VueWrapper | undefined
  beforeEach(() => {
    errors.length = 0
    configureStrictMode('throw')
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    document.body.replaceChildren()
    configureStrictMode('off')
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })
  const open = async (component: Component, props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) => {
    wrapper?.unmount()
    errors.length = 0
    wrapper = mount(
      defineComponent({
        setup() {
          onErrorCaptured((e) => {
            errors.push(e as Error)
            return false
          })
          return () => h(component, props, slots)
        },
      }),
      { attachTo: document.body },
    )
    await settle()
    return wrapper
  }
  return { errors, open, messages: () => errors.map((e) => e.message) }
}
