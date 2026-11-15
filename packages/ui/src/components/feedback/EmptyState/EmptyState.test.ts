import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { faInbox } from '@fortawesome/free-solid-svg-icons'
import EmptyState from './EmptyState.vue'
import {
  emptyStateActionVariants,
  emptyStateDescriptionVariants,
  emptyStateIconVariants,
  emptyStateIllustrationVariants,
  emptyStateTitleVariants,
  emptyStateVariants,
} from './variants'

const VARIANTS = ['default', 'card', 'bordered-dashed', 'compact', 'inline'] as const
const full = { icon: faInbox, title: 'No items', description: 'Create one to start' }

describe('EmptyState', () => {
  describe('good path', () => {
    it('renders icon, title, description and action', () => {
      const w = mount(EmptyState, {
        props: { icon: faInbox, title: 'No items', description: 'Create one to start' },
        slots: { action: '<button>Create</button>' },
      })
      expect(w.attributes('data-slot')).toBe('empty-state')
      expect(w.find('[data-slot="empty-state-icon"] svg').exists()).toBe(true)
      expect(w.find('[data-slot="empty-state-title"]').text()).toBe('No items')
      expect(w.find('[data-slot="empty-state-description"]').text()).toBe('Create one to start')
      expect(w.find('[data-slot="empty-state-action"] button').text()).toBe('Create')
    })

    it('title is an h3 by default and titleAs changes it', () => {
      expect(mount(EmptyState, { props: { title: 'x' } }).find('[data-slot="empty-state-title"]').element.tagName).toBe('H3')
      expect(mount(EmptyState, { props: { title: 'x', titleAs: 'p' } }).find('[data-slot="empty-state-title"]').element.tagName).toBe('P')
    })

    it.each(['sm', 'md', 'lg'] as const)('size %s', (size) => {
      const w = mount(EmptyState, { props: { size, title: 'x' } })
      expect(w.attributes('data-size')).toBe(size)
      expect(w.classes().join(' ')).toContain(emptyStateVariants({ size }).split(' ').at(-1)!)
    })

    it('supports icon, title and description slots', () => {
      const w = mount(EmptyState, { slots: { icon: '<i id="art" />', title: '<b>T</b>', description: '<u>D</u>' } })
      expect(w.find('#art').exists()).toBe(true)
      expect(w.find('[data-slot="empty-state-title"] b').exists()).toBe(true)
      expect(w.find('[data-slot="empty-state-description"] u').exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs', () => {
      const w = mount(EmptyState, { props: { class: 'py-2 mine' }, attrs: { id: 'e' } })
      expect(w.classes()).toContain('mine')
      expect(w.classes()).toContain('py-2')
      expect(w.classes()).not.toContain('py-12')
      expect(w.attributes('id')).toBe('e')
    })
  })

  describe('bad path', () => {
    it('empty props render a bare container without optional parts', () => {
      const w = mount(EmptyState)
      for (const part of ['icon', 'title', 'description', 'action']) expect(w.find(`[data-slot="empty-state-${part}"]`).exists()).toBe(false)
    })

    it('empty-string title and description are omitted', () => {
      const w = mount(EmptyState, { props: { title: '', description: '' } })
      expect(w.find('[data-slot="empty-state-title"]').exists()).toBe(false)
      expect(w.find('[data-slot="empty-state-description"]').exists()).toBe(false)
    })

    it('invalid size and titleAs fall back', () => {
      const w = mount(EmptyState, { props: { size: 'huge' as never, titleAs: 'script' as never, title: 'x' } })
      expect(w.attributes('data-size')).toBe('md')
      expect(w.find('[data-slot="empty-state-title"]').element.tagName).toBe('H3')
    })
  })

  describe('edge cases', () => {
    it('very long and unicode text', () => {
      const w = mount(EmptyState, { props: { title: 'ß'.repeat(3000), description: 'مرحبا 日本語 🚀' } })
      expect(w.find('[data-slot="empty-state-title"]').classes()).toContain('break-words')
      expect(w.text()).toContain('مرحبا')
    })

    it('does not render html from props', () => {
      expect(mount(EmptyState, { props: { title: '<b>x</b>' } }).find('b').exists()).toBe(false)
    })
  })

  describe('variants', () => {
    it('default usage is unchanged (exact class strings, no data-variant)', () => {
      const w = mount(EmptyState, { props: full, slots: { action: '<b>a</b>' } })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.attributes('class')).toBe('flex flex-col items-center justify-center text-center gap-3 px-6 py-12')
      expect(w.find('[data-slot="empty-state-icon"]').attributes('class')).toBe('flex items-center justify-center rounded-full bg-muted text-muted-foreground size-12 [&_svg]:size-5')
      expect(w.find('[data-slot="empty-state-title"]').attributes('class')).toBe('font-semibold tracking-tight text-foreground text-base break-words')
      expect(w.find('[data-slot="empty-state-description"]').attributes('class')).toBe('max-w-md text-sm text-muted-foreground break-words')
      expect(w.find('[data-slot="empty-state-action"]').attributes('class')).toBe('mt-1 flex flex-wrap items-center justify-center gap-2')
    })

    it.each(VARIANTS)('%s renders every part', (variant) => {
      const w = mount(EmptyState, { props: { ...full, variant }, slots: { action: '<button>Go</button>' } })
      expect(w.attributes('data-variant')).toBe(variant === 'default' ? undefined : variant)
      for (const part of ['icon', 'title', 'description', 'action']) expect(w.find(`[data-slot="empty-state-${part}"]`).exists()).toBe(true)
    })

    it('card has a bordered, elevated surface', () => {
      expect(mount(EmptyState, { props: { variant: 'card' } }).classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'shadow-xs']))
    })

    it('bordered-dashed has a dashed border', () => {
      expect(mount(EmptyState, { props: { variant: 'bordered-dashed' } }).classes()).toEqual(expect.arrayContaining(['border-2', 'border-dashed', 'rounded-lg']))
    })

    it('compact is dense whatever the size', () => {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const w = mount(EmptyState, { props: { ...full, variant: 'compact', size } })
        expect(w.classes()).toEqual(expect.arrayContaining(['py-4', 'px-3', 'gap-1.5']))
        expect(w.classes()).not.toContain('py-12')
        expect(w.find('[data-slot="empty-state-icon"]').classes()).toContain('size-8')
        expect(w.find('[data-slot="empty-state-title"]').classes()).toContain('text-sm')
        expect(w.find('[data-slot="empty-state-description"]').classes()).toContain('text-xs')
      }
    })

    it('inline is a left-aligned grid row: icon | text | action', () => {
      const w = mount(EmptyState, { props: { ...full, variant: 'inline' }, slots: { action: '<button>Go</button>' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['grid', 'grid-cols-[auto_1fr_auto]', 'text-left', 'px-4', 'py-3']))
      expect(w.classes()).not.toContain('flex')
      expect(w.classes()).not.toContain('text-center')
      expect(w.find('[data-slot="empty-state-icon"]').classes()).toEqual(expect.arrayContaining(['row-span-2', 'size-9']))
      expect(w.find('[data-slot="empty-state-title"]').classes()).toContain('col-start-2')
      expect(w.find('[data-slot="empty-state-description"]').classes()).toEqual(expect.arrayContaining(['col-start-2', 'max-w-none']))
      expect(w.find('[data-slot="empty-state-action"]').classes()).toEqual(expect.arrayContaining(['col-start-3', 'justify-end']))
    })

    it('inline works with only a title', () => {
      const w = mount(EmptyState, { props: { variant: 'inline', title: 'Nothing here' } })
      expect(w.text()).toBe('Nothing here')
    })

    it('unknown variant falls back to default', () => {
      const w = mount(EmptyState, { props: { variant: 'fancy' as never } })
      expect(w.attributes('data-variant')).toBeUndefined()
      expect(w.classes()).toContain('py-12')
    })

    it('class prop overrides variant classes', () => {
      const w = mount(EmptyState, { props: { variant: 'card', class: 'bg-muted rounded-none' } })
      expect(w.classes()).toContain('bg-muted')
      expect(w.classes()).not.toContain('bg-card')
      expect(w.classes()).toContain('rounded-none')
      expect(w.classes()).not.toContain('rounded-lg')
    })

    it('variant and size combine (card + lg)', () => {
      const w = mount(EmptyState, { props: { variant: 'card', size: 'lg' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-card', 'py-20']))
    })

    it('standalone helpers return merged strings', () => {
      expect(emptyStateVariants({ variant: 'inline' }).split(' ')).not.toContain('flex')
      expect(emptyStateVariants()).toContain('py-12')
      expect(emptyStateIconVariants({ variant: 'compact', size: 'lg' })).not.toContain('size-16')
      expect(emptyStateTitleVariants({ variant: 'compact' })).toContain('text-sm')
      expect(emptyStateDescriptionVariants()).toContain('max-w-md')
      expect(emptyStateActionVariants({ variant: 'compact' })).toContain('mt-0.5')
      expect(emptyStateIllustrationVariants()).toContain('max-w-xs')
    })
  })

  describe('illustration slot', () => {
    it('renders custom artwork above the other parts', () => {
      const w = mount(EmptyState, { props: { title: 'T' }, slots: { illustration: '<svg id="art" viewBox="0 0 10 10"></svg>' } })
      const ill = w.find('[data-slot="empty-state-illustration"]')
      expect(ill.exists()).toBe(true)
      expect(ill.find('#art').exists()).toBe(true)
      expect(w.element.firstElementChild).toBe(ill.element)
      expect(w.find('[data-slot="empty-state-icon"]').exists()).toBe(false)
    })

    it('is omitted without the slot', () => {
      expect(mount(EmptyState, { props: full }).find('[data-slot="empty-state-illustration"]').exists()).toBe(false)
    })

    it('scales per variant and can sit next to an icon', () => {
      const compact = mount(EmptyState, { props: { variant: 'compact', icon: faInbox }, slots: { illustration: '<i />' } })
      expect(compact.find('[data-slot="empty-state-illustration"]').classes()).toContain('max-w-24')
      expect(compact.find('[data-slot="empty-state-icon"]').exists()).toBe(true)
      const inline = mount(EmptyState, { props: { variant: 'inline' }, slots: { illustration: '<i />' } })
      expect(inline.find('[data-slot="empty-state-illustration"]').classes()).toContain('row-span-2')
    })
  })
})
