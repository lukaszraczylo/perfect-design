/** Contract tests: every documented requirement throws a ContractError, accepted alternatives pass, modes behave. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured, type VNodeChild } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { ActivityFeed } from './index'

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
const fails = async (root: () => VNodeChild, ...fragments: string[]) => {
  await open(root)
  expect(errors, errors.map((e) => e.message).join('\n')).toHaveLength(1)
  expect(errors[0].name).toBe('ContractError')
  for (const f of fragments) expect(errors[0].message).toContain(f)
}
const passes = async (root: () => VNodeChild) => {
  await open(root)
  expect(errors.map((e) => e.message)).toEqual([])
}

beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
  vi.restoreAllMocks()
})

const ev = [{ id: 'a', actor: 'Deploy bot', action: 'deployed', time: '2026-03-04T11:42:00Z' }]
const feed = (props: Record<string, unknown> = {}) => () => h(ActivityFeed as never, { label: 'Sample activity', events: ev, ...props })

describe('ActivityFeed contract', () => {
  it('requires an accessible name (requires a name)', async () => {
    await fails(feed({ label: undefined }), 'ActivityFeed: needs an accessible name', 'label')
    await fails(feed({ label: '  ' }), 'needs an accessible name')
    await passes(feed())
    await passes(feed({ label: undefined, 'aria-label': 'Project activity' }))
    await passes(feed({ label: undefined, 'aria-labelledby': 'heading-1' }))
  })

  it('an empty feed still needs a name and passes with one', async () => {
    await fails(feed({ label: undefined, events: [] }), 'needs an accessible name')
    await passes(feed({ events: [] }))
  })

  it('requires an id on every event', async () => {
    await fails(feed({ events: [{ action: 'x', time: 'now' }] }), 'event 1 needs an `id`')
    await fails(feed({ events: [{ id: '', action: 'x', time: 'now' }] }), 'event 1 needs an `id`')
    await fails(feed({ events: [{ id: Number.NaN, action: 'x', time: 'now' }] }), 'needs an `id`')
    await passes(feed({ events: [{ id: 0, action: 'x', time: 'now' }, { id: 'b', action: 'y', time: 'now' }] }))
  })

  it('requires unique ids', async () => {
    await fails(feed({ events: [{ id: 'a', action: 'x', time: 'now' }, { id: 'a', action: 'y', time: 'now' }] }), 'event ids must be unique', '"a"', 'event 2')
    await passes(feed({ events: [{ id: 1, action: 'x', time: 'now' }, { id: '1', action: 'y', time: 'now' }] }))
  })

  it('requires a non-blank action and names the event', async () => {
    await fails(feed({ events: [{ id: 'z', action: '  ', time: 'now' }] }), 'event 1 ("z") needs `action`')
    await fails(feed({ events: [{ id: 'z', time: 'now' }] }), 'needs `action`')
    await fails(feed({ events: [null] }), 'needs an `id`')
  })

  it('checks events that arrive after mount', async () => {
    const { ref } = await import('vue')
    const events = ref<unknown[]>([])
    await open(() => h(ActivityFeed as never, { label: 'Sample activity', events: events.value }))
    expect(errors).toHaveLength(0)
    events.value = [{ id: 'a', action: '', time: 'now' }]
    await settle()
    expect(errors.map((e) => e.message).join()).toContain('needs `action`')
  })

  it('does not throw in warn or off mode', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await passes(feed({ label: undefined, events: [{ id: 'a', action: '', time: 'now' }] }))
    expect(spy.mock.calls.map((c) => String(c[0])).join('\n')).toContain('ActivityFeed')
    configureStrictMode('off')
    spy.mockClear()
    await passes(feed({ label: undefined, events: [{ action: '' }] }))
    expect(spy).not.toHaveBeenCalled()
  })

  it('the normal documented usage raises nothing', async () => {
    await passes(feed({ variant: 'grouped', hasMore: true, expanded: [], now: '2026-03-04T12:00:00Z', events: [...ev, { id: 'b', action: 'ran', time: '2026-03-03T10:00:00Z', tone: 'warning', details: 'More' }] }))
  })
})
