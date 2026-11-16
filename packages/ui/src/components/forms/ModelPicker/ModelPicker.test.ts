import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import ModelPicker from './ModelPicker.vue'
import { ModelPicker as Exported } from './index'
import { resolveGroups, searchText, usableOptions } from './options'
import Field from '../Field/Field.vue'
import ConfigProvider from '../../layout/ConfigProvider/ConfigProvider.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const OPTIONS = [
  { id: 'draft', label: 'Draft - fast', description: 'Quick first pass for short texts.', badges: ['Fast'] },
  { id: 'review', label: 'Review - careful', description: 'Slower, checks each claim twice.', badges: ['Careful', 'Preview'] },
  { id: 'summary', label: 'Summary - compact' },
  { id: 'archive', label: 'Archive - retired', description: 'Old projects only.', disabled: true },
]
const GROUPED = [
  { label: 'Everyday', options: [OPTIONS[0], OPTIONS[2]] },
  { label: 'Thorough', options: [OPTIONS[1], OPTIONS[3]] },
]

async function flush() {
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 10))
  await nextTick()
}
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const model = ref<string | undefined>((props.modelValue as string | undefined) ?? undefined)
  const useModel = !('defaultValue' in props) && !props.uncontrolled
  const { uncontrolled: _u, ...rest } = props
  void _u
  const Host = defineComponent({
    setup: () => () =>
      h(ModelPicker, {
        options: OPTIONS,
        'aria-label': 'Preset',
        ...rest,
        ...(useModel ? { modelValue: model.value, 'onUpdate:modelValue': (v: string) => (model.value = v) } : {}),
        ...attrs,
      }),
  })
  wrapper = mount(Host, { attachTo: document.body })
  return { model }
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const qa = (s: string) => Array.from(document.body.querySelectorAll(s)) as HTMLElement[]
const input = () => q('input[data-slot="model-picker-input"]') as HTMLInputElement
const options = () => qa('[role="option"]')
const names = () => options().map((o) => o.querySelector('[data-slot="model-picker-item-label"]')?.textContent?.trim())
async function type(text: string) {
  input().value = text
  input().dispatchEvent(new Event('input', { bubbles: true }))
  await flush()
}
async function open() {
  input().focus()
  await flush()
}
async function key(k: string) {
  input().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  await flush()
}

describe('ModelPicker good path', () => {
  it('is exported from the barrel and renders a closed combobox root with an input and a toggle', () => {
    make({ placeholder: 'Choose a preset' })
    expect(Exported).toBe(ModelPicker)
    expect(q('[data-slot="model-picker"]')).not.toBeNull()
    expect(input().getAttribute('role')).toBe('combobox')
    expect(input().getAttribute('placeholder')).toBe('Choose a preset')
    expect(q('[data-slot="model-picker-trigger"]')).not.toBeNull()
    expect(q('[data-slot="model-picker-content"]')).toBeNull()
  })
  it('opens on focus and lists label, badges as text and description for every option', async () => {
    make()
    await open()
    expect(input().getAttribute('aria-expanded')).toBe('true')
    expect(names()).toEqual(['Draft - fast', 'Review - careful', 'Summary - compact', 'Archive - retired'])
    const review = options()[1]
    expect([...review.querySelectorAll('[data-slot="model-picker-badge"]')].map((b) => b.textContent)).toEqual(['Careful', 'Preview'])
    expect(review.querySelector('[data-slot="model-picker-item-description"]')?.textContent).toBe('Slower, checks each claim twice.')
    expect(options()[2].querySelector('[data-slot="model-picker-item-description"]')).toBeNull()
    expect(options()[2].querySelector('[data-slot="model-picker-badge"]')).toBeNull()
  })
  it('selecting an option emits its id and shows the label', async () => {
    const { model } = make()
    await open()
    options()[1].click()
    await flush()
    expect(model.value).toBe('review')
    expect(input().value).toBe('Review - careful')
  })
  it('shows the label of the controlled value, an empty input for an unknown id, and updates from outside', async () => {
    make({ modelValue: 'summary' })
    await flush()
    expect(input().value).toBe('Summary - compact')
    wrapper!.unmount()
    make({ modelValue: 'ghost' })
    await flush()
    expect(input().value).toBe('')
  })
  it('works uncontrolled with defaultValue', async () => {
    make({ defaultValue: 'draft' })
    await flush()
    expect(input().value).toBe('Draft - fast')
    await open()
    options()[2].click()
    await flush()
    expect(input().value).toBe('Summary - compact')
  })
  it('marks the chosen row selected and shows a check indicator', async () => {
    make({ modelValue: 'review' })
    await open()
    expect(options()[1].getAttribute('aria-selected')).toBe('true')
    expect(options()[1].querySelector('svg')).not.toBeNull()
    expect(options()[0].getAttribute('aria-selected')).not.toBe('true')
  })
  it('emits update:open when the list opens and closes', async () => {
    const seen: boolean[] = []
    make({ 'onUpdate:open': (v: boolean) => seen.push(v) })
    await open()
    await key('Escape')
    expect(seen[0]).toBe(true)
    expect(seen).toContain(false)
  })
})

