import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useContractHarness } from '../shared/contract-harness/testing'
import FaqList from './FaqList.vue'

const { errors, open, messages } = useContractHarness()
const items = [{ q: 'First question?', a: 'First answer.' }, { q: 'Second question?', a: 'Second answer.' }]

describe('FaqList contract', () => {
  it('throws a ContractError when a question is empty, naming the item', async () => {
    await open(FaqList, { items: [items[0], { q: ' ', a: 'Answer' }] })
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(messages()[0]).toContain('FaqList: requires a non-empty question `q` in every item (items[1] has none)')
  })
  it('throws when an answer is empty and reports only the first broken item', async () => {
    await open(FaqList, { items: [items[0], { q: 'Q?', a: '' }, { q: '', a: '' }] })
    expect(errors).toHaveLength(1)
    expect(messages()[0]).toContain('non-empty answer `a`')
    expect(messages()[0]).toContain('items[1]')
  })
  it('accepts an empty answer when the answer slot renders it', async () => {
    await open(FaqList, { items: [{ q: 'Q?', a: '' }] }, { answer: () => h('p', 'Rich answer') })
    expect(errors).toEqual([])
  })
  it('still requires the question when the answer slot is used', async () => {
    await open(FaqList, { items: [{ q: '', a: 'A' }] }, { answer: () => h('p', 'Rich answer') })
    expect(errors).toHaveLength(1)
  })
  it('does not complain about normal usage, categories or an empty list', async () => {
    await open(FaqList, { items })
    expect(errors).toEqual([])
    await open(FaqList, { items: items.map((i) => ({ ...i, category: 'Setup' })), variant: 'with-categories', categoryMode: 'tabs' })
    expect(errors).toEqual([])
    await open(FaqList, {})
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await open(FaqList, { items: [{ q: '', a: '' }] })
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('FaqList: requires a non-empty'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await open(FaqList, { items: [{ q: '', a: '' }] })
    expect(spy).not.toHaveBeenCalled()
  })
})
