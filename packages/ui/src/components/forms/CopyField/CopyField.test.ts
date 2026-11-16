import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import CopyField from './CopyField.vue'
import Field from '../Field/Field.vue'

const input = (w: ReturnType<typeof mount>) => w.find('input')
const button = (w: ReturnType<typeof mount>) => w.find('[data-slot=copy-field-button]')
const status = (w: ReturnType<typeof mount>) => w.find('[data-slot=copy-field-status]')

type Doc = { execCommand?: unknown }
const clipboardWrite = vi.fn()
let execCommand: ReturnType<typeof vi.fn>

function installClipboard(impl: () => Promise<void> = () => Promise.resolve()) {
  clipboardWrite.mockReset().mockImplementation(impl)
  Object.defineProperty(navigator, 'clipboard', { value: { write: clipboardWrite, writeText: clipboardWrite }, configurable: true })
  Object.defineProperty(navigator, 'permissions', {
    value: { query: vi.fn().mockResolvedValue({ state: 'granted', addEventListener: vi.fn(), removeEventListener: vi.fn() }) },
    configurable: true,
  })
  vi.stubGlobal('ClipboardItem', class { constructor(public items: unknown) {} })
}

beforeEach(() => {
  execCommand = vi.fn(() => true)
  ;(document as unknown as Doc).execCommand = execCommand
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'clipboard')
  Reflect.deleteProperty(navigator, 'permissions')
  delete (document as unknown as Doc).execCommand
})

