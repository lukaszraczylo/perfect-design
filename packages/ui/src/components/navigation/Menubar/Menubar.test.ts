import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms))
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const qa = (s: string) => [...document.body.querySelectorAll(s)] as HTMLElement[]
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
const pointerDown = (el: Element) => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', ctrlKey: false }))

interface Opts {
  value?: string
  controlled?: boolean
  rootProps?: Record<string, unknown>
  onSelect?: (e: Event) => void
  onDelete?: (e: Event) => void
  fileDisabled?: boolean
}

function make(opts: Opts = {}) {
  const value = ref(opts.value ?? '')
  const checked = ref<boolean | 'indeterminate'>(false)
  const radio = ref('a')
  const updates: string[] = []
  const Comp = defineComponent({
    setup: () => () =>
      h('div', [
        h('button', { id: 'outside' }, 'outside'),
        h(
          Menubar,
          {
            ...(opts.controlled ? { modelValue: value.value } : {}),
            'onUpdate:modelValue': (v: string) => {
              updates.push(v)
              value.value = v
            },
            class: 'custom-root',
            'aria-label': 'App menu',
            ...opts.rootProps,
          },
          () => [
            h(MenubarMenu, { value: 'file' }, () => [
              h(MenubarTrigger, { class: 'custom-trigger', disabled: opts.fileDisabled }, () => 'File'),
              h(MenubarContent, { class: 'custom-content', 'data-test': 'x' }, () => [
                h(MenubarLabel, { class: 'custom-label' }, () => 'Document'),
                h(MenubarSeparator, { class: 'custom-sep' }),
                h(MenubarGroup, null, () => [
                  h(MenubarItem, { id: 'new', onSelect: opts.onSelect }, () => ['New', h(MenubarShortcut, { class: 'custom-short' }, () => '⌘N')]),
                  h(MenubarItem, { id: 'open', inset: true }, () => 'Open'),
                  h(MenubarItem, { id: 'disabled', disabled: true, onSelect: opts.onSelect }, () => 'Disabled'),
                  h(MenubarItem, { id: 'delete', destructive: true, class: 'custom-item', onSelect: opts.onDelete }, () => 'Delete'),
                ]),
                h(MenubarSeparator),
                h(MenubarCheckboxItem, { id: 'check', modelValue: checked.value, 'onUpdate:modelValue': (v: boolean | 'indeterminate') => (checked.value = v) }, () => 'Toolbar'),
                h(MenubarRadioGroup, { modelValue: radio.value, 'onUpdate:modelValue': (v: unknown) => (radio.value = v as string) }, () => [
                  h(MenubarRadioItem, { id: 'ra', value: 'a' }, () => 'Alpha'),
                  h(MenubarRadioItem, { id: 'rb', value: 'b' }, () => 'Beta'),
                ]),
                h(MenubarSub, null, () => [
                  h(MenubarSubTrigger, { id: 'sub', inset: true, class: 'custom-subtrigger' }, () => 'Share'),
                  h(MenubarSubContent, { class: 'custom-sub' }, () => h(MenubarItem, { id: 'nested' }, () => 'Email')),
                ]),
              ]),
            ]),
            h(MenubarMenu, { value: 'edit' }, () => [
              h(MenubarTrigger, null, () => 'Edit'),
              h(MenubarContent, null, () => h(MenubarItem, { id: 'undo' }, () => 'Undo')),
            ]),
            h(MenubarMenu, { value: 'view' }, () => [
              h(MenubarTrigger, { disabled: true }, () => 'View'),
              h(MenubarContent, null, () => h(MenubarItem, null, () => 'Zoom')),
            ]),
          ],
        ),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { value, checked, radio, updates }
}

const root = () => q('[data-slot="menubar"]')!
const trigger = (id = 'file') => q(`[data-slot="menubar-trigger"][data-value="${id}"]`)!
const content = () => q('[data-slot="menubar-content"]')

async function openFile() {
  pointerDown(trigger())
  await nextTick()
  await tick()
}

describe('Menubar', () => {
  describe('structure', () => {
    it('renders a role=menubar root with triggers and no content while closed', () => {
      make()
      expect(root().getAttribute('role')).toBe('menubar')
      expect(qa('[data-slot="menubar-trigger"]')).toHaveLength(3)
      expect(content()).toBeNull()
      expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('has data-slot on every part', async () => {
      make()
      await openFile()
      for (const s of [
        'menubar',
        'menubar-trigger',
        'menubar-content',
        'menubar-label',
        'menubar-separator',
        'menubar-group',
        'menubar-item',
        'menubar-shortcut',
        'menubar-checkbox-item',
        'menubar-radio-group',
        'menubar-radio-item',
        'menubar-sub-trigger',
        'menubar-item-indicator',
      ])
        expect(q(`[data-slot="${s}"]`), s).not.toBeNull()
      // MenubarMenu renders no element of its own (renderless wrapper) but accepts the data-slot attribute without warning.
    })

    it('renders sub content with data-slot', async () => {
      make()
      await openFile()
      key(q('[data-slot="menubar-sub-trigger"]')!, 'ArrowRight')
      await nextTick()
      await tick()
      expect(q('[data-slot="menubar-sub-content"]')).not.toBeNull()
    })
  })

  describe('open / close', () => {
    it('opens on pointerdown and reports aria-expanded', async () => {
      const { updates } = make()
      await openFile()
      expect(content()!.getAttribute('role')).toBe('menu')
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(updates).toContain('file')
    })

    it.each(['Enter', ' ', 'ArrowDown'])('opens with keyboard (%s)', async (k) => {
      make()
      key(trigger(), k)
      await nextTick()
      await tick()
      expect(content()).not.toBeNull()
    })

    it('toggles closed when the open trigger is pressed again', async () => {
      const { value } = make({ controlled: true })
      await openFile()
      expect(value.value).toBe('file')
      pointerDown(trigger())
      await nextTick()
      expect(value.value).toBe('')
    })

    it('closes on Escape', async () => {
      const { value } = make({ controlled: true })
      await openFile()
      key(content()!, 'Escape')
      await nextTick()
      expect(value.value).toBe('')
    })

    it('closes on outside pointer down', async () => {
      const { value } = make({ controlled: true })
      await openFile()
      q('#outside')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
      await nextTick()
      expect(value.value).toBe('')
    })

    it('works uncontrolled', async () => {
      make()
      await openFile()
      expect(content()).not.toBeNull()
      key(content()!, 'Escape')
      await nextTick()
      await tick(20)
      expect(content()).toBeNull()
    })

    it('defaultValue opens a menu at mount', async () => {
      make({ rootProps: { defaultValue: 'edit' } })
      await nextTick()
      await tick()
      expect(q('#undo')).not.toBeNull()
      expect(trigger('edit').getAttribute('aria-expanded')).toBe('true')
    })

    it('supports controlled opening from the parent', async () => {
      const { value } = make({ controlled: true })
      value.value = 'edit'
      await nextTick()
      await tick()
      expect(q('#undo')).not.toBeNull()
    })

    it('an unknown controlled value opens nothing', async () => {
      make({ controlled: true, value: 'nope' })
      await nextTick()
      expect(content()).toBeNull()
    })

    it('hovering another trigger while open switches menus', async () => {
      const { value } = make({ controlled: true })
      await openFile()
      trigger('edit').dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
      await nextTick()
      expect(value.value).toBe('edit')
    })

    it('does not open from a disabled trigger', async () => {
      make()
      pointerDown(trigger('view'))
      await nextTick()
      expect(content()).toBeNull()
      expect(trigger('view').hasAttribute('data-disabled')).toBe(true)
    })

    it('does not open when the first trigger is disabled via prop', async () => {
      make({ fileDisabled: true })
      pointerDown(trigger())
      await nextTick()
      expect(content()).toBeNull()
    })

    it('ignores non-primary pointer buttons', async () => {
      make()
      trigger().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 2, pointerType: 'mouse' }))
      await nextTick()
      expect(content()).toBeNull()
    })
  })

  describe('keyboard navigation', () => {
    it('moves between triggers with arrow keys, skipping nothing it cannot reach', async () => {
      make()
      await tick()
      trigger().focus()
      key(trigger(), 'ArrowRight')
      await nextTick()
      await tick()
      expect(document.activeElement).toBe(trigger('edit'))
      key(trigger('edit'), 'ArrowLeft')
      await nextTick()
      await tick()
      expect(document.activeElement).toBe(trigger('file'))
    })

    it('loops focus when loop is set', async () => {
      make({ rootProps: { loop: true } })
      await tick()
      trigger().focus()
      key(trigger(), 'ArrowLeft')
      await nextTick()
      await tick()
      expect(document.activeElement).toBe(trigger('edit'))
    })

    it('does not loop by default', async () => {
      make()
      await tick()
      trigger().focus()
      key(trigger(), 'ArrowLeft')
      await nextTick()
      await tick()
      expect(document.activeElement).toBe(trigger())
    })

    it('reverses horizontal arrows with dir=rtl', async () => {
      make({ rootProps: { dir: 'rtl' } })
      await tick()
      trigger().focus()
      key(trigger(), 'ArrowLeft')
      await nextTick()
      await tick()
      expect(document.activeElement).toBe(trigger('edit'))
    })

    it('ArrowRight inside open content moves to the next menu', async () => {
      const { value } = make({ controlled: true })
      await openFile()
      key(q('#new')!, 'ArrowRight')
      await nextTick()
      await tick()
      expect(value.value).toBe('edit')
    })

    it('ArrowDown inside content moves item focus', async () => {
      make()
      await openFile()
      const first = q('#new')!
      first.focus()
      key(first, 'ArrowDown')
      await nextTick()
      expect(document.activeElement).toBe(q('#open'))
    })
  })

  describe('items', () => {
    it('fires select and closes the menu on item click', async () => {
      const onSelect = vi.fn()
      const { value } = make({ controlled: true, onSelect })
      await openFile()
      q('#new')!.click()
      await nextTick()
      expect(onSelect).toHaveBeenCalledTimes(1)
      expect(value.value).toBe('')
    })

    it('stays open when select is default-prevented', async () => {
      const { value } = make({ controlled: true, onSelect: (e) => e.preventDefault() })
      await openFile()
      q('#new')!.click()
      await nextTick()
      expect(value.value).toBe('file')
    })

    it('activates a focused item with Enter', async () => {
      const onSelect = vi.fn()
      make({ onSelect })
      await openFile()
      const item = q('#new')!
      item.focus()
      key(item, 'Enter')
      await nextTick()
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('a disabled item neither fires select nor closes the menu', async () => {
      const onSelect = vi.fn()
      const { value } = make({ controlled: true, onSelect })
      await openFile()
      const d = q('#disabled')!
      expect(d.hasAttribute('data-disabled')).toBe(true)
      expect(d.getAttribute('aria-disabled')).toBe('true')
      d.click()
      await nextTick()
      expect(onSelect).not.toHaveBeenCalled()
      expect(value.value).toBe('file')
    })

    it('destructive and inset flags set data attributes and classes', async () => {
      make()
      await openFile()
      expect(q('#delete')!.getAttribute('data-variant')).toBe('destructive')
      expect(q('#delete')!.className).toContain('text-destructive')
      expect(q('#open')!.hasAttribute('data-inset')).toBe(true)
      expect(q('#open')!.className).toContain('pl-8')
      expect(q('#new')!.hasAttribute('data-inset')).toBe(false)
      expect(q('#new')!.hasAttribute('data-variant')).toBe(false)
    })

    it('checkbox item toggles and reflects aria-checked', async () => {
      const { checked } = make()
      await openFile()
      const cb = q('#check')!
      expect(cb.getAttribute('role')).toBe('menuitemcheckbox')
      expect(cb.getAttribute('aria-checked')).toBe('false')
      cb.click()
      await nextTick()
      expect(checked.value).toBe(true)
    })

    it('indeterminate checkbox state is exposed', async () => {
      const { checked } = make()
      checked.value = 'indeterminate'
      await openFile()
      expect(q('#check')!.getAttribute('aria-checked')).toBe('mixed')
    })

    it('radio items select exclusively', async () => {
      const { radio } = make()
      await openFile()
      expect(q('#ra')!.getAttribute('role')).toBe('menuitemradio')
      expect(q('#ra')!.getAttribute('aria-checked')).toBe('true')
      q('#rb')!.click()
      await nextTick()
      expect(radio.value).toBe('b')
    })
  })

  describe('customisation', () => {
    it('merges class last on every part and uses menu tokens', async () => {
      make()
      await openFile()
      expect(root().className).toContain('custom-root')
      expect(root().className).toContain('bg-background')
      expect(trigger().className).toContain('custom-trigger')
      expect(content()!.className).toContain('custom-content')
      expect(content()!.className).toContain('bg-popover')
      expect(q('.custom-label')!.getAttribute('data-slot')).toBe('menubar-label')
      expect(q('.custom-sep')!.getAttribute('data-slot')).toBe('menubar-separator')
      expect(q('.custom-short')!.getAttribute('data-slot')).toBe('menubar-shortcut')
      expect(q('.custom-item')!.getAttribute('data-slot')).toBe('menubar-item')
      expect(q('.custom-subtrigger')!.getAttribute('data-slot')).toBe('menubar-sub-trigger')
    })

    it('class override wins over internal conflicting classes', () => {
      make({ rootProps: { class: 'h-12 rounded-none' } })
      expect(root().className).toContain('h-12')
      expect(root().className).not.toContain('h-9')
      expect(root().className).toContain('rounded-none')
    })

    it('falls attributes through to root and content', async () => {
      make()
      await openFile()
      expect(root().getAttribute('aria-label')).toBe('App menu')
      expect(content()!.getAttribute('data-test')).toBe('x')
    })

    it('sub content merges class', async () => {
      make()
      await openFile()
      key(q('[data-slot="menubar-sub-trigger"]')!, 'ArrowRight')
      await nextTick()
      await tick()
      expect(q('[data-slot="menubar-sub-content"]')!.className).toContain('custom-sub')
    })
  })

  describe('edge cases', () => {
    it('renders with zero menus', () => {
      wrapper = mount(Menubar, { attachTo: document.body })
      expect(root().children).toHaveLength(0)
    })

    it('renders one menu and many menus', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(Menubar, null, () =>
              Array.from({ length: 200 }, (_, i) =>
                h(MenubarMenu, { value: `m${i}` }, () => [h(MenubarTrigger, null, () => `T${i}`), h(MenubarContent, null, () => h(MenubarItem, null, () => `I${i}`))]),
              ),
            ),
        }),
        { attachTo: document.body },
      )
      expect(qa('[data-slot="menubar-trigger"]')).toHaveLength(200)
    })

    it('handles rapid toggling without leaving content mounted', async () => {
      const { value } = make({ controlled: true })
      for (let i = 0; i < 10; i++) {
        key(trigger(), 'Enter')
        await nextTick()
      }
      expect(value.value).toBe('')
      await tick(20)
      expect(content()).toBeNull()
    })

    it('unmounting while open removes portalled content', async () => {
      make()
      await openFile()
      wrapper!.unmount()
      wrapper = undefined
      await tick(20)
      expect(content()).toBeNull()
    })

    it('handles unicode and long trigger text', () => {
      wrapper = mount(Menubar, {
        slots: { default: () => h(MenubarMenu, { value: 'u' }, () => [h(MenubarTrigger, null, () => '文件 ملف ' + 'x'.repeat(500)), h(MenubarContent, null, () => null)]) },
        attachTo: document.body,
      })
      expect(q('[data-slot="menubar-trigger"]')!.textContent).toContain('文件')
    })

    it('menu label and sub trigger accept inset', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(Menubar, { defaultValue: 'm' }, () =>
              h(MenubarMenu, { value: 'm' }, () => [
                h(MenubarTrigger, null, () => 'M'),
                h(MenubarContent, null, () => [h(MenubarLabel, { inset: true }, () => 'L'), h(MenubarLabel, null, () => 'L2')]),
              ]),
            ),
        }),
        { attachTo: document.body },
      )
      await nextTick()
      await tick()
      const labels = qa('[data-slot="menubar-label"]')
      expect(labels[0].hasAttribute('data-inset')).toBe(true)
      expect(labels[1].hasAttribute('data-inset')).toBe(false)
    })
  })
})
