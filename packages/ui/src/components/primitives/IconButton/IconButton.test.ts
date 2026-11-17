import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import IconButton from './IconButton.vue'

describe('IconButton', () => {
  describe('good path', () => {
    it('renders a button with aria-label, title and the icon', () => {
      const w = mount(IconButton, { props: { label: 'Add item', icon: faPlus } })
      expect(w.element.tagName).toBe('BUTTON')
      expect(w.attributes('data-slot')).toBe('icon-button')
      expect(w.attributes('aria-label')).toBe('Add item')
      expect(w.attributes('title')).toBe('Add item')
      expect(w.attributes('type')).toBe('button')
      expect(w.find('[data-slot="icon"]').exists()).toBe(true)
      expect(w.text()).toBe('')
    })

    it('defaults to the ghost variant and the square icon size', () => {
      const w = mount(IconButton, { props: { label: 'x', icon: faPlus } })
      expect(w.classes()).toContain('size-9')
      expect(w.classes()).toContain('hover:bg-accent')
      expect(w.classes()).not.toContain('bg-primary')
    })

    it('passes the variant through', () => {
      expect(mount(IconButton, { props: { label: 'x', icon: faPlus, variant: 'default' } }).classes()).toContain('bg-primary')
      expect(mount(IconButton, { props: { label: 'x', icon: faPlus, variant: 'destructive' } }).classes()).toContain('bg-destructive')
    })

    it.each([
      ['xs', 'size-6'],
      ['sm', 'size-8'],
      ['md', 'size-9'],
      ['lg', 'size-11'],
      ['icon', 'size-9'],
      ['icon-xs', 'size-6'],
      ['icon-sm', 'size-8'],
      ['icon-lg', 'size-11'],
    ] as const)('maps size %s to a square button (%s)', (size, cls) => {
      expect(mount(IconButton, { props: { label: 'x', icon: faPlus, size } }).classes()).toContain(cls)
    })

    it('emits click', async () => {
      const onClick = vi.fn()
      const w = mount(IconButton, { props: { label: 'x', icon: faPlus }, attrs: { onClick } })
      await w.trigger('click')
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('default slot overrides the icon', () => {
      const w = mount(IconButton, { props: { label: 'x', icon: faPlus }, slots: { default: '<i data-custom>★</i>' } })
      expect(w.find('[data-custom]').exists()).toBe(true)
      expect(w.find('[data-slot="icon"]').exists()).toBe(false)
    })
  })

  describe('customisation', () => {
    it('merges class and lets the consumer override', () => {
      const w = mount(IconButton, { props: { label: 'x', icon: faPlus, class: 'size-14 custom' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('size-14')
      expect(w.classes()).not.toContain('size-9')
    })

    it('attributes fall through and may override title', () => {
      const w = mount(IconButton, { props: { label: 'Delete', icon: faTrash }, attrs: { title: 'Delete forever', 'data-test': 'd' } })
      expect(w.attributes('title')).toBe('Delete forever')
      expect(w.attributes('data-test')).toBe('d')
      expect(w.attributes('aria-label')).toBe('Delete')
    })

    it('forwards `as` and type', () => {
      const a = mount(IconButton, { props: { label: 'x', icon: faPlus, as: 'a' }, attrs: { href: '/x' } })
      expect(a.element.tagName).toBe('A')
      expect(a.attributes('type')).toBeUndefined()
      expect(mount(IconButton, { props: { label: 'x', icon: faPlus, type: 'submit' } }).attributes('type')).toBe('submit')
    })
  })

  describe('bad path', () => {
    it('disabled blocks clicks', async () => {
      const onClick = vi.fn()
      const w = mount(IconButton, { props: { label: 'x', icon: faPlus, disabled: true }, attrs: { onClick } })
      expect(w.attributes('disabled')).toBeDefined()
      await w.trigger('click')
      expect(onClick).not.toHaveBeenCalled()
    })

    it('loading shows a spinner instead of the icon, sets aria-busy and blocks clicks', async () => {
      const onClick = vi.fn()
      const w = mount(IconButton, { props: { label: 'Save', icon: faPlus, loading: true }, attrs: { onClick } })
      expect(w.find('[data-slot="spinner"]').exists()).toBe(true)
      expect(w.find('[data-slot="icon"]').exists()).toBe(false)
      expect(w.attributes('aria-busy')).toBe('true')
      expect(w.attributes('aria-label')).toBe('Save')
      await w.trigger('click')
      expect(onClick).not.toHaveBeenCalled()
    })

    it('loading also hides a custom slot', () => {
      const w = mount(IconButton, { props: { label: 'x', loading: true }, slots: { default: '<i data-custom />' } })
      expect(w.find('[data-custom]').exists()).toBe(false)
    })

    it('unknown size falls back to the square icon size', () => {
      expect(mount(IconButton, { props: { label: 'x', icon: faPlus, size: 'huge' as never } }).classes()).toContain('size-9')
    })
  })

  describe('edge cases', () => {
    it('renders an empty button when neither icon nor slot is given', () => {
      const w = mount(IconButton, { props: { label: 'x' } })
      expect(w.find('svg').exists()).toBe(false)
      expect(w.attributes('aria-label')).toBe('x')
    })

    it('supports unicode / long labels', () => {
      const label = '追加 '.repeat(200)
      expect(mount(IconButton, { props: { label, icon: faPlus } }).attributes('aria-label')).toBe(label)
    })

    it('updates the label reactively', async () => {
      const w = mount(IconButton, { props: { label: 'a', icon: faPlus } })
      await w.setProps({ label: 'b' })
      expect(w.attributes('aria-label')).toBe('b')
      expect(w.attributes('title')).toBe('b')
    })
  })

  describe('loadingIndicator', () => {
    it.each(['ring', 'dots', 'bars', 'pulse', 'orbit'] as const)('%s replaces the icon and keeps the label as the accessible name', (loadingIndicator) => {
      const w = mount(IconButton, { props: { label: 'Save', icon: faPlus, loading: true, loadingIndicator } })
      expect(w.find('[data-slot="spinner"]').attributes('data-variant')).toBe(loadingIndicator === 'ring' ? undefined : loadingIndicator)
      expect(w.find('[data-slot="icon"]').exists()).toBe(false)
      expect(w.attributes('aria-label')).toBe('Save')
      expect(w.attributes('aria-busy')).toBe('true')
    })
  })
})
