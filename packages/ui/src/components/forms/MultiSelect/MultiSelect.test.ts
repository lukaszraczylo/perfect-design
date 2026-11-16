import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount as vtuMount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import MultiSelect from './MultiSelect.vue'
import { MultiSelect as Exported, multiSelectTriggerVariants } from './index'
import Field from '../Field/Field.vue'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'

const mounted: VueWrapper[] = []
const mount = ((c: unknown, o: Record<string, unknown> = {}) => {
  const w = vtuMount(c as never, { attachTo: document.body, ...o })
  mounted.push(w)
  return w
}) as unknown as typeof vtuMount

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date', disabled: true },
  { value: 'elder', label: 'Elderberry' },
]

const trigger = (w: VueWrapper) => w.find('[data-slot="multi-select-trigger"]')
const content = (w: VueWrapper) => w.find('[data-slot="multi-select-content"]')
const opts = (w: VueWrapper) => w.findAll('[data-slot="multi-select-option"]')
const search = (w: VueWrapper) => w.find('[data-slot="multi-select-search-input"]')
const chips = (w: VueWrapper) => w.findAll('[data-slot="multi-select-chip"]').map((c) => c.text())
const active = (w: VueWrapper) => w.find('[data-slot="multi-select-option"][data-active]').text()
const lastEmit = (w: VueWrapper, name = 'update:modelValue') => w.emitted(name)?.at(-1)?.[0]

async function open(props: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
  const w = mount(MultiSelect, { props: { options: OPTIONS, ...props }, ...extra })
  await trigger(w).trigger('click')
  await nextTick()
  return w
}

