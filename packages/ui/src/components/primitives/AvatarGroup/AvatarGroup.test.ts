import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Comment, createTextVNode, createVNode, defineComponent, Fragment, h, ref } from 'vue'
import { flattenVNodes } from './flatten'
import AvatarGroup from './AvatarGroup.vue'
import Avatar from '../Avatar/Avatar.vue'
import { avatarGroupVariants } from './variants'

const items = [{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }, { name: 'Alan Turing' }, { name: 'Linus Torvalds' }]

describe('AvatarGroup', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('good path', () => {
    it('renders items as overlapping avatars inside a group', () => {
      const w = mount(AvatarGroup, { props: { items } })
      expect(w.attributes('data-slot')).toBe('avatar-group')
      expect(w.attributes('role')).toBe('group')
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(4)
      expect(w.classes()).toContain('-space-x-2.5')
      expect(w.classes()).toContain('[&>*]:ring-2')
      expect(w.classes()).toContain('[&>*]:ring-background')
      expect(w.find('[data-slot="avatar-group-overflow"]').exists()).toBe(false)
    })

    it('max shows the first N and a +N bubble for items', () => {
      const w = mount(AvatarGroup, { props: { items, max: 2 } })
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(2)
      const more = w.find('[data-slot="avatar-group-overflow"]')
      expect(more.text()).toBe('+2')
      expect(more.attributes('aria-label')).toBe('2 more')
      expect(more.attributes('role')).toBe('img')
    })

    it('renders slotted Avatars and counts them with max', () => {
      const Demo = defineComponent({
        components: { AvatarGroup, Avatar },
        template: `<AvatarGroup :max="2"><Avatar name="A B" /><Avatar name="C D" /><Avatar name="E F" /></AvatarGroup>`,
      })
      const w = mount(Demo)
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(2)
      expect(w.find('[data-slot="avatar-group-overflow"]').text()).toBe('+1')
    })

    it('flattens v-for fragments and ignores v-if=false when counting', async () => {
      const names = ref(['A B', 'C D', 'E F', 'G H'])
      const Demo = defineComponent({
        components: { AvatarGroup, Avatar },
        setup: () => ({ names }),
        template: `<AvatarGroup :max="3"><Avatar v-for="n in names" :key="n" :name="n" /><Avatar v-if="false" name="no" /></AvatarGroup>`,
      })
      const w = mount(Demo)
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(3)
      expect(w.find('[data-slot="avatar-group-overflow"]').text()).toBe('+1')
      names.value = ['A B']
      await w.vm.$nextTick()
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(1)
      expect(w.find('[data-slot="avatar-group-overflow"]').exists()).toBe(false)
    })

    it('combines items and slot children', () => {
      const w = mount(AvatarGroup, { props: { items: [{ name: 'A B' }], max: 2 }, slots: { default: ['<span data-slot="avatar">x</span>', '<span data-slot="avatar">y</span>'] } })
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(2)
      expect(w.find('[data-slot="avatar-group-overflow"]').text()).toBe('+1')
    })

    it('slotted Avatars inherit size and shape from the group unless overridden', () => {
      const Demo = defineComponent({
        components: { AvatarGroup, Avatar },
        template: `<AvatarGroup size="lg" shape="square"><Avatar name="A B" /><Avatar name="C D" size="xs" shape="circle" /></AvatarGroup>`,
      })
      const [a, b] = mount(Demo).findAll('[data-slot="avatar"]')
      expect(a!.classes()).toContain('size-12')
      expect(a!.classes()).toContain('rounded-md')
      expect(b!.classes()).toContain('size-6')
      expect(b!.classes()).toContain('rounded-full')
    })

    it('items inherit size and the overflow bubble matches size and shape', () => {
      const w = mount(AvatarGroup, { props: { items, max: 1, size: 'sm', shape: 'square' } })
      expect(w.find('[data-slot="avatar"]').classes()).toContain('size-8')
      const more = w.find('[data-slot="avatar-group-overflow"]')
      expect(more.classes()).toContain('size-8')
      expect(more.classes()).toContain('rounded-md')
    })

    it('items pass src, alt, fallback and status to Avatar', () => {
      const w = mount(AvatarGroup, { props: { items: [{ src: '/a.png', alt: 'Alt' }, { fallback: 'ZZ', status: 'success' }] } })
      expect(w.find('img').attributes('alt')).toBe('Alt')
      expect(w.text()).toContain('ZZ')
      expect(w.find('[data-slot="avatar-status"]').exists()).toBe(true)
    })

    it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)('supports size %s', (size) => {
      expect(avatarGroupVariants({ size })).toContain('-space-x-')
      expect(mount(AvatarGroup, { props: { size } }).exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class, attrs and supports `as`', () => {
      const w = mount(AvatarGroup, { props: { as: 'section', class: 'items-start' }, attrs: { 'aria-label': 'Team' } })
      expect(w.element.tagName).toBe('SECTION')
      expect(w.classes()).toContain('items-start')
      expect(w.classes()).not.toContain('items-center')
      expect(w.attributes('aria-label')).toBe('Team')
    })
  })

  describe('bad path', () => {
    it('invalid max values mean no limit', () => {
      for (const max of [-1, NaN, Infinity, 'x' as never]) {
        const w = mount(AvatarGroup, { props: { items, max } })
        expect(w.findAll('[data-slot="avatar"]')).toHaveLength(4)
        expect(w.find('[data-slot="avatar-group-overflow"]').exists()).toBe(false)
      }
    })

    it('invalid size falls back to md spacing', () => {
      expect(mount(AvatarGroup, { props: { size: 'huge' as never } }).classes()).toContain('-space-x-2.5')
    })

    it('max=0 shows only the overflow bubble', () => {
      const w = mount(AvatarGroup, { props: { items, max: 0 } })
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(0)
      expect(w.find('[data-slot="avatar-group-overflow"]').text()).toBe('+4')
    })

    it('fractional max is floored', () => {
      const w = mount(AvatarGroup, { props: { items, max: 2.9 } })
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(2)
    })

    it('unknown shape renders a circular overflow bubble', () => {
      const w = mount(AvatarGroup, { props: { items, max: 1, shape: 'hex' as never } })
      expect(w.find('[data-slot="avatar-group-overflow"]').classes()).toContain('rounded-full')
    })
  })

  describe('edge cases', () => {
    it('renders empty without items or slot', () => {
      const w = mount(AvatarGroup)
      expect(w.element.children).toHaveLength(0)
    })

    it('max larger than count shows no overflow', () => {
      const w = mount(AvatarGroup, { props: { items, max: 10 } })
      expect(w.find('[data-slot="avatar-group-overflow"]').exists()).toBe(false)
    })

    it('updates when items change', async () => {
      const w = mount(AvatarGroup, { props: { items: items.slice(0, 1), max: 2 } })
      await w.setProps({ items })
      expect(w.findAll('[data-slot="avatar"]')).toHaveLength(2)
      expect(w.find('[data-slot="avatar-group-overflow"]').text()).toBe('+2')
    })

    it('a standalone Avatar outside a group still defaults to md', () => {
      expect(mount(Avatar).classes()).toContain('size-10')
    })
  })

  describe('flattenVNodes', () => {
    it('handles undefined, blank text, comments, nested fragments and non-array fragment children', () => {
      expect(flattenVNodes(undefined)).toEqual([])
      const inner = createVNode(Fragment, null, [h('i'), createVNode(Fragment, null, [h('b')])])
      const textFragment = createVNode(Fragment, null, 'plain')
      const nodes = flattenVNodes([createTextVNode('  '), createVNode(Comment), inner, createTextVNode('keep'), textFragment, h('u')])
      expect(nodes.map((n) => (typeof n.type === 'string' ? n.type : n.type === Fragment ? 'fragment' : 'text'))).toEqual(['i', 'b', 'text', 'fragment', 'u'])
    })
  })

  describe('2xl size and rounded shape', () => {
    it('2xl uses wider overlap and 2xl avatars', () => {
      const w = mount(AvatarGroup, { props: { items, size: '2xl' } })
      expect(w.classes()).toContain('-space-x-6')
      expect(w.find('[data-slot="avatar"]').classes()).toContain('size-24')
      expect(avatarGroupVariants({ size: '2xl' })).toContain('-space-x-6')
    })

    it('rounded shape reaches avatars and the overflow bubble', () => {
      const w = mount(AvatarGroup, { props: { items, shape: 'rounded', max: 1 } })
      expect(w.find('[data-slot="avatar"]').classes()).toContain('rounded-xl')
      expect(w.find('[data-slot="avatar-group-overflow"]').classes()).toContain('rounded-xl')
    })

    it('square shape still reaches the overflow bubble', () => {
      const w = mount(AvatarGroup, { props: { items, shape: 'square', max: 1 } })
      expect(w.find('[data-slot="avatar-group-overflow"]').classes()).toContain('rounded-md')
    })

    it('unknown shape falls back to circle for the overflow bubble', () => {
      const w = mount(AvatarGroup, { props: { items, shape: 'hex' as never, max: 1 } })
      expect(w.find('[data-slot="avatar-group-overflow"]').classes()).toContain('rounded-full')
    })
  })
})

describe('AvatarGroup overflow bubble', () => {
  it('uses tabular numbers for the +N count and is a single named image', () => {
    const w = mount(AvatarGroup, { props: { max: 1, items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] } })
    const more = w.find('[data-slot="avatar-group-overflow"]')
    expect(more.text()).toBe('+2')
    expect(more.classes()).toContain('tabular-nums')
    expect(more.attributes('role')).toBe('img')
    expect(more.attributes('aria-label')).toBe('2 more')
  })
})

describe('AvatarGroup initials', () => {
  it('pads the fallback of overlapped avatars by their overlap so initials stay readable', () => {
    const cls = avatarGroupVariants({ layout: 'stacked', size: 'md', density: 'default' })
    expect(cls).toContain('-space-x-2.5')
    expect(cls).toContain('[&>*:not(:last-child)>[data-slot=avatar-fallback]]:pe-2.5')
  })
  it('does not pad the spaced layout', () => {
    expect(avatarGroupVariants({ layout: 'spaced' })).not.toContain(':pe-')
  })
})
