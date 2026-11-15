/**
 * Leaderboard contract: a missing accessible name, a missing, invalid or duplicate entry id and a blank entry label throw a
 * ContractError that names the fix; every accepted alternative passes; 'warn' logs and 'off' is silent.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import Leaderboard from './Leaderboard.vue'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
const errors: Error[] = []
let wrapper: VueWrapper | undefined
const entries = [{ id: 'a', label: 'Team A', value: 3 }, { id: 'b', label: 'Team B', value: 2 }]
const open = async (props: Record<string, unknown>) => {
  errors.length = 0
  wrapper?.unmount()
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return () => h(Leaderboard as never, { label: 'Scores', entries, ...props })
      },
    }),
    { attachTo: document.body },
  )
  await settle()
}
const fails = async (props: Record<string, unknown>, ...fragments: string[]) => {
  await open(props)
  expect(errors.length, 'expected a ContractError').toBeGreaterThan(0)
  expect(errors[0]!.name).toBe('ContractError')
  for (const f of fragments) expect(errors[0]!.message).toContain(f)
}
const passes = async (props: Record<string, unknown>) => {
  await open(props)
  expect(errors.map((e) => e.message)).toEqual([])
}

beforeEach(() => configureStrictMode('throw'))
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
})

describe('Leaderboard contract', () => {
  it('requires an accessible name and says how to give one', async () => {
    await fails({ label: undefined }, 'Leaderboard: needs an accessible name', 'label="Sales by region"')
    await fails({ label: '  ' }, 'needs an accessible name')
    await fails({ label: undefined, entries: [] }, 'needs an accessible name')
    await fails({ label: undefined, variant: 'table' }, 'needs an accessible name')
  })
  it('accepts label, aria-label and aria-labelledby as the name, in every variant', async () => {
    for (const variant of ['list', 'table', 'podium']) {
      await passes({ variant })
      await passes({ variant, label: undefined, 'aria-label': 'Scores' })
      await passes({ variant, label: undefined, 'aria-labelledby': 'heading' })
    }
  })
  it('throws on duplicate entry ids', async () => {
    await fails({ entries: [...entries, { id: 'a', label: 'Team C', value: 1 }] }, 'Leaderboard: entry ids must be unique', '"a"', 'entry 3')
    await fails({ entries: [{ id: 1, label: 'A', value: 1 }, { id: 1, label: 'B', value: 1 }] }, 'must be unique')
  })
  it('treats 1 and "1" as different ids', async () => {
    await passes({ entries: [{ id: 1, label: 'A', value: 1 }, { id: '1', label: 'B', value: 1 }] })
  })
  it('requires a valid id on every entry', async () => {
    await fails({ entries: [{ label: 'A', value: 1 }] }, 'entry 1 needs an `id`')
    await fails({ entries: [{ id: '  ', label: 'A', value: 1 }] }, 'entry 1 needs an `id`')
    await fails({ entries: [{ id: Number.NaN, label: 'A', value: 1 }] }, 'entry 1 needs an `id`')
    await fails({ entries: [null] }, 'entry 1 needs an `id`')
  })
  it('requires a label on every entry', async () => {
    await fails({ entries: [{ id: 'a', value: 1 }] }, 'entry 1 ("a") needs a `label`')
    await fails({ entries: [{ id: 'a', label: ' ', value: 1 }] }, 'needs a `label`')
  })
  it('accepts empty entries, NaN values and unusual but valid data', async () => {
    await passes({ entries: [] })
    await passes({ entries: null })
    await passes({ entries: [{ id: 0, label: 'Zero', value: Number.NaN }, { id: 'x', label: 'X', value: -1, delta: Number.POSITIVE_INFINITY, rank: 9 }] })
  })
  it('re-checks when the entries change', async () => {
    errors.length = 0
    const w = mount(
      defineComponent({
        props: { list: { type: Array, required: true } },
        setup(p) {
          onErrorCaptured((e) => {
            errors.push(e as Error)
            return false
          })
          return () => h(Leaderboard as never, { label: 'Scores', entries: p.list })
        },
      }),
      { props: { list: entries }, attachTo: document.body },
    )
    await settle()
    expect(errors).toEqual([])
    await w.setProps({ list: [...entries, { id: 'a', label: 'Dup', value: 1 }] })
    await settle()
    expect(errors.some((e) => e.message.includes('must be unique'))).toBe(true)
    w.unmount()
  })
  it("'warn' logs the message and does not throw; 'off' is silent and still renders", async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open({ label: undefined, entries: [{ id: 'a', label: 'A', value: 1 }, { id: 'a', label: '', value: 1 }] })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).startsWith('[perfect-design] Leaderboard:'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open({ label: undefined, entries: [{ id: 'a', label: 'A', value: 1 }, { id: 'a', label: '', value: 1 }] })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('[perfect-design]'))).toBe(false)
    expect(wrapper!.findAll('[data-slot="leaderboard-item"]')).toHaveLength(2)
    spy.mockRestore()
  })
})
