import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import PromptInput from './PromptInput.vue'
import { PromptInput as Exported } from './index'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
  wrapper = mount(PromptInput, { props, attrs: { 'aria-label': 'Message', ...attrs }, slots: slots as never, attachTo: document.body })
  return wrapper
}
const ta = () => wrapper!.find('textarea')
const send = () => wrapper!.find('[data-slot=prompt-input-submit]')
const stop = () => wrapper!.find('[data-slot=prompt-input-stop]')
const count = () => wrapper!.find('[data-slot=prompt-input-count]')
const live = () => wrapper!.find('[data-slot=prompt-input-limit-status]')
async function type(text: string) {
  await ta().setValue(text)
}
async function key(init: KeyboardEventInit & { keyCode?: number }) {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  if (init.keyCode !== undefined) Object.defineProperty(e, 'keyCode', { value: init.keyCode })
  ta().element.dispatchEvent(e)
  await nextTick()
  return e
}
const submitted = () => wrapper!.emitted('submit') ?? []

describe('PromptInput good path', () => {
  it('is exported from the barrel and renders root, textarea, toolbar and a Send button', () => {
    make()
    expect(Exported).toBe(PromptInput)
    expect(wrapper!.attributes('data-slot')).toBe('prompt-input')
    expect(ta().attributes('data-slot')).toBe('prompt-input-textarea')
    expect(wrapper!.find('[data-slot=prompt-input-toolbar]').exists()).toBe(true)
    expect(send().attributes('aria-label')).toBe('Send')
    expect(stop().exists()).toBe(false)
  })
  it('reflects modelValue, emits update:modelValue on input and syncs from outside', async () => {
    make({ modelValue: 'hello' })
    expect(ta().element.value).toBe('hello')
    await type('hello there')
    expect(wrapper!.emitted('update:modelValue')!.at(-1)).toEqual(['hello there'])
    await wrapper!.setProps({ modelValue: 'changed' })
    expect(ta().element.value).toBe('changed')
    await wrapper!.setProps({ modelValue: null })
    expect(ta().element.value).toBe('')
  })
  it('works uncontrolled', async () => {
    make()
    await type('typed')
    expect(ta().element.value).toBe('typed')
  })
  it('applies placeholder and rows, and passes other attributes to the textarea', () => {
    make({ placeholder: 'Write a message', rows: 3 }, { name: 'msg', autocomplete: 'off', 'data-test': 'x' })
    expect(ta().attributes('placeholder')).toBe('Write a message')
    expect(ta().attributes('rows')).toBe('3')
    expect(ta().attributes('name')).toBe('msg')
    expect(ta().attributes('data-test')).toBe('x')
    expect(wrapper!.attributes('name')).toBeUndefined()
  })
  it('renders the header, attach, actions and footer slots', () => {
    make({}, {}, { header: () => 'H', attach: () => h('button', { type: 'button' }, 'Attach'), actions: () => 'A', footer: () => 'F' })
    expect(wrapper!.find('[data-slot=prompt-input-header]').text()).toBe('H')
    expect(wrapper!.find('[data-slot=prompt-input-attach]').text()).toBe('Attach')
    expect(wrapper!.find('[data-slot=prompt-input-footer]').text()).toBe('F')
    expect(wrapper!.find('[data-slot=prompt-input-toolbar]').text()).toContain('A')
  })
  it('renders no header, attach or footer wrapper without those slots', () => {
    make()
    for (const s of ['header', 'attach', 'footer']) expect(wrapper!.find(`[data-slot=prompt-input-${s}]`).exists()).toBe(false)
  })
  it('exposes submit and focus', async () => {
    make({ modelValue: 'hi' })
    ;(wrapper!.vm as unknown as { submit: () => void; focus: () => void }).focus()
    expect(document.activeElement).toBe(ta().element)
    ;(wrapper!.vm as unknown as { submit: () => void }).submit()
    expect(submitted()).toEqual([['hi']])
  })
})

