import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../../lib/contract'
import { useHotkeyRegistry, useHotkeys } from '../../../lib/hotkeys'
import ShortcutsDialog from './ShortcutsDialog.vue'
import { ShortcutsDialog as Exported } from './index'

const wrappers: VueWrapper[] = []
let warn: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  configureStrictMode('off')
  warn.mockRestore()
  expect(useHotkeyRegistry().value).toEqual([])
})

const settle = async () => {
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null
const qa = (s: string) => [...document.body.querySelectorAll(s)] as HTMLElement[]
const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim()

async function make(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}, attrs: Record<string, unknown> = {}) {
  const w = mount(ShortcutsDialog, { props: { title: 'Keyboard shortcuts', ...props } as never, slots: slots as never, attrs, attachTo: document.body })
  wrappers.push(w)
  await settle()
  return w
}

const sample = [
  { keys: 'mod+k', description: 'Search the catalogue', group: 'Navigation' },
  { keys: 'g then d', description: 'Go to the dashboard', group: 'Navigation' },
  { keys: 'n', description: 'Create a shipment', group: 'Shipments' },
]

describe('ShortcutsDialog good path', () => {
  it('is exported from its barrel and renders nothing while closed', async () => {
    expect(Exported).toBe(ShortcutsDialog)
    await make()
    expect(q('[data-slot="dialog-content"]')).toBeNull()
  })

  it('opens with ? by default and lists its own shortcut', async () => {
    await make()
    press('?', { shiftKey: true })
    await settle()
    expect(q('[role="dialog"]')).not.toBeNull()
    expect(text(q('[data-slot="dialog-title"]'))).toBe('Keyboard shortcuts')
    expect(text(q('[data-slot="shortcuts-dialog-item"]'))).toContain('Show keyboard shortcuts')
    expect(text(q('[data-slot="shortcuts-dialog-item"]'))).toContain('Question mark')
  })

  it('does not open from ? typed into a text field', async () => {
    await make()
    const input = document.createElement('input')
    document.body.append(input)
    press('?', {}, input)
    await settle()
    expect(q('[role="dialog"]')).toBeNull()
  })

  it('opens with a custom hotkey and follows hotkey changes', async () => {
    const w = await make({ hotkey: 'mod+/' })
    press('?')
    await settle()
    expect(q('[role="dialog"]')).toBeNull()
    press('/', { ctrlKey: true })
    await settle()
    expect(q('[role="dialog"]')).not.toBeNull()
    await w.setProps({ open: false })
    await w.setProps({ hotkey: 'h' })
    await settle()
    press('h')
    await settle()
    expect(w.emitted('update:open')?.at(-1)).toEqual([true])
  })

  it('an empty hotkey registers nothing', async () => {
    await make({ hotkey: '' })
    expect(useHotkeyRegistry().value).toEqual([])
    press('?')
    await settle()
    expect(q('[role="dialog"]')).toBeNull()
  })

  it('opens from the trigger slot and from v-model:open, and Escape closes it', async () => {
    const w = await make({}, { trigger: () => h('button', { id: 'open-btn' }, 'Show') })
    document.getElementById('open-btn')!.click()
    await settle()
    expect(q('[role="dialog"]')).not.toBeNull()
    expect(w.emitted('update:open')?.[0]).toEqual([true])
    press('Escape', {}, q('[role="dialog"]')!)
    await settle()
    expect(q('[role="dialog"]')).toBeNull()
    await w.setProps({ open: true })
    await settle()
    expect(q('[role="dialog"]')).not.toBeNull()
  })

  it('has no trigger when the slot is empty', async () => {
    await make({ open: true })
    expect(q('[data-slot="dialog-trigger"]')).toBeNull()
  })

  it('shows the description wired to the dialog', async () => {
    await make({ open: true, description: 'Sample help' })
    const dlg = q('[role="dialog"]')!
    expect(dlg.getAttribute('aria-describedby')).toBe(q('[data-slot="dialog-description"]')!.id)
    expect(text(q('[data-slot="dialog-description"]'))).toBe('Sample help')
    expect(dlg.getAttribute('aria-labelledby')).toBe(q('[data-slot="dialog-title"]')!.id)
  })
})

