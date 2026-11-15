import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useStrictHarness } from '../testing'
import { VisuallyHidden } from '../../primitives/VisuallyHidden'
import Field from '../Field/Field.vue'
import FileDropzone from './FileDropzone.vue'

const { errors, mountTree } = useStrictHarness()

/** Custom prompt made only of a decorative icon: the button has no text to take its name from. */
const iconOnly = { default: () => h('span', { 'aria-hidden': 'true', class: 'icon' }) }

describe('FileDropzone contract', () => {
  it('the default prompt names the drop area', async () => {
    await mountTree(() => h(FileDropzone, { accept: 'image/*' }))
    expect(errors).toEqual([])
  })
  it('throws when the custom content has no text and nothing else names the drop area, saying how to fix it', async () => {
    await mountTree(() => h(FileDropzone, null, iconOnly))
    expect(errors).toHaveLength(1)
    expect(errors[0].name).toBe('ContractError')
    expect(errors[0].message).toContain('FileDropzone: needs an accessible name')
    expect(errors[0].message).toContain('ariaLabel')
  })
  it.each([
    ['text in the custom content', () => h(FileDropzone, { multiple: true }, { default: () => [h('span', { 'aria-hidden': 'true' }), h('span', null, 'Drop PDFs or click to browse')] })],
    ['ariaLabel', () => h(FileDropzone, { ariaLabel: 'Upload an image' }, iconOnly)],
    ['an aria-label attribute', () => h(FileDropzone, { 'aria-label': 'Upload an image' }, iconOnly)],
    ['a Field label prop', () => h(Field, { label: 'Attachments' }, () => h(FileDropzone, null, iconOnly))],
    ['a Field label slot', () => h(Field, null, { label: () => 'Attachments', default: () => h(FileDropzone, null, iconOnly) })],
    ['a Field label with visually hidden text', () => h(Field, null, { label: () => h(VisuallyHidden, null, () => 'Attachments'), default: () => h(FileDropzone, null, iconOnly) })],
  ])('is satisfied by %s', async (_n, root) => {
    await mountTree(root)
    expect(errors).toEqual([])
  })
  it('a disabled dropzone with the default prompt passes', async () => {
    await mountTree(() => h(FileDropzone, { disabled: true }))
    expect(errors).toEqual([])
  })
  it('warn mode logs without throwing; off mode is silent', async () => {
    configureStrictMode('warn')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mountTree(() => h(FileDropzone, null, iconOnly))
    expect(errors).toEqual([])
    expect(spy.mock.calls.some((c) => String(c[0]).includes('FileDropzone: needs an accessible name'))).toBe(true)
    spy.mockClear()
    configureStrictMode('off')
    await mountTree(() => h(FileDropzone, null, iconOnly))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
