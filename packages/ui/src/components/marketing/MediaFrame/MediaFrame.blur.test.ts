import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import MediaFrame from './MediaFrame.vue'

// Vue skips a bubbling listener attached in the same millisecond as the event, so wait before clicking a fresh mount.
const settle = () => new Promise((r) => setTimeout(r, 5))
const toggle = (w: ReturnType<typeof mount>) => w.find('[data-slot="media-blur-toggle"]')
const content = (w: ReturnType<typeof mount>) => w.find('[data-slot="media-frame-content"]')

describe('MediaFrame blurred', () => {
  it('default output is unchanged', () => {
    const w = mount(MediaFrame, { props: { src: '/a.png', alt: 'Shot' } })
    expect(w.attributes('data-blurred')).toBeUndefined()
    expect(w.html()).not.toContain('blur')
    expect(toggle(w).exists()).toBe(false)
  })

  it('blurs the content children, clips the content area, keeps the chrome and alt sharp', () => {
    const w = mount(MediaFrame, { props: { src: '/a.png', alt: 'Shot', title: 'localhost', blurred: true } })
    expect(w.attributes('data-blurred')).toBe('')
    expect(content(w).classes()).toContain('overflow-hidden')
    expect(content(w).classes().join(' ')).toContain('[&>*]:blur-md')
    expect(w.find('[data-slot="media-frame-bar"]').classes().join(' ')).not.toContain('blur')
    expect(w.find('img').attributes('alt')).toBe('Shot')
  })

  it('blurs slotted content as well', () => {
    const w = mount(MediaFrame, { props: { blurred: true }, slots: { default: '<pre>secret</pre>' } })
    expect(content(w).classes().join(' ')).toContain('[&>*]:blur-md')
    expect(w.find('pre').text()).toBe('secret')
  })

  it('transition classes are motion-safe only', () => {
    const w = mount(MediaFrame, { props: { blurred: true, src: '/a.png', alt: '' } })
    for (const c of content(w).classes().filter((x) => x.includes('transition'))) expect(c).toContain('motion-safe:')
  })

  it('ConfigProvider default and own override, both ways', () => {
    const inherit = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => h(MediaFrame, { src: '/a.png', alt: '' })) })
    expect(inherit.find('figure').attributes('data-blurred')).toBe('')
    const off = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => h(MediaFrame, { src: '/a.png', alt: '', blurred: false })) })
    expect(off.find('figure').attributes('data-blurred')).toBeUndefined()
    const on = mount({ render: () => h(ConfigProvider, { blurMedia: false }, () => h(MediaFrame, { src: '/a.png', alt: '', blurred: true })) })
    expect(on.find('figure').attributes('data-blurred')).toBe('')
  })

  describe('revealable', () => {
    it('shows no button unless revealable', () => {
      expect(toggle(mount(MediaFrame, { props: { blurred: true } })).exists()).toBe(false)
    })

    it('uncontrolled defaultBlurred: reveal, then hide again, with changing action names', async () => {
      const w = mount(MediaFrame, { props: { defaultBlurred: true, revealable: true, src: '/a.png', alt: '' } })
      expect(toggle(w).text()).toBe('Show image')
      expect(toggle(w).attributes('aria-pressed')).toBeUndefined()
      await settle()
      await toggle(w).trigger('click')
      expect(w.attributes('data-blurred')).toBeUndefined()
      expect(toggle(w).text()).toBe('Hide image')
      expect(toggle(w).attributes('aria-pressed')).toBeUndefined()
      expect(w.emitted('update:blurred')).toEqual([[false]])
      await settle()
      await toggle(w).trigger('click')
      expect(w.attributes('data-blurred')).toBe('')
      expect(w.emitted('update:blurred')).toEqual([[false], [true]])
    })

    it('controlled: emits and follows the parent value (both directions)', async () => {
      const w = mount(MediaFrame, { props: { blurred: true, revealable: true } })
      await settle()
      await toggle(w).trigger('click')
      expect(w.emitted('update:blurred')).toEqual([[false]])
      expect(w.attributes('data-blurred')).toBe('')
      await w.setProps({ blurred: false })
      expect(w.attributes('data-blurred')).toBeUndefined()
      expect(toggle(w).text()).toBe('Hide image')
      await w.setProps({ blurred: true })
      expect(toggle(w).text()).toBe('Show image')
    })

    it('labels come from props', () => {
      const w = mount(MediaFrame, { props: { blurred: true, revealable: true, revealLabel: 'Bild zeigen', hideLabel: 'Bild verbergen' } })
      expect(toggle(w).text()).toBe('Bild zeigen')
    })

    it('has no button while the media was never blurred', () => {
      expect(toggle(mount(MediaFrame, { props: { revealable: true } })).exists()).toBe(false)
    })

    it('button has a 44px coarse-pointer target and sits outside the blurred content', () => {
      const w = mount(MediaFrame, { props: { blurred: true, revealable: true } })
      expect(toggle(w).classes().join(' ')).toContain('pointer-coarse:min-h-11')
      expect(content(w).find('[data-slot="media-blur-toggle"]').exists()).toBe(false)
    })
  })
})
