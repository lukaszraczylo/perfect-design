import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import SearchInput from './SearchInput.vue'
import Field from '../Field/Field.vue'

const input = (w: ReturnType<typeof mount>) => w.find('input')
const clearBtn = (w: ReturnType<typeof mount>) => w.find('[data-slot=search-input-clear]')

describe('SearchInput', () => {
  describe('good path', () => {
    it('renders wrapper, search icon and type=search input', () => {
      const w = mount(SearchInput, { attrs: { placeholder: 'Find' } })
      expect(w.attributes('data-slot')).toBe('search-input')
      expect(w.find('[data-slot=search-input-icon]').exists()).toBe(true)
      expect(input(w).attributes('type')).toBe('search')
      expect(input(w).attributes('placeholder')).toBe('Find')
      expect(w.attributes('role')).toBeUndefined()
    })

    it('reflects modelValue and updates when the prop changes', async () => {
      const w = mount(SearchInput, { props: { modelValue: 'abc' } })
      expect(input(w).element.value).toBe('abc')
      await w.setProps({ modelValue: 'xyz' })
      expect(input(w).element.value).toBe('xyz')
      await w.setProps({ modelValue: null })
      expect(input(w).element.value).toBe('')
    })

    it('emits update:modelValue immediately and search immediately when debounce=0', async () => {
      const w = mount(SearchInput)
      await input(w).setValue('hello')
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['hello'])
      expect(w.emitted('search')?.[0]).toEqual(['hello'])
    })

    it('works uncontrolled', async () => {
      const w = mount(SearchInput)
      await input(w).setValue('abc')
      expect(input(w).element.value).toBe('abc')
      expect(clearBtn(w).exists()).toBe(true)
    })

    it('landmark adds role=search', () => {
      expect(mount(SearchInput, { props: { landmark: true } }).attributes('role')).toBe('search')
    })

    it('Enter emits search with current value', async () => {
      const w = mount(SearchInput, { props: { modelValue: 'q' } })
      await input(w).trigger('keydown', { key: 'Enter' })
      expect(w.emitted('search')?.[0]).toEqual(['q'])
    })

    it('Enter during IME composition does not search', async () => {
      const w = mount(SearchInput, { props: { modelValue: 'q' } })
      await input(w).trigger('keydown', { key: 'Enter', isComposing: true })
      expect(w.emitted('search')).toBeUndefined()
    })

    it('other keys do nothing', async () => {
      const w = mount(SearchInput, { props: { modelValue: 'q' } })
      await input(w).trigger('keydown', { key: 'a' })
      expect(w.emitted()).not.toHaveProperty('search')
      expect(w.emitted()).not.toHaveProperty('clear')
    })
  })

  describe('clear', () => {
    it('clear button hidden when empty, shown when non-empty, labelled', () => {
      expect(clearBtn(mount(SearchInput)).exists()).toBe(false)
      const w = mount(SearchInput, { props: { modelValue: 'x' } })
      expect(clearBtn(w).exists()).toBe(true)
      expect(clearBtn(w).attributes('aria-label')).toBe('Clear search')
      expect(clearBtn(w).attributes('type')).toBe('button')
    })

    it('clearLabel is overridable', () => {
      const w = mount(SearchInput, { props: { modelValue: 'x', clearLabel: 'Wyczyść' } })
      expect(clearBtn(w).attributes('aria-label')).toBe('Wyczyść')
    })

    it('clicking clear empties, emits update, clear and search(""), and focuses input', async () => {
      const w = mount(SearchInput, { props: { modelValue: 'x' }, attachTo: document.body })
      await clearBtn(w).trigger('click')
      expect(w.emitted('update:modelValue')?.[0]).toEqual([''])
      expect(w.emitted('clear')).toHaveLength(1)
      expect(w.emitted('search')?.[0]).toEqual([''])
      expect(input(w).element.value).toBe('')
      expect(document.activeElement).toBe(input(w).element)
      expect(clearBtn(w).exists()).toBe(false)
      w.unmount()
    })

    it('Esc clears and is consumed (stopPropagation + preventDefault)', async () => {
      const outer = vi.fn()
      const Host = defineComponent({
        render: () => h('div', { onKeydown: outer }, [h(SearchInput, { modelValue: 'x' })]),
      })
      const w = mount(Host)
      const ev = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      w.find('input').element.dispatchEvent(ev)
      await nextTick()
      const s = w.findComponent(SearchInput)
      expect(s.emitted('clear')).toHaveLength(1)
      expect(ev.defaultPrevented).toBe(true)
      expect(outer).not.toHaveBeenCalled()
    })

    it('Esc on empty input does nothing and propagates', async () => {
      const outer = vi.fn()
      const Host = defineComponent({ render: () => h('div', { onKeydown: outer }, [h(SearchInput)]) })
      const w = mount(Host)
      await w.find('input').trigger('keydown', { key: 'Escape' })
      expect(w.findComponent(SearchInput).emitted('clear')).toBeUndefined()
      expect(outer).toHaveBeenCalled()
    })

    it('exposed clear() on empty value is a no-op', () => {
      const w = mount(SearchInput)
      ;(w.vm as unknown as { clear: () => void }).clear()
      expect(w.emitted('clear')).toBeUndefined()
    })

    it('exposed focus() focuses the input', () => {
      const w = mount(SearchInput, { attachTo: document.body })
      ;(w.vm as unknown as { focus: () => void }).focus()
      expect(document.activeElement).toBe(input(w).element)
      w.unmount()
    })
  })

  describe('debounce', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('delays search but not update:modelValue', async () => {
      const w = mount(SearchInput, { props: { debounce: 300 } })
      await input(w).setValue('a')
      expect(w.emitted('update:modelValue')).toHaveLength(1)
      expect(w.emitted('search')).toBeUndefined()
      vi.advanceTimersByTime(299)
      expect(w.emitted('search')).toBeUndefined()
      vi.advanceTimersByTime(1)
      expect(w.emitted('search')?.[0]).toEqual(['a'])
    })

    it('rapid typing emits only the last value once', async () => {
      const w = mount(SearchInput, { props: { debounce: 200 } })
      for (const v of ['a', 'ab', 'abc', 'abcd']) {
        await input(w).setValue(v)
        vi.advanceTimersByTime(50)
      }
      vi.advanceTimersByTime(200)
      expect(w.emitted('search')).toEqual([['abcd']])
      expect(w.emitted('update:modelValue')).toHaveLength(4)
    })

    it('Enter fires immediately and cancels the pending debounce', async () => {
      const w = mount(SearchInput, { props: { debounce: 300 } })
      await input(w).setValue('abc')
      await input(w).trigger('keydown', { key: 'Enter' })
      expect(w.emitted('search')).toEqual([['abc']])
      vi.advanceTimersByTime(1000)
      expect(w.emitted('search')).toHaveLength(1)
    })

    it('clear cancels the pending debounce and only emits search("")', async () => {
      const w = mount(SearchInput, { props: { debounce: 300 } })
      await input(w).setValue('abc')
      await clearBtn(w).trigger('click')
      vi.advanceTimersByTime(1000)
      expect(w.emitted('search')).toEqual([['']])
    })

    it('timer is cleaned up on unmount (no emit afterwards)', async () => {
      const w = mount(SearchInput, { props: { debounce: 300 } })
      await input(w).setValue('abc')
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      w.unmount()
      expect(vi.getTimerCount()).toBe(0)
      vi.advanceTimersByTime(1000)
      expect(w.emitted('search')).toBeUndefined()
    })

    it('negative or NaN debounce behaves as immediate (bad input)', async () => {
      const neg = mount(SearchInput, { props: { debounce: -50 } })
      await input(neg).setValue('a')
      expect(neg.emitted('search')).toHaveLength(1)
      const nan = mount(SearchInput, { props: { debounce: Number.NaN } })
      await input(nan).setValue('a')
      expect(nan.emitted('search')).toHaveLength(1)
    })
  })

  describe('disabled / readonly', () => {
    it('disabled hides clear and blocks Esc/clear()', async () => {
      const w = mount(SearchInput, { props: { modelValue: 'x', disabled: true } })
      expect(input(w).attributes('disabled')).toBeDefined()
      expect(clearBtn(w).exists()).toBe(false)
      await input(w).trigger('keydown', { key: 'Escape' })
      ;(w.vm as unknown as { clear: () => void }).clear()
      expect(w.emitted('clear')).toBeUndefined()
      expect(input(w).element.value).toBe('x')
    })

    it('readonly hides clear and blocks Esc, but Enter still searches', async () => {
      const w = mount(SearchInput, { props: { modelValue: 'x', readonly: true } })
      expect(input(w).attributes('readonly')).toBeDefined()
      expect(clearBtn(w).exists()).toBe(false)
      await input(w).trigger('keydown', { key: 'Escape' })
      expect(w.emitted('clear')).toBeUndefined()
      await input(w).trigger('keydown', { key: 'Enter' })
      expect(w.emitted('search')).toEqual([['x']])
    })
  })

  describe('a11y / field integration', () => {
    it('invalid sets aria-invalid', () => {
      expect(input(mount(SearchInput, { props: { invalid: true } })).attributes('aria-invalid')).toBe('true')
      expect(input(mount(SearchInput)).attributes('aria-invalid')).toBeUndefined()
    })

    it('required is forwarded', () => {
      expect(input(mount(SearchInput, { props: { required: true } })).attributes('required')).toBeDefined()
    })

    it('inside Field takes id, describedby, invalid and disabled', () => {
      const w = mount(Field, {
        props: { label: 'Search', hint: 'hint', error: 'bad', disabled: true, id: 'q' },
        slots: { default: () => h(SearchInput) },
      })
      const el = w.find('input')
      expect(el.attributes('id')).toBe('q')
      expect(el.attributes('aria-describedby')).toBe('q-hint q-error')
      expect(el.attributes('aria-invalid')).toBe('true')
      expect(el.attributes('disabled')).toBeDefined()
    })

    it('explicit id and aria-describedby attrs win over field context', () => {
      const w = mount(SearchInput, { attrs: { id: 'mine', 'aria-describedby': 'x' } })
      expect(input(w).attributes('id')).toBe('mine')
      expect(input(w).attributes('aria-describedby')).toBe('x')
    })
  })

  describe('customisation', () => {
    it('class merges on the wrapper last; inputClass on the input', () => {
      const w = mount(SearchInput, { props: { class: 'w-64 custom', inputClass: 'h-20' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('w-64')
      expect(w.classes()).not.toContain('w-full')
      expect(input(w).classes()).toContain('h-20')
      expect(input(w).classes()).not.toContain('h-9')
    })

    it('sizes map to heights; unknown falls back to md', () => {
      expect(input(mount(SearchInput, { props: { size: 'sm' } })).classes()).toContain('h-8')
      expect(input(mount(SearchInput, { props: { size: 'lg' } })).classes()).toContain('h-11')
      // @ts-expect-error deliberately invalid
      expect(input(mount(SearchInput, { props: { size: 'x' } })).classes()).toContain('h-9')
    })

    it('attrs (name, aria-label, listeners) land on the input, not the wrapper', async () => {
      const onFocus = vi.fn()
      const w = mount(SearchInput, { attrs: { name: 'q', 'aria-label': 'Search docs', onFocus } })
      expect(input(w).attributes('name')).toBe('q')
      expect(input(w).attributes('aria-label')).toBe('Search docs')
      expect(w.attributes('name')).toBeUndefined()
      await input(w).trigger('focus')
      expect(onFocus).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles unicode and very long values', async () => {
      const w = mount(SearchInput)
      const long = 'ż'.repeat(5000)
      await input(w).setValue(long)
      expect(w.emitted('search')?.[0]).toEqual([long])
      await input(w).setValue('日本語 🔍 مرحبا')
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['日本語 🔍 مرحبا'])
    })

    it('whitespace-only value counts as non-empty', () => {
      expect(clearBtn(mount(SearchInput, { props: { modelValue: ' ' } })).exists()).toBe(true)
    })

    it('typing emptied value hides clear and emits search("")', async () => {
      const w = mount(SearchInput, { props: { modelValue: 'a' } })
      await input(w).setValue('')
      expect(clearBtn(w).exists()).toBe(false)
      expect(w.emitted('search')?.[0]).toEqual([''])
    })
  })
})
