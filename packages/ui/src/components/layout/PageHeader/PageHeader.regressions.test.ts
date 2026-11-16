import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import PageHeader from './PageHeader.vue'

describe('PageHeader', () => {
  it('title and description slots appear and disappear at render time', async () => {
    const show = ref(false)
    const Host = defineComponent({
      render: () => h(PageHeader, null, show.value ? { title: () => 'Hello', description: () => 'Desc' } : {}),
    })
    const w = mount(Host)
    expect(w.find('[data-slot="page-header-title"]').exists()).toBe(false)
    show.value = true
    await nextTick()
    expect(w.find('[data-slot="page-header-title"]').exists()).toBe(true)
    expect(w.find('[data-slot="page-header-description"]').exists()).toBe(true)
    show.value = false
    await nextTick()
    expect(w.find('[data-slot="page-header-title"]').exists()).toBe(false)
  })

  it('the back chevron flips in RTL', () => {
    const w = mount(PageHeader, { props: { title: 'T', backHref: '/x' } })
    expect(w.find('[data-slot="page-header-back"] svg').classes()).toContain('rtl:-scale-x-100')
  })
})
