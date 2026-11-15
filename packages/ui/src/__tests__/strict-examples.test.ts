/**
 * Every documented example must satisfy the contract it documents: mounted with strict mode on ('throw'), no component
 * may report a missing required part, prop or accessible name. This is what turns "required" in the docs into something
 * that cannot rot: an example (and therefore any copy-pasted usage) that omits a DialogTitle fails here.
 */
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent, nextTick, onErrorCaptured } from 'vue'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ComponentDoc } from '../docs-types'
import { configureStrictMode } from '../lib/contract'
import { allComponents } from '../registry'

const docs = Object.values(import.meta.glob<{ default: ComponentDoc }>('../components/**/*.docs.ts', { eager: true })).map((m) => m.default)

beforeAll(() => configureStrictMode('throw'))
afterAll(() => configureStrictMode('off'))

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

describe('docs examples honour the component contracts (strict mode)', () => {
  it.each(docs.flatMap((d) => d.examples.map((ex) => [`${d.name} › ${ex.title}`, ex] as const)))('%s', async (_name, ex) => {
    const errors: Error[] = []
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Demo = defineComponent({
      components: allComponents,
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return ex.state?.() ?? {}
      },
      template: `<main><div>${ex.code}</div></main>`,
    })
    const w = mount(Demo, { global: { plugins: [createPinia()] }, attachTo: document.body })
    await settle()
    w.unmount()
    document.body.innerHTML = ''
    warn.mockRestore()
    err.mockRestore()
    expect(errors.filter((e) => e.name === 'ContractError').map((e) => e.message)).toEqual([])
  })
})
