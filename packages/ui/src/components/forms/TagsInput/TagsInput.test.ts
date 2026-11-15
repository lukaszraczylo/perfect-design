import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import TagsInput from './TagsInput.vue'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  wrapper = mount(TagsInput, { props, attrs, attachTo: document.body })
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const input = (w: VueWrapper) => w.find('input[data-slot=tags-input-input]')
const tags = (w: VueWrapper) => w.findAll('[data-slot=tags-input-item]').map((t) => t.find('[data-slot=tags-input-item-text]').text())
const last = (w: VueWrapper) => w.emitted('update:modelValue')?.at(-1)?.[0]

/** Type text and press Enter; reka commits after a nextTick. */
async function addWithEnter(w: VueWrapper, text: string) {
  const el = input(w)
  ;(el.element as HTMLInputElement).value = text
  await el.trigger('input')
  await el.trigger('keydown', { key: 'Enter' })
  await flushPromises()
}

/** Type a delimiter char as a real InputEvent (reka reads `event.data`). */
async function typeWithDelimiter(w: VueWrapper, text: string, char = ',') {
  const el = input(w)
  ;(el.element as HTMLInputElement).value = text + char
  el.element.dispatchEvent(new InputEvent('input', { data: char, bubbles: true }))
  await flushPromises()
}

