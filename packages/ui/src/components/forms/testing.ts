/**
 * Test harness for the forms contract tests. Mounts a tree with strict mode on and collects the errors Vue routes to
 * `onErrorCaptured`, so a test can assert on the `ContractError` a missing label or value raises.
 */
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, nextTick, onErrorCaptured, type VNodeChild } from 'vue'
import { afterEach, beforeEach } from 'vitest'
import { configureStrictMode } from '../../lib/contract'

export const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

/** Call once at the top of a contract test file: strict mode on before each test, off and unmounted after. */
export function useStrictHarness() {
  const errors: Error[] = []
  let wrapper: VueWrapper | undefined
  const unmount = () => {
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
  }
  const mountTree = async (root: () => VNodeChild) => {
    unmount()
    errors.length = 0
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
    return wrapper
  }
  beforeEach(() => {
    errors.length = 0
    configureStrictMode('throw')
  })
  afterEach(() => {
    unmount()
    configureStrictMode('off')
  })
  return { errors, mountTree, unmount }
}