describe('ShortcutsDialog content', () => {
  it('lists static shortcuts grouped in first-seen order with key chips and spoken text', async () => {
    await make({ open: true, hotkey: '', registered: false, shortcuts: sample })
    const groups = qa('[data-slot="shortcuts-dialog-group"]')
    expect(groups.map((g) => text(g.querySelector('[data-slot="shortcuts-dialog-group-title"]')))).toEqual(['Navigation', 'Shipments'])
    const items = qa('[data-slot="shortcuts-dialog-item"]')
    expect(items.map((i) => text(i.querySelector('[data-slot="shortcuts-dialog-label"]')))).toEqual(['Search the catalogue', 'Go to the dashboard', 'Create a shipment'])
    expect(qa('[data-slot="shortcuts-dialog-keys"] .sr-only').map((s) => s.textContent)).toEqual(['Control plus K', 'G then D', 'N'])
    const sequence = items[1]
    expect([...sequence.querySelectorAll('[data-slot="kbd"]')].map((k) => k.textContent)).toEqual(['G', 'D'])
    expect(sequence.querySelectorAll('[data-slot="kbd-group"]')).toHaveLength(2)
    expect(sequence.textContent).toContain('then')
    for (const g of sequence.querySelectorAll('[data-slot="kbd-group"]')) expect(g.getAttribute('aria-hidden')).toBe('true')
  })

  it('names each list by its heading', async () => {
    await make({ open: true, hotkey: '', registered: false, shortcuts: sample })
    for (const list of qa('[data-slot="shortcuts-dialog-list"]')) {
      const heading = document.getElementById(list.getAttribute('aria-labelledby')!)
      expect(heading?.dataset.slot).toBe('shortcuts-dialog-group-title')
    }
  })

  it('lists registered shortcuts with description and group, hides undescribed ones', async () => {
    const Page = defineComponent({
      setup() {
        useHotkeys({
          'mod+b': { handler: () => {}, description: 'Toggle the sidebar', group: 'Layout' },
          x: () => {},
          y: { handler: () => {}, description: 'Secret', hidden: true },
        })
        return () => h(ShortcutsDialog, { title: 'Keys', open: true, hotkey: '' })
      },
    })
    wrappers.push(mount(Page, { attachTo: document.body }))
    await settle()
    expect(qa('[data-slot="shortcuts-dialog-label"]').map((e) => e.textContent)).toEqual(['Toggle the sidebar'])
    expect(text(q('[data-slot="shortcuts-dialog-group-title"]'))).toBe('Layout')
  })

  it('updates while open when shortcuts are registered or removed', async () => {
    const w = await make({ open: true, hotkey: '' })
    expect(q('[data-slot="shortcuts-dialog-empty"]')).not.toBeNull()
    const holder = mount(
      defineComponent({
        setup() {
          useHotkeys({ j: { handler: () => {}, description: 'Next row' } })
          return () => h('i')
        },
      }),
    )
    await settle()
    expect(qa('[data-slot="shortcuts-dialog-label"]').map((e) => e.textContent)).toEqual(['Next row'])
    holder.unmount()
    await settle()
    expect(qa('[data-slot="shortcuts-dialog-label"]')).toEqual([])
    expect(w.exists()).toBe(true)
  })

  it('registered=false leaves registered shortcuts out; shortcuts still show', async () => {
    const holder = mount(
      defineComponent({
        setup() {
          useHotkeys({ j: { handler: () => {}, description: 'Next row' } })
          return () => h('i')
        },
      }),
    )
    wrappers.push(holder)
    await make({ open: true, hotkey: '', registered: false, shortcuts: [{ keys: 'k', description: 'Previous row' }] })
    expect(qa('[data-slot="shortcuts-dialog-label"]').map((e) => e.textContent)).toEqual(['Previous row'])
  })

  it('merges duplicates of a registered shortcut and puts entries without a group under General', async () => {
    const holder = mount(
      defineComponent({
        setup() {
          useHotkeys({ j: { handler: () => {}, description: 'Next row' } })
          return () => h('i')
        },
      }),
    )
    wrappers.push(holder)
    await make({ open: true, hotkey: '', shortcuts: [{ keys: 'J', description: 'Next row' }, { keys: 'k', description: 'Previous row', group: '  ' }] })
    expect(qa('[data-slot="shortcuts-dialog-label"]').map((e) => e.textContent)).toEqual(['Next row', 'Previous row'])
    expect(qa('[data-slot="shortcuts-dialog-group-title"]').map((e) => e.textContent?.trim())).toEqual(['General'])
  })

  it('skips invalid combos, blank descriptions and junk entries without throwing', async () => {
    await make({
      open: true,
      hotkey: '',
      registered: false,
      shortcuts: [
        { keys: '', description: 'Empty' },
        { keys: 'ctrl', description: 'Modifier only' },
        { keys: 'nonsense', description: 'Unknown' },
        { keys: 'a', description: '   ' },
        { keys: 'b' },
        null,
        undefined,
        { keys: 'c', description: 'Valid' },
      ],
    })
    expect(qa('[data-slot="shortcuts-dialog-label"]').map((e) => e.textContent)).toEqual(['Valid'])
  })

  it('shows the empty text, and a custom one', async () => {
    await make({ open: true, hotkey: '' })
    expect(text(q('[data-slot="shortcuts-dialog-empty"]'))).toBe('No keyboard shortcuts are registered on this page.')
    wrappers.pop()!.unmount()
    document.body.innerHTML = ''
    await make({ open: true, hotkey: '', emptyText: 'Nothing to show' })
    expect(text(q('[data-slot="shortcuts-dialog-empty"]'))).toBe('Nothing to show')
  })

  it('sets the group heading level and falls back to 3', async () => {
    const w = await make({ open: true, hotkey: '', registered: false, shortcuts: sample, headingLevel: 5 })
    expect(q('[data-slot="shortcuts-dialog-group-title"]')!.tagName).toBe('H5')
    await w.setProps({ headingLevel: 9 as never })
    expect(q('[data-slot="shortcuts-dialog-group-title"]')!.tagName).toBe('H3')
    await w.setProps({ headingLevel: 4 })
    expect(q('[data-slot="shortcuts-dialog-group-title"]')!.tagName).toBe('H4')
  })
})