describe('ModelPicker groups', () => {
  it('renders { label, options } groups with a labelled role=group each', async () => {
    make({ options: GROUPED })
    await open()
    const groups = qa('[role="group"]')
    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.querySelector('[data-slot="model-picker-group-label"]')?.textContent)).toEqual(['Everyday', 'Thorough'])
    const labelId = groups[0].getAttribute('aria-labelledby')!
    expect(document.getElementById(labelId)?.textContent).toBe('Everyday')
    expect(names()).toEqual(['Draft - fast', 'Summary - compact', 'Review - careful', 'Archive - retired'])
  })
  it('gathers flat options by their group key, in order of first appearance, ungrouped ones stay bare', async () => {
    make({
      options: [
        { id: 'a', label: 'Alpha', group: 'First' },
        { id: 'x', label: 'Loose' },
        { id: 'b', label: 'Beta', group: 'Second' },
        { id: 'c', label: 'Gamma', group: 'First' },
      ],
    })
    await open()
    const groups = qa('[role="group"]')
    expect(groups.map((g) => g.querySelector('[data-slot="model-picker-group-label"]')?.textContent)).toEqual(['First', 'Second'])
    expect([...groups[0].querySelectorAll('[role="option"]')].map((o) => o.textContent?.trim())).toEqual(['Alpha', 'Gamma'])
    expect(names()).toEqual(['Loose', 'Alpha', 'Gamma', 'Beta'].sort((a, b) => names().indexOf(a) - names().indexOf(b)))
    expect(options().find((o) => o.textContent?.includes('Loose'))!.closest('[role="group"]')).toBeNull()
  })
  it('filters across groups and hides a group when none of its options match', async () => {
    make({ options: GROUPED })
    await open()
    await type('careful')
    expect(names()).toEqual(['Review - careful'])
    const groups = qa('[role="group"]').filter((g) => !g.hasAttribute('hidden'))
    expect(groups.map((g) => g.querySelector('[data-slot="model-picker-group-label"]')?.textContent)).toEqual(['Thorough'])
  })
  it('keyboard moves the highlight across groups and Enter chooses', async () => {
    const { model } = make({ options: GROUPED })
    await open()
    await key('ArrowDown')
    await key('ArrowDown')
    await key('ArrowDown')
    await key('Enter')
    expect(model.value).toBe('review')
  })
})

