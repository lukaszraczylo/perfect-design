import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Textarea from './Textarea.vue'

afterEach(() => vi.restoreAllMocks())

describe('Textarea', () => {
  describe('good path', () => {
    it('renders a <textarea> with data-slot and wrapper', () => {
      const w = mount(Textarea)
      expect(w.attributes('data-slot')).toBe('textarea-wrapper')
      const ta = w.find('textarea')
      expect(ta.attributes('data-slot')).toBe('textarea')
      expect(ta.attributes('rows')).toBe('3')
    })

    it('reflects modelValue and emits update:modelValue', async () => {
      const w = mount(Textarea, { props: { modelValue: 'abc' } })
      expect(w.find('textarea').element.value).toBe('abc')
      await w.find('textarea').setValue('xyz')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['xyz'])
    })

    it('syncs when modelValue changes from outside', async () => {
      const w = mount(Textarea, { props: { modelValue: 'a' } })
      await w.setProps({ modelValue: 'b' })
      expect(w.find('textarea').element.value).toBe('b')
    })

    it('works uncontrolled', async () => {
      const w = mount(Textarea)
      await w.find('textarea').setValue('hello')
      expect(w.find('textarea').element.value).toBe('hello')
    })

    it('rows prop is applied', () => {
      expect(mount(Textarea, { props: { rows: 8 } }).find('textarea').attributes('rows')).toBe('8')
    })
  })

  describe('counter', () => {
    it('shows n / maxlength when showCount and maxlength', async () => {
      const w = mount(Textarea, { props: { maxlength: 20, showCount: true, modelValue: 'abc' } })
      expect(w.find('[data-slot="textarea-count"]').text()).toBe('3 / 20')
      expect(w.find('textarea').attributes('maxlength')).toBe('20')
      await w.find('textarea').setValue('hello')
      expect(w.find('[data-slot="textarea-count"]').text()).toBe('5 / 20')
    })

    it('counts unicode code points (emoji = 1)', () => {
      const w = mount(Textarea, { props: { maxlength: 10, showCount: true, modelValue: '🌍🌍é' } })
      expect(w.find('[data-slot="textarea-count"]').text()).toBe('3 / 10')
    })

    it('highlights when the limit is reached', () => {
      const w = mount(Textarea, { props: { maxlength: 3, showCount: true, modelValue: 'abc' } })
      expect(w.find('[data-slot="textarea-count"]').classes()).toContain('text-destructive')
    })

    it('no counter without showCount, or without maxlength', () => {
      expect(mount(Textarea, { props: { maxlength: 5 } }).find('[data-slot="textarea-count"]').exists()).toBe(false)
      expect(mount(Textarea, { props: { showCount: true } }).find('[data-slot="textarea-count"]').exists()).toBe(false)
    })
  })

  describe('autosize', () => {
    function stubScroll(h: number) {
      vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(h)
    }

    it('sets height from scrollHeight on mount and after input', async () => {
      stubScroll(120)
      const w = mount(Textarea, { props: { autosize: true }, attachTo: document.body })
      expect(w.find('textarea').element.style.height).toBe('120px')
      expect(w.find('textarea').classes()).toContain('resize-none')
      stubScroll(200)
      await w.find('textarea').setValue('more\nlines')
      await nextTick()
      expect(w.find('textarea').element.style.height).toBe('200px')
      w.unmount()
    })

    it('caps height at maxRows', () => {
      stubScroll(1000)
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({ lineHeight: '20px', paddingTop: '8px', paddingBottom: '8px' } as CSSStyleDeclaration)
      const w = mount(Textarea, { props: { autosize: true, maxRows: 4 }, attachTo: document.body })
      expect(w.find('textarea').element.style.height).toBe('96px')
      w.unmount()
    })

    it('falls back to defaults when computed style is not numeric', () => {
      stubScroll(1000)
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({ lineHeight: 'normal', paddingTop: '', paddingBottom: '' } as CSSStyleDeclaration)
      const w = mount(Textarea, { props: { autosize: true, maxRows: 2 } })
      expect(w.find('textarea').element.style.height).toBe('40px')
    })

    it('does not touch height when autosize is off; enabling later resizes', async () => {
      stubScroll(80)
      const w = mount(Textarea)
      expect(w.find('textarea').element.style.height).toBe('')
      expect(w.find('textarea').classes()).toContain('resize-y')
      await w.setProps({ autosize: true })
      await nextTick()
      expect(w.find('textarea').element.style.height).toBe('80px')
    })

    it('exposes resize()', () => {
      const w = mount(Textarea)
      expect(() => (w.vm as unknown as { resize: () => void }).resize()).not.toThrow()
    })
  })

  describe('customisation', () => {
    it('merges class onto the textarea and overrides', () => {
      const w = mount(Textarea, { props: { class: 'min-h-40 custom' } })
      const ta = w.find('textarea')
      expect(ta.classes()).toContain('custom')
      expect(ta.classes()).toContain('min-h-40')
      expect(ta.classes()).not.toContain('min-h-16')
    })

    it('passes attrs to the textarea (placeholder, name, aria-label)', () => {
      const w = mount(Textarea, { attrs: { placeholder: 'Bio', name: 'bio', 'aria-label': 'Bio' } })
      const ta = w.find('textarea')
      expect(ta.attributes('placeholder')).toBe('Bio')
      expect(ta.attributes('name')).toBe('bio')
      expect(ta.attributes('aria-label')).toBe('Bio')
      expect(w.attributes('placeholder')).toBeUndefined()
    })
  })

  describe('bad path / states', () => {
    it('disabled and readonly are forwarded', () => {
      const ta = mount(Textarea, { props: { disabled: true, readonly: true } }).find('textarea')
      expect(ta.attributes('disabled')).toBeDefined()
      expect(ta.attributes('readonly')).toBeDefined()
    })

    it('invalid sets aria-invalid; required sets required', () => {
      const ta = mount(Textarea, { props: { invalid: true, required: true } }).find('textarea')
      expect(ta.attributes('aria-invalid')).toBe('true')
      expect(ta.attributes('required')).toBeDefined()
      expect(mount(Textarea).find('textarea').attributes('aria-invalid')).toBeUndefined()
      expect(mount(Textarea).find('textarea').attributes('required')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('treats null/undefined modelValue as empty', () => {
      expect(mount(Textarea, { props: { modelValue: null } }).find('textarea').element.value).toBe('')
      expect(mount(Textarea, { props: { modelValue: undefined } }).find('textarea').element.value).toBe('')
    })

    it('handles huge, multiline and unicode content', async () => {
      const big = 'é\n🌍\n'.repeat(5000)
      const w = mount(Textarea)
      await w.find('textarea').setValue(big)
      expect(w.emitted('update:modelValue')?.[0]).toEqual([big])
    })

    it('rapid input emits every value', async () => {
      const w = mount(Textarea)
      for (const v of ['a', 'ab', 'abc']) await w.find('textarea').setValue(v)
      expect(w.emitted('update:modelValue')).toHaveLength(3)
    })
  })
})