describe('MultiSelect', () => {
  describe('good path', () => {
    it('is exported from the barrel', () => expect(Exported).toBe(MultiSelect))

    it('renders closed with a placeholder and correct aria', () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, placeholder: 'Pick fruit' } })
      expect(w.attributes('data-slot')).toBe('multi-select')
      expect(w.attributes('data-state')).toBe('closed')
      expect(trigger(w).attributes('aria-haspopup')).toBe('listbox')
      expect(trigger(w).attributes('aria-expanded')).toBe('false')
      expect(trigger(w).attributes('type')).toBe('button')
      expect(w.find('[data-slot="multi-select-placeholder"]').text()).toBe('Pick fruit')
      expect(content(w).exists()).toBe(false)
    })

    it('opens on click, wires aria-controls and focuses the search input', async () => {
      const w = await open()
      expect(w.attributes('data-state')).toBe('open')
      expect(trigger(w).attributes('aria-expanded')).toBe('true')
      const list = w.find('[role="listbox"]')
      expect(list.attributes('aria-multiselectable')).toBe('true')
      expect(trigger(w).attributes('aria-controls')).toBe(list.attributes('id'))
      expect(opts(w)).toHaveLength(5)
      expect(document.activeElement).toBe(search(w).element)
      await trigger(w).trigger('click')
      expect(content(w).exists()).toBe(false)
    })

    it('toggles options on click and emits string arrays', async () => {
      const w = await open()
      await opts(w)[0].trigger('click')
      expect(lastEmit(w)).toEqual(['apple'])
      expect(opts(w)[0].attributes('aria-selected')).toBe('true')
      expect(opts(w)[0].attributes('data-state')).toBe('checked')
      await opts(w)[1].trigger('click')
      expect(lastEmit(w)).toEqual(['apple', 'banana'])
      await opts(w)[0].trigger('click')
      expect(lastEmit(w)).toEqual(['banana'])
      expect(chips(w)).toEqual(['Banana'])
    })

    it('stays open after selecting (multi)', async () => {
      const w = await open()
      await opts(w)[0].trigger('click')
      expect(content(w).exists()).toBe(true)
    })

    it('controlled modelValue wins until the parent updates', async () => {
      const w = await open({ modelValue: ['apple'] })
      await opts(w)[1].trigger('click')
      expect(lastEmit(w)).toEqual(['apple', 'banana'])
      expect(opts(w)[1].attributes('aria-selected')).toBe('false')
      await w.setProps({ modelValue: ['apple', 'banana'] })
      expect(opts(w)[1].attributes('aria-selected')).toBe('true')
    })

    it('works uncontrolled with defaultValue', async () => {
      const w = await open({ defaultValue: ['cherry'] })
      expect(chips(w)).toEqual(['Cherry'])
      await opts(w)[0].trigger('click')
      expect(chips(w)).toEqual(['Cherry', 'Apple'])
    })

    it('supports v-model from a parent', async () => {
      const v = ref<string[]>([])
      const w = mount(defineComponent({ setup: () => () => h(MultiSelect, { options: OPTIONS, modelValue: v.value, 'onUpdate:modelValue': (x: string[]) => (v.value = x) }) }))
      await w.find('[data-slot="multi-select-trigger"]').trigger('click')
      await w.findAll('[data-slot="multi-select-option"]')[2].trigger('click')
      expect(v.value).toEqual(['cherry'])
    })

    it('summarises with chips and "+N more" overflow', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, modelValue: ['apple', 'banana', 'cherry', 'elder'], maxVisible: 2 } })
      expect(chips(w)).toEqual(['Apple', 'Banana'])
      expect(w.find('[data-slot="multi-select-overflow"]').text()).toBe('+2 more')
      const none = mount(MultiSelect, { props: { options: OPTIONS, modelValue: ['apple', 'banana'] } })
      expect(none.find('[data-slot="multi-select-overflow"]').exists()).toBe(false)
    })

    it('maxVisible 0 shows only the count; invalid maxVisible falls back to 3', () => {
      const zero = mount(MultiSelect, { props: { options: OPTIONS, modelValue: ['apple', 'banana'], maxVisible: 0 } })
      expect(chips(zero)).toEqual([])
      expect(zero.find('[data-slot="multi-select-overflow"]').text()).toBe('+2 more')
      const bad = mount(MultiSelect, { props: { options: OPTIONS, modelValue: ['apple', 'banana', 'cherry', 'elder'], maxVisible: NaN } })
      expect(chips(bad)).toHaveLength(3)
    })

    it('falls back to the raw value for unknown selected values', () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, modelValue: ['ghost'] } })
      expect(chips(w)).toEqual(['ghost'])
    })

    it('filters by search text (case-insensitive) and shows the empty state', async () => {
      const w = await open()
      await search(w).setValue('AN')
      expect(opts(w).map((o) => o.text())).toEqual(['Banana'])
      await search(w).setValue('zzz')
      expect(opts(w)).toHaveLength(0)
      expect(w.find('[data-slot="multi-select-empty"]').text()).toBe('No results found')
      await search(w).setValue('  ')
      expect(opts(w)).toHaveLength(5)
    })

    it('custom emptyText and empty slot; no options at all', async () => {
      const w = await open({ options: [], emptyText: 'Nothing here' })
      expect(w.find('[data-slot="multi-select-empty"]').text()).toBe('Nothing here')
      const s = await open({ options: [] }, { slots: { empty: '<b class="e">none</b>' } })
      expect(s.find('.e').exists()).toBe(true)
    })

    it('select all selects enabled, filtered options only; clear removes them', async () => {
      const w = await open()
      await w.find('[data-slot="multi-select-select-all"]').trigger('click')
      expect(lastEmit(w)).toEqual(['apple', 'banana', 'cherry', 'elder'])
      await w.find('[data-slot="multi-select-clear-all"]').trigger('click')
      expect(lastEmit(w)).toEqual([])
      await search(w).setValue('e')
      await w.find('[data-slot="multi-select-select-all"]').trigger('click')
      expect(lastEmit(w)).toEqual(['apple', 'cherry', 'elder'])
    })

    it('select all with nothing to add and clear with nothing selected emit nothing', async () => {
      const w = await open({ modelValue: ['apple', 'banana', 'cherry', 'elder'] })
      await w.find('[data-slot="multi-select-select-all"]').trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      const e = await open()
      await e.find('[data-slot="multi-select-clear-all"]').trigger('click')
      expect(e.emitted('update:modelValue')).toBeUndefined()
    })

    it('clear keeps selected disabled options locked', async () => {
      const w = await open({ modelValue: ['apple', 'date'] })
      await w.find('[data-slot="multi-select-clear-all"]').trigger('click')
      expect(lastEmit(w)).toEqual(['date'])
    })

    it('hides the actions row when actions=false and the search when searchable=false', async () => {
      const w = await open({ actions: false, searchable: false })
      expect(w.find('[data-slot="multi-select-actions"]').exists()).toBe(false)
      expect(search(w).exists()).toBe(false)
      expect(document.activeElement).toBe(w.find('[role="listbox"]').element)
    })

    it('renders hidden inputs for form submission when name is set', () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, modelValue: ['apple', 'cherry'], name: 'fruit' } })
      const inputs = w.findAll('input[type="hidden"]')
      expect(inputs.map((i) => [i.attributes('name'), (i.element as HTMLInputElement).value])).toEqual([
        ['fruit', 'apple'],
        ['fruit', 'cherry'],
      ])
      expect(mount(MultiSelect, { props: { options: OPTIONS, modelValue: ['apple'] } }).findAll('input[type="hidden"]')).toHaveLength(0)
    })

    it('renders chip and option slots', async () => {
      const w = await open(
        { modelValue: ['apple'] },
        { slots: { chip: ({ label }: { label: string }) => `chip:${label}`, option: ({ option, selected }: { option: { label: string }; selected: boolean }) => `opt:${option.label}:${selected}` } },
      )
      expect(chips(w)).toEqual(['chip:Apple'])
      expect(opts(w)[0].text()).toBe('opt:Apple:true')
    })
  })

  describe('open state', () => {
    it('supports v-model:open (controlled)', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, open: false } })
      await trigger(w).trigger('click')
      expect(lastEmit(w, 'update:open')).toBe(true)
      expect(content(w).exists()).toBe(false)
      await w.setProps({ open: true })
      expect(content(w).exists()).toBe(true)
      await trigger(w).trigger('click')
      expect(lastEmit(w, 'update:open')).toBe(false)
    })

    it('does not open when disabled, even when open=true', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, disabled: true, open: true } })
      expect(content(w).exists()).toBe(false)
      await trigger(w).trigger('click')
      await trigger(w).trigger('keydown', { key: 'ArrowDown' })
      await trigger(w).trigger('keydown', { key: 'a' })
      expect(w.emitted('update:open')).toBeUndefined()
      expect(trigger(w).attributes('disabled')).toBeDefined()
    })

    it('closes when it becomes disabled while open', async () => {
      const w = await open()
      await w.setProps({ disabled: true })
      expect(content(w).exists()).toBe(false)
    })

    it('resets the query when reopened', async () => {
      const w = await open()
      await search(w).setValue('ban')
      await trigger(w).trigger('click')
      await trigger(w).trigger('click')
      expect((search(w).element as HTMLInputElement).value).toBe('')
    })
  })

  describe('max selections', () => {
    it('blocks new selections at the limit but allows deselecting', async () => {
      const w = await open({ max: 2, modelValue: ['apple', 'banana'] })
      expect(opts(w)[2].attributes('aria-disabled')).toBe('true')
      expect(opts(w)[0].attributes('aria-disabled')).toBeUndefined()
      await opts(w)[2].trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      await opts(w)[0].trigger('click')
      expect(lastEmit(w)).toEqual(['banana'])
      expect(w.find('[data-slot="multi-select-limit"]').text()).toBe('2 / 2 selected')
    })

    it('hides select all when a limit is set', async () => {
      const w = await open({ max: 3 })
      expect(w.find('[data-slot="multi-select-select-all"]').exists()).toBe(false)
    })

    it.each([[0], [-1], [NaN], [Infinity], ['3' as never]])('max=%s means unlimited', async (max) => {
      const w = await open({ max, modelValue: ['apple', 'banana', 'cherry'] })
      expect(opts(w)[4].attributes('aria-disabled')).toBeUndefined()
      expect(w.find('[data-slot="multi-select-select-all"]').exists()).toBe(true)
    })

    it('floors a fractional max', async () => {
      const w = await open({ max: 1.9, modelValue: ['apple'] })
      expect(opts(w)[1].attributes('aria-disabled')).toBe('true')
    })

    it('select all is a no-op at the programmatic level when limited', async () => {
      const w = await open({ max: 2 })
      expect(w.find('[data-slot="multi-select-select-all"]').exists()).toBe(false)
    })
  })

  describe('keyboard', () => {
    it('ArrowDown / ArrowUp move the active option (skipping disabled, wrapping) and set aria-activedescendant', async () => {
      const w = await open()
      expect(active(w)).toBe('Apple')
      await search(w).trigger('keydown', { key: 'ArrowDown' })
      expect(active(w)).toBe('Banana')
      expect(search(w).attributes('aria-activedescendant')).toBe(opts(w)[1].attributes('id'))
      await search(w).trigger('keydown', { key: 'ArrowDown' })
      await search(w).trigger('keydown', { key: 'ArrowDown' })
      expect(active(w)).toBe('Elderberry') // skipped Date
      await search(w).trigger('keydown', { key: 'ArrowDown' })
      expect(active(w)).toBe('Apple')
      await search(w).trigger('keydown', { key: 'ArrowUp' })
      expect(active(w)).toBe('Elderberry')
    })

    it('Enter toggles the active option', async () => {
      const w = await open()
      await search(w).trigger('keydown', { key: 'ArrowDown' })
      await search(w).trigger('keydown', { key: 'Enter' })
      expect(lastEmit(w)).toEqual(['banana'])
      await search(w).trigger('keydown', { key: 'Enter' })
      expect(lastEmit(w)).toEqual([])
    })

    it('Space toggles when the query is empty, but types a space otherwise', async () => {
      const w = await open()
      await search(w).trigger('keydown', { key: ' ' })
      expect(lastEmit(w)).toEqual(['apple'])
      await search(w).setValue('x')
      const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      search(w).element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
    })

    it('Enter with no active option is a no-op', async () => {
      const w = await open()
      await search(w).setValue('zzz')
      await search(w).trigger('keydown', { key: 'Enter' })
      await search(w).trigger('keydown', { key: 'ArrowDown' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('Escape closes and returns focus to the trigger', async () => {
      const w = await open()
      await search(w).trigger('keydown', { key: 'Escape' })
      await nextTick()
      expect(content(w).exists()).toBe(false)
      expect(document.activeElement).toBe(trigger(w).element)
    })

    it('Escape on the trigger closes an open panel', async () => {
      const w = await open()
      await trigger(w).trigger('keydown', { key: 'Escape' })
      expect(content(w).exists()).toBe(false)
    })

    it('Tab closes without stealing focus', async () => {
      const w = await open()
      await search(w).trigger('keydown', { key: 'Tab' })
      expect(content(w).exists()).toBe(false)
    })

    it.each(['ArrowDown', 'ArrowUp', 'Enter', ' '])('trigger opens on %s', async (key) => {
      const w = mount(MultiSelect, { props: { options: OPTIONS } })
      await trigger(w).trigger('keydown', { key })
      expect(content(w).exists()).toBe(true)
    })

    it('typing a character on the closed trigger opens and seeds the search', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS } })
      await trigger(w).trigger('keydown', { key: 'c' })
      await nextTick()
      expect((search(w).element as HTMLInputElement).value).toBe('c')
      expect(opts(w).map((o) => o.text())).toEqual(['Cherry'])
    })

    it('ignores modifier combos and non-printable keys on the trigger', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS } })
      await trigger(w).trigger('keydown', { key: 'c', ctrlKey: true })
      await trigger(w).trigger('keydown', { key: 'Shift' })
      await trigger(w).trigger('keydown', { key: 'Escape' })
      expect(content(w).exists()).toBe(false)
    })

    it('non-searchable: Home/End and type-ahead move the active option', async () => {
      vi.useFakeTimers()
      const w = await open({ searchable: false })
      const list = w.find('[role="listbox"]')
      await list.trigger('keydown', { key: 'End' })
      expect(active(w)).toBe('Elderberry')
      expect(list.attributes('aria-activedescendant')).toBe(opts(w)[4].attributes('id'))
      await list.trigger('keydown', { key: 'Home' })
      expect(active(w)).toBe('Apple')
      await list.trigger('keydown', { key: 'c' })
      expect(active(w)).toBe('Cherry')
      await list.trigger('keydown', { key: 'h' })
      expect(active(w)).toBe('Cherry')
      vi.advanceTimersByTime(700)
      await list.trigger('keydown', { key: 'b' })
      expect(active(w)).toBe('Banana')
      await list.trigger('keydown', { key: 'q' }) // "bq": no match keeps current
      expect(active(w)).toBe('Banana')
    })

    it('non-searchable: typing on the closed trigger opens and jumps', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, searchable: false } })
      await trigger(w).trigger('keydown', { key: 'b' })
      await nextTick()
      expect(content(w).exists()).toBe(true)
      expect(active(w)).toBe('Banana')
    })

    it('Home/End in the search input are left to the text field', async () => {
      const w = await open()
      const ev = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true })
      search(w).element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
    })

    it('starts on the first selected enabled option', async () => {
      const w = await open({ modelValue: ['cherry'] })
      expect(active(w)).toBe('Cherry')
    })

    it('moves the active option when filtering removes it, and scrolls it into view', async () => {
      const spy = vi.spyOn(Element.prototype, 'scrollIntoView')
      const w = await open()
      await search(w).setValue('eld')
      expect(active(w)).toBe('Elderberry')
      await nextTick()
      expect(spy).toHaveBeenCalled()
    })

    it('keeps the active option while it still matches the filter', async () => {
      const w = await open()
      await search(w).trigger('keydown', { key: 'ArrowDown' })
      await search(w).setValue('an')
      expect(active(w)).toBe('Banana')
    })

    it('pointer movement activates an option, but not a disabled one', async () => {
      const w = await open()
      await opts(w)[2].trigger('pointermove')
      expect(active(w)).toBe('Cherry')
      await opts(w)[3].trigger('pointermove')
      expect(active(w)).toBe('Cherry')
    })

    it('mousedown on options does not steal focus from the search input', async () => {
      const w = await open()
      const ev = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
      opts(w)[0].element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(true)
    })
  })

  describe('dismissal', () => {
    it('closes on pointerdown outside, stays open on pointerdown inside', async () => {
      const w = await open()
      await opts(w)[0].trigger('pointerdown')
      expect(content(w).exists()).toBe(true)
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
      await nextTick()
      expect(content(w).exists()).toBe(false)
    })

    it('closes when focus moves outside, not when it moves inside or to nowhere', async () => {
      const outside = document.createElement('button')
      document.body.appendChild(outside)
      const w = await open()
      await w.trigger('focusout', { relatedTarget: trigger(w).element })
      expect(content(w).exists()).toBe(true)
      await w.trigger('focusout', { relatedTarget: null })
      expect(content(w).exists()).toBe(true)
      await w.trigger('focusout', { relatedTarget: outside })
      expect(content(w).exists()).toBe(false)
    })

    it('removes the document listener on close and on unmount', async () => {
      const add = vi.spyOn(document, 'addEventListener')
      const remove = vi.spyOn(document, 'removeEventListener')
      const w = await open()
      expect(add.mock.calls.filter((c) => c[0] === 'pointerdown')).toHaveLength(1)
      await trigger(w).trigger('click')
      expect(remove.mock.calls.filter((c) => c[0] === 'pointerdown').length).toBeGreaterThanOrEqual(1)
      await trigger(w).trigger('click')
      remove.mockClear()
      w.unmount()
      mounted.pop()
      expect(remove.mock.calls.some((c) => c[0] === 'pointerdown')).toBe(true)
    })

    it('clears the type-ahead timer on unmount', async () => {
      vi.useFakeTimers()
      const w = await open({ searchable: false })
      const before = vi.getTimerCount()
      await w.find('[role="listbox"]').trigger('keydown', { key: 'a' })
      expect(vi.getTimerCount()).toBe(before + 1)
      w.unmount()
      mounted.pop()
      expect(vi.getTimerCount()).toBe(before)
    })
  })

  describe('customisation', () => {
    it('merges class last on the root and forwards attrs to the trigger', () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, class: 'w-64 custom' }, attrs: { 'aria-label': 'Fruit', 'data-testid': 't' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['w-64', 'custom']))
      expect(w.classes()).not.toContain('w-full')
      // aria-label is folded into aria-labelledby (name + visible value), see 'accessible name' tests
      expect(trigger(w).attributes('aria-label')).toBeUndefined()
      expect(trigger(w).attributes('data-testid')).toBe('t')
    })

    it('applies size variants', () => {
      expect(trigger(mount(MultiSelect, { props: { size: 'sm' } })).classes()).toContain('min-h-8')
      expect(trigger(mount(MultiSelect, { props: { size: 'md' } })).classes()).toContain('min-h-9')
      expect(trigger(mount(MultiSelect, { props: { size: 'lg' } })).classes()).toContain('min-h-10')
      expect(multiSelectTriggerVariants()).toContain('min-h-9')
    })

    it('uses the id prop, then Field id, then generates one', () => {
      expect(trigger(mount(MultiSelect, { props: { id: 'mine' } })).attributes('id')).toBe('mine')
      expect(trigger(mount(MultiSelect)).attributes('id')).toMatch(/multi-select-/)
      const f = mount(Field, { props: { label: 'L' }, slots: { default: () => h(MultiSelect, { options: OPTIONS }) } })
      const labelFor = f.find('label').attributes('for')
      expect(f.find('[data-slot="multi-select-trigger"]').attributes('id')).toBe(labelFor)
    })

    it('custom placeholders', async () => {
      const w = await open({ searchPlaceholder: 'Find...' })
      expect(search(w).attributes('placeholder')).toBe('Find...')
    })

    it('uses only tokens (no hard-coded colours)', async () => {
      const w = await open({ invalid: true, modelValue: ['apple'] })
      expect(w.html()).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|oklch\(/i)
    })
  })

  describe('bad path', () => {
    it('disabled option cannot be toggled; aria-disabled is set', async () => {
      const w = await open()
      expect(opts(w)[3].attributes('aria-disabled')).toBe('true')
      await opts(w)[3].trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('does nothing when selecting while disabled (programmatic click on a stale option)', async () => {
      const w = await open()
      const option = opts(w)[0]
      await w.setProps({ disabled: true })
      await option.trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('invalid / required reflect on the trigger', () => {
      const w = mount(MultiSelect, { props: { invalid: true, required: true } })
      expect(trigger(w).attributes('aria-invalid')).toBe('true')
      expect(trigger(w).attributes('aria-required')).toBe('true')
    })

    it('inherits invalid, disabled and describedby from a Field', () => {
      const f = mount(Field, { props: { label: 'L', error: 'bad', hint: 'h', disabled: true }, slots: { default: () => h(MultiSelect, { options: OPTIONS }) } })
      const t = f.find('[data-slot="multi-select-trigger"]')
      expect(t.attributes('aria-invalid')).toBe('true')
      expect(t.attributes('disabled')).toBeDefined()
      expect(t.attributes('aria-describedby')).toBeTruthy()
    })

    it('tolerates a non-array modelValue, duplicate and non-string entries', () => {
      expect(chips(mount(MultiSelect, { props: { options: OPTIONS, modelValue: 'apple' as never } }))).toEqual([])
      expect(chips(mount(MultiSelect, { props: { options: OPTIONS, modelValue: ['apple', 'apple', 1, null] as never } }))).toEqual(['Apple'])
      expect(chips(mount(MultiSelect, { props: { options: OPTIONS, defaultValue: 'x' as never } }))).toEqual([])
    })

    it('tolerates invalid options (non-array, null, missing value)', async () => {
      const a = await open({ options: null as never })
      expect(opts(a)).toHaveLength(0)
      const b = await open({ options: [null, { label: 'no value' }, { value: 'ok', label: 'Ok' }] as never })
      expect(opts(b).map((o) => o.text())).toEqual(['Ok'])
    })

    it('shows clear button only when clearable, selected and enabled', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, clearable: true, modelValue: ['apple', 'date'] } })
      const clear = w.find('[data-slot="multi-select-clear"]')
      expect(clear.attributes('aria-label')).toBe('Clear selection')
      await clear.trigger('click')
      expect(lastEmit(w)).toEqual(['date'])
      expect(mount(MultiSelect, { props: { clearable: true } }).find('[data-slot="multi-select-clear"]').exists()).toBe(false)
      expect(mount(MultiSelect, { props: { clearable: true, disabled: true, modelValue: ['a'] } }).find('[data-slot="multi-select-clear"]').exists()).toBe(false)
      expect(mount(MultiSelect, { props: { modelValue: ['a'] } }).find('[data-slot="multi-select-clear"]').exists()).toBe(false)
    })

    it('clear is a no-op when disabled', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, clearable: true, modelValue: ['apple'] } })
      const clear = w.find('[data-slot="multi-select-clear"]')
      await w.setProps({ disabled: true })
      await clear.trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('handles 10 000 options', async () => {
      const many = Array.from({ length: 10_000 }, (_, i) => ({ value: `v${i}`, label: `Item ${i}` }))
      const w = await open({ options: many })
      expect(opts(w)).toHaveLength(10_000)
      await search(w).setValue('Item 9999')
      expect(opts(w)).toHaveLength(1)
    })

    it('handles 1 option and unicode / RTL / long labels', async () => {
      const w = await open({ options: [{ value: 'a', label: `مرحبا 🚀 ${'x'.repeat(5000)}` }] })
      expect(opts(w)).toHaveLength(1)
      await search(w).setValue('🚀')
      expect(opts(w)).toHaveLength(1)
    })

    it('handles rapid open/close and toggles', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS } })
      for (let i = 0; i < 20; i++) await trigger(w).trigger('click')
      expect(content(w).exists()).toBe(false)
      await trigger(w).trigger('click')
      for (let i = 0; i < 20; i++) await opts(w)[0].trigger('click')
      expect(w.emitted('update:modelValue')).toHaveLength(20)
    })

    it('duplicate option values do not break rendering of the first', async () => {
      const w = await open({ options: [{ value: 'a', label: 'A' }, { value: 'a', label: 'A2' }] })
      expect(opts(w).length).toBeGreaterThan(0)
    })

    it('no-ops moving with an empty list', async () => {
      const w = await open({ options: [] })
      await search(w).trigger('keydown', { key: 'ArrowDown' })
      await search(w).trigger('keydown', { key: 'ArrowUp' })
      expect(w.find('[data-active]').exists()).toBe(false)
    })
  })
  describe('accessibility (regressions)', () => {
    const nameOf = (w: VueWrapper) => {
      const ids = (trigger(w).attributes('aria-labelledby') ?? '').split(' ')
      return ids.map((id) => document.getElementById(id)?.textContent?.trim()).join(' ')
    }

    it('aria-label is combined with the visible chips so the visible text is in the name (WCAG 2.5.3)', () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, defaultValue: ['apple', 'cherry'] }, attrs: { 'aria-label': 'Fruit' } })
      expect(trigger(w).attributes('aria-label')).toBeUndefined()
      expect(nameOf(w)).toMatch(/^Fruit Apple\s*Cherry$/)
    })

    it('aria-label is combined with the placeholder when nothing is selected', () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, placeholder: 'Pick fruit' }, attrs: { 'aria-label': 'Fruit' } })
      expect(nameOf(w)).toBe('Fruit Pick fruit')
    })

    it('author aria-labelledby gets the visible value appended and no hidden name span is rendered', () => {
      const w = mount(MultiSelect, {
        props: { options: OPTIONS, placeholder: 'Pick fruit' },
        attrs: { 'aria-labelledby': 'ext' },
        slots: {},
      })
      const ids = trigger(w).attributes('aria-labelledby')!.split(' ')
      expect(ids[0]).toBe('ext')
      expect(ids).toHaveLength(2)
      expect(document.getElementById(ids[1])?.textContent).toContain('Pick fruit')
      expect(w.find('.sr-only').exists()).toBe(false)
    })

    it('adds no aria-labelledby when no author name is given (Field label or none)', () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS } })
      expect(trigger(w).attributes('aria-labelledby')).toBeUndefined()
      expect(trigger(w).attributes('aria-label')).toBeUndefined()
    })

    it('clear button is at least 24px (size-6) with a larger coarse-pointer target and a name', () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, clearable: true, defaultValue: ['apple'] } })
      const clear = w.find('[data-slot="multi-select-clear"]')
      expect(clear.classes()).toContain('size-6')
      expect(clear.classes()).toContain('pointer-coarse:size-8')
      expect(clear.attributes('aria-label')).toBe('Clear selection')
      expect(trigger(w).classes()).toContain('pe-14')
    })

    it('trigger, search input and options use mobile-safe text size and coarse-pointer height', async () => {
      const w = await open()
      expect(trigger(w).classes()).toEqual(expect.arrayContaining(['text-md', 'md:text-sm', 'pointer-coarse:min-h-11']))
      expect(search(w).classes()).toEqual(expect.arrayContaining(['text-md', 'md:text-sm', 'pointer-coarse:h-11']))
      expect(opts(w)[0].classes()).toContain('pointer-coarse:min-h-11')
    })

    it('select all / clear actions meet the 24px target size', async () => {
      const w = await open()
      for (const slot of ['multi-select-select-all', 'multi-select-clear-all']) {
        expect(w.find(`[data-slot="${slot}"]`).classes()).toEqual(expect.arrayContaining(['min-h-6', 'min-w-6']))
      }
    })

    it('focus and active states have forced-colors fallbacks; check icon renders only when selected', async () => {
      const w = await open({ defaultValue: ['apple'] })
      expect(trigger(w).classes()).toContain('outline-hidden')
      expect(opts(w)[0].classes()).toContain('forced-colors:data-[active]:outline')
      expect(opts(w)[0].find('svg').exists()).toBe(true)
      expect(opts(w)[1].find('svg').exists()).toBe(false)
    })

    it('uses the Tailwind radius scale, not arbitrary values', async () => {
      const w = await open()
      expect(w.html()).not.toMatch(/rounded-\[/)
    })

    it('hides the empty listbox and shows the empty message outside it', async () => {
      const w = await open()
      await search(w).setValue('zzz')
      expect(w.find('[role="listbox"]').attributes('hidden')).toBeDefined()
      expect(w.find('[role="listbox"]').find('[data-slot="multi-select-empty"]').exists()).toBe(false)
      expect(w.find('[data-slot="multi-select-empty"]').exists()).toBe(true)
    })

    it('announces the filtered result count and the empty state in a polite status region', async () => {
      const w = await open()
      const status = () => w.find('[data-slot="multi-select-status"]')
      expect(status().attributes('role')).toBe('status')
      expect(status().text()).toBe('')
      await search(w).setValue('an')
      expect(status().text()).toBe('1 option available')
      await search(w).setValue('e')
      expect(status().text()).toBe('4 options available')
      await search(w).setValue('zzz')
      expect(status().text()).toBe('No results found')
    })

    it('Ctrl+A selects all enabled options when the search is empty', async () => {
      const w = await open()
      await search(w).trigger('keydown', { key: 'a', ctrlKey: true })
      expect(lastEmit(w)).toEqual(['apple', 'banana', 'cherry', 'elder'])
    })

    it('Ctrl+A leaves the search text alone while a query is typed; plain a is not intercepted', async () => {
      const w = await open()
      await search(w).setValue('an')
      await search(w).trigger('keydown', { key: 'a', ctrlKey: true })
      expect(w.emitted('update:modelValue')).toBeUndefined()
      await search(w).trigger('keydown', { key: 'a' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('non-searchable: Ctrl+A selects all, plain a still type-aheads', async () => {
      const w = await open({ searchable: false })
      await w.find('[role="listbox"]').trigger('keydown', { key: 'b' })
      expect(active(w)).toBe('Banana')
      await w.find('[role="listbox"]').trigger('keydown', { key: 'a', metaKey: true })
      expect(lastEmit(w)).toEqual(['apple', 'banana', 'cherry', 'elder'])
    })
  })

  describe('required and labels', () => {
    it('required with nothing selected renders a native required input that blocks submit', async () => {
      const w = mount(MultiSelect, { props: { options: OPTIONS, required: true, name: 'f', 'aria-label': 'Fruit' } })
      const req = w.find('input[required]')
      expect(req.exists()).toBe(true)
      expect((req.element as HTMLInputElement).validity.valueMissing).toBe(true)
      await trigger(w).trigger('click')
      await opts(w)[0].trigger('click')
      expect(w.find('input[required]').exists()).toBe(false)
    })

    it('required from a Field also applies', () => {
      const w = mount(defineComponent({ render: () => h(Field, { label: 'Fruit', required: true }, () => h(MultiSelect, { options: OPTIONS })) }))
      expect(w.find('input[required]').exists()).toBe(true)
    })

    it('built-in strings come from the ConfigProvider', async () => {
      const labels = { 'multiSelect.more': '+{count} weitere', 'multiSelect.clearSelection': 'Auswahl löschen', 'multiSelect.selectAll': 'Alle', 'multiSelect.clear': 'Leeren', 'multiSelect.options': 'Optionen' }
      const w = mount(defineComponent({ render: () => h(ConfigProvider, { labels }, () => h(MultiSelect, { options: OPTIONS, defaultValue: ['apple', 'banana', 'cherry', 'elder'], maxVisible: 2, clearable: true, 'aria-label': 'F' })) }))
      expect(w.find('[data-slot="multi-select-overflow"]').text()).toBe('+2 weitere')
      expect(w.find('[data-slot="multi-select-clear"]').attributes('aria-label')).toBe('Auswahl löschen')
      await trigger(w).trigger('click')
      await nextTick()
      expect(w.find('[data-slot="multi-select-select-all"]').text()).toBe('Alle')
      expect(w.find('[role="listbox"]').attributes('aria-label')).toBe('Optionen')
    })
  })
})