describe('PromptInput submit', () => {
  it('Enter submits the trimmed text and clears the field', async () => {
    make({ modelValue: '' })
    await type('  hello world \n ')
    const e = await key({ key: 'Enter' })
    expect(e.defaultPrevented).toBe(true)
    expect(submitted()).toEqual([['hello world']])
    expect(ta().element.value).toBe('')
    expect(wrapper!.emitted('update:modelValue')!.at(-1)).toEqual([''])
  })
  it('clicking Send submits', async () => {
    make()
    await type('click me')
    await send().trigger('click')
    expect(submitted()).toEqual([['click me']])
  })
  it('clearOnSubmit off keeps the text', async () => {
    make({ clearOnSubmit: false })
    await type('keep')
    await key({ key: 'Enter' })
    expect(submitted()).toEqual([['keep']])
    expect(ta().element.value).toBe('keep')
  })
  it('Shift+Enter and Alt+Enter do not submit and are not prevented', async () => {
    make()
    await type('line')
    for (const mod of [{ shiftKey: true }, { altKey: true }]) {
      const e = await key({ key: 'Enter', ...mod })
      expect(e.defaultPrevented).toBe(false)
    }
    expect(submitted()).toEqual([])
  })
  it('Ctrl+Enter and Cmd+Enter also submit in enter mode', async () => {
    make()
    await type('one')
    await key({ key: 'Enter', ctrlKey: true })
    await type('two')
    await key({ key: 'Enter', metaKey: true })
    expect(submitted()).toEqual([['one'], ['two']])
  })
  it('other keys do nothing', async () => {
    make()
    await type('x')
    const e = await key({ key: 'a' })
    expect(e.defaultPrevented).toBe(false)
    expect(submitted()).toEqual([])
  })
  it('ignores Enter while an IME is composing (isComposing and keyCode 229)', async () => {
    make()
    await type('日本語')
    const a = await key({ key: 'Enter', isComposing: true })
    const b = await key({ key: 'Process', keyCode: 229 })
    const c = await key({ key: 'Enter', keyCode: 229 })
    expect([a, b, c].some((e) => e.defaultPrevented)).toBe(false)
    expect(submitted()).toEqual([])
    expect(ta().element.value).toBe('日本語')
  })
  it('empty and whitespace-only text never submits, and Send is disabled', async () => {
    make()
    expect(send().attributes('disabled')).toBeDefined()
    await key({ key: 'Enter' })
    await type('   \n\t ')
    await key({ key: 'Enter' })
    await send().trigger('click')
    expect(submitted()).toEqual([])
    expect(send().attributes('disabled')).toBeDefined()
    await type('a')
    expect(send().attributes('disabled')).toBeUndefined()
  })
  it('submitOn mod-enter: Enter inserts a line, Ctrl or Cmd with Enter submits', async () => {
    make({ submitOn: 'mod-enter' })
    await type('draft')
    const plain = await key({ key: 'Enter' })
    const shift = await key({ key: 'Enter', shiftKey: true })
    expect(plain.defaultPrevented).toBe(false)
    expect(shift.defaultPrevented).toBe(false)
    expect(submitted()).toEqual([])
    const ctrl = await key({ key: 'Enter', ctrlKey: true })
    expect(ctrl.defaultPrevented).toBe(true)
    expect(submitted()).toEqual([['draft']])
    await type('again')
    await key({ key: 'Enter', metaKey: true })
    expect(submitted()).toEqual([['draft'], ['again']])
  })
  it('mod-enter mode ignores IME composition too', async () => {
    make({ submitOn: 'mod-enter' })
    await type('x')
    await key({ key: 'Enter', ctrlKey: true, isComposing: true })
    expect(submitted()).toEqual([])
  })
})