describe('TagsInput', () => {
  describe('good path', () => {
    it('renders root, input and existing tags with data-slots', () => {
      const w = make({ modelValue: ['a', 'b'] })
      expect(w.attributes('data-slot')).toBe('tags-input')
      expect(input(w).exists()).toBe(true)
      expect(tags(w)).toEqual(['a', 'b'])
    })

    it('adds a tag on Enter and clears the text', async () => {
      const w = make()
      await addWithEnter(w, 'vue')
      expect(last(w)).toEqual(['vue'])
      expect(w.emitted('add')?.[0]).toEqual(['vue'])
      expect((input(w).element as HTMLInputElement).value).toBe('')
      expect(tags(w)).toEqual(['vue'])
    })

    it('adds a tag on the comma delimiter', async () => {
      const w = make()
      await typeWithDelimiter(w, 'react')
      expect(last(w)).toEqual(['react'])
      expect((input(w).element as HTMLInputElement).value).toBe('')
    })

    it('supports a custom delimiter', async () => {
      const w = make({ delimiter: ';' })
      await typeWithDelimiter(w, 'x', ';')
      expect(last(w)).toEqual(['x'])
    })

    it('trims whitespace around tags', async () => {
      const w = make()
      await addWithEnter(w, '  padded  ')
      expect(last(w)).toEqual(['padded'])
    })

    it('keeps adding to existing tags', async () => {
      const w = make({ modelValue: ['a'] })
      await addWithEnter(w, 'b')
      expect(last(w)).toEqual(['a', 'b'])
    })

    it('removes a tag with its delete button', async () => {
      const w = make({ modelValue: ['a', 'b', 'c'] })
      await w.findAll('[data-slot=tags-input-item-delete]')[1]!.trigger('click')
      expect(last(w)).toEqual(['a', 'c'])
      expect(w.emitted('remove')?.[0]).toEqual(['b'])
      expect(tags(w)).toEqual(['a', 'c'])
    })

    it('Backspace on empty input selects then removes the last tag', async () => {
      const w = make({ modelValue: ['a', 'b'] })
      await flushPromises()
      const el = input(w)
      await el.trigger('keydown', { key: 'Backspace' })
      await flushPromises()
      expect(w.findAll('[data-slot=tags-input-item]').at(-1)!.attributes('data-state')).toBe('active')
      await el.trigger('keydown', { key: 'Backspace' })
      await flushPromises()
      expect(last(w)).toEqual(['a'])
      expect(w.emitted('remove')?.[0]).toEqual(['b'])
    })

    it('works uncontrolled with defaultValue', async () => {
      const w = make({ defaultValue: ['x'] })
      expect(tags(w)).toEqual(['x'])
      await addWithEnter(w, 'y')
      expect(tags(w)).toEqual(['x', 'y'])
    })

    it('syncs when modelValue changes externally', async () => {
      const w = make({ modelValue: ['a'] })
      await w.setProps({ modelValue: ['q', 'r'] })
      expect(tags(w)).toEqual(['q', 'r'])
    })

    it('keeps tags when modelValue becomes null', async () => {
      const w = make({ modelValue: ['a'] })
      await w.setProps({ modelValue: null })
      expect(tags(w)).toEqual(['a'])
    })

    it('works with a parent v-model', async () => {
      const list = ref<string[]>(['a'])
      const Host = defineComponent({
        setup: () => () => h(TagsInput, { modelValue: list.value, 'onUpdate:modelValue': (v: string[]) => (list.value = v) }),
      })
      wrapper = mount(Host, { attachTo: document.body }) as unknown as VueWrapper
      await addWithEnter(wrapper, 'b')
      expect(list.value).toEqual(['a', 'b'])
    })

    it('shows the placeholder only while there are no tags', async () => {
      const w = make({ placeholder: 'Add tag' })
      expect(input(w).attributes('placeholder')).toBe('Add tag')
      await addWithEnter(w, 'x')
      expect(input(w).attributes('placeholder')).toBeUndefined()
    })

    it('addOnBlur adds the pending text', async () => {
      const w = make({ addOnBlur: true })
      ;(input(w).element as HTMLInputElement).value = 'pending'
      await input(w).trigger('blur')
      expect(last(w)).toEqual(['pending'])
    })

    it('addOnPaste splits on the delimiter', async () => {
      const w = make({ addOnPaste: true })
      const paste = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown }
      paste.clipboardData = { getData: () => 'a,b,c' }
      input(w).element.dispatchEvent(paste)
      await flushPromises()
      expect(last(w)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('bad path', () => {
    it('rejects duplicates with duplicate + reject events', async () => {
      const w = make({ modelValue: ['vue'] })
      await addWithEnter(w, 'vue')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(w.emitted('duplicate')?.[0]).toEqual(['vue'])
      expect(w.emitted('reject')?.[0]).toEqual([{ value: 'vue', reason: 'duplicate' }])
      expect(tags(w)).toEqual(['vue'])
    })

    it('detects duplicates after trimming', async () => {
      const w = make({ modelValue: ['vue'] })
      await addWithEnter(w, '  vue ')
      expect(w.emitted('duplicate')?.[0]).toEqual(['vue'])
    })

    it('duplicate check is case-sensitive', async () => {
      const w = make({ modelValue: ['Vue'] })
      await addWithEnter(w, 'vue')
      expect(last(w)).toEqual(['Vue', 'vue'])
    })

    it('enforces max and emits reject reason=max (not duplicate)', async () => {
      const w = make({ modelValue: ['a', 'b'], max: 2 })
      await addWithEnter(w, 'c')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(w.emitted('reject')?.[0]).toEqual([{ value: 'c', reason: 'max' }])
      expect(w.emitted('duplicate')).toBeUndefined()
      expect(tags(w)).toEqual(['a', 'b'])
    })

    it('allows reaching max exactly', async () => {
      const w = make({ modelValue: ['a'], max: 2 })
      await addWithEnter(w, 'b')
      expect(last(w)).toEqual(['a', 'b'])
    })

    it('ignores empty and whitespace-only input', async () => {
      const w = make()
      await addWithEnter(w, '')
      await addWithEnter(w, '    ')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(w.emitted('add')).toBeUndefined()
      expect(tags(w)).toEqual([])
    })

    it('a lone delimiter does not add an empty tag', async () => {
      const w = make()
      await typeWithDelimiter(w, '')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('disabled disables the input and blocks removal', async () => {
      const w = make({ modelValue: ['a'], disabled: true })
      expect(input(w).attributes('disabled')).toBeDefined()
      expect(w.attributes('data-disabled')).toBeDefined()
      await w.find('[data-slot=tags-input-item-delete]').trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(tags(w)).toEqual(['a'])
    })

    it('disabled blocks adding via Enter', async () => {
      const w = make({ disabled: true })
      await addWithEnter(w, 'x')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('a11y and customisation', () => {
    it('remove buttons have accessible names with the tag', () => {
      const w = make({ modelValue: ['react'] })
      expect(w.find('[data-slot=tags-input-item-delete]').attributes('aria-label')).toBe('Remove react')
    })

    it('removeLabel customises the prefix', () => {
      const w = make({ modelValue: ['react'], removeLabel: 'Usuń' })
      expect(w.find('[data-slot=tags-input-item-delete]').attributes('aria-label')).toBe('Usuń react')
    })

    it('remove buttons are type=button', () => {
      expect(make({ modelValue: ['a'] }).find('[data-slot=tags-input-item-delete]').attributes('type')).toBe('button')
    })

    it('ariaLabel names the text input', () => {
      expect(input(make({ ariaLabel: 'Skills' })).attributes('aria-label')).toBe('Skills')
    })

    it('invalid sets aria-invalid on the input and destructive styling on the root', () => {
      const w = make({ invalid: true })
      expect(input(w).attributes('aria-invalid')).toBe('true')
      expect(w.classes()).toContain('border-destructive')
    })

    it('valid has no aria-invalid', () => {
      const w = make()
      expect(input(w).attributes('aria-invalid')).toBeUndefined()
      expect(w.classes()).not.toContain('ring-destructive/20')
    })

    it('merges class last so it wins', () => {
      const w = make({ class: 'min-h-20 custom' })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('min-h-20')
      expect(w.classes()).not.toContain('min-h-9')
    })

    it('uses the shared field surface', () => {
      expect(make().classes()).toContain('border-input')
    })

    it('attrs go to the text input', () => {
      const w = make({}, { 'data-testid': 'tags', 'aria-describedby': 'custom' })
      expect(input(w).attributes('data-testid')).toBe('tags')
      expect(input(w).attributes('aria-describedby')).toBe('custom')
    })

    it('renders a hidden form input when name is set inside a form', async () => {
      wrapper = mount(
        defineComponent({ render: () => h('form', [h(TagsInput, { modelValue: ['a'], name: 'skills' })]) }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      await flushPromises()
      expect(document.body.querySelector('input[name="skills[0]"]')).not.toBeNull()
    })
  })

  describe('edge cases', () => {
    it('handles unicode, emoji and RTL tags', async () => {
      const w = make()
      await addWithEnter(w, 'żółć')
      await addWithEnter(w, '🚀 launch')
      await addWithEnter(w, 'مرحبا')
      expect(last(w)).toEqual(['żółć', '🚀 launch', 'مرحبا'])
    })

    it('handles very long tags (truncated visually, intact in the model)', async () => {
      const w = make()
      const long = 'x'.repeat(500)
      await addWithEnter(w, long)
      expect(last(w)).toEqual([long])
    })

    it('rapid additions all land', async () => {
      const w = make()
      for (let i = 0; i < 20; i++) await addWithEnter(w, `t${i}`)
      expect(tags(w)).toHaveLength(20)
      expect(new Set(tags(w)).size).toBe(20)
    })

    it('filters empty strings that sneak into the model', async () => {
      const w = make({ modelValue: ['a'] })
      const root = w.findComponent({ name: 'TagsInputRoot' })
      root.vm.$emit('update:modelValue', ['a', ''])
      await flushPromises()
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(tags(w)).toEqual(['a'])
      root.vm.$emit('update:modelValue', ['a', '', 'b'])
      await flushPromises()
      expect(last(w)).toEqual(['a', 'b'])
    })

    it('tolerates a non-array update from reka', async () => {
      const w = make({ modelValue: ['a'] })
      w.findComponent({ name: 'TagsInputRoot' }).vm.$emit('update:modelValue', undefined)
      await flushPromises()
      expect(last(w)).toEqual([])
    })

    it('does not throw on unmount', () => {
      const w = make({ modelValue: ['a'] })
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => w.unmount()).not.toThrow()
      wrapper = undefined
      spy.mockRestore()
    })
  })

  describe('Field integration', () => {
    it('takes id, describedBy, invalid and disabled from Field', () => {
      wrapper = mount(
        defineComponent({
          components: { Field, TagsInput },
          template: `<Field id="tg" hint="Hint" error="Bad" disabled><TagsInput :model-value="['a']" /></Field>`,
        }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      const i = wrapper.find('input[data-slot=tags-input-input]')
      expect(i.attributes('id')).toBe('tg')
      expect(i.attributes('aria-describedby')).toContain('tg-hint')
      expect(i.attributes('aria-invalid')).toBe('true')
      expect(i.attributes('disabled')).toBeDefined()
    })
  })

  describe('accessibility fixes', () => {
    const status = (w: VueWrapper) => w.find('[data-slot=tags-input-status]')

    it('remove button name is its own aria-label, not the tag text (reka sets aria-labelledby to the text)', () => {
      const w = make({ modelValue: ['react', 'two words'] })
      const buttons = w.findAll('[data-slot=tags-input-item-delete]')
      expect(buttons).toHaveLength(2)
      for (const b of buttons) {
        const id = b.attributes('id') as string
        expect(id).toBeTruthy()
        expect(id).not.toMatch(/\s/)
        expect(b.attributes('aria-labelledby')).toBe(id)
      }
      expect(buttons[1]!.attributes('aria-label')).toBe('Remove two words')
      expect(new Set(buttons.map((b) => b.attributes('id'))).size).toBe(2)
    })

    it('remove buttons are at least 24px (size-6) with a coarse-pointer size and the chip is not an edge-padded box', () => {
      const w = make({ modelValue: ['a'] })
      expect(w.find('[data-slot=tags-input-item-delete]').classes()).toEqual(expect.arrayContaining(['size-6', 'pointer-coarse:size-9']))
      expect(w.find('[data-slot=tags-input-item]').classes()).toEqual(expect.arrayContaining(['ps-2', 'pe-0', 'pointer-coarse:h-9']))
      expect(w.find('[data-slot=tags-input-item]').classes()).not.toContain('data-[disabled]:opacity-70')
    })

    it('root has a coarse-pointer height and forced-colors focus outline; input is 16px on small screens', () => {
      const w = make()
      expect(w.find('[data-slot=tags-input]').classes()).toEqual(expect.arrayContaining(['pointer-coarse:min-h-11', 'forced-colors:focus-within:outline-2']))
      expect(input(w).classes()).toEqual(expect.arrayContaining(['text-md', 'md:text-base']))
    })

    it('has a polite visually hidden status region, empty at rest', () => {
      const w = make({ modelValue: ['a'] })
      expect(status(w).attributes('role')).toBe('status')
      expect(status(w).classes()).toContain('sr-only')
      expect(status(w).text()).toBe('')
    })

    it('announces an added tag', async () => {
      const w = make()
      await addWithEnter(w, 'react')
      await flushPromises()
      expect(status(w).text()).toBe('Added react')
    })

    it('announces a removed tag and returns focus to the text input', async () => {
      const w = make({ modelValue: ['a', 'b'] })
      await w.findAll('[data-slot=tags-input-item-delete]')[0]!.trigger('click')
      await flushPromises()
      expect(status(w).text()).toBe('Removed a')
      expect(document.activeElement).toBe(input(w).element)
    })

    it('announces a rejected duplicate', async () => {
      const w = make({ modelValue: ['react'] })
      await addWithEnter(w, 'react')
      await flushPromises()
      expect(status(w).text()).toBe('Already added: react')
    })

    it('announces a rejection caused by max, with custom labels', async () => {
      const w = make({ modelValue: ['a', 'b'], max: 2, maxLabel: 'Limit', addedLabel: 'Plus' })
      await addWithEnter(w, 'c')
      await flushPromises()
      expect(status(w).text()).toBe('Limit: c')
      expect(w.emitted('reject')?.[0]).toEqual([{ value: 'c', reason: 'max' }])
    })

    it('does not announce an empty add', async () => {
      const w = make()
      await addWithEnter(w, '   ')
      await flushPromises()
      expect(status(w).text()).toBe('')
    })

    it('Field label names the text input (id lands on the input, not the root)', () => {
      wrapper = mount(
        defineComponent({ components: { Field, TagsInput }, template: `<Field id="tg2" label="Keywords"><TagsInput /></Field>` }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      expect(wrapper.find('label').attributes('for')).toBe('tg2')
      expect(wrapper.find('input[data-slot=tags-input-input]').attributes('id')).toBe('tg2')
      expect(wrapper.find('[data-slot=tags-input]').attributes('id')).toBeUndefined()
    })
  })
})
