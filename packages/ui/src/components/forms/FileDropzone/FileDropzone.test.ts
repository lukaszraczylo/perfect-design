import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import FileDropzone from './FileDropzone.vue'
import Field from '../Field/Field.vue'

let wrapper: VueWrapper | undefined
function make(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}, slots = {}) {
  wrapper = mount(FileDropzone, { props, attrs, slots, attachTo: document.body })
  return wrapper
}
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const file = (name: string, type = 'text/plain', size = 10, lastModified = 1) => {
  const f = new File(['x'.repeat(Math.min(size, 50))], name, { type, lastModified })
  Object.defineProperty(f, 'size', { value: size })
  return f
}
const area = (w: VueWrapper) => w.find('[data-slot=file-dropzone-area]')
const input = (w: VueWrapper) => w.find('input[type=file]')
const last = (w: VueWrapper, name = 'update:modelValue') => w.emitted(name)?.at(-1)?.[0] as File[]
const drop = async (w: VueWrapper, files: File[]) => {
  await area(w).trigger('drop', { dataTransfer: { files } })
}
async function pick(w: VueWrapper, files: File[]) {
  Object.defineProperty(input(w).element, 'files', { value: files, configurable: true })
  await input(w).trigger('change')
}

describe('FileDropzone', () => {
  describe('good path', () => {
    it('renders root, native button area, hidden file input', () => {
      const w = make()
      expect(w.attributes('data-slot')).toBe('file-dropzone')
      expect(area(w).element.tagName).toBe('BUTTON')
      expect(area(w).attributes('type')).toBe('button')
      expect(area(w).attributes('role')).toBeUndefined()
      expect(area(w).attributes('tabindex')).toBeUndefined()
      expect(input(w).attributes('aria-hidden')).toBe('true')
      expect(input(w).attributes('tabindex')).toBe('-1')
    })

    it('shows default prompt text', () => {
      expect(area(make()).text()).toContain('Drag and drop files here')
    })

    it('shows constraints hint', () => {
      const w = make({ accept: 'image/*, .pdf', maxSize: 2 * 1024 * 1024, multiple: true, maxFiles: 3 })
      expect(area(w).text()).toContain('Accepts image/*, .pdf. Up to 2 MB. Max 3 files')
      expect(area(w).text()).not.toContain('·')
    })

    it('forwards accept, multiple, name to the input', () => {
      const w = make({ accept: 'image/*', multiple: true, name: 'docs' })
      expect(input(w).attributes('accept')).toBe('image/*')
      expect(input(w).attributes('multiple')).toBeDefined()
      expect(input(w).attributes('name')).toBe('docs')
    })

    it('click opens the picker', async () => {
      const w = make()
      let clicked = 0
      input(w).element.addEventListener('click', () => clicked++)
      await area(w).trigger('click')
      expect(clicked).toBe(1)
    })

    it('keyboard activation is native: the area is a focusable button that is not in a custom keydown path', () => {
      const w = make()
      const el = area(w).element as HTMLButtonElement
      el.focus()
      expect(document.activeElement).toBe(el)
      expect(el.disabled).toBe(false)
    })

    it('accepts a dropped file', async () => {
      const w = make()
      const f = file('a.txt')
      await drop(w, [f])
      expect(last(w)).toEqual([f])
      expect(w.emitted('reject')).toBeUndefined()
      expect(w.find('[data-slot=file-dropzone-item]').text()).toContain('a.txt')
    })

    it('accepts a picked file via the input and resets the input', async () => {
      const w = make()
      const f = file('a.txt')
      await pick(w, [f])
      expect(last(w)).toEqual([f])
    })

    it('single mode replaces the previous file', async () => {
      const w = make()
      const a = file('a.txt')
      const b = file('b.txt')
      await drop(w, [a])
      await drop(w, [b])
      expect(last(w)).toEqual([b])
    })

    it('multiple mode appends', async () => {
      const w = make({ multiple: true })
      const a = file('a.txt')
      const b = file('b.txt', 'text/plain', 10, 2)
      await drop(w, [a])
      await drop(w, [b])
      expect(last(w)).toEqual([a, b])
    })

    it('syncs controlled modelValue and treats null as empty', async () => {
      const a = file('a.txt')
      const w = make({ modelValue: [a], multiple: true })
      expect(w.findAll('[data-slot=file-dropzone-item]')).toHaveLength(1)
      await w.setProps({ modelValue: [] })
      expect(w.findAll('[data-slot=file-dropzone-item]')).toHaveLength(0)
      await w.setProps({ modelValue: null })
      expect(w.findAll('[data-slot=file-dropzone-item]')).toHaveLength(0)
    })

    it('works with a parent v-model', async () => {
      const files = ref<File[]>([])
      const Host = defineComponent({
        setup: () => () => h(FileDropzone, { modelValue: files.value, multiple: true, 'onUpdate:modelValue': (v: File[]) => (files.value = v) }),
      })
      wrapper = mount(Host, { attachTo: document.body }) as unknown as VueWrapper
      const a = file('a.txt')
      await wrapper.find('[data-slot=file-dropzone-area]').trigger('drop', { dataTransfer: { files: [a] } })
      expect(files.value).toEqual([a])
    })

    it('removes a file with its remove button', async () => {
      const w = make({ multiple: true })
      const a = file('a.txt')
      const b = file('b.txt', 'text/plain', 10, 2)
      await drop(w, [a, b])
      await w.findAll('[data-slot=file-dropzone-remove]')[0]!.trigger('click')
      expect(last(w)).toEqual([b])
      expect(w.findAll('[data-slot=file-dropzone-item]')).toHaveLength(1)
    })

    it('remove buttons are named after the file and are type=button', async () => {
      const w = make()
      await drop(w, [file('report.pdf', 'application/pdf')])
      const btn = w.find('[data-slot=file-dropzone-remove]')
      expect(btn.attributes('aria-label')).toBe('Remove report.pdf')
      expect(btn.attributes('type')).toBe('button')
    })

    it('showFiles=false hides the list', async () => {
      const w = make({ showFiles: false })
      await drop(w, [file('a.txt')])
      expect(w.find('[data-slot=file-dropzone-list]').exists()).toBe(false)
    })

    it('formats sizes in the list', async () => {
      const w = make({ multiple: true })
      await drop(w, [file('b.txt', 'text/plain', 500), file('k.txt', 'text/plain', 1536, 2), file('m.txt', 'text/plain', 5 * 1024 * 1024, 3), file('g.txt', 'text/plain', 3 * 1024 ** 3, 4)])
      const text = w.find('[data-slot=file-dropzone-list]').text()
      expect(text).toContain('500 B')
      expect(text).toContain('1.5 KB')
      expect(text).toContain('5 MB')
      expect(text).toContain('3 GB')
    })
  })

  describe('drag state', () => {
    it('sets data-dragging on dragenter/dragover and clears on leave', async () => {
      const w = make()
      await area(w).trigger('dragenter')
      expect(w.attributes('data-dragging')).toBeDefined()
      expect(area(w).attributes('data-dragging')).toBeDefined()
      await area(w).trigger('dragover')
      await area(w).trigger('dragleave')
      expect(area(w).attributes('data-dragging')).toBeUndefined()
    })

    it('nested enter/leave pairs do not flicker', async () => {
      const w = make()
      await area(w).trigger('dragenter')
      await area(w).trigger('dragenter')
      await area(w).trigger('dragleave')
      expect(area(w).attributes('data-dragging')).toBeDefined()
      await area(w).trigger('dragleave')
      expect(area(w).attributes('data-dragging')).toBeUndefined()
    })

    it('extra dragleave never goes negative', async () => {
      const w = make()
      await area(w).trigger('dragleave')
      await area(w).trigger('dragleave')
      await area(w).trigger('dragenter')
      expect(area(w).attributes('data-dragging')).toBeDefined()
    })

    it('drop clears dragging', async () => {
      const w = make()
      await area(w).trigger('dragenter')
      await drop(w, [file('a.txt')])
      expect(area(w).attributes('data-dragging')).toBeUndefined()
    })

    it('dragover prevents default so drop is allowed', async () => {
      const w = make()
      const ev = new Event('dragover', { bubbles: true, cancelable: true })
      area(w).element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(true)
    })

    it('the default slot receives { dragging } and default text changes', async () => {
      const w = make({}, {}, { default: `<template #default="{ dragging }"><i id="s">{{ dragging ? 'over' : 'idle' }}</i></template>` })
      expect(w.find('#s').text()).toBe('idle')
      await area(w).trigger('dragenter')
      expect(w.find('#s').text()).toBe('over')
      const d = make()
      await area(d).trigger('dragenter')
      expect(area(d).text()).toContain('Drop to upload')
    })
  })

  describe('validation (bad path)', () => {
    it('rejects wrong types by wildcard, extension and exact mime', async () => {
      const w = make({ accept: 'image/*,.pdf,text/csv', multiple: true })
      const good = [file('a.png', 'image/png'), file('b.PDF', 'application/pdf'), file('c.csv', 'text/csv')]
      const bad = file('d.exe', 'application/x-msdownload')
      await drop(w, [...good, bad])
      expect(last(w)).toEqual(good)
      expect(last(w, 'reject')).toEqual([{ file: bad, reason: 'type' }])
      expect(w.emitted('error')?.[0]?.[0]).toContain('d.exe')
      expect(w.find('[data-slot=file-dropzone-error]').text()).toContain('file type not allowed')
    })

    it('accept matching is case-insensitive and tolerates spaces', async () => {
      const w = make({ accept: ' IMAGE/PNG , .TXT ' })
      await drop(w, [file('a.txt', '')])
      expect(w.emitted('reject')).toBeUndefined()
      await drop(w, [file('x.png', 'IMAGE/PNG')])
      expect(w.emitted('reject')).toBeUndefined()
    })

    it('file with empty mime type is judged by extension only', async () => {
      const w = make({ accept: 'image/*' })
      await drop(w, [file('noext', '')])
      expect(last(w, 'reject')[0]).toMatchObject({ reason: 'type' })
    })

    it('rejects oversized files', async () => {
      const w = make({ maxSize: 1000, multiple: true })
      const big = file('big.bin', 'application/octet-stream', 1001)
      const ok = file('ok.bin', 'application/octet-stream', 1000, 2)
      await drop(w, [big, ok])
      expect(last(w)).toEqual([ok])
      expect(last(w, 'reject')).toEqual([{ file: big, reason: 'size' }])
      expect(w.find('[data-slot=file-dropzone-error]').text()).toContain('big.bin: larger than 1000 B')
    })

    it('maxSize 0 rejects any non-empty file but keeps empty ones', async () => {
      const w = make({ maxSize: 0, multiple: true })
      await drop(w, [file('e.txt', 'text/plain', 0), file('n.txt', 'text/plain', 1, 2)])
      expect(last(w)).toHaveLength(1)
      expect(last(w, 'reject')[0]).toMatchObject({ reason: 'size' })
    })

    it('enforces maxFiles across drops', async () => {
      const w = make({ multiple: true, maxFiles: 2 })
      const a = file('a', 'text/plain', 1, 1)
      const b = file('b', 'text/plain', 1, 2)
      const c = file('c', 'text/plain', 1, 3)
      await drop(w, [a, b, c])
      expect(last(w)).toEqual([a, b])
      expect(last(w, 'reject')).toEqual([{ file: c, reason: 'count' }])
      expect(w.find('[data-slot=file-dropzone-error]').text()).toContain('At most 2 files')
      await drop(w, [file('d', 'text/plain', 1, 4)])
      expect(last(w, 'reject')[0]).toMatchObject({ reason: 'count' })
    })

    it('single mode rejects extra files with reason count', async () => {
      const w = make()
      const a = file('a', 'text/plain', 1, 1)
      const b = file('b', 'text/plain', 1, 2)
      await drop(w, [a, b])
      expect(last(w)).toEqual([a])
      expect(last(w, 'reject')).toEqual([{ file: b, reason: 'count' }])
      expect(w.find('[data-slot=file-dropzone-error]').text()).toBe('Only one file is allowed')
    })

    it('reports mixed rejection reasons in one message', async () => {
      const w = make({ accept: '.txt', maxSize: 5, multiple: true, maxFiles: 1 })
      await drop(w, [file('a.png', 'image/png'), file('b.txt', 'text/plain', 50, 2), file('c.txt', 'text/plain', 1, 3), file('d.txt', 'text/plain', 1, 4)])
      const msg = w.find('[data-slot=file-dropzone-error]').text()
      expect(msg).toContain('file type not allowed')
      expect(msg).toContain('larger than 5 B')
      expect(msg).toContain('Only one file is allowed')
      expect(last(w, 'reject').map((r: unknown) => (r as { reason: string }).reason).sort()).toEqual(['count', 'size', 'type'])
    })

    it('ignores duplicates silently', async () => {
      const w = make({ multiple: true })
      const a = file('a.txt')
      await drop(w, [a])
      await drop(w, [a])
      expect(w.emitted('update:modelValue')).toHaveLength(1)
      expect(w.emitted('reject')).toBeUndefined()
    })

    it('ignores duplicates within the same drop', async () => {
      const w = make({ multiple: true })
      await drop(w, [file('a.txt'), file('a.txt')])
      expect(last(w)).toHaveLength(1)
    })

    it('a rejection does not wipe previously accepted files (single mode)', async () => {
      const w = make({ accept: '.txt' })
      const a = file('a.txt')
      await drop(w, [a])
      await drop(w, [file('x.png', 'image/png')])
      expect(w.emitted('update:modelValue')).toHaveLength(1)
      expect(w.findAll('[data-slot=file-dropzone-item]')).toHaveLength(1)
    })

    it('error is cleared by a later clean drop and by removing a file', async () => {
      const w = make({ accept: '.txt' })
      await drop(w, [file('x.png', 'image/png')])
      expect(w.find('[data-slot=file-dropzone-error]').exists()).toBe(true)
      await drop(w, [file('a.txt')])
      expect(w.find('[data-slot=file-dropzone-error]').exists()).toBe(false)
      await drop(w, [file('y.png', 'image/png')])
      await w.find('[data-slot=file-dropzone-remove]').trigger('click')
      expect(w.find('[data-slot=file-dropzone-error]').exists()).toBe(false)
    })

    it('error state sets aria-invalid, describedby and role=alert', async () => {
      const w = make({ accept: '.txt' })
      await drop(w, [file('x.png', 'image/png')])
      expect(area(w).attributes('aria-invalid')).toBe('true')
      const err = w.find('[data-slot=file-dropzone-error]')
      expect(err.attributes('role')).toBe('alert')
      expect(area(w).attributes('aria-describedby')).toBe(err.attributes('id'))
    })

    it('empty drop and empty change are no-ops', async () => {
      const w = make()
      await area(w).trigger('drop', { dataTransfer: { files: [] } })
      await area(w).trigger('drop', {})
      await pick(w, [])
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('change event with files null is a no-op', async () => {
      const w = make()
      Object.defineProperty(input(w).element, 'files', { value: null, configurable: true })
      await input(w).trigger('change')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('onChange survives an environment that forbids resetting the input', async () => {
      const w = make()
      Object.defineProperty(input(w).element, 'value', {
        configurable: true,
        get: () => '',
        set: () => {
          throw new Error('nope')
        },
      })
      await pick(w, [file('a.txt')])
      expect(last(w)).toHaveLength(1)
    })
  })

  describe('disabled', () => {
    it('disabled blocks drop, pick, click and keyboard; removes tab stop', async () => {
      const w = make({ disabled: true })
      expect(area(w).attributes('disabled')).toBeDefined()
      expect(input(w).attributes('disabled')).toBeDefined()
      let clicked = 0
      input(w).element.addEventListener('click', () => clicked++)
      await area(w).trigger('click')
      await drop(w, [file('a.txt')])
      await pick(w, [file('b.txt')])
      await area(w).trigger('dragenter')
      await area(w).trigger('dragover')
      expect(clicked).toBe(0)
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(area(w).attributes('data-dragging')).toBeUndefined()
    })

    it('disabled disables remove buttons', async () => {
      const w = make({ disabled: true, modelValue: [file('a.txt')] })
      const btn = w.find('[data-slot=file-dropzone-remove]')
      expect(btn.attributes('disabled')).toBeDefined()
      await btn.trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })

    it('removeFile guard holds even if a click is forced', async () => {
      const w = make({ disabled: true, modelValue: [file('a.txt')] })
      ;(w.find('[data-slot=file-dropzone-remove]').element as HTMLButtonElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('customisation and a11y', () => {
    it('merges class last on the root', () => {
      const w = make({ class: 'w-64 custom' })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).toContain('w-64')
      expect(w.classes()).not.toContain('w-full')
    })

    it('passes attrs to the area', () => {
      const w = make({}, { 'data-testid': 'dz', 'aria-describedby': 'x' })
      expect(area(w).attributes('data-testid')).toBe('dz')
    })

    it('ariaLabel is hidden text inside the area, so the visible prompt stays in the name (WCAG 2.5.3)', () => {
      const a = area(make({ ariaLabel: 'Upload CV' }))
      expect(a.attributes('aria-label')).toBeUndefined()
      expect(a.find('[data-slot=file-dropzone-label]').text()).toBe('Upload CV')
      expect(a.find('[data-slot=file-dropzone-label]').classes()).toContain('sr-only')
      expect(a.text()).toContain('Upload CV')
      expect(a.text()).toContain('Drag and drop files here')
    })

    it('has no aria-label that could differ from the visible text', () => {
      expect(area(make()).attributes('aria-label')).toBeUndefined()
      expect(area(make()).attributes('aria-labelledby')).toBeUndefined()
    })

    it('announces added and removed files through a polite status region', async () => {
      const w = make({ multiple: true })
      const status = w.find('[data-slot=file-dropzone-status]')
      expect(status.attributes('role')).toBe('status')
      expect(status.text()).toBe('')
      await drop(w, [file('a.txt')])
      expect(status.text()).toBe('a.txt added')
      await drop(w, [file('b.txt', 'text/plain', 10, 2), file('c.txt', 'text/plain', 10, 3)])
      expect(status.text()).toBe('2 files added')
      await w.find('[data-slot=file-dropzone-remove]').trigger('click')
      expect(status.text()).toBe('a.txt removed')
    })

    it('remove buttons grow to a 44px target on coarse pointers and stay 24px otherwise', async () => {
      const w = make({ modelValue: [file('a.txt')] })
      const cls = w.find('[data-slot=file-dropzone-remove]').classes()
      expect(cls).toContain('size-6')
      expect(cls).toContain('pointer-coarse:size-11')
    })

    it('has a forced-colors outline for the dragging state and no arbitrary data variants', () => {
      const cls = area(make()).classes()
      expect(cls).toContain('forced-colors:data-dragging:outline-2')
      expect(cls.some((c) => c.includes('-['))).toBe(false)
    })

    it('invalid sets aria-invalid; valid does not', () => {
      expect(area(make({ invalid: true })).attributes('aria-invalid')).toBe('true')
      expect(area(make()).attributes('aria-invalid')).toBeUndefined()
    })

    it('required is forwarded to the input', () => {
      expect(input(make({ required: true })).attributes('required')).toBeDefined()
    })

    it('handles unicode and very long file names', async () => {
      const w = make({ multiple: true })
      const long = `${'ä'.repeat(300)}.txt`
      await drop(w, [file('żółć 🚀.txt'), file(long, 'text/plain', 10, 2)])
      expect(last(w)).toHaveLength(2)
      expect(w.findAll('[data-slot=file-dropzone-item]')[0]!.text()).toContain('żółć 🚀.txt')
    })

    it('rapid repeated drops accumulate up to the limit', async () => {
      const w = make({ multiple: true, maxFiles: 5 })
      for (let i = 0; i < 10; i++) await drop(w, [file(`f${i}`, 'text/plain', 1, i)])
      expect(last(w)).toHaveLength(5)
    })

    it('unmounts cleanly', () => {
      const w = make()
      expect(() => w.unmount()).not.toThrow()
      wrapper = undefined
    })
  })

  describe('Field integration', () => {
    it('id lands on the hidden input; describedBy/invalid/disabled applied', () => {
      wrapper = mount(
        defineComponent({
          components: { Field, FileDropzone },
          template: `<Field id="up" hint="Hint" error="Required" disabled><FileDropzone /></Field>`,
        }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      expect(wrapper.find('input#up').exists()).toBe(true)
      const a = wrapper.find('[data-slot=file-dropzone-area]')
      expect(a.attributes('aria-describedby')).toContain('up-hint')
      expect(a.attributes('aria-invalid')).toBe('true')
      expect(a.attributes('disabled')).toBeDefined()
    })

    it('the Field label and the visible prompt together name the dropzone', async () => {
      wrapper = mount(
        defineComponent({
          components: { Field, FileDropzone },
          template: `<Field id="up2" label="Attachments"><FileDropzone aria-label="Upload" /></Field>`,
        }),
        { attachTo: document.body },
      ) as unknown as VueWrapper
      await nextTick()
      const a = wrapper.find('[data-slot=file-dropzone-area]')
      const ids = a.attributes('aria-labelledby')!.split(' ')
      expect(ids).toHaveLength(2)
      expect(ids[1]).toBe(a.attributes('id'))
      expect(document.getElementById(ids[0])!.textContent).toContain('Attachments')
    })
  })
})
