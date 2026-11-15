import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { FIELDS, ITEMS, apply, chipTexts, chips, live, mountBar, openPopover, q, qa, setInput, setSelect, slot, tick } from './testing'
import type { FilterItem } from './types'

const lastEmit = (w: ReturnType<typeof mountBar>, name: string) => w.emitted(name)!.at(-1)![0]
const valueEl = <T extends HTMLElement>(sel: string) => q<T>(`[data-slot="filter-bar-value"] ${sel}`)

describe('FilterBar: rendering', () => {
  it('is a named group with a chip per filter and generated text', () => {
    const w = mountBar({ modelValue: ITEMS() })
    const root = w.get('[data-slot="filter-bar"]')
    expect(root.attributes('role')).toBe('group')
    expect(root.attributes('aria-label')).toBe('Filters')
    expect(chipTexts()).toEqual(['Status is In transit', 'Weight is greater than 120', 'Carrier is any of Kestrel Freight, Orchard Mill'])
    expect(w.findAll('li')).toHaveLength(3)
    expect(w.get('ul').attributes('role')).toBe('list')
  })

  it('names every remove button after its chip', () => {
    mountBar({ modelValue: ITEMS() })
    expect(qa('[data-slot="filter-chip-remove"]').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Remove filter: Status is In transit',
      'Remove filter: Weight is greater than 120',
      'Remove filter: Carrier is any of Kestrel Freight, Orchard Mill',
    ])
  })

  it('renders no list and no Clear all without filters, but keeps the live region and Add filter', () => {
    const w = mountBar()
    expect(w.find('ul').exists()).toBe(false)
    expect(slot('filter-bar-clear')).toBeNull()
    expect(slot('filter-bar-add')!.textContent).toContain('Add filter')
    const status = slot('filter-bar-status')!
    expect(status.getAttribute('role')).toBe('status')
    expect(status.getAttribute('aria-live')).toBe('polite')
  })

  it('uses item.label when given and falls back to the field id for unknown fields and operators', () => {
    mountBar({
      modelValue: [
        { id: '1', field: 'status', value: 'booked', label: 'Custom text' },
        { id: '2', field: 'gone', operator: 'weird', value: 'x' },
        { id: '3', field: 'insured', operator: 'eq', value: true },
        { id: '4', field: 'insured', value: false },
        { id: '5', field: 'reference', value: 'KF-1' },
        { id: '6', field: 'weight', value: Number.NaN },
      ],
    })
    expect(chipTexts()).toEqual(['Custom text', 'gone weird x', 'Insured is Yes', 'Insured is No', 'Reference contains KF-1', 'Weight is'])
  })

  it('renders the chip slot with the filter and its text', () => {
    mountBar({ modelValue: [ITEMS()[0]] }, { slots: { chip: ({ filter, label }: { filter: FilterItem; label: string }) => h('b', { class: 'custom' }, `${filter.id}:${label}`) } })
    expect(q('.custom')!.textContent).toBe('a:Status is In transit')
    expect(q('[data-slot="filter-chip-remove"]')!.getAttribute('aria-label')).toBe('Remove filter: Status is In transit')
  })
})