describe('PromptInput loading, disabled and readonly', () => {
  it('loading swaps Send for a named Stop button, sets aria-busy and blocks submit but not typing', async () => {
    make({ loading: true, modelValue: 'next one' })
    expect(send().exists()).toBe(false)
    expect(stop().attributes('aria-label')).toBe('Stop')
    expect(wrapper!.attributes('aria-busy')).toBe('true')
    expect(wrapper!.attributes('data-loading')).toBe('')
    const e = await key({ key: 'Enter' })
    expect(e.defaultPrevented).toBe(true)
    expect(submitted()).toEqual([])
    await type('still editable')
    expect(ta().element.value).toBe('still editable')
    expect(ta().attributes('disabled')).toBeUndefined()
  })
  it('Stop emits stop; leaving loading brings Send back', async () => {
    make({ loading: true })
    await stop().trigger('click')
    expect(wrapper!.emitted('stop')).toHaveLength(1)
    await wrapper!.setProps({ loading: false })
    expect(send().exists()).toBe(true)
    expect(wrapper!.attributes('aria-busy')).toBeUndefined()
  })
  it('custom button labels', () => {
    make({ submitLabel: 'Senden' })
    expect(send().attributes('aria-label')).toBe('Senden')
    wrapper!.unmount()
    make({ loading: true, stopLabel: 'Anhalten' })
    expect(stop().attributes('aria-label')).toBe('Anhalten')
  })
  it('disabled disables the field and both buttons and blocks submit', async () => {
    make({ disabled: true, modelValue: 'text' })
    expect(ta().attributes('disabled')).toBeDefined()
    expect(send().attributes('disabled')).toBeDefined()
    ;(wrapper!.vm as unknown as { submit: () => void }).submit()
    expect(submitted()).toEqual([])
    await wrapper!.setProps({ loading: true })
    expect(stop().attributes('disabled')).toBeDefined()
  })
  it('readonly blocks submit but Stop still works while loading', async () => {
    make({ readonly: true, modelValue: 'text' })
    expect(ta().attributes('readonly')).toBeDefined()
    await key({ key: 'Enter' })
    expect(submitted()).toEqual([])
    await wrapper!.setProps({ loading: true })
    expect(stop().attributes('disabled')).toBeUndefined()
    await stop().trigger('click')
    expect(wrapper!.emitted('stop')).toHaveLength(1)
  })
  it('invalid sets aria-invalid; a normal field has none', () => {
    make({ invalid: true })
    expect(ta().attributes('aria-invalid')).toBe('true')
    wrapper!.unmount()
    make()
    expect(ta().attributes('aria-invalid')).toBeUndefined()
  })
})

describe('PromptInput character limit', () => {
  it('shows no counter or live region without maxLength (or with a non-positive one)', () => {
    make()
    expect(count().exists()).toBe(false)
    expect(live().exists()).toBe(false)
    expect(ta().attributes('aria-describedby')).toBeUndefined()
    wrapper!.unmount()
    make({ maxLength: 0 })
    expect(count().exists()).toBe(false)
  })
  it('does not set the native maxlength, so typing past the limit is allowed', async () => {
    make({ maxLength: 5 })
    expect(ta().attributes('maxlength')).toBeUndefined()
    await type('123456789')
    expect(ta().element.value).toBe('123456789')
  })
  it('shows count / limit, linked from the textarea, with an empty live region while far from the limit', async () => {
    make({ maxLength: 100 })
    await type('hello')
    expect(count().text()).toContain('5 / 100')
    expect(count().attributes('data-state')).toBe('ok')
    expect(ta().attributes('aria-describedby')).toBe(count().attributes('id'))
    expect(live().text()).toBe('')
    expect(live().attributes('role')).toBe('status')
  })
  it('announces one fixed sentence at 90% and does not include the running count', async () => {
    make({ maxLength: 10 })
    await type('12345678')
    expect(count().attributes('data-state')).toBe('ok')
    await type('123456789')
    expect(count().attributes('data-state')).toBe('near')
    expect(live().text()).toBe('Close to the character limit')
    await type('1234567890')
    expect(live().text()).toBe('Close to the character limit')
    expect(count().attributes('data-state')).toBe('near')
  })
  it('over the limit: icon and text in the counter, aria-invalid, live message, Send disabled, submit blocked', async () => {
    make({ maxLength: 5 })
    await type('123456')
    expect(count().attributes('data-state')).toBe('over')
    expect(count().text()).toContain('6 / 5')
    expect(count().text()).toContain('Over the character limit')
    expect(count().find('svg').exists()).toBe(true)
    expect(live().text()).toBe('Over the character limit')
    expect(ta().attributes('aria-invalid')).toBe('true')
    expect(send().attributes('disabled')).toBeDefined()
    const e = await key({ key: 'Enter' })
    expect(e.defaultPrevented).toBe(true)
    expect(submitted()).toEqual([])
    await type('12345')
    expect(ta().attributes('aria-invalid')).toBeUndefined()
    await key({ key: 'Enter' })
    expect(submitted()).toEqual([['12345']])
  })
  it('custom limit labels', async () => {
    make({ maxLength: 10, limitNearLabel: 'Fast am Limit', limitOverLabel: 'Zu lang' })
    await type('123456789')
    expect(live().text()).toBe('Fast am Limit')
    await type('12345678901')
    expect(live().text()).toBe('Zu lang')
    expect(count().text()).toContain('Zu lang')
  })
  it('counts unicode code points, not UTF-16 units', async () => {
    make({ maxLength: 3 })
    await type('🙂🙂🙂')
    expect(count().text()).toContain('3 / 3')
    expect(count().attributes('data-state')).toBe('near')
    await type('🙂🙂🙂🙂')
    expect(count().attributes('data-state')).toBe('over')
  })
  it('trims before sending but counts the raw text', async () => {
    make({ maxLength: 5 })
    await type('   ab   ')
    expect(count().text()).toContain('8 / 5')
    expect(submitted()).toEqual([])
  })
})

