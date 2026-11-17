import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import BeforeAfter from './BeforeAfter.vue'

const base = { before: '/b.png', after: '/a.png', beforeAlt: 'Before', afterAlt: 'After' }
// Vue skips a bubbling listener attached in the same millisecond as the event, so wait before clicking a fresh mount.
const settle = () => new Promise((r) => setTimeout(r, 5))
const toggle = (w: ReturnType<typeof mount>) => w.find('[data-slot="media-blur-toggle"]')

describe('BeforeAfter blurred', () => {
  it('default output is unchanged', () => {
    const w = mount(BeforeAfter, { props: base })
    expect(w.attributes('data-blurred')).toBeUndefined()
    expect(w.find('img').classes()).toEqual(['absolute', 'inset-0', 'size-full', 'object-cover'])
    expect(toggle(w).exists()).toBe(false)
  })

  it('blurs both images only; labels and slider stay sharp', () => {
    const w = mount(BeforeAfter, { props: { ...base, blurred: true } })
    expect(w.attributes('data-blurred')).toBe('')
    for (const img of w.findAll('img')) expect(img.classes()).toContain('blur-md')
    expect(w.classes().join(' ')).not.toContain('blur-md')
    expect(w.find('[data-slot="before-after-before-label"]').classes().join(' ')).not.toContain('blur')
    expect(w.find('[role="slider"]').classes().join(' ')).not.toContain('blur')
    expect(w.findAll('img').map((i) => i.attributes('alt'))).toEqual(['Before', 'After'])
  })

  it('provider default and own override, both ways', () => {
    const a = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => h(BeforeAfter, base)) })
    expect(a.find('[data-slot="before-after"]').attributes('data-blurred')).toBe('')
    const b = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => h(BeforeAfter, { ...base, blurred: false })) })
    expect(b.find('[data-slot="before-after"]').attributes('data-blurred')).toBeUndefined()
  })

  it('revealable: uncontrolled toggle with a changing action name and events', async () => {
    const w = mount(BeforeAfter, { props: { ...base, defaultBlurred: true, revealable: true } })
    expect(toggle(w).attributes('aria-pressed')).toBeUndefined()
    await settle()
    await toggle(w).trigger('click')
    expect(w.attributes('data-blurred')).toBeUndefined()
    expect(toggle(w).attributes('aria-pressed')).toBeUndefined()
    expect(w.emitted('update:blurred')).toEqual([[false]])
    await settle()
    await toggle(w).trigger('click')
    expect(w.attributes('data-blurred')).toBe('')
  })

  it('revealable: controlled both directions', async () => {
    const w = mount(BeforeAfter, { props: { ...base, blurred: true, revealable: true } })
    await settle()
    await toggle(w).trigger('click')
    expect(w.emitted('update:blurred')).toEqual([[false]])
    expect(w.attributes('data-blurred')).toBe('')
    await w.setProps({ blurred: false })
    expect(w.attributes('data-blurred')).toBeUndefined()
  })

  it('pressing the button does not move the divider', async () => {
    const w = mount(BeforeAfter, { props: { ...base, blurred: true, revealable: true } })
    await toggle(w).trigger('pointerdown', { clientX: 10, clientY: 10 })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})