describe('FilterBar: removing and clearing', () => {
  it('removes a filter, emits, announces and moves focus to the neighbour', async () => {
    const w = mountBar({ modelValue: ITEMS() })
    qa('[data-slot="filter-chip-remove"]')[1].click()
    await tick()
    expect((lastEmit(w, 'update:modelValue') as FilterItem[]).map((f) => f.id)).toEqual(['a', 'c'])
    expect((lastEmit(w, 'remove') as FilterItem).id).toBe('b')
    expect(live()).toBe('Removed filter: Weight is greater than 120.')
  })

  it('keeps focus in the list after removal (uncontrolled)', async () => {
    mountBar({ defaultValue: ITEMS() })
    qa('[data-slot="filter-chip-remove"]')[1].click()
    await tick()
    expect(chipTexts()).toHaveLength(2)
    expect(document.activeElement).toBe(qa('[data-slot="filter-chip-remove"]')[1])
    qa('[data-slot="filter-chip-remove"]')[1].click()
    await tick()
    expect(document.activeElement).toBe(qa('[data-slot="filter-chip-remove"]')[0])
    qa('[data-slot="filter-chip-remove"]')[0].click()
    await tick()
    expect(chipTexts()).toEqual([])
    expect(document.activeElement).toBe(slot('filter-bar-add'))
  })

  it('removes with Delete and Backspace on the remove button', async () => {
    const w = mountBar({ modelValue: ITEMS() })
    qa('[data-slot="filter-chip-remove"]')[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }))
    await tick()
    expect((lastEmit(w, 'remove') as FilterItem).id).toBe('a')
    qa('[data-slot="filter-chip-remove"]')[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }))
    await tick()
    expect((lastEmit(w, 'remove') as FilterItem).id).toBe('b')
  })

  it('clears everything, emits the removed filters and announces', async () => {
    const w = mountBar({ modelValue: ITEMS() })
    slot('filter-bar-clear')!.click()
    await tick()
    expect(lastEmit(w, 'update:modelValue')).toEqual([])
    expect((lastEmit(w, 'clear') as FilterItem[]).map((f) => f.id)).toEqual(['a', 'b', 'c'])
    expect(live()).toBe('All filters cleared.')
  })

  it('clears an uncontrolled bar and focuses Add filter', async () => {
    mountBar({ defaultValue: ITEMS() })
    slot('filter-bar-clear')!.click()
    await tick()
    expect(chips()).toHaveLength(0)
    expect(slot('filter-bar-clear')).toBeNull()
    expect(document.activeElement).toBe(slot('filter-bar-add'))
  })

  it('hides Clear all when clearable is false', () => {
    mountBar({ modelValue: ITEMS(), clearable: false })
    expect(slot('filter-bar-clear')).toBeNull()
  })

  it('announces the same message twice in a row', async () => {
    mountBar({ defaultValue: [{ id: 'a', field: 'status', value: 'booked' }, { id: 'b', field: 'status', value: 'booked' }] })
    qa('[data-slot="filter-chip-remove"]')[0].click()
    await tick()
    expect(live()).toBe('Removed filter: Status is Booked.')
    qa('[data-slot="filter-chip-remove"]')[0].click()
    await tick()
    expect(live()).toBe('Removed filter: Status is Booked.')
  })

  it('blocks removal and clearing when disabled', async () => {
    const w = mountBar({ modelValue: ITEMS(), disabled: true })
    expect(qa<HTMLButtonElement>('[data-slot="filter-chip-remove"]').every((b) => b.disabled)).toBe(true)
    expect((slot('filter-bar-clear') as HTMLButtonElement).disabled).toBe(true)
    expect((slot('filter-bar-add') as HTMLButtonElement).disabled).toBe(true)
    qa('[data-slot="filter-chip-remove"]')[0].click()
    slot('filter-bar-clear')!.click()
    await tick()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(w.get('[data-slot="filter-bar"]').attributes('data-disabled')).toBe('')
  })

  it('ignores a delete key on a disabled chip', async () => {
    const w = mountBar({ modelValue: ITEMS(), disabled: true })
    qa('[data-slot="filter-chip-remove"]')[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    await tick()
    expect(w.emitted('remove')).toBeUndefined()
  })
})

