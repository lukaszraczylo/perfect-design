import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'
import TeamGrid from './TeamGrid.vue'
import TeamMemberCard from './TeamMemberCard.vue'

const items = [
  { name: 'Sample person A', role: 'Engineer', bio: 'Bio text.', avatar: '/a.png' },
  { name: 'Sample person B', role: 'Admiral' },
]

describe('TeamGrid blurred', () => {
  it('default output is unchanged', () => {
    const w = mount(TeamGrid, { props: { items } })
    expect(w.html()).not.toContain('blur')
    expect(w.find('[data-blurred]').exists()).toBe(false)
  })

  it('blurs every member photo and initials; text stays readable', () => {
    const w = mount(TeamGrid, { props: { items, blurred: true } })
    const avatars = w.findAll('[data-slot="avatar"]')
    expect(avatars).toHaveLength(2)
    for (const a of avatars) expect(a.attributes('data-blurred')).toBe('')
    expect(w.find('img').classes()).toContain('blur-md')
    for (const sel of ['team-member-name', 'team-member-role', 'team-member-bio']) {
      expect(w.find(`[data-slot="${sel}"]`).classes().join(' ')).not.toContain('blur')
    }
    expect(w.text()).toContain('Sample person A')
    expect(w.text()).toContain('Engineer')
  })

  it('provider default and own override, both ways', () => {
    const a = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => h(TeamGrid, { items })) })
    expect(a.findAll('[data-slot="avatar"][data-blurred]')).toHaveLength(2)
    const b = mount({ render: () => h(ConfigProvider, { blurMedia: true }, () => h(TeamGrid, { items, blurred: false })) })
    expect(b.findAll('[data-slot="avatar"][data-blurred]')).toHaveLength(0)
  })

  it('TeamMemberCard takes blurred on its own', () => {
    const w = mount(TeamMemberCard, { props: { name: 'Sample person A', avatar: '/a.png', blurred: true } })
    expect(w.find('img').classes()).toContain('blur-md')
  })
})