describe('CopyField', () => {
  describe('rendering', () => {
    it('renders readonly input with the value, a button and a live status region', () => {
      const w = mount(CopyField, { props: { value: 'sk-123' } })
      expect(w.attributes('data-slot')).toBe('copy-field')
      expect(input(w).element.value).toBe('sk-123')
      expect(input(w).attributes('readonly')).toBeDefined()
      expect(input(w).attributes('type')).toBe('text')
      expect(button(w).text()).toBe('Copy')
      expect(button(w).attributes('type')).toBe('button')
      expect(status(w).attributes('role')).toBe('status')
      expect(status(w).attributes('aria-live')).toBe('polite')
      expect(status(w).text()).toBe('')
    })

    it('modelValue is an alias and wins over value; updates reactively', async () => {
      const w = mount(CopyField, { props: { modelValue: 'a', value: 'b' } })
      expect(input(w).element.value).toBe('a')
      await w.setProps({ modelValue: null })
      expect(input(w).element.value).toBe('b')
      await w.setProps({ value: undefined })
      expect(input(w).element.value).toBe('')
    })

    it('mask renders a password input', () => {
      expect(input(mount(CopyField, { props: { value: 'x', mask: true } })).attributes('type')).toBe('password')
    })

    it('iconOnly keeps the label for assistive tech (sr-only)', () => {
      const w = mount(CopyField, { props: { value: 'x', iconOnly: true } })
      expect(button(w).find('span').classes()).toContain('sr-only')
      expect(button(w).text()).toBe('Copy')
    })

    it('selects the whole value on focus', async () => {
      const w = mount(CopyField, { props: { value: 'select me' }, attachTo: document.body })
      await input(w).trigger('focus')
      expect(input(w).element.selectionStart).toBe(0)
      expect(input(w).element.selectionEnd).toBe(9)
      w.unmount()
    })
  })

  describe('copying', () => {
    it('copies via the async clipboard API, emits copy, shows Copied then reverts', async () => {
      vi.useFakeTimers()
      installClipboard()
      const w = mount(CopyField, { props: { value: 'secret' } })
      await flushPromises()
      await button(w).trigger('click')
      await flushPromises()
      expect(clipboardWrite).toHaveBeenCalledTimes(1)
      expect(w.emitted('copy')?.[0]).toEqual(['secret'])
      expect(button(w).text()).toBe('Copied')
      expect(status(w).text()).toBe('Copied')
      expect(w.attributes('data-copied')).toBeDefined()
      vi.advanceTimersByTime(1999)
      await flushPromises()
      expect(button(w).text()).toBe('Copied')
      vi.advanceTimersByTime(1)
      await flushPromises()
      expect(button(w).text()).toBe('Copy')
      expect(status(w).text()).toBe('')
      expect(w.attributes('data-copied')).toBeUndefined()
    })

    it('honours copiedDuring and custom labels', async () => {
      vi.useFakeTimers()
      installClipboard()
      const w = mount(CopyField, { props: { value: 'v', copiedDuring: 500, label: 'Kopiuj', copiedLabel: 'Skopiowano' } })
      await flushPromises()
      expect(button(w).text()).toBe('Kopiuj')
      await button(w).trigger('click')
      await flushPromises()
      expect(button(w).text()).toBe('Skopiowano')
      vi.advanceTimersByTime(500)
      await flushPromises()
      expect(button(w).text()).toBe('Kopiuj')
    })

    it('reads copiedDuring live for the copied timer', async () => {
      vi.useFakeTimers()
      installClipboard()
      const w = mount(CopyField, { props: { value: 'v', copiedDuring: 500, label: 'Copy', copiedLabel: 'Done' } })
      await flushPromises()
      await w.setProps({ copiedDuring: 2000 })
      await button(w).trigger('click')
      await flushPromises()
      vi.advanceTimersByTime(600)
      await flushPromises()
      expect(button(w).text()).toBe('Done')
      vi.advanceTimersByTime(1500)
      await flushPromises()
      expect(button(w).text()).toBe('Copy')
    })

    it('negative / NaN copiedDuring does not throw (bad input)', async () => {
      vi.useFakeTimers()
      installClipboard()
      const w = mount(CopyField, { props: { value: 'v', copiedDuring: Number.NaN } })
      await flushPromises()
      await button(w).trigger('click')
      await flushPromises()
      vi.advanceTimersByTime(1)
      await flushPromises()
      expect(button(w).text()).toBe('Copy')
    })

    it('falls back to execCommand when the async API is unavailable', async () => {
      const w = mount(CopyField, { props: { value: 'legacy' } })
      await flushPromises()
      await button(w).trigger('click')
      await flushPromises()
      expect(execCommand).toHaveBeenCalledWith('copy')
      expect(w.emitted('copy')?.[0]).toEqual(['legacy'])
    })

    it('falls back to execCommand when the async API rejects', async () => {
      installClipboard(() => Promise.reject(new Error('denied')))
      const w = mount(CopyField, { props: { value: 'v' } })
      await flushPromises()
      await button(w).trigger('click')
      await flushPromises()
      expect(clipboardWrite).toHaveBeenCalledTimes(1)
      expect(execCommand).toHaveBeenCalledWith('copy')
      expect(w.emitted('copy')).toHaveLength(1)
    })

    it('copies unicode, long and whitespace values verbatim', async () => {
      installClipboard()
      for (const v of ['日本語 🔑 مرحبا', 'x'.repeat(10000), '  spaced  ']) {
        const w = mount(CopyField, { props: { value: v } })
        await flushPromises()
        await button(w).trigger('click')
        await flushPromises()
        expect(w.emitted('copy')?.[0]).toEqual([v])
      }
    })

    it('masked fields still copy the real value', async () => {
      installClipboard()
      const w = mount(CopyField, { props: { value: 'real', mask: true } })
      await flushPromises()
      await button(w).trigger('click')
      await flushPromises()
      expect(w.emitted('copy')?.[0]).toEqual(['real'])
      expect(input(w).element.value).toBe('real')
    })

    it('rapid clicks restart the copied timer', async () => {
      vi.useFakeTimers()
      installClipboard()
      const w = mount(CopyField, { props: { value: 'v' } })
      await flushPromises()
      await button(w).trigger('click')
      await flushPromises()
      vi.advanceTimersByTime(1500)
      await button(w).trigger('click')
      await flushPromises()
      vi.advanceTimersByTime(1500)
      await flushPromises()
      expect(button(w).text()).toBe('Copied')
      vi.advanceTimersByTime(500)
      await flushPromises()
      expect(button(w).text()).toBe('Copy')
      expect(w.emitted('copy')).toHaveLength(2)
    })

    it('clears the copied timer on unmount', async () => {
      vi.useFakeTimers()
      installClipboard()
      const w = mount(CopyField, { props: { value: 'v' } })
      await flushPromises()
      await button(w).trigger('click')
      await flushPromises()
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      w.unmount()
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('bad path', () => {
    it('emits copy-error (not copy) when copying throws', async () => {
      // no async API and no execCommand => legacy path throws
      delete (document as unknown as Doc).execCommand
      const w = mount(CopyField, { props: { value: 'v' } })
      await flushPromises()
      await button(w).trigger('click')
      await flushPromises()
      expect(w.emitted('copy')).toBeUndefined()
      expect(w.emitted('copy-error')).toHaveLength(1)
      expect(w.emitted('copy-error')?.[0][0]).toBeInstanceOf(Error)
      // the failure is shown and announced, then cleared
      expect(button(w).text()).toBe('Copy failed')
      expect(w.find('[data-slot="copy-field-status"]').text()).toBe('Copy failed')
    })

    it('empty value disables the button and never copies', async () => {
      installClipboard()
      for (const props of [{}, { value: '' }, { value: null }]) {
        const w = mount(CopyField, { props })
        await flushPromises()
        expect(button(w).attributes('disabled')).toBeDefined()
        await button(w).trigger('click')
        expect(w.emitted('copy')).toBeUndefined()
      }
      expect(clipboardWrite).not.toHaveBeenCalled()
    })

    it('disabled disables input and button and blocks copy', async () => {
      installClipboard()
      const w = mount(CopyField, { props: { value: 'v', disabled: true } })
      await flushPromises()
      expect(input(w).attributes('disabled')).toBeDefined()
      expect(button(w).attributes('disabled')).toBeDefined()
      await button(w).trigger('click')
      ;(w.vm as unknown as { copy: () => Promise<void> }).copy()
      await flushPromises()
      expect(clipboardWrite).not.toHaveBeenCalled()
      expect(w.emitted('copy')).toBeUndefined()
    })

    it('invalid sets aria-invalid', () => {
      expect(input(mount(CopyField, { props: { value: 'x', invalid: true } })).attributes('aria-invalid')).toBe('true')
      expect(input(mount(CopyField, { props: { value: 'x' } })).attributes('aria-invalid')).toBeUndefined()
    })
  })

  describe('field integration & customisation', () => {
    it('inside Field takes id, describedby, invalid and disabled', () => {
      const w = mount(Field, {
        props: { label: 'Key', hint: 'h', error: 'e', disabled: true, id: 'k' },
        slots: { default: () => h(CopyField, { value: 'x' }) },
      })
      const el = w.find('input')
      expect(el.attributes('id')).toBe('k')
      expect(el.attributes('aria-describedby')).toBe('k-hint k-error')
      expect(el.attributes('aria-invalid')).toBe('true')
      expect(el.attributes('disabled')).toBeDefined()
      expect(w.find('[data-slot=copy-field-button]').attributes('disabled')).toBeDefined()
    })

    it('class merges on wrapper last, inputClass on input; attrs land on the input', () => {
      const w = mount(CopyField, {
        props: { value: 'x', class: 'max-w-sm custom', inputClass: 'text-lg' },
        attrs: { 'aria-label': 'API key', name: 'key' },
      })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('max-w-sm')
      expect(input(w).classes()).toContain('text-lg')
      expect(input(w).classes()).not.toContain('text-sm')
      expect(input(w).attributes('aria-label')).toBe('API key')
      expect(input(w).attributes('name')).toBe('key')
      expect(w.attributes('name')).toBeUndefined()
    })

    it('sizes map to heights on input and button; unknown falls back to md', () => {
      const sm = mount(CopyField, { props: { value: 'x', size: 'sm' } })
      expect(input(sm).classes()).toContain('h-8')
      expect(button(sm).classes()).toContain('h-8')
      expect(input(mount(CopyField, { props: { value: 'x', size: 'lg' } })).classes()).toContain('h-11')
      // @ts-expect-error deliberately invalid
      expect(input(mount(CopyField, { props: { value: 'x', size: 'q' } })).classes()).toContain('h-9')
    })
  })
})