describe('FilterBar: adding filters', () => {
  it('opens a labelled form with field, condition and value editors', async () => {
    mountBar()
    await openPopover()
    expect(slot('filter-bar-content')!.getAttribute('role')).toBe('dialog')
    const labels = qa('[data-slot="filter-bar-form"] label').map((l) => l.textContent?.trim())
    expect(labels).toEqual(['Field', 'Condition', 'Value'])
    expect(qa('[data-slot="filter-bar-field"] option').map((o) => o.textContent)).toEqual(['Status', 'Reference', 'Weight', 'Delivery', 'Carrier', 'Insured'])
    // first field is a select: condition is / is not, then a value select with a placeholder
    expect(qa('[data-slot="filter-bar-operator"] option').map((o) => o.textContent)).toEqual(['is', 'is not'])
    expect(qa('[data-slot="filter-bar-value"] option').map((o) => o.textContent)).toEqual(['Choose a value', 'Booked', 'In transit', 'Held'])
  })

  it('adds a select filter', async () => {
    const w = mountBar({ modelValue: [] })
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-operator"]'), 'neq')
    await setSelect(valueEl<HTMLSelectElement>('select'), 'booked')
    await apply()
    const added = lastEmit(w, 'add') as FilterItem
    expect(added).toMatchObject({ field: 'status', operator: 'neq', value: 'booked' })
    expect(added.id).toMatch(/^filter-/)
    expect(lastEmit(w, 'update:modelValue')).toEqual([added])
    expect(live()).toBe('Added filter: Status is not Booked.')
    expect(slot('filter-bar-content')).toBeNull()
    expect(lastEmit(w, 'update:open')).toBe(false)
  })

  it('adds a text filter, trimming the value, and keeps existing filters', async () => {
    const w = mountBar({ defaultValue: [ITEMS()[0]] })
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'reference')
    expect(valueEl<HTMLInputElement>('input')!.placeholder).toBe('KF-1042')
    await setInput(valueEl<HTMLInputElement>('input'), '  KF-77  ')
    await apply()
    expect(lastEmit(w, 'add')).toMatchObject({ field: 'reference', operator: 'contains', value: 'KF-77' })
    expect(chipTexts()).toEqual(['Status is In transit', 'Reference contains KF-77'])
  })

  it('submits a text filter with Enter', async () => {
    const w = mountBar()
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'reference')
    await setInput(valueEl<HTMLInputElement>('input'), 'KF-9')
    q('[data-slot="filter-bar-form"]')!.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
    await tick()
    expect(lastEmit(w, 'add')).toMatchObject({ field: 'reference', value: 'KF-9' })
  })

  it('adds a number filter within bounds', async () => {
    const w = mountBar()
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'weight')
    expect(qa('[data-slot="filter-bar-operator"] option')).toHaveLength(6)
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-operator"]'), 'lte')
    const input = valueEl<HTMLInputElement>('input')!
    await setInput(input, '250')
    input.dispatchEvent(new Event('blur'))
    await tick()
    await apply()
    expect(lastEmit(w, 'add')).toMatchObject({ field: 'weight', operator: 'lte', value: 250 })
    expect(chipTexts()).toEqual(['Weight is at most 250'])
  })

  it('adds a date filter and rejects one outside min and max', async () => {
    const w = mountBar()
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'delivery')
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-operator"]'), 'before')
    await setInput(valueEl<HTMLInputElement>('input'), '2030-01-01')
    await apply()
    expect(w.emitted('add')).toBeUndefined()
    expect(slot('filter-bar-form')!.textContent).toContain('Enter a value within the allowed range.')
    await setInput(valueEl<HTMLInputElement>('input'), '2024-12-31')
    await apply()
    expect(w.emitted('add')).toBeUndefined()
    await setInput(valueEl<HTMLInputElement>('input'), '2025-06-30')
    await apply()
    expect(lastEmit(w, 'add')).toMatchObject({ field: 'delivery', operator: 'before', value: '2025-06-30' })
    expect(chipTexts()).toEqual(['Delivery is before 2025-06-30'])
  })

  it('adds a boolean filter without a condition picker', async () => {
    const w = mountBar()
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'insured')
    expect(slot('filter-bar-operator')).toBeNull()
    expect(qa('[data-slot="filter-bar-value"] option').map((o) => o.textContent)).toEqual(['Yes', 'No'])
    await setSelect(valueEl<HTMLSelectElement>('select'), 'false')
    await apply()
    expect(lastEmit(w, 'add')).toMatchObject({ field: 'insured', operator: 'eq', value: false })
  })

  it('adds a multi-select filter from checkboxes and skips disabled options', async () => {
    const w = mountBar()
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'carrier')
    const group = slot('filter-bar-value')!
    expect(group.tagName).toBe('FIELDSET')
    expect(group.querySelector('legend')!.textContent).toBe('Value')
    const boxes = qa<HTMLButtonElement>('[data-slot="filter-bar-value"] [role="checkbox"]')
    expect(boxes).toHaveLength(3)
    expect(boxes[2].hasAttribute('disabled') || boxes[2].getAttribute('data-disabled') !== null).toBe(true)
    boxes[1].click()
    await tick()
    boxes[0].click()
    await tick()
    boxes[1].click()
    await tick()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-operator"]'), 'nin')
    await apply()
    expect(lastEmit(w, 'add')).toMatchObject({ field: 'carrier', operator: 'nin', value: ['kestrel'] })
  })

  it('shows an error, focuses the value editor and adds nothing for an empty value', async () => {
    const w = mountBar()
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'reference')
    await apply()
    expect(w.emitted('add')).toBeUndefined()
    expect(slot('filter-bar-content')).not.toBeNull()
    expect(slot('filter-bar-form')!.textContent).toContain('Enter a value within the allowed range.')
    expect(document.activeElement).toBe(valueEl('input'))
    expect(valueEl('input')!.getAttribute('aria-invalid')).toBe('true')
    await setInput(valueEl<HTMLInputElement>('input'), 'x')
    expect(slot('filter-bar-form')!.textContent).not.toContain('Enter a value')
  })

  it('shows a multi-select error linked to the group', async () => {
    const w = mountBar()
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'carrier')
    await apply()
    expect(w.emitted('add')).toBeUndefined()
    const err = slot('filter-bar-error')!
    expect(err.getAttribute('role')).toBe('alert')
    expect(slot('filter-bar-value')!.getAttribute('aria-describedby')).toBe(err.id)
  })

  it('rejects an unselected or disabled select value', async () => {
    const w = mountBar()
    await openPopover()
    await apply()
    expect(w.emitted('add')).toBeUndefined()
    await setSelect(valueEl<HTMLSelectElement>('select'), 'held')
    await apply()
    expect(w.emitted('add')).toBeUndefined()
  })

  it('rejects a number below min and empty number', async () => {
    const w = mountBar()
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'weight')
    await apply()
    expect(w.emitted('add')).toBeUndefined()
    const input = valueEl<HTMLInputElement>('input')!
    await setInput(input, '5000')
    input.dispatchEvent(new Event('blur'))
    await tick()
    await apply()
    // NumberInput clamps to max (1000), which is within bounds
    expect(lastEmit(w, 'add')).toMatchObject({ field: 'weight', value: 1000 })
  })

  it('resets the draft each time the popover opens and when the field changes', async () => {
    mountBar()
    await openPopover()
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'reference')
    await setInput(valueEl<HTMLInputElement>('input'), 'abc')
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'weight')
    expect(valueEl<HTMLInputElement>('input')!.value).toBe('')
    slot('filter-bar-cancel')!.click()
    await tick()
    expect(slot('filter-bar-content')).toBeNull()
    await openPopover()
    expect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]')!.value).toBe('status')
  })

  it('Cancel and Escape close without adding', async () => {
    const w = mountBar()
    await openPopover()
    slot('filter-bar-cancel')!.click()
    await tick()
    expect(slot('filter-bar-content')).toBeNull()
    await openPopover()
    slot('filter-bar-content')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await tick()
    expect(slot('filter-bar-content')).toBeNull()
    expect(w.emitted('add')).toBeUndefined()
  })

  it('offers only the operators a field allows, ignoring unknown ids', async () => {
    mountBar({ fields: [{ id: 'name', label: 'Name', operators: ['starts', 'ends', 'bogus' as never] }, { id: 'one', label: 'One', operators: ['eq'] }] })
    await openPopover()
    expect(qa('[data-slot="filter-bar-operator"] option').map((o) => o.textContent)).toEqual(['starts with', 'ends with'])
    await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'one')
    expect(slot('filter-bar-operator')).toBeNull()
  })

  it('works controlled and uncontrolled for the popover', async () => {
    const w = mountBar({ open: true })
    await tick()
    expect(slot('filter-bar-content')).not.toBeNull()
    await w.setProps({ open: false })
    await tick()
    expect(slot('filter-bar-content')).toBeNull()
  })

  it('adds many filters quickly with unique ids', async () => {
    const w = mountBar()
    for (let i = 0; i < 5; i++) {
      await openPopover()
      await setSelect(q<HTMLSelectElement>('[data-slot="filter-bar-field"]'), 'reference')
      await setInput(valueEl<HTMLInputElement>('input'), `KF-${i}`)
      await apply()
    }
    const ids = (lastEmit(w, 'update:modelValue') as FilterItem[]).map((f) => f.id)
    expect(new Set(ids).size).toBe(5)
  })

  it('does nothing without fields', async () => {
    const w = mountBar({ fields: [] })
    expect((slot('filter-bar-add') as HTMLButtonElement).disabled).toBe(true)
    slot('filter-bar-add')!.click()
    await tick()
    expect(slot('filter-bar-content')).toBeNull()
    expect(w.emitted('add')).toBeUndefined()
  })
})

