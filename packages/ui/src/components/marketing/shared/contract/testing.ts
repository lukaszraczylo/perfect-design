/** Test helper for the contract tests of marketing components: mounts a tree and collects what Vue's error handling receives. */
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, type Component, type VNodeChild } from 'vue'

/** Lets async `onMounted` hooks (which await a tick or two) finish. */
export const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

/** `h` for a component whose props are deliberately incomplete (contract tests omit required props on purpose). */
export const el = (component: unknown, props: Record<string, unknown> | null = null, slots?: Record<string, () => VNodeChild>) => h(component as Component, props, slots)

export function strictMount() {
  const errors: Error[] = []
  let wrapper: VueWrapper | undefined
  return {
    errors,
    /** Mounts `render()` under an error-capturing parent and waits for the contract checks to run. */
    async mount(render: () => VNodeChild) {
      wrapper = mount(
        defineComponent({
          setup() {
            onErrorCaptured((e) => {
              errors.push(e as Error)
              return false
            })
            return render
          },
        }),
        { attachTo: document.body },
      )
      await settle()
      return wrapper
    },
    /** Messages of the captured errors, one string. */
    text: () => errors.map((e) => e.message).join('\n'),
    reset() {
      wrapper?.unmount()
      wrapper = undefined
      errors.length = 0
      document.body.replaceChildren()
    },
  }
}