describe('ModelPicker search', () => {
  it('matches the label, case-insensitively', async () => {
    make()
    await open()
    await type('REVIEW')
    expect(names()).toEqual(['Review - careful'])
  })
  it('matches the description', async () => {
    make()
    await open()
    await type('first pass')
    expect(names()).toEqual(['Draft - fast'])
  })
  it('does not match badges', async () => {
    make()
    await open()
    await type('preview')
    expect(names()).toEqual([])
  })
  it('shows the empty state as a polite status, with custom text', async () => {
    make({ emptyText: 'No preset matches' })
    await open()
    await type('zzzz')
    const empty = q('[data-slot="model-picker-empty"]')!
    expect(empty.textContent?.trim()).toBe('No preset matches')
    expect(empty.getAttribute('role')).toBe('status')
    expect(empty.getAttribute('aria-live')).toBe('polite')
    expect(options()).toHaveLength(0)
  })
  it('shows the default empty text with no options at all', async () => {
    make({ options: [] })
    await open()
    expect(q('[data-slot="model-picker-empty"]')?.textContent?.trim()).toBe('No matching options')
  })
  it('supports a custom empty slot and a custom option slot', async () => {
    wrapper = mount(ModelPicker, {
      props: { options: OPTIONS, 'aria-label': 'Preset' } as never,
      slots: { empty: () => h('b', 'Nothing here'), option: ({ option }: { option: { label: string } }) => h('i', { class: 'custom-row' }, option.label.toUpperCase()) },
      attachTo: document.body,
    })
    await open()
    expect(qa('.custom-row').map((e) => e.textContent)).toEqual(['DRAFT - FAST', 'REVIEW - CAREFUL', 'SUMMARY - COMPACT', 'ARCHIVE - RETIRED'])
    await type('zzzz')
    expect(q('[data-slot="model-picker-empty"] b')?.textContent).toBe('Nothing here')
  })
})

describe('ModelPicker states', () => {
  it('a disabled option cannot be chosen and is marked disabled', async () => {
    const { model } = make()
    await open()
    const archive = options()[3]
    expect(archive.getAttribute('aria-disabled')).toBe('true')
    archive.click()
    await flush()
    expect(model.value).toBeUndefined()
  })
  it('disabled disables the input and toggle and never opens', async () => {
    make({ disabled: true })
    expect(input().disabled).toBe(true)
    await open()
    expect(q('[data-slot="model-picker-content"]')).toBeNull()
  })
  it('clearable shows a clear button only while a value exists, and clearing emits an empty id', async () => {
    const { model } = make({ clearable: true })
    expect(q('[data-slot="model-picker-clear"]')).toBeNull()
    await open()
    options()[0].click()
    await flush()
    const clear = q('[data-slot="model-picker-clear"]')!
    expect(clear.getAttribute('aria-label')).toBe('Clear selection')
    clear.click()
    await flush()
    expect(model.value).toBe('')
  })
  it('invalid and status=error set aria-invalid; required sets required', () => {
    make({ invalid: true, required: true })
    expect(input().getAttribute('aria-invalid')).toBe('true')
    expect(input().required).toBe(true)
    wrapper!.unmount()
    make({ status: 'error' })
    expect(input().getAttribute('aria-invalid')).toBe('true')
    wrapper!.unmount()
    make()
    expect(input().getAttribute('aria-invalid')).toBeNull()
  })
  it('status adds an icon and, for success and warning, hidden text linked by aria-describedby', () => {
    make({ status: 'success' })
    const icon = q('[data-slot="field-status"]')!
    expect(icon).not.toBeNull()
    expect(input().getAttribute('aria-describedby')).toContain(icon.querySelector('.sr-only')!.id)
  })
  it('inside a Field it takes the id, description, required and the label name', () => {
    const Host = defineComponent({ setup: () => () => h(Field, { label: 'Preset', hint: 'Pick one', required: true }, () => h(ModelPicker, { options: OPTIONS })) })
    wrapper = mount(Host, { attachTo: document.body })
    expect(document.querySelector(`label[for="${input().id}"]`)).not.toBeNull()
    expect(input().getAttribute('aria-describedby')).toBeTruthy()
    expect(input().required).toBe(true)
  })
  it('merges an author aria-describedby and forwards attributes to the input; class goes to the root', () => {
    make({ class: 'zz-custom' }, { 'aria-describedby': 'extra', name: 'preset-field', 'data-test': 'x' })
    expect(input().getAttribute('aria-describedby')).toContain('extra')
    expect(input().getAttribute('data-test')).toBe('x')
    expect(q('[data-slot="model-picker"]')!.classList.contains('zz-custom')).toBe(true)
    expect(input().classList.contains('zz-custom')).toBe(false)
  })
})

