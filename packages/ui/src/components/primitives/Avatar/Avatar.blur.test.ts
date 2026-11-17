import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import Avatar from './Avatar.vue'
import AvatarGroup from '../AvatarGroup/AvatarGroup.vue'

const BLUR = 'blur-md'
const withProvider = (blurMedia: boolean | undefined, child: () => ReturnType<typeof h>) => mount({ render: () => h(ConfigProvider, { blurMedia }, child) })

describe('Avatar blurred', () => {
  it('default output is unchanged: no blur class, no data-blurred, no wrapper', () => {
    const w = mount(Avatar, { props: { src: '/a.png', name: 'Ada Lovelace' } })
    expect(w.attributes('data-blurred')).toBeUndefined()
    expect(w.html()).not.toContain('blur')
    expect(w.find('[data-slot="avatar-media"]').exists()).toBe(false)
    expect(w.find('img').classes()).toEqual(['size-full', 'rounded-[inherit]', 'object-cover'])
  })

  it('blurs the image element only, clipped by a wrapper, root is not blurred', () => {
    const w = mount(Avatar, { props: { src: '/a.png', name: 'Ada Lovelace', blurred: true } })
    expect(w.attributes('data-blurred')).toBe('')
    expect(w.classes().join(' ')).not.toContain(BLUR)
    expect(w.find('img').classes()).toContain(BLUR)
    const media = w.find('[data-slot="avatar-media"]')
    expect(media.classes()).toContain('overflow-hidden')
    expect(media.classes()).not.toContain(BLUR)
  })

  it('blurs the initials fallback too', () => {
    const w = mount(Avatar, { props: { name: 'Ada Lovelace', blurred: true } })
    expect(w.find('[data-slot="avatar-fallback"]').classes()).toContain(BLUR)
    expect(w.text()).toBe('AL')
  })

  it('keeps the accessible name and the status dot sharp', () => {
    const w = mount(Avatar, { props: { name: 'Ada', status: 'success', blurred: true } })
    expect(w.attributes('aria-label')).toBe('Ada, success')
    expect(w.find('[data-slot="avatar-status"]').classes().join(' ')).not.toContain(BLUR)
  })

  it('keeps alt text on the image', () => {
    const w = mount(Avatar, { props: { src: '/a.png', name: 'Ada', alt: 'Portrait of Ada', blurred: true } })
    expect(w.find('img').attributes('alt')).toBe('Portrait of Ada')
  })

  it('has no transition class outside motion-safe', () => {
    const w = mount(Avatar, { props: { src: '/a.png', name: 'Ada', blurred: true } })
    const transitions = w.find('img').classes().filter((c) => c.includes('transition'))
    expect(transitions.length).toBeGreaterThan(0)
    for (const c of transitions) expect(c.startsWith('motion-safe:')).toBe(true)
  })

  it('inherits ConfigProvider blurMedia', () => {
    const w = withProvider(true, () => h(Avatar, { src: '/a.png', name: 'Ada' }))
    expect(w.find('[data-slot="avatar"]').attributes('data-blurred')).toBe('')
    expect(w.find('img').classes()).toContain(BLUR)
  })

  it('own blurred=false beats a blurring provider; own blurred=true beats a clear one', () => {
    const off = withProvider(true, () => h(Avatar, { src: '/a.png', name: 'Ada', blurred: false }))
    expect(off.find('img').classes()).not.toContain(BLUR)
    const on = withProvider(false, () => h(Avatar, { src: '/a.png', name: 'Ada', blurred: true }))
    expect(on.find('img').classes()).toContain(BLUR)
  })
})

describe('AvatarGroup blurred', () => {
  it('blurs every item and slotted avatar but not the +N count', () => {
    const w = mount(AvatarGroup, {
      props: { blurred: true, max: 2, items: [{ name: 'Ada Lovelace' }, { name: 'Bo Lin' }] },
      slots: { default: () => h(Avatar, { name: 'Cy Dee' }) },
    })
    expect(w.attributes('data-blurred')).toBe('')
    const avatars = w.findAll('[data-slot="avatar"]')
    expect(avatars).toHaveLength(2)
    for (const a of avatars) expect(a.attributes('data-blurred')).toBe('')
    const overflow = w.find('[data-slot="avatar-group-overflow"]')
    expect(overflow.text()).toBe('+1')
    expect(overflow.attributes('data-blurred')).toBeUndefined()
    expect(overflow.classes().join(' ')).not.toContain(BLUR)
  })

  it('a slotted avatar with blurred=false stays sharp', () => {
    const w = mount(AvatarGroup, { props: { blurred: true }, slots: { default: () => [h(Avatar, { name: 'Ada', blurred: false }), h(Avatar, { name: 'Bo' })] } })
    const [a, b] = w.findAll('[data-slot="avatar"]')
    expect(a.attributes('data-blurred')).toBeUndefined()
    expect(b.attributes('data-blurred')).toBe('')
  })

  it('default output is unchanged', () => {
    const w = mount(AvatarGroup, { props: { items: [{ name: 'Ada' }] } })
    expect(w.attributes('data-blurred')).toBeUndefined()
    expect(w.html()).not.toContain('blur')
  })

  it('inherits the provider and the group prop wins over it', () => {
    const inherited = withProvider(true, () => h(AvatarGroup, { items: [{ name: 'Ada' }] }))
    expect(inherited.find('[data-slot="avatar"]').attributes('data-blurred')).toBe('')
    const own = withProvider(true, () => h(AvatarGroup, { blurred: false, items: [{ name: 'Ada' }] }))
    expect(own.find('[data-slot="avatar"]').attributes('data-blurred')).toBeUndefined()
  })
})
