import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import Banner from './Banner.vue'
import Alert from '../Alert/Alert.vue'
import { BANNER_STORAGE_PREFIX } from './storage'

beforeEach(() => localStorage.clear())
afterEach(() => (document.body.innerHTML = ''))

describe('Banner storage and focus', () => {
  it('first render ignores storage (hydration safe), then hides after mount', async () => {
    localStorage.setItem(`${BANNER_STORAGE_PREFIX}promo`, '1')
    const html = await renderToString(h(Banner, { storageKey: 'promo' }, () => 'Hi'))
    expect(html).toContain('data-slot="banner"')
    const w = mount(Banner, { props: { storageKey: 'promo' }, slots: { default: 'Hi' } })
    await nextTick()
    expect(w.find('[data-slot="banner"]').exists()).toBe(false)
  })

  it('moves focus to the next focusable sibling after dismiss', async () => {
    const Host = defineComponent({
      render: () => h('div', [h(Banner, { dismissible: true }, () => 'Msg'), h('button', { id: 'next' }, 'Next')]),
    })
    const w = mount(Host, { attachTo: document.body })
    const dismiss = w.find('[data-slot="banner-dismiss"]').element as HTMLElement
    dismiss.focus()
    await w.find('[data-slot="banner-dismiss"]').trigger('click')
    expect(document.activeElement?.id).toBe('next')
  })

  it('falls back to the parent region with tabindex=-1', async () => {
    const Host = defineComponent({ render: () => h('section', { id: 'region' }, [h(Alert, { dismissible: true }, () => 'Msg')]) })
    const w = mount(Host, { attachTo: document.body })
    ;(w.find('[data-slot="alert-dismiss"]').element as HTMLElement).focus()
    await w.find('[data-slot="alert-dismiss"]').trigger('click')
    const region = document.getElementById('region')!
    expect(region.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(region)
  })
})