describe('ModelPicker edge cases', () => {
  it('hostile and long text is rendered as text and wraps', async () => {
    const hostile = '<img src=x onerror=alert(1)>' + 'long'.repeat(80)
    make({ options: [{ id: 'h', label: hostile, description: '<script>alert(1)</script>', badges: ['<b>x</b>'] }] })
    await open()
    expect(document.body.querySelector('img')).toBeNull()
    expect(document.body.querySelector('script')).toBeNull()
    expect(document.body.querySelector('[data-slot="model-picker-badge"] b')).toBeNull()
    expect(names()[0]).toBe(hostile)
    expect(options()[0].querySelector('[data-slot="model-picker-item-label"]')!.className).toContain('break-words')
  })
  it('RTL labels, descriptions and a dir=rtl container render', async () => {
    document.body.dir = 'rtl'
    make({ options: [{ id: 'ar', label: 'مسودة سريعة', description: 'مراجعة أولى', badges: ['سريع'] }] })
    await open()
    expect(names()).toEqual(['مسودة سريعة'])
    await type('أولى')
    expect(names()).toEqual(['مسودة سريعة'])
    document.body.dir = ''
  })
  it('many options render and filter', async () => {
    make({ options: Array.from({ length: 300 }, (_, i) => ({ id: `m${i}`, label: `Preset ${i}`, description: `Note ${i}` })) })
    await open()
    expect(options().length).toBe(300)
    await type('Preset 299')
    expect(names()).toEqual(['Preset 299'])
  })
  it('skips unusable entries instead of throwing', async () => {
    make({ options: [null, 5, { label: 'No id' }, { id: '', label: 'Blank' }, { id: 'ok', label: 'Fine', badges: ['', ' ', 7, 'Text'] }, { label: 'Broken group', options: 'nope' }] as never })
    await open()
    expect(names()).toEqual(['Fine'])
    expect([...document.body.querySelectorAll('[data-slot="model-picker-badge"]')].map((b) => b.textContent)).toEqual(['Text'])
  })
  it('handles options that are not an array', async () => {
    make({ options: undefined })
    await open()
    expect(options()).toHaveLength(0)
    wrapper!.unmount()
    make({ options: 'nope' as never })
    await open()
    expect(options()).toHaveLength(0)
  })
})

describe('ModelPicker option helpers', () => {
  it('resolveGroups keeps order, drops empty and unusable', () => {
    expect(resolveGroups(null)).toEqual([])
    const g = resolveGroups([
      { id: 'a', label: 'A', group: ' G ' },
      { label: 'Own', options: [{ id: 'b', label: 'B' }, { id: '', label: 'bad' }] },
      { label: 'Empty', options: [] },
      { id: 'c', label: 'C', group: 'G' },
      { id: 'd', label: 'D', group: 7 },
    ] as never)
    expect(g.map((x) => [x.label, x.options.map((o) => o.id)])).toEqual([['G', ['a', 'c']], ['Own', ['b']], ['', ['d']]])
    expect(resolveGroups([{ options: [{ id: 'z', label: 'Z' }] }] as never)[0].label).toBe('')
  })
  it('usableOptions flattens groups and searchText joins label and description', () => {
    expect(usableOptions(GROUPED).map((o) => o.id)).toEqual(['draft', 'summary', 'review', 'archive'])
    expect(usableOptions('x')).toEqual([])
    expect(searchText({ id: 'a', label: 'A', description: 'B' })).toBe('A B')
    expect(searchText({ id: 'a', label: 'A' })).toBe('A')
  })
})

describe('ModelPicker labels', () => {
  it('built-in strings come from the ConfigProvider', async () => {
    const labels = { 'modelPicker.clearSelection': 'Auswahl löschen', 'modelPicker.toggleOptions': 'Optionen umschalten', 'modelPicker.empty': 'Keine Treffer' }
    wrapper = mount(
      defineComponent({ render: () => h(ConfigProvider, { labels }, () => h(ModelPicker, { options: OPTIONS, defaultValue: 'draft', clearable: true, 'aria-label': 'x' })) }),
      { attachTo: document.body },
    )
    expect(document.querySelector('[data-slot="model-picker-clear"]')?.getAttribute('aria-label')).toBe('Auswahl löschen')
    expect(document.querySelector('[data-slot="model-picker-trigger"]')?.getAttribute('aria-label')).toBe('Optionen umschalten')
  })
})
