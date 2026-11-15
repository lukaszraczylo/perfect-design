import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import Hero from './Hero.vue'

const { errors, open, messages } = useContractHarness()

describe('Hero contract', () => {
  it('throws a ContractError when the hero has no heading', async () => {
    await open(Hero, { subtitle: 'Only a subtitle' })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('Hero: requires a heading')
    expect(messages()[0]).toContain('`title`')
    await open(Hero, { title: '  ' })
    expect(errors).toHaveLength(1)
  })
  it('is satisfied by title, the title slot, a heading in the default slot or an aria-label', async () => {
    await open(Hero, { title: 'A headline' })
    expect(errors).toEqual([])
    await open(Hero, {}, { title: () => 'Slot headline' })
    expect(errors).toEqual([])
    await open(Hero, {}, { default: () => h('h2', 'Own heading') })
    expect(errors).toEqual([])
    await open(Hero, { 'aria-label': 'Product introduction' })
    expect(errors).toEqual([])
    await open(Hero, { 'aria-labelledby': 'elsewhere' })
    expect(errors).toEqual([])
  })
  it('does not complain about a realistic hero', async () => {
    await open(Hero, { variant: 'split', title: 'A headline', subtitle: 'Sub', level: 2, background: 'grid' }, { actions: () => h('button', 'Do it') })
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(Hero, {})
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Hero: requires a heading'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(Hero, {})
    expect(spy).not.toHaveBeenCalled()
  })
})
