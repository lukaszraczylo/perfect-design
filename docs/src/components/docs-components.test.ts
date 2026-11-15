import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Component } from 'vue'
import type { ExampleDoc } from '@ui/docs-types'
import ExampleRunner from './ExampleRunner.vue'
import PropsTable from './PropsTable.vue'
import SearchBox from './SearchBox.vue'
import CodeSnippet from './CodeSnippet.vue'

const router = () => createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }] })
const runner = (props: Record<string, unknown>) => mount(ExampleRunner as Component, { props, global: { plugins: [createPinia()] } })
// The live demo loads through defineAsyncComponent (compiler + registry chunk): several microtask rounds land it.
const settle = async () => {
  await flushPromises()
  await flushPromises()
  await flushPromises()
}

describe('ExampleRunner', () => {
  const ex: ExampleDoc = { title: 'Basic', code: '<Button>Hi</Button>' }

  it('defers the live demo until visible (placeholder, aria-busy)', () => {
    const w = runner({ example: ex })
    expect(w.find('[data-testid="example-preview"]').attributes('aria-busy')).toBe('true')
    expect(w.text()).toContain('Loading preview')
  })

  it('renders the live preview with library components and a code view', async () => {
    const w = runner({ example: ex, eager: true })
    await vi.waitFor(() => expect(w.find('[data-testid="example-preview"] button').exists()).toBe(true))
    expect(w.find('[data-testid="example-preview"] button').text()).toBe('Hi')
    expect(w.find('[data-testid="example-preview"]').attributes('aria-busy')).toBe('false')
    await w.findAll('button[aria-pressed]')[1].trigger('click')
    expect(w.text()).toContain('<Button>Hi</Button>')
  })

  it('uses state() for reactive examples', async () => {
    const w = runner({ eager: true, example: { title: 'S', code: '<span>{{ msg }}</span>', state: () => ({ msg: 'from state' }) } })
    await vi.waitFor(() => expect(w.text()).toContain('from state'))
  })

  it('shows the script block in the code view when provided', async () => {
    const w = runner({ eager: true, example: { ...ex, script: 'const a = 1' } })
    await w.findAll('button[aria-pressed]')[1].trigger('click')
    expect(w.text()).toContain('const a = 1')
  })

  it('mounts a plain example without any Vue warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = runner({ eager: true, example: { title: 'Plain', code: '<p>{{ 1 + 1 }} <Button>Ok</Button></p>' } })
    await vi.waitFor(() => expect(w.text()).toContain('2'))
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([])
    warn.mockRestore()
  })

  it('keeps example state reactive: assignments in handlers re-render, with no Vue warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { ref } = await import('vue')
    const w = runner({ eager: true, example: { title: 'State', code: '<button type="button" @click="count++">{{ count }}</button><span v-if="count > 1">many</span>', state: () => ({ count: ref(0) }) } })
    await vi.waitFor(() => expect(w.find('[data-testid="example-preview"] button').exists()).toBe(true))
    const button = w.find('[data-testid="example-preview"] button')
    await button.trigger('click')
    await button.trigger('click')
    expect(button.text()).toBe('2')
    expect(w.text()).toContain('many')
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([])
    warn.mockRestore()
  })

  it('does not crash on an unknown component', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = runner({ eager: true, example: { title: 'Bad', code: '<NopeComponent />' } })
    await vi.waitFor(() => expect(w.find('[data-testid="example-preview"]').attributes('aria-busy')).toBe('false'))
    expect(w.exists()).toBe(true)
    warn.mockRestore()
  })

  it('exposes the preview/code switch as a pressed-state button group with accessible names', () => {
    const w = runner({ example: ex })
    const group = w.find('[role=group]')
    expect(group.attributes('aria-label')).toContain('Basic')
    expect(w.findAll('button[aria-pressed]').map((b) => b.attributes('aria-pressed'))).toEqual(['true', 'false'])
  })

  it('is a labelled figure so screen readers announce the example title', () => {
    const w = runner({ example: ex })
    expect(w.find('figure').attributes('aria-labelledby')).toBe(w.find('h3').attributes('id'))
  })
})

describe('PropsTable', () => {
  it('lists props with defaults and required marker', () => {
    const w = mount(PropsTable, { props: { props: [{ name: 'size', type: "'sm'", default: "'md'", description: 'd' }, { name: 'id', type: 'string', required: true, description: 'x' }] } })
    expect(w.text()).toContain("'md'")
    expect(w.find('[title=required]').exists()).toBe(true)
    expect(w.text()).toContain('None')
  })
  it('shows an empty message with no props', () => {
    expect(mount(PropsTable, { props: { props: [] } }).text()).toContain('No props')
  })
})

describe('SearchBox', () => {
  it('shows no results for an empty query and a message for no matches', async () => {
    const w = mount(SearchBox, { global: { plugins: [router()] } })
    const input = w.find('input')
    await input.trigger('focus')
    expect(w.find('[role=listbox]').exists()).toBe(false)
    await input.setValue('zzzzzzzzzz-no-such-component')
    expect(w.text()).toContain('No component matches')
  })
  it('ranks name matches and navigates on Enter', async () => {
    const r = router()
    const push = vi.spyOn(r, 'push')
    const w = mount(SearchBox, { global: { plugins: [r] } })
    const input = w.find('input')
    await input.trigger('focus')
    await input.setValue('button')
    await flushPromises()
    expect(w.findAll('[role=option]').length).toBeGreaterThan(0)
    await input.trigger('keydown', { key: 'Enter' })
    expect(push).toHaveBeenCalled()
    expect(String(push.mock.calls[0][0])).toMatch(/^\/components\//)
  })
  it('Escape clears the query', async () => {
    const w = mount(SearchBox, { global: { plugins: [router()] } })
    const input = w.find('input')
    await input.setValue('abc')
    await input.trigger('keydown', { key: 'Escape' })
    expect((input.element as HTMLInputElement).value).toBe('')
  })
})

describe('CodeSnippet', () => {
  it('copies code and swaps the label, tolerates clipboard failure', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const w = mount(CodeSnippet, { props: { code: 'x=1' } })
    await w.find('button').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('x=1')
    expect(w.find('button').attributes('aria-label')).toBe('Copied')
    writeText.mockRejectedValueOnce(new Error('denied'))
    const w2 = mount(CodeSnippet, { props: { code: 'y' } })
    await w2.find('button').trigger('click')
    await flushPromises()
    expect(w2.find('button').attributes('aria-label')).toBe('Copy code')
  })
  it('makes the scrollable code region keyboard focusable and labelled (WCAG 2.1.1)', () => {
    const pre = mount(CodeSnippet, { props: { code: 'a', label: 'main.ts' } }).find('pre')
    expect(pre.attributes('tabindex')).toBe('0')
    expect(pre.attributes('role')).toBe('region')
    expect(pre.attributes('aria-label')).toBe('main.ts: a')
  })
})