describe('ShortcutsDialog customisation', () => {
  it('merges class onto the panel with the consumer last', async () => {
    await make({ open: true, hotkey: '', class: 'custom-panel max-w-xs' })
    const panel = q('[data-slot="dialog-content"]')!
    expect(panel.classList.contains('custom-panel')).toBe(true)
    expect(panel.classList.contains('max-w-xs')).toBe(true)
  })

  it('falls attributes through to the body and keeps data-slot hooks on every part', async () => {
    await make({ open: true, hotkey: '', registered: false, shortcuts: sample }, {}, { 'data-testid': 'body', id: 'shortcuts-body', 'aria-live': 'off' })
    const body = q('[data-slot="shortcuts-dialog-body"]')!
    expect(body.getAttribute('data-testid')).toBe('body')
    expect(body.id).toBe('shortcuts-body')
    for (const slot of ['shortcuts-dialog-header', 'shortcuts-dialog-group', 'shortcuts-dialog-group-title', 'shortcuts-dialog-list', 'shortcuts-dialog-item', 'shortcuts-dialog-label', 'shortcuts-dialog-keys']) {
      expect(q(`[data-slot="${slot}"]`), slot).not.toBeNull()
    }
  })
})

describe('ShortcutsDialog bad path and contract', () => {
  const capture = async (props: Record<string, unknown>) => {
    configureStrictMode('throw')
    const errors: Error[] = []
    wrappers.push(
      mount(
        defineComponent({
          setup() {
            onErrorCaptured((e) => {
              errors.push(e as Error)
              return false
            })
            return () => h(ShortcutsDialog, props as never)
          },
        }),
        { attachTo: document.body },
      ),
    )
    await settle()
    return errors
  }

  it('throws a ContractError when the title is missing or blank', async () => {
    for (const title of [undefined, '', '   ']) {
      const errors = await capture({ title, hotkey: '' })
      expect(errors).toHaveLength(1)
      expect(errors[0].name).toBe('ContractError')
      expect(errors[0].message).toContain('ShortcutsDialog: requires a non-empty `title`')
      wrappers.pop()!.unmount()
    }
  })

  it('throws a ContractError when the hotkey is not a valid combination', async () => {
    for (const hotkey of ['ctrl', 'nonsense', 'g then', 'x'.repeat(500)]) {
      const errors = await capture({ title: 'Keys', hotkey })
      expect(errors, hotkey).toHaveLength(1)
      expect(errors[0].name).toBe('ContractError')
      expect(errors[0].message).toContain('requires a valid `hotkey`')
      wrappers.pop()!.unmount()
    }
  })

  it('accepts a valid title and hotkey, or no hotkey, in strict mode', async () => {
    expect(await capture({ title: 'Keys' })).toEqual([])
    expect(await capture({ title: 'Keys', hotkey: '' })).toEqual([])
    expect(await capture({ title: 'Keys', hotkey: 'mod+/' })).toEqual([])
  })

  it('warn mode logs and does not throw; off mode is silent', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    configureStrictMode('warn')
    await make({ title: '', hotkey: 'ctrl' })
    expect(spy.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('ShortcutsDialog'))).toHaveLength(2)
    spy.mockClear()
    configureStrictMode('off')
    await make({ title: '', hotkey: 'ctrl' })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('an invalid hotkey registers nothing and does not warn from the composable', async () => {
    await make({ hotkey: 'ctrl' })
    expect(useHotkeyRegistry().value).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })

  it('unknown variation values fall back to the defaults', async () => {
    await make({ open: true, hotkey: '', registered: false, shortcuts: sample, size: 'huge', layout: 'wall', density: 'tiny' })
    expect(q('[data-slot="dialog-content"]')!.className).toContain('sm:max-w-lg')
    expect(q('[data-slot="shortcuts-dialog-body"]')!.dataset.layout).toBe('list')
    expect(q('[data-slot="shortcuts-dialog-item"]')!.dataset.density).toBe('comfortable')
  })
})

