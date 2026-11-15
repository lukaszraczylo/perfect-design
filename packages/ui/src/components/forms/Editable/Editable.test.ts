import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import Editable from './Editable.vue'
import Field from '../Field/Field.vue'
import { editableVariants } from './variants'

type W = ReturnType<typeof mount>
const preview = (w: W) => w.find('[data-slot=editable-preview]')
const field = (w: W) => w.find('[data-slot=editable-input]')
const mountAttached = (props = {}, attrs = {}) => mount(Editable, { props, attrs, attachTo: document.body })
const start = async (w: W) => {
  await preview(w).trigger('click')
  await flushPromises()
}
const typeIn = async (w: W, v: string) => {
  await field(w).setValue(v)
}
afterEach(() => (document.body.innerHTML = ''))

describe('Editable', () => {
  it('renders preview with the value and button semantics', () => {
    const w = mount(Editable, { props: { modelValue: 'Hello' } })
    expect(w.find('[data-slot=editable]').exists()).toBe(true)
    expect(preview(w).text()).toBe('Hello')
    expect(preview(w).attributes('role')).toBe('button')
    expect(preview(w).attributes('tabindex')).toBe('0')
    expect(field(w).exists()).toBe(false)
  })

  it('shows the placeholder (muted) when empty / null', () => {
    for (const modelValue of ['', null, undefined]) {
      const w = mount(Editable, { props: { modelValue: modelValue as string, placeholder: 'Click to add' } })
      expect(preview(w).text()).toBe('Click to add')
      expect(preview(w).attributes('data-empty')).toBeDefined()
    }
  })

  it('click enters edit mode, focuses and selects the input, emits edit', async () => {
    const w = mountAttached({ modelValue: 'Hello' })
    await start(w)
    expect(w.emitted('edit')).toHaveLength(1)
    const el = field(w).element as HTMLInputElement
    expect(el.tagName).toBe('INPUT')
    expect(el.value).toBe('Hello')
    expect(document.activeElement).toBe(el)
    expect(w.find('[data-slot=editable]').attributes('data-editing')).toBeDefined()
    w.unmount()
  })

  it('Enter submits: emits update:modelValue and submit, returns to preview and refocuses it', async () => {
    const w = mountAttached({ modelValue: 'a' })
    await start(w)
    await typeIn(w, 'b')
    await field(w).trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(w.emitted('update:modelValue')).toEqual([['b']])
    expect(w.emitted('submit')).toEqual([['b']])
    expect(preview(w).text()).toBe('b')
    expect(document.activeElement).toBe(preview(w).element)
    w.unmount()
  })

  it('submitting an unchanged draft emits submit but not update:modelValue', async () => {
    const w = mountAttached({ modelValue: 'a' })
    await start(w)
    await field(w).trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.emitted('submit')).toEqual([['a']])
    w.unmount()
  })

  it('Escape cancels, discards the draft and emits cancel with the original value', async () => {
    const w = mountAttached({ modelValue: 'a' })
    await start(w)
    await typeIn(w, 'zzz')
    await field(w).trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(w.emitted('cancel')).toEqual([['a']])
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(preview(w).text()).toBe('a')
    expect(document.activeElement).toBe(preview(w).element)
    w.unmount()
  })

  it('blur submits by default (no refocus)', async () => {
    const w = mountAttached({ modelValue: 'a' })
    await start(w)
    await typeIn(w, 'c')
    await field(w).trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([['c']])
    expect(preview(w).exists()).toBe(true)
    w.unmount()
  })

  it('a blur fired while unmounting after Enter does not double-submit', async () => {
    const w = mountAttached({ modelValue: 'a' })
    await start(w)
    await typeIn(w, 'x')
    const el = field(w)
    await el.trigger('keydown', { key: 'Enter' })
    await el.trigger('blur')
    expect(w.emitted('submit')).toHaveLength(1)
    w.unmount()
  })

  it('syncs preview when modelValue changes externally (controlled)', async () => {
    const w = mount(Editable, { props: { modelValue: 'a' } })
    await w.setProps({ modelValue: 'b' })
    expect(preview(w).text()).toBe('b')
    await w.setProps({ modelValue: null })
    expect(preview(w).text()).toBe('')
  })

  it('works uncontrolled', async () => {
    const w = mount(Editable)
    await start(w)
    await typeIn(w, 'typed')
    await field(w).trigger('keydown', { key: 'Enter' })
    expect(preview(w).text()).toBe('typed')
  })

  it('can submit an empty string (clears the value)', async () => {
    const w = mount(Editable, { props: { modelValue: 'a', placeholder: 'empty' } })
    await start(w)
    await typeIn(w, '')
    await field(w).trigger('keydown', { key: 'Enter' })
    expect(w.emitted('update:modelValue')).toEqual([['']])
    expect(preview(w).text()).toBe('empty')
  })

  describe('submitMode', () => {
    it('enter: blur cancels', async () => {
      const w = mount(Editable, { props: { modelValue: 'a', submitMode: 'enter' } })
      await start(w)
      await typeIn(w, 'b')
      await field(w).trigger('blur')
      expect(w.emitted('cancel')).toEqual([['a']])
      expect(w.emitted('update:modelValue')).toBeUndefined()
      await start(w)
      await typeIn(w, 'b')
      await field(w).trigger('keydown', { key: 'Enter' })
      expect(w.emitted('update:modelValue')).toEqual([['b']])
    })

    it('blur: Enter is ignored, blur commits', async () => {
      const w = mount(Editable, { props: { modelValue: 'a', submitMode: 'blur' } })
      await start(w)
      await typeIn(w, 'b')
      await field(w).trigger('keydown', { key: 'Enter' })
      expect(w.emitted('submit')).toBeUndefined()
      expect(field(w).exists()).toBe(true)
      await field(w).trigger('blur')
      expect(w.emitted('update:modelValue')).toEqual([['b']])
    })

    it('Escape cancels in every mode', async () => {
      for (const submitMode of ['both', 'enter', 'blur'] as const) {
        const w = mount(Editable, { props: { modelValue: 'a', submitMode } })
        await start(w)
        await field(w).trigger('keydown', { key: 'Escape' })
        expect(w.emitted('cancel')).toHaveLength(1)
      }
    })

    it('IME composition Enter does not submit', async () => {
      const w = mount(Editable, { props: { modelValue: 'a' } })
      await start(w)
      await field(w).trigger('keydown', { key: 'Enter', isComposing: true })
      expect(field(w).exists()).toBe(true)
    })

    it('other keys do nothing', async () => {
      const w = mount(Editable, { props: { modelValue: 'a' } })
      await start(w)
      await field(w).trigger('keydown', { key: 'x' })
      expect(field(w).exists()).toBe(true)
    })
  })

  describe('activation', () => {
    it('Enter, Space and F2 on the preview start editing', async () => {
      for (const key of ['Enter', ' ', 'F2']) {
        const w = mount(Editable, { props: { modelValue: 'a' } })
        await preview(w).trigger('keydown', { key })
        expect(field(w).exists()).toBe(true)
      }
      const w = mount(Editable, { props: { modelValue: 'a' } })
      await preview(w).trigger('keydown', { key: 'a' })
      expect(field(w).exists()).toBe(false)
    })

    it('dblclick mode ignores single clicks', async () => {
      const w = mount(Editable, { props: { modelValue: 'a', activationMode: 'dblclick' } })
      await preview(w).trigger('click')
      expect(field(w).exists()).toBe(false)
      await preview(w).trigger('dblclick')
      expect(field(w).exists()).toBe(true)
    })

    it('click mode ignores dblclick/focus; focus mode edits on focus and does not steal focus back', async () => {
      const c = mount(Editable, { props: { modelValue: 'a' } })
      await preview(c).trigger('dblclick')
      await preview(c).trigger('focus')
      expect(field(c).exists()).toBe(false)

      const w = mountAttached({ modelValue: 'a', activationMode: 'focus' })
      await preview(w).trigger('focus')
      await flushPromises()
      expect(field(w).exists()).toBe(true)
      await field(w).trigger('keydown', { key: 'Escape' })
      await flushPromises()
      expect(field(w).exists()).toBe(false)
      w.unmount()
    })

    it('re-entering edit while editing is a no-op', async () => {
      const w = mount(Editable, { props: { modelValue: 'a' } })
      await start(w)
      ;(w.vm as unknown as { edit: () => void }).edit()
      expect(w.emitted('edit')).toHaveLength(1)
    })

    it('exposes edit/submit/cancel for programmatic control', async () => {
      const w = mount(Editable, { props: { modelValue: 'a' } })
      const api = w.vm as unknown as { edit: () => void; submit: () => void; cancel: () => void }
      api.edit()
      await flushPromises()
      api.cancel()
      await flushPromises()
      expect(w.emitted('cancel')).toHaveLength(1)
      api.submit() // not editing: no-op
      api.cancel()
      expect(w.emitted('submit')).toBeUndefined()
      expect(w.emitted('cancel')).toHaveLength(1)
    })
  })

  describe('multiline', () => {
    it('uses a textarea with rows; plain Enter does not submit', async () => {
      const w = mount(Editable, { props: { modelValue: 'a', multiline: true, rows: 5 } })
      await start(w)
      expect(field(w).element.tagName).toBe('TEXTAREA')
      expect(field(w).attributes('rows')).toBe('5')
      await typeIn(w, 'line1\nline2')
      const ev = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true })
      field(w).element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
      expect(w.emitted('submit')).toBeUndefined()
    })

    it.each([{ shiftKey: true }, { ctrlKey: true }, { metaKey: true }])('Enter with %j submits', async (mod) => {
      const w = mount(Editable, { props: { modelValue: 'a', multiline: true } })
      await start(w)
      await typeIn(w, 'x\ny')
      await field(w).trigger('keydown', { key: 'Enter', ...mod })
      expect(w.emitted('update:modelValue')).toEqual([['x\ny']])
    })

    it('blur and Escape still work in multiline', async () => {
      const w = mount(Editable, { props: { modelValue: 'a', multiline: true } })
      await start(w)
      await typeIn(w, 'b')
      await field(w).trigger('blur')
      expect(w.emitted('update:modelValue')).toEqual([['b']])
      await start(w)
      await field(w).trigger('keydown', { key: 'Escape' })
      expect(w.emitted('cancel')).toHaveLength(1)
    })
  })

  describe('disabled / readonly', () => {
    it('disabled: no role/tabindex change in edit flow, never edits', async () => {
      const w = mount(Editable, { props: { modelValue: 'a', disabled: true } })
      expect(preview(w).attributes('aria-disabled')).toBe('true')
      expect(preview(w).attributes('role')).toBeUndefined()
      expect(preview(w).attributes('tabindex')).toBeUndefined()
      await preview(w).trigger('click')
      await preview(w).trigger('keydown', { key: 'F2' })
      expect(field(w).exists()).toBe(false)
      expect(w.emitted('edit')).toBeUndefined()
    })

    it('readonly: shows value, not interactive', async () => {
      const w = mount(Editable, { props: { modelValue: 'a', readonly: true } })
      expect(preview(w).attributes('data-readonly')).toBeDefined()
      expect(preview(w).attributes('role')).toBeUndefined()
      await preview(w).trigger('click')
      expect(field(w).exists()).toBe(false)
    })

    it('becoming disabled while editing still lets Escape/blur resolve', async () => {
      const w = mount(Editable, { props: { modelValue: 'a' } })
      await start(w)
      await w.setProps({ disabled: true })
      await field(w).trigger('keydown', { key: 'Escape' })
      expect(preview(w).exists()).toBe(true)
    })
  })

  describe('customisation', () => {
    it('merges class last, forwards attrs, sizes', () => {
      const w = mount(Editable, { props: { class: 'max-w-xs', size: 'lg', modelValue: 'a' }, attrs: { 'data-x': '1', id: 'e' } })
      const root = w.find('[data-slot=editable]')
      expect(root.classes()).toContain('max-w-xs')
      expect(root.attributes('data-x')).toBe('1')
      expect(preview(w).classes()).toContain('text-lg')
      expect(editableVariants({ size: 'sm', state: 'editing' })).toContain('md:text-sm')
      expect(editableVariants()).toContain('cursor-text')
    })

    it('forwards placeholder, aria-label and invalid to the control', async () => {
      const w = mount(Editable, { props: { placeholder: 'Name', ariaLabel: 'Project name', invalid: true, required: true } })
      expect(preview(w).attributes('aria-label')).toBe('Project name: Name')
      await start(w)
      expect(field(w).attributes('placeholder')).toBe('Name')
      expect(field(w).attributes('aria-label')).toBe('Project name')
      expect(field(w).attributes('aria-invalid')).toBe('true')
      expect(field(w).attributes('required')).toBeDefined()
    })

    it('names the preview with the label plus its visible text (WCAG 2.5.3)', () => {
      // Pinned previously: aria-label only when empty. The name now states the purpose and contains the visible text.
      expect(preview(mount(Editable, { props: { modelValue: 'x', ariaLabel: 'Name' } })).attributes('aria-label')).toBe('Name: x')
      expect(preview(mount(Editable, { props: { ariaLabel: 'Name' } })).attributes('aria-label')).toBe('Name')
      expect(preview(mount(Editable, { props: { modelValue: 'x' } })).attributes('aria-label')).toBeUndefined()
    })

    it('does not put aria-label on a locked (non-button) preview', () => {
      const w = mount(Editable, { props: { modelValue: 'x', ariaLabel: 'Name', readonly: true } })
      expect(preview(w).attributes('aria-label')).toBeUndefined()
      expect(preview(w).attributes('role')).toBeUndefined()
    })

    it('names the preview from the Field label through aria-labelledby', async () => {
      const w = mount({ components: { Field, Editable }, template: '<Field label="Title"><Editable model-value="Hello" /></Field>' }, { attachTo: document.body })
      await flushPromises()
      const p = w.find('[data-slot=editable-preview]')
      const label = w.find('label')
      expect(label.attributes('id')).toBeTruthy()
      expect(p.attributes('aria-labelledby')).toBe(`${label.attributes('id')} ${p.attributes('id')}`)
      expect(document.getElementById(label.attributes('id') as string)?.textContent).toContain('Title')
    })

    it('does not use aria-labelledby when ariaLabel is set or inside a Field without a label', async () => {
      const w = mount({ components: { Field, Editable }, template: '<Field label="Title"><Editable model-value="Hello" aria-label="Own" /></Field>' })
      await flushPromises()
      expect(w.find('[data-slot=editable-preview]').attributes('aria-labelledby')).toBeUndefined()
      const bare = mount({ components: { Field, Editable }, template: '<Field><Editable model-value="Hello" /></Field>' })
      await flushPromises()
      expect(bare.find('[data-slot=editable-preview]').attributes('aria-labelledby')).toBeUndefined()
    })

    it('uses sensible control hints and responsive sizing', async () => {
      const w = mount(Editable, { props: { modelValue: 'a' } })
      expect(preview(w).classes()).toEqual(expect.arrayContaining(['min-h-8', 'pointer-coarse:min-h-11', 'text-md', 'md:text-base']))
      await start(w)
      expect(field(w).attributes('autocomplete')).toBe('off')
      expect(field(w).attributes('enterkeyhint')).toBe('done')
    })

    it('wires into Field', async () => {
      const w = mount({ components: { Field, Editable }, template: '<Field label="Title" error="Bad" required><Editable model-value="x" /></Field>' })
      const p = w.find('[data-slot=editable-preview]')
      expect(p.attributes('id')).toBeTruthy()
      await p.trigger('click')
      const f = w.find('[data-slot=editable-input]')
      expect(f.attributes('aria-invalid')).toBe('true')
      expect(f.attributes('id')).toBe(p.attributes('id'))
    })
  })

  describe('cleanup', () => {
    it('unmounting right after starting an edit does not throw (pending focus)', async () => {
      const w = mountAttached({ modelValue: 'a' })
      await preview(w).trigger('click')
      w.unmount()
      await flushPromises()
      expect(document.body.innerHTML).toBe('')
    })

    it('unmounting right after a keyboard commit does not throw (pending refocus)', async () => {
      const w = mountAttached({ modelValue: 'a' })
      await start(w)
      await field(w).trigger('keydown', { key: 'Enter' })
      w.unmount()
      await flushPromises()
    })
  })

  describe('announcements and focus', () => {
    const status = (w: W) => w.find('[data-slot=editable-status]')

    it('has a polite status region that is empty at rest', () => {
      const w = mount(Editable, { props: { modelValue: 'a' } })
      expect(status(w).attributes('role')).toBe('status')
      expect(status(w).classes()).toContain('sr-only')
      expect(status(w).text()).toBe('')
    })

    it('announces a commit with the saved text', async () => {
      const w = mountAttached({ modelValue: 'a' })
      await start(w)
      await typeIn(w, 'Renamed')
      await field(w).trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(status(w).text()).toBe('Saved: Renamed')
    })

    it('announces a commit that empties the value without a colon, with a custom label', async () => {
      const w = mountAttached({ modelValue: 'a', savedLabel: 'Stored' })
      await start(w)
      await typeIn(w, '')
      await field(w).trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(status(w).text()).toBe('Stored')
    })

    it('announces a discarded draft', async () => {
      const w = mountAttached({ modelValue: 'a' })
      await start(w)
      await typeIn(w, 'zzz')
      await field(w).trigger('keydown', { key: 'Escape' })
      await flushPromises()
      expect(status(w).text()).toBe('Changes discarded')
    })

    it('announces the same message twice in a row', async () => {
      const w = mountAttached({ modelValue: 'a' })
      for (let i = 0; i < 2; i++) {
        await start(w)
        await field(w).trigger('keydown', { key: 'Escape' })
        await flushPromises()
        expect(status(w).text()).toBe('Changes discarded')
      }
    })

    it('returns focus to the preview after a keyboard commit in focus mode without re-entering edit', async () => {
      const w = mountAttached({ modelValue: 'a', activationMode: 'focus' })
      ;(preview(w).element as HTMLElement).focus()
      await flushPromises()
      expect(field(w).exists()).toBe(true)
      await field(w).trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(field(w).exists()).toBe(false)
      expect(document.activeElement).toBe(preview(w).element)
      // A later focus (Tab back in) still starts editing.
      ;(preview(w).element as HTMLElement).blur()
      ;(preview(w).element as HTMLElement).focus()
      await flushPromises()
      expect(field(w).exists()).toBe(true)
    })

    it('keeps a disabled preview out of the tab order', () => {
      const w = mount(Editable, { props: { modelValue: 'a', disabled: true } })
      expect(preview(w).attributes('tabindex')).toBeUndefined()
    })
  })
})
