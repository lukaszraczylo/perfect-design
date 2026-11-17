import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import ConfigProvider from '../components/layout/ConfigProvider/ConfigProvider.vue'
import BlogCard from '../components/marketing/BlogCard/BlogCard.vue'
import Testimonial from '../components/marketing/Testimonial/Testimonial.vue'
import Blockquote from '../components/typography/Blockquote/Blockquote.vue'
import Leaderboard from '../components/data-display/Leaderboard/Leaderboard.vue'
import ChatMessageImageLink from '../components/data-display/ChatMessage/ChatMessageImageLink.vue'

const wrap = (blurMedia: boolean | undefined, child: () => ReturnType<typeof h>) => mount({ render: () => h(ConfigProvider, { blurMedia }, child) })
const DATA = 'data:image/png;base64,AAAA'

describe('components that show photos honour ConfigProvider blurMedia', () => {
  const cases: [string, () => ReturnType<typeof h>][] = [
    ['Testimonial', () => h(Testimonial, { quote: 'Sample quote.', author: 'Sample person', avatar: '/a.png' })],
    ['Blockquote', () => h(Blockquote, { author: 'Sample person', avatar: '/a.png' }, () => 'Sample quote.')],
    ['BlogCard', () => h(BlogCard, { title: 'Sample post', image: '/c.png', imageAlt: 'Cover' })],
    ['ChatMessageImageLink', () => h(ChatMessageImageLink, { src: DATA, alt: 'Sample' })],
  ]
  it.each(cases)('%s: unblurred by default, blurred under the provider, sharp when the provider is false', (_n, child) => {
    expect(wrap(undefined, child).html()).not.toContain('blur-md')
    expect(wrap(false, child).html()).not.toContain('blur-md')
    const on = wrap(true, child)
    expect(on.find('img[data-blurred]').exists() || on.find('[data-blurred]').exists()).toBe(true)
    expect(on.html()).toContain('blur-md')
  })

  it('Leaderboard avatars blur through Avatar', () => {
    const w = wrap(true, () => h(Leaderboard, { entries: [{ id: 'a', label: 'Sample person', value: 10, avatar: { src: '/a.png' } }] } as never))
    expect(w.find('[data-slot="avatar"]').attributes('data-blurred')).toBe('')
  })

  it('the Testimonial initials fallback blurs too', () => {
    const w = wrap(true, () => h(Testimonial, { quote: 'Sample quote.', author: 'Sample person' }))
    expect(w.find('[data-slot="testimonial-avatar"]').classes()).toContain('blur-md')
  })
})