describe('FilterBar: limits', () => {
  it('disables Add filter at max', () => {
    mountBar({ modelValue: ITEMS(), max: 3 })
    expect((slot('filter-bar-add') as HTMLButtonElement).disabled).toBe(true)
  })
  it('floors a fractional max and ignores bad ones', () => {
    mountBar({ modelValue: ITEMS(), max: 3.9 })
    expect((slot('filter-bar-add') as HTMLButtonElement).disabled).toBe(true)
  })
  it.each([0, -2, Number.NaN, '3' as never, Infinity])('treats max=%s as unlimited', (max) => {
    mountBar({ modelValue: ITEMS(), max })
    expect((slot('filter-bar-add') as HTMLButtonElement).disabled).toBe(false)
  })
})

describe('FilterBar: labels', () => {
  it('replaces texts and operator wording, keeps defaults for blank keys', async () => {
    mountBar({
      modelValue: [ITEMS()[0]],
      labels: { group: 'Active filters', add: 'New filter', clear: 'Reset', remove: 'Drop {filter}', apply: '', operators: { eq: '=' } },
    })
    expect(q('[data-slot="filter-bar"]')!.getAttribute('aria-label')).toBe('Active filters')
    expect(slot('filter-bar-add')!.textContent).toContain('New filter')
    expect(slot('filter-bar-clear')!.textContent).toContain('Reset')
    expect(chipTexts()).toEqual(['Status = In transit'])
    expect(q('[data-slot="filter-chip-remove"]')!.getAttribute('aria-label')).toBe('Drop Status = In transit')
    await openPopover()
    expect(slot('filter-bar-apply')!.textContent).toBe('Apply filter')
    expect(qa('[data-slot="filter-bar-operator"] option').map((o) => o.textContent)).toEqual(['=', 'is not'])
  })

  it('ignores non-object labels', () => {
    mountBar({ labels: 'nope' as never })
    expect(q('[data-slot="filter-bar"]')!.getAttribute('aria-label')).toBe('Filters')
  })
})

