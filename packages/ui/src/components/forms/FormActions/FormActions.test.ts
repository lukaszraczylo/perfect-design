import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FormActions from './FormActions.vue'

describe('FormActions', () => {
  describe('good path', () => {
    it('renders a root with data-slot and default slot content; role=group only when named', () => {
      const w = mount(FormActions, { slots: { default: '<button class="x">Go</button>' } })
      expect(w.attributes('data-slot')).toBe('form-actions')
      expect(w.attributes('role')).toBeUndefined()
      expect(mount(FormActions, { attrs: { 'aria-label': 'Form actions' } }).attributes('role')).toBe('group')
      expect(w.find('.x').exists()).toBe(true)
    })

    it('renders nothing but the wrapper when no props or slot are given (edge)', () => {
      const w = mount(FormActions)
      expect(w.element.children).toHaveLength(0)
    })

    it('renders submit button (type=submit) and cancel button (type=button)', () => {
      const w = mount(FormActions, { props: { submitLabel: 'Save', cancelLabel: 'Cancel' } })
      const submit = w.find('[data-slot=form-actions-submit]')
      const cancel = w.find('[data-slot=form-actions-cancel]')
      expect(submit.text()).toBe('Save')
      expect(submit.attributes('type')).toBe('submit')
      expect(cancel.text()).toBe('Cancel')
      expect(cancel.attributes('type')).toBe('button')
      // cancel comes first so the primary action ends up at the end
      expect(w.findAll('button')[0].text()).toBe('Cancel')
    })

    it('renders only the buttons whose label is set', () => {
      expect(mount(FormActions, { props: { submitLabel: 'Save' } }).findAll('button')).toHaveLength(1)
      expect(mount(FormActions, { props: { cancelLabel: 'Back' } }).findAll('button')).toHaveLength(1)
    })

    it('emits submit and cancel on click', async () => {
      const w = mount(FormActions, { props: { submitLabel: 'Save', cancelLabel: 'Cancel' } })
      await w.find('[data-slot=form-actions-submit]').trigger('click')
      await w.find('[data-slot=form-actions-cancel]').trigger('click')
      expect(w.emitted('submit')).toHaveLength(1)
      expect(w.emitted('cancel')).toHaveLength(1)
      expect(w.emitted('submit')?.[0][0]).toBeInstanceOf(MouseEvent)
    })

    it('submit button submits the surrounding form natively', async () => {
      const w = mount(
        { components: { FormActions }, template: '<form @submit.prevent="$emit(\'sent\')"><FormActions submit-label="Go" /></form>' },
        { attachTo: document.body },
      )
      await w.find('[data-slot=form-actions-submit]').trigger('click')
      expect(w.emitted('sent')).toHaveLength(1)
      w.unmount()
    })

    it('default slot replaces convenience buttons', () => {
      const w = mount(FormActions, { props: { submitLabel: 'Save', cancelLabel: 'Cancel' }, slots: { default: '<span class="custom">custom</span>' } })
      expect(w.find('.custom').exists()).toBe(true)
      expect(w.find('[data-slot=form-actions-submit]').exists()).toBe(false)
      expect(w.find('[data-slot=form-actions-cancel]').exists()).toBe(false)
    })
  })

  describe('layout', () => {
    it('aligns to the end by default and honours align', () => {
      expect(mount(FormActions).classes()).toContain('sm:justify-end')
      expect(mount(FormActions, { props: { align: 'start' } }).classes()).toContain('sm:justify-start')
      expect(mount(FormActions, { props: { align: 'center' } }).classes()).toContain('sm:justify-center')
      expect(mount(FormActions, { props: { align: 'between' } }).classes()).toContain('sm:justify-between')
    })

    it('invalid align falls back to end', () => {
      // @ts-expect-error deliberately invalid
      expect(mount(FormActions, { props: { align: 'nope' } }).classes()).toContain('sm:justify-end')
    })

    it('stacked (default) stacks on small screens; stacked=false keeps a row', () => {
      const stacked = mount(FormActions)
      // DOM order is kept (no flex-col-reverse) so focus order matches the visual order
      expect(stacked.classes()).toContain('flex-col')
      expect(stacked.classes()).not.toContain('flex-col-reverse')
      const row = mount(FormActions, { props: { stacked: false, align: 'between' } })
      expect(row.classes()).not.toContain('flex-col')
      expect(row.classes()).toContain('justify-between')
    })

    it('sticky adds a bordered bottom bar with an opaque background (no blur)', () => {
      const w = mount(FormActions, { props: { sticky: true } })
      expect(w.classes()).toEqual(expect.arrayContaining(['sticky', 'bottom-0', 'border-t', 'bg-background']))
      expect(w.classes().join(' ')).not.toMatch(/backdrop|bg-background\//)
      expect(w.attributes('data-sticky')).toBeDefined()
      expect(mount(FormActions).classes()).not.toContain('sticky')
      expect(mount(FormActions).attributes('data-sticky')).toBeUndefined()
    })
  })

  describe('bad path', () => {
    it('loading shows busy submit and blocks submit clicks', async () => {
      const w = mount(FormActions, { props: { submitLabel: 'Save', loading: true } })
      const submit = w.find('[data-slot=form-actions-submit]')
      expect(submit.attributes('aria-busy')).toBe('true')
      expect(submit.attributes('disabled')).toBeDefined()
      await submit.trigger('click')
      expect(w.emitted('submit')).toBeUndefined()
    })

    it('submitDisabled disables only the submit button', async () => {
      const w = mount(FormActions, { props: { submitLabel: 'Save', cancelLabel: 'Cancel', submitDisabled: true } })
      expect(w.find('[data-slot=form-actions-submit]').attributes('disabled')).toBeDefined()
      expect(w.find('[data-slot=form-actions-cancel]').attributes('disabled')).toBeUndefined()
      await w.find('[data-slot=form-actions-submit]').trigger('click')
      expect(w.emitted('submit')).toBeUndefined()
    })

    it('cancel remains usable while loading', async () => {
      const w = mount(FormActions, { props: { cancelLabel: 'Cancel', submitLabel: 'Save', loading: true } })
      await w.find('[data-slot=form-actions-cancel]').trigger('click')
      expect(w.emitted('cancel')).toHaveLength(1)
    })
  })

  describe('customisation', () => {
    it('merges class last and passes attrs through', () => {
      const w = mount(FormActions, { props: { class: 'gap-6 custom' }, attrs: { 'aria-label': 'Form actions', id: 'fa' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('gap-6')
      expect(w.classes()).not.toContain('gap-2')
      expect(w.attributes('aria-label')).toBe('Form actions')
      expect(w.attributes('id')).toBe('fa')
    })

    it('handles unicode labels and rapid clicks', async () => {
      const w = mount(FormActions, { props: { submitLabel: '保存 💾', cancelLabel: 'Anuluj' } })
      expect(w.find('[data-slot=form-actions-submit]').text()).toBe('保存 💾')
      for (let i = 0; i < 5; i++) await w.find('[data-slot=form-actions-cancel]').trigger('click')
      expect(w.emitted('cancel')).toHaveLength(5)
    })
  })
})
