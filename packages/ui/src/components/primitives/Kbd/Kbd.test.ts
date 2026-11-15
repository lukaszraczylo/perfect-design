import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { Comment, createTextVNode, createVNode, defineComponent, Fragment, h, ref } from 'vue'
import Kbd from './Kbd.vue'
import KbdGroup from './KbdGroup.vue'
import { flattenVNodes } from './flatten'

describe('Kbd', () => {
  describe('good path', () => {
    it('renders a <kbd> with slot content', () => {
      const w = mount(Kbd, { slots: { default: 'Esc' } })
      expect(w.element.tagName).toBe('KBD')
      expect(w.attributes('data-slot')).toBe('kbd')
      expect(w.text()).toBe('Esc')
      expect(w.classes()).toContain('font-mono')
      expect(w.classes()).toContain('h-6')
    })

    it('supports the sm size', () => {
      const w = mount(Kbd, { props: { size: 'sm' } })
      expect(w.classes()).toContain('h-5')
      expect(w.classes()).not.toContain('h-6')
    })
  })

  describe('customisation', () => {
    it('merges class with consumer winning', () => {
      const w = mount(Kbd, { props: { class: 'bg-primary text-primary-foreground' } })
      expect(w.classes()).toContain('bg-primary')
      expect(w.classes()).not.toContain('bg-muted')
    })

    it('passes attributes and supports `as`', () => {
      const w = mount(Kbd, { props: { as: 'span' }, attrs: { 'aria-label': 'Escape' } })
      expect(w.element.tagName).toBe('SPAN')
      expect(w.attributes('aria-label')).toBe('Escape')
    })
  })

  describe('bad path / edge cases', () => {
    it('unknown size falls back to md', () => {
      expect(mount(Kbd, { props: { size: 'huge' as never } }).classes()).toContain('h-6')
    })

    it('renders empty and with unicode symbols', () => {
      expect(mount(Kbd).text()).toBe('')
      expect(mount(Kbd, { slots: { default: '⌘' } }).text()).toBe('⌘')
    })
  })
})

describe('KbdGroup', () => {
  describe('good path', () => {
    it('renders keys from the prop as Kbd chips', () => {
      const w = mount(KbdGroup, { props: { keys: ['Ctrl', 'K'] } })
      expect(w.attributes('data-slot')).toBe('kbd-group')
      const kbds = w.findAll('[data-slot="kbd"]')
      expect(kbds.map((k) => k.text())).toEqual(['Ctrl', 'K'])
      expect(w.find('[data-slot="kbd-separator"]').exists()).toBe(false)
    })

    it('joins keys with an aria-hidden separator', () => {
      const w = mount(KbdGroup, { props: { keys: ['Ctrl', 'Shift', 'P'], separator: '+' } })
      const seps = w.findAll('[data-slot="kbd-separator"]')
      expect(seps).toHaveLength(2)
      expect(seps[0]!.text()).toBe('+')
      expect(seps[0]!.attributes('aria-hidden')).toBe('true')
      expect(w.text()).toBe('Ctrl+Shift+P')
    })

    it('joins slotted children, unwrapping v-for fragments and ignoring v-if=false', () => {
      const keys = ref(['A', 'B'])
      const Demo = defineComponent({
        components: { KbdGroup, Kbd },
        setup: () => ({ keys }),
        template: `<KbdGroup separator="then"><Kbd v-for="k in keys" :key="k">{{ k }}</Kbd><Kbd v-if="false">no</Kbd><!-- c --></KbdGroup>`,
      })
      const w = mount(Demo)
      expect(w.findAll('[data-slot="kbd"]')).toHaveLength(2)
      expect(w.findAll('[data-slot="kbd-separator"]')).toHaveLength(1)
      expect(w.text()).toBe('AthenB')
    })

    it('combines keys prop and slot children with one separator between all', async () => {
      const w = mount(KbdGroup, { props: { keys: ['Ctrl'], separator: '+' }, slots: { default: () => h(Kbd, null, () => 'S') } })
      expect(w.text()).toBe('Ctrl+S')
    })

    it('reacts to keys changes', async () => {
      const w = mount(KbdGroup, { props: { keys: ['A'], separator: '+' } })
      await w.setProps({ keys: ['A', 'B', 'C'] })
      expect(w.findAll('[data-slot="kbd"]')).toHaveLength(3)
      expect(w.findAll('[data-slot="kbd-separator"]')).toHaveLength(2)
    })

    it('size applies to generated chips', () => {
      const w = mount(KbdGroup, { props: { keys: ['A'], size: 'sm' } })
      expect(w.find('[data-slot="kbd"]').classes()).toContain('h-5')
    })
  })

  describe('customisation', () => {
    it('merges class and supports `as`', () => {
      const w = mount(KbdGroup, { props: { class: 'gap-3', as: 'div' } })
      expect(w.element.tagName).toBe('DIV')
      expect(w.classes()).toContain('gap-3')
      expect(w.classes()).not.toContain('gap-1')
    })
  })

  describe('bad path / edge cases', () => {
    it('renders empty with no keys and no slot', () => {
      const w = mount(KbdGroup, { props: { separator: '+' } })
      expect(w.text()).toBe('')
      expect(w.element.children).toHaveLength(0)
    })

    it('a single key has no separator', () => {
      const w = mount(KbdGroup, { props: { keys: ['Esc'], separator: '+' } })
      expect(w.find('[data-slot="kbd-separator"]').exists()).toBe(false)
    })

    it('flattenVNodes handles undefined, blank text, comments and nested fragments', () => {
      expect(flattenVNodes(undefined)).toEqual([])
      const inner = createVNode(Fragment, null, [h('i'), createVNode(Fragment, null, [h('b')])])
      const nodes = flattenVNodes([createTextVNode('  '), createVNode(Comment), inner, createTextVNode('keep'), h('u')])
      expect(nodes.map((n) => (typeof n.type === 'string' ? n.type : 'text'))).toEqual(['i', 'b', 'text', 'u'])
    })
  })
})
