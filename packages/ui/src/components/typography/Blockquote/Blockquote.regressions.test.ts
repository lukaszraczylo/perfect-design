import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import Blockquote from './Blockquote.vue'

afterEach(() => vi.restoreAllMocks())

describe('Blockquote authorRole', () => {
  it('authorRole renders the role without a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(Blockquote, { props: { author: 'Ada', authorRole: 'CTO' }, slots: { default: 'Q' } })
    expect(w.find('[data-slot="blockquote-role"]').text()).toBe('CTO')
    expect(warn).not.toHaveBeenCalled()
  })

  it('deprecated role still renders and warns once per instance, naming authorRole', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(Blockquote, { props: { author: 'Ada', role: 'CTO' }, slots: { default: 'Q' } })
    expect(w.find('[data-slot="blockquote-role"]').text()).toBe('CTO')
    await w.setProps({ role: 'CEO' })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('authorRole')
  })

  it('authorRole wins over role and does not warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mount(Blockquote, { props: { author: 'Ada', role: 'old', authorRole: 'new' }, slots: { default: 'Q' } })
    expect(w.find('[data-slot="blockquote-role"]').text()).toBe('new')
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('Blockquote slot presence is evaluated at render time', () => {
  it('shows and hides the author row when a slot appears and disappears', async () => {
    const show = ref(false)
    const Host = defineComponent({
      render: () => h(Blockquote, null, { default: () => 'Q', ...(show.value ? { author: () => 'Ada' } : {}) }),
    })
    const w = mount(Host)
    expect(w.find('[data-slot="blockquote-author"]').exists()).toBe(false)
    show.value = true
    await nextTick()
    expect(w.find('[data-slot="blockquote-author"]').exists()).toBe(true)
    show.value = false
    await nextTick()
    expect(w.find('[data-slot="blockquote-author"]').exists()).toBe(false)
  })
})