describe('PromptInput auto-grow', () => {
  function layout(scrollHeight: number, lineHeight = '20px') {
    vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockReturnValue(scrollHeight)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ lineHeight, fontSize: '16px', paddingTop: '6px', paddingBottom: '6px' } as CSSStyleDeclaration)
  }
  it('is safe with no layout: scrollHeight 0 leaves no inline height', async () => {
    make({ modelValue: 'text\nmore\nlines' })
    await nextTick()
    expect(ta().element.style.height).toBe('')
    await type('even\nmore\ntext')
    await nextTick()
    expect(ta().element.style.height).toBe('')
  })
  it('sets the height from scrollHeight and re-measures after input', async () => {
    layout(60)
    make({ modelValue: 'one' })
    expect(ta().element.style.height).toBe('60px')
    layout(90)
    await type('one\ntwo')
    await nextTick()
    expect(ta().element.style.height).toBe('90px')
  })
  it('caps the height at maxRows lines plus padding', async () => {
    layout(1000)
    make({ maxRows: 3 })
    expect(ta().element.style.height).toBe('72px')
  })
  it('falls back to a font-size based line height when line-height is not numeric, and to 1 row for a bad maxRows', () => {
    layout(1000, 'normal')
    make({ maxRows: 2 })
    expect(ta().element.style.height).toBe('60px')
    wrapper!.unmount()
    make({ maxRows: 0 })
    expect(ta().element.style.height).toBe('36px')
  })
  it('falls back when computed style values are not numbers', () => {
    vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockReturnValue(500)
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ lineHeight: 'normal', fontSize: '', paddingTop: '', paddingBottom: '' } as CSSStyleDeclaration)
    make({ maxRows: 2 })
    expect(ta().element.style.height).toBe('48px')
  })
  it('re-measures when maxRows changes', async () => {
    layout(1000)
    make({ maxRows: 2 })
    expect(ta().element.style.height).toBe('52px')
    await wrapper!.setProps({ maxRows: 4 })
    await nextTick()
    expect(ta().element.style.height).toBe('92px')
  })
  it('re-measures when the width changes (ResizeObserver), not when only the height does', () => {
    let cb: ResizeObserverCallback = () => {}
    const disconnect = vi.fn()
    class RO {
      constructor(c: ResizeObserverCallback) {
        cb = c
      }
      observe() {}
      unobserve() {}
      disconnect = disconnect
    }
    vi.stubGlobal('ResizeObserver', RO)
    layout(40)
    make()
    expect(ta().element.style.height).toBe('40px')
    layout(80)
    cb([{ contentRect: { width: 300 } } as ResizeObserverEntry], {} as ResizeObserver)
    expect(ta().element.style.height).toBe('80px')
    layout(120)
    cb([{ contentRect: { width: 300 } } as ResizeObserverEntry], {} as ResizeObserver)
    expect(ta().element.style.height).toBe('80px')
    cb([{ contentRect: { width: 200 } } as ResizeObserverEntry], {} as ResizeObserver)
    expect(ta().element.style.height).toBe('120px')
    cb([], {} as ResizeObserver)
    wrapper!.unmount()
    wrapper = undefined
    expect(disconnect).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
  it('works without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    make()
    expect(ta().exists()).toBe(true)
    vi.unstubAllGlobals()
  })
  it('exposes resize()', () => {
    make()
    expect(() => (wrapper!.vm as unknown as { resize: () => void }).resize()).not.toThrow()
  })
})

