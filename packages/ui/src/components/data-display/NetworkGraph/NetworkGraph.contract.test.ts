/**
 * Contract tests: every `requires` entry of NetworkGraph throws a ContractError in strict mode, accepted alternatives pass,
 * and the modes 'warn' and 'off' never throw.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, type VNodeChild } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import NetworkGraph from './NetworkGraph.vue'

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
const graph = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) => () =>
  h(NetworkGraph as never, { nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ from: 'a', to: 'b' }], label: 'Sample network', ...props, ...attrs })
const fails = async (root: () => VNodeChild, ...fragments: string[]) => {
  await open(root)
  expect(errors.map((e) => e.message).join('\n')).not.toBe('')
  expect(errors).toHaveLength(1)
  expect(errors[0]!.name).toBe('ContractError')
  for (const f of fragments) expect(errors[0]!.message).toContain(f)
}
const passes = async (root: () => VNodeChild) => {
  await open(root)
  expect(errors.map((e) => e.message)).toEqual([])
}

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

describe('NetworkGraph contract: a name', () => {
  it('throws a ContractError naming the component when there is no label, title or aria name', async () => {
    await fails(graph({ label: undefined }), 'NetworkGraph', 'label')
  })
  it.each([
    ['label', { label: 'Sample network' }, {}],
    ['title', { label: undefined, title: 'Sample network' }, {}],
    ['aria-label', { label: undefined }, { 'aria-label': 'Sample network' }],
    ['aria-labelledby', { label: undefined }, { 'aria-labelledby': 'heading' }],
  ])('passes with %s', async (_n, props, attrs) => {
    await passes(graph(props, attrs))
  })
  it('the empty state needs a name too, and passes with one', async () => {
    await fails(graph({ label: undefined, nodes: [] }), 'label')
    await passes(graph({ nodes: [] }))
  })
})

describe('NetworkGraph contract: nodes', () => {
  it('throws a ContractError when nodes is not an array', async () => {
    await fails(graph({ nodes: 'a,b' }), 'requires `nodes`')
    await fails(graph({ nodes: undefined }), 'requires `nodes`')
  })
  it('an empty nodes array is valid', async () => {
    await passes(graph({ nodes: [], edges: [] }))
  })
  it('throws a ContractError when a node has no id', async () => {
    await fails(graph({ nodes: [{ id: 'a' }, { label: 'No id' }] }), 'node 2 needs an `id`')
    await fails(graph({ nodes: [{ id: '' }] }), 'node 1 needs an `id`')
    await fails(graph({ nodes: [null] }), 'node 1 needs an `id`')
  })
  it('numeric ids are accepted', async () => {
    await passes(graph({ nodes: [{ id: 1 }, { id: 2 }], edges: [{ from: 1, to: 2 }] }))
  })
})

describe('NetworkGraph contract: edges', () => {
  it('throws a ContractError when edges is given and is not an array', async () => {
    await fails(graph({ edges: { from: 'a', to: 'b' } }), 'expects `edges` to be an array')
  })
  it('edges may be omitted or empty', async () => {
    await passes(graph({ edges: undefined }))
    await passes(graph({ edges: [] }))
  })
  it('throws a ContractError when a connection has no from or no to', async () => {
    await fails(graph({ edges: [{ from: 'a' }] }), 'connection 1 needs `from` and `to`')
    await fails(graph({ edges: [{ from: 'a', to: 'b' }, { to: 'a' }] }), 'connection 2 needs `from` and `to`')
    await fails(graph({ edges: ['a-b'] }), 'connection 1 needs `from` and `to`')
  })
  it('an unknown endpoint is not a contract error (it is skipped with a message)', async () => {
    await passes(graph({ edges: [{ from: 'a', to: 'ghost' }] }))
    expect(wrapper!.find('[data-slot="network-graph-message"]').text()).toBe('1 connection skipped: unknown node id')
  })
  it('checks again when the data changes', async () => {
    await passes(graph())
    const w = mount(
      defineComponent({
        props: { nodes: { type: Array, default: () => [{ id: 'a' }] } },
        setup(p) {
          onErrorCaptured((e) => {
            errors.push(e as Error)
            return false
          })
          return () => h(NetworkGraph as never, { nodes: p.nodes, label: 'Sample network' })
        },
      }),
      { attachTo: document.body },
    )
    await settle()
    expect(errors).toHaveLength(0)
    await w.setProps({ nodes: [{ label: 'broken' }] })
    await settle()
    expect(errors).toHaveLength(1)
    expect(errors[0]!.name).toBe('ContractError')
    w.unmount()
  })
})

describe('NetworkGraph contract: modes', () => {
  it("'off' is silent and 'warn' logs without throwing", async () => {
    configureStrictMode('off')
    await passes(graph({ label: undefined, nodes: 'x', edges: 3 }))
    configureStrictMode('warn')
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    await passes(graph({ label: undefined }))
    expect(err).toHaveBeenCalled()
    expect(String(err.mock.calls[0]![0])).toContain('NetworkGraph')
    err.mockRestore()
  })
  it('normal documented usage has no false positive', async () => {
    await passes(
      graph({
        nodes: [{ id: 'a', label: 'Kestrel Freight', group: 'Depot', size: 3 }, { id: 'b', label: 'Orchard Mill' }],
        edges: [{ from: 'a', to: 'b', weight: 2, directed: true, label: 'Supplies' }, { from: 'b', to: 'b' }],
        variant: 'grouped',
        layout: 'layered',
      }),
    )
  })
})