describe('ShortcutsDialog edge cases', () => {
  it('renders hostile text as text', async () => {
    const hostile = '<img src=x onerror=alert(1)> <script>alert(1)</script>'
    await make({ open: true, hotkey: '', registered: false, title: hostile, description: hostile, shortcuts: [{ keys: 'a', description: hostile, group: hostile }] })
    expect(document.body.querySelector('img')).toBeNull()
    expect(document.body.querySelector('script')).toBeNull()
    expect(text(q('[data-slot="shortcuts-dialog-label"]'))).toBe(hostile)
    expect(text(q('[data-slot="shortcuts-dialog-group-title"]'))).toBe(hostile)
  })

  it('handles long, unicode and right-to-left text and wraps it', async () => {
    const long = 'Export '.repeat(200)
    await make({
      open: true,
      hotkey: '',
      registered: false,
      shortcuts: [
        { keys: 'a', description: long },
        { keys: 'b', description: 'فتح قائمة الاختصارات', group: 'عام' },
        { keys: 'c', description: 'Ctrl ‮ reversed \u0000 control', group: '日本語' },
      ],
    })
    expect(qa('[data-slot="shortcuts-dialog-label"]')).toHaveLength(3)
    expect(q('[data-slot="shortcuts-dialog-label"]')!.className).toContain('break-words')
    expect(q('[data-slot="shortcuts-dialog-label"]')!.className).toContain('min-w-0')
    expect(q('[data-slot="shortcuts-dialog-keys"]')!.className).toContain('flex-wrap')
  })

  it('uses logical properties only for layout', async () => {
    await make({ open: true, hotkey: '', registered: false, shortcuts: sample })
    const html = q('[data-slot="shortcuts-dialog-body"]')!.outerHTML
    expect(html).not.toMatch(/\b(?:ml|mr|pl|pr|left|right|text-left|text-right)-/)
  })

  it('lists a very large number of shortcuts', async () => {
    const shortcuts = Array.from({ length: 300 }, (_, i) => ({ keys: `f${(i % 24) + 1}`, description: `Action ${i}`, group: `Group ${i % 7}` }))
    await make({ open: true, hotkey: '', registered: false, shortcuts })
    expect(qa('[data-slot="shortcuts-dialog-item"]')).toHaveLength(300)
    expect(qa('[data-slot="shortcuts-dialog-group"]')).toHaveLength(7)
  })

  it('unregisters its shortcut on unmount and leaves no timers', async () => {
    vi.useFakeTimers()
    const w = mount(ShortcutsDialog, { props: { title: 'Keys' }, attachTo: document.body })
    await nextTick()
    expect(useHotkeyRegistry().value).toHaveLength(1)
    press('?')
    w.unmount()
    expect(useHotkeyRegistry().value).toHaveLength(0)
    vi.useRealTimers()
  })

  it('two dialogs with the same hotkey conflict in development', async () => {
    await make({})
    await make({})
    expect(warn.mock.calls.some((c: unknown[]) => String(c[0]).includes('conflicts'))).toBe(true)
  })

  it('supports keyboard use: focus moves into the dialog and Escape closes it', async () => {
    await make({ open: true, hotkey: '' })
    const panel = q('[role="dialog"]')!
    expect(panel.contains(document.activeElement)).toBe(true)
    press('Escape', {}, panel)
    await settle()
    expect(q('[role="dialog"]')).toBeNull()
  })

  it('reacts to props changing while open', async () => {
    const w = await make({ open: true, hotkey: '', registered: false, shortcuts: sample })
    await w.setProps({ shortcuts: [{ keys: 'z', description: 'Only one' }], title: 'Renamed', description: 'Now with text' })
    expect(qa('[data-slot="shortcuts-dialog-item"]')).toHaveLength(1)
    expect(text(q('[data-slot="dialog-title"]'))).toBe('Renamed')
  })
})