describe('PromptInput customisation', () => {
  it('class merges onto the root and wins over internal classes', () => {
    make({ class: 'zz-custom p-8' })
    expect(wrapper!.classes()).toContain('zz-custom')
    expect(wrapper!.classes()).toContain('p-8')
    expect(wrapper!.classes()).not.toContain('p-2')
    expect(ta().classes()).not.toContain('zz-custom')
  })
  it('inside a Field it takes the id, description and invalid state', () => {
    const Host = defineComponent({
      setup: () => () => h(Field, { label: 'Message', hint: 'A hint', error: 'Too short' }, () => h(PromptInput)),
    })
    wrapper = mount(Host, { attachTo: document.body }) as unknown as VueWrapper
    const t = wrapper.find('textarea')
    expect(document.querySelector(`label[for="${t.attributes('id')}"]`)).not.toBeNull()
    expect(t.attributes('aria-describedby')).toBeTruthy()
    expect(t.attributes('aria-invalid')).toBe('true')
  })
  it('keeps an explicit id and merges an author aria-describedby with the counter', () => {
    make({ maxLength: 10 }, { id: 'my-id', 'aria-describedby': 'extra' })
    expect(ta().attributes('id')).toBe('my-id')
    expect(ta().attributes('aria-describedby')).toContain('extra')
    expect(ta().attributes('aria-describedby')).toContain(count().attributes('id') as string)
  })
})

describe('PromptInput edge cases', () => {
  it('handles a huge text, hostile markup and RTL text without rendering HTML', async () => {
    make({ maxLength: 50 })
    const hostile = '<img src=x onerror=alert(1)><script>alert(2)</script>'
    await type(hostile)
    expect(ta().element.value).toBe(hostile)
    expect(wrapper!.find('img').exists()).toBe(false)
    expect(wrapper!.find('script').exists()).toBe(false)
    await key({ key: 'Enter' })
    // 51 characters > 50: blocked
    expect(submitted()).toEqual([])
    await type('مرحبا بالعالم')
    await key({ key: 'Enter' })
    expect(submitted()).toEqual([['مرحبا بالعالم']])
    const huge = 'x'.repeat(200_000)
    await type(huge)
    expect(count().attributes('data-state')).toBe('over')
  })
  it('hostile text is sent verbatim (trimmed), never interpreted', async () => {
    make()
    await type('  <b onclick="x()">{{ 1 + 1 }}</b>  ')
    await key({ key: 'Enter' })
    expect(submitted()).toEqual([['<b onclick="x()">{{ 1 + 1 }}</b>']])
  })
  it('rapid Enter presses submit once per non-empty text', async () => {
    make()
    await type('once')
    await key({ key: 'Enter' })
    await key({ key: 'Enter' })
    await key({ key: 'Enter' })
    expect(submitted()).toEqual([['once']])
  })
  it('works controlled through v-model in a parent', async () => {
    const text = ref('')
    const got: string[] = []
    const Host = defineComponent({
      setup: () => () => h(PromptInput, { modelValue: text.value, 'onUpdate:modelValue': (v: string) => (text.value = v), onSubmit: (v: string) => got.push(v), 'aria-label': 'Message' }),
    })
    const w = mount(Host, { attachTo: document.body })
    await w.find('textarea').setValue('from parent')
    expect(text.value).toBe('from parent')
    w.find('textarea').element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    await nextTick()
    expect(got).toEqual(['from parent'])
    expect(text.value).toBe('')
    w.unmount()
  })
  it('unmounting cleans up without errors', () => {
    make()
    expect(() => wrapper!.unmount()).not.toThrow()
    wrapper = undefined
  })
})