describe('FilterBar: customisation', () => {
  it('merges class last and falls through attributes', () => {
    const w = mountBar({ class: 'zz-custom' }, { attrs: { 'data-testid': 'bar', 'aria-label': 'Shipment filters', id: 'bar-1' } })
    const root = w.get('[data-slot="filter-bar"]')
    expect(root.classes()).toContain('zz-custom')
    expect(root.attributes('data-testid')).toBe('bar')
    expect(root.attributes('aria-label')).toBe('Shipment filters')
    expect(root.attributes('id')).toBe('bar-1')
  })
})

describe('FilterBar: edge cases', () => {
  it('survives garbage input', () => {
    const w = mountBar({
      fields: [null, 'x', { id: '' }, { id: '__proto__', label: 'Bad' }, { id: 'ok', label: 'Fine', type: 'nonsense' }, { id: 'ok', label: 'Duplicate' }] as never,
      modelValue: [null, 5, { id: 'a' }, { id: 'a', field: 'ok', value: 'v' }, { id: 'a', field: 'ok', value: 'dup' }, { id: 'n', field: 'ok', value: null }] as never,
    })
    expect(chipTexts()).toEqual(['Fine contains v'])
    expect(w.exists()).toBe(true)
  })

  it('treats non-array model and fields as empty', () => {
    mountBar({ fields: 'nope' as never, modelValue: 'nope' as never })
    expect(chips()).toHaveLength(0)
  })

  it('renders hostile text as text', () => {
    mountBar({ modelValue: [{ id: 'x', field: 'reference', operator: 'contains', value: '<img src=x onerror=alert(1)>' }] })
    expect(q('img')).toBeNull()
    expect(chipTexts()[0]).toBe('Reference contains <img src=x onerror=alert(1)>')
  })

  it('strips control characters and cuts huge values', () => {
    mountBar({ modelValue: [{ id: 'x', field: 'reference', value: `a\u0000b‮c${'z'.repeat(10000)}` }] })
    const text = chipTexts()[0]!
    expect(text).not.toMatch(/[\u0000-\u001f]/)
    expect(text.length).toBeLessThanOrEqual(120)
    expect(text.endsWith('…')).toBe(true)
  })

  it('handles right-to-left and unicode text', () => {
    mountBar({ modelValue: [{ id: 'x', field: 'reference', operator: 'eq', value: 'مرحبا שלום 🚚' }] }, { attrs: { dir: 'rtl' } })
    expect(chipTexts()[0]).toBe('Reference is مرحبا שלום 🚚')
  })

  it('renders 200 filters', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({ id: `i${i}`, field: 'reference', value: `v${i}` }))
    mountBar({ modelValue: many })
    expect(chips()).toHaveLength(200)
  })

  it('does not leak the document listeners or timers on unmount', async () => {
    const w = mountBar({ modelValue: ITEMS() })
    await openPopover()
    w.unmount()
    await tick()
    expect(slot('filter-bar-content')).toBeNull()
  })

  it('exposes state when a controlled model does not change after removal', async () => {
    const w = mountBar({ modelValue: ITEMS() })
    qa('[data-slot="filter-chip-remove"]')[0].click()
    await tick()
    // controlled: the parent owns the list, so the chips stay until it updates
    expect(chips()).toHaveLength(3)
    await w.setProps({ modelValue: ITEMS().slice(1) })
    expect(chips()).toHaveLength(2)
  })
})
