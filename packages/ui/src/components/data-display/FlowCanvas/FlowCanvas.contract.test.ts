import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { ContractError, configureStrictMode } from '../../../lib/contract'
import FlowCanvas from './FlowCanvas.vue'
import { EDGES, NODES } from './testing'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
function capture(props: Record<string, unknown>) {
  const errors: Error[] = []
  const Host = defineComponent({
    setup() {
      onErrorCaptured((e) => {
        errors.push(e as Error)
        return false
      })
      return () => h(FlowCanvas, { label: 'Sample', nodes: NODES(), edges: EDGES(), ...props } as never)
    },
  })
  const w = mount(Host)
  return { w, errors }
}
const messages = (errors: Error[]) => errors.map((e) => e.message)

describe('FlowCanvas contract', () => {
  beforeEach(() => configureStrictMode('throw'))
  afterEach(() => configureStrictMode('off'))

  it('passes for the documented usage', async () => {
    const { errors } = capture({})
    await settle()
    expect(errors).toEqual([])
  })
  it('passes with empty arrays and with aria-label or aria-labelledby instead of label', async () => {
    for (const props of [{ nodes: [], edges: [] }, { label: undefined, 'aria-label': 'Named' }, { label: undefined, 'aria-labelledby': 'h1' }]) {
      const { errors } = capture(props)
      await settle()
      expect(errors).toEqual([])
    }
  })
  it('throws a ContractError when there is no accessible name', async () => {
    const { errors } = capture({ label: undefined })
    await settle()
    expect(errors[0]).toBeInstanceOf(ContractError)
    expect(errors[0]!.message).toContain('FlowCanvas')
    expect(errors[0]!.message).toContain('requires `label` or `aria-label` or `aria-labelledby`')
    expect(errors[0]!.message).toContain('Name what the canvas shows')
  })
  it('throws when nodes is not an array', async () => {
    const { errors } = capture({ nodes: 'x' })
    await settle()
    expect(messages(errors).some((m) => m.includes('requires `nodes`'))).toBe(true)
  })
  it('throws when a node has no id', async () => {
    for (const bad of [{ x: 0, y: 0 }, { id: '', x: 0, y: 0 }, null, 5]) {
      const { errors } = capture({ nodes: [bad] })
      await settle()
      expect(messages(errors).some((m) => m.includes('node 1 needs an `id`'))).toBe(true)
    }
  })
  it('throws when two nodes share an id', async () => {
    const { errors } = capture({ nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'a', x: 5, y: 5 }], edges: [] })
    await settle()
    expect(messages(errors)).toEqual([expect.stringContaining('node ids must be unique, but "a" is used twice')])
  })
  it('throws when a node has no numeric x and y', async () => {
    for (const bad of [{ id: 'a' }, { id: 'a', x: 1 }, { id: 'a', x: '1', y: 2 }, { id: 'a', x: NaN, y: 0 }]) {
      const { errors } = capture({ nodes: [bad], edges: [] })
      await settle()
      expect(messages(errors).some((m) => m.includes('node "a" needs numeric `x` and `y`'))).toBe(true)
    }
  })
  it('throws when edges is not an array', async () => {
    const { errors } = capture({ edges: {} })
    await settle()
    expect(messages(errors).some((m) => m.includes('expects `edges` to be an array'))).toBe(true)
  })
  it('throws when a connection has no id, from or to', async () => {
    for (const bad of [{ from: 'a', to: 'b' }, { id: 'e', to: 'b' }, { id: 'e', from: 'a' }, null]) {
      const { errors } = capture({ edges: [bad] })
      await settle()
      expect(messages(errors).some((m) => m.includes('connection 1 needs `id`, `from` and `to`'))).toBe(true)
    }
  })
  it('throws when two connections share an id', async () => {
    const { errors } = capture({ edges: [{ id: 'e', from: 'a', to: 'b' }, { id: 'e', from: 'b', to: 'c' }] })
    await settle()
    expect(messages(errors)).toEqual([expect.stringContaining('connection ids must be unique, but "e" is used twice')])
  })
  it('does not throw for a connection to an unknown node (it is reported in the page instead)', async () => {
    const { errors, w } = capture({ edges: [{ id: 'e', from: 'a', to: 'ghost' }] })
    await settle()
    expect(errors).toEqual([])
    expect(w.find('[data-slot="flow-canvas-message"]').exists()).toBe(true)
  })
  it('checks again when the data changes later', async () => {
    const errors: Error[] = []
    const Host = defineComponent({
      props: { nodes: { type: Array, default: () => NODES() } },
      setup(p) {
        onErrorCaptured((e) => (errors.push(e as Error), false))
        return () => h(FlowCanvas, { label: 'Sample', nodes: p.nodes as never, edges: [] })
      },
    })
    const w = mount(Host)
    await settle()
    expect(errors).toEqual([])
    await w.setProps({ nodes: [{ id: '' }] })
    await settle()
    expect(errors.length).toBeGreaterThan(0)
  })
  it('never blanks the canvas: it still renders when a rule is broken', async () => {
    const { w } = capture({ label: undefined, nodes: [{ id: 'a', x: 0, y: 0 }, { id: 'a', x: 0, y: 0 }] })
    await settle()
    expect(w.findAll('[data-slot="flow-canvas-node"]')).toHaveLength(1)
  })
  it('logs without throwing in warn mode and is silent in off mode', async () => {
    const logged: unknown[] = []
    const orig = console.error
    console.error = (...a: unknown[]) => void logged.push(a[0])
    try {
      configureStrictMode('warn')
      const warn = capture({ label: undefined })
      await settle()
      expect(warn.errors).toEqual([])
      expect(String(logged[0])).toContain('FlowCanvas')
      logged.length = 0
      configureStrictMode('off')
      capture({ label: undefined })
      await settle()
      expect(logged).toEqual([])
    } finally {
      console.error = orig
    }
  })
})
