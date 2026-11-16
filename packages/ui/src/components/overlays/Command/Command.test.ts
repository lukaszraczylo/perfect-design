import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  matchesSearch,
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
const input = () => q('[data-slot="command-input"]') as HTMLInputElement
const labels = () => qa('[data-slot="command-item"]').map((i) => i.textContent?.trim())
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
async function type(text: string) {
  input().value = text
  input().dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
  await tick()
}
const highlighted = () => qa('[data-slot="command-item"][data-highlighted]').map((i) => i.textContent?.trim())

interface Opts {
  rootProps?: Record<string, unknown>
  onSelect?: (v: string) => void
  items?: string[]
}

function make(opts: Opts = {}) {
  const search = ref('')
  const model = ref<string | undefined>(undefined)
  const items = ref(opts.items ?? ['Calendar', 'Search Emoji', 'Calculator'])
  const Comp = defineComponent({
    setup: () => () =>
      h(
        Command,
        {
          class: 'custom-root',
          search: search.value,
          'onUpdate:search': (v: string) => (search.value = v),
          modelValue: model.value,
          'onUpdate:modelValue': (v: unknown) => (model.value = v as string),
          ...(opts.rootProps ?? {}),
        },
        () => [
          h(CommandInput, { placeholder: 'Type a command', class: 'custom-input' }),
          h(CommandList, { class: 'custom-list' }, () => [
            h(CommandEmpty, { class: 'custom-empty' }, () => 'Nothing found.'),
            h(CommandGroup, { heading: 'Suggestions', class: 'custom-group' }, () =>
              items.value.map((i) => h(CommandItem, { key: i, value: i, onSelect: () => opts.onSelect?.(i) }, () => i)),
            ),
            h(CommandSeparator, { class: 'custom-sep' }),
            h(CommandGroup, { heading: 'Settings' }, () => [
              h(CommandItem, { value: 'profile', keywords: ['account', 'user'] }, () => ['Profile', h(CommandShortcut, { class: 'custom-short' }, () => '⌘P')]),
              h(CommandItem, { value: 'billing', disabled: true }, () => 'Billing'),
            ]),
          ]),
        ],
      ),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { search, model, items }
}

describe('matchesSearch', () => {
  it.each([
    ['Calendar', '', true],
    ['Calendar', '   ', true],
    ['Calendar', 'cal', true],
    ['Calendar', 'CAL', true],
    ['Calendar', 'x', false],
    ['search emoji', 'emoji search', true],
    ['search emoji', 'emoji nope', false],
    ['你好 мир', '好', true],
    ['', 'a', false],
  ])('matchesSearch(%j, %j) = %s', (h, s, expected) => expect(matchesSearch(h, s)).toBe(expected))
})

describe('Command', () => {
  describe('rendering', () => {
    it('renders every item, the input and the group headings when search is empty', async () => {
      make()
      await nextTick()
      expect(labels()).toEqual(['Calendar', 'Search Emoji', 'Calculator', 'Profile⌘P', 'Billing'])
      expect(q('[data-slot="command"]')).not.toBeNull()
      expect(input().placeholder).toBe('Type a command')
      expect(qa('[data-slot="command-group-heading"]').map((h) => h.textContent?.trim())).toEqual(['Suggestions', 'Settings'])
    })

    it('uses listbox / option roles', async () => {
      make()
      await nextTick()
      expect(q('[role="listbox"]')).not.toBeNull()
      expect(qa('[role="option"]')).toHaveLength(5)
      expect(qa('[data-slot="command-group"]').every((g) => g.getAttribute('role') === 'group')).toBe(true)
    })

    it('hides the empty state while there are results', async () => {
      make()
      await nextTick()
      expect(q('[data-slot="command-empty"]')).toBeNull()
    })

    it('renders the shortcut part', async () => {
      make()
      await nextTick()
      const s = q('[data-slot="command-shortcut"]')!
      expect(s.textContent).toBe('⌘P')
      expect(s.className).toContain('custom-short')
    })
  })

  describe('filtering', () => {
    it('filters items as the user types (case-insensitive)', async () => {
      make()
      await type('CAL')
      expect(labels()).toEqual(['Calendar', 'Calculator'])
    })

    it('requires every search word to match', async () => {
      make()
      await type('search emo')
      expect(labels()).toEqual(['Search Emoji'])
    })

    it('matches against keywords', async () => {
      make()
      await type('account')
      expect(labels()[0]).toContain('Profile')
      expect(labels()).toHaveLength(1)
    })

    it('restores all items when the search is cleared', async () => {
      make()
      await type('cal')
      await type('')
      expect(labels()).toHaveLength(5)
    })

    it('hides groups without matches but keeps their items registered', async () => {
      make()
      await type('cal')
      const [g1, g2] = qa('[data-slot="command-group"]')
      expect(g1.style.display).not.toBe('none')
      expect(g2.style.display).toBe('none')
      await type('')
      expect(qa('[data-slot="command-group"]')[1].style.display).not.toBe('none')
    })

    it('hides the separator while filtering', async () => {
      make()
      expect(q('[data-slot="command-separator"]')).not.toBeNull()
      await type('cal')
      expect(q('[data-slot="command-separator"]')).toBeNull()
    })

    it('shows the empty state when nothing matches', async () => {
      make()
      await type('zzz')
      expect(labels()).toEqual([])
      const e = q('[data-slot="command-empty"]')!
      expect(e.textContent).toBe('Nothing found.')
      expect(e.className).toContain('custom-empty')
      // A status role is not allowed inside a listbox: the announcement lives in the Command's own status region.
      expect(e.getAttribute('role')).toBeNull()
      expect(q('[data-slot="command-status"]')!.textContent).toBe('No results found.')
    })

    it('names the listbox and the input, keeps separators out of the accessibility tree and reports the result count', async () => {
      make()
      expect(q('[role="listbox"]')!.getAttribute('aria-label')).toBe('Results')
      expect(q('[data-slot="command-input"]')!.getAttribute('aria-label')).toBe('Search')
      const sep = q('[data-slot="command-separator"]')
      if (sep) {
        expect(sep.getAttribute('role')).toBe('presentation')
        expect(sep.getAttribute('aria-hidden')).toBe('true')
      }
      expect(q('[data-slot="command-status"]')!.getAttribute('role')).toBe('status')
      await type('a')
      expect(q('[data-slot="command-status"]')!.textContent).toMatch(/^\d+ results? available$/)
    })

    it('default empty text is provided', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () => h(Command, null, () => [h(CommandInput), h(CommandList, null, () => [h(CommandEmpty), h(CommandItem, { value: 'a' }, () => 'A')])]),
        }),
        { attachTo: document.body },
      )
      await type('zzz')
      expect(q('[data-slot="command-empty"]')!.textContent).toBe('No results found.')
    })

    it('shouldFilter=false disables built-in filtering', async () => {
      make({ rootProps: { shouldFilter: false } })
      await type('zzz')
      expect(labels()).toHaveLength(5)
      expect(q('[data-slot="command-empty"]')).toBeNull()
      expect(q('[data-slot="command-separator"]')).not.toBeNull()
    })

    it('updates the empty state when items are removed or added', async () => {
      const { items } = make({ items: ['One'] })
      await type('on')
      expect(labels()).toEqual(['One'])
      items.value = []
      await nextTick()
      await tick()
      expect(labels()).toEqual([])
      expect(q('[data-slot="command-empty"]')).not.toBeNull()
      items.value = ['Onion']
      await nextTick()
      await tick()
      expect(labels()).toEqual(['Onion'])
      expect(q('[data-slot="command-empty"]')).toBeNull()
    })

    it('treats regex characters in the search literally', async () => {
      make()
      await type('(.*')
      expect(labels()).toEqual([])
    })

    it('items with non-primitive values match only through keywords', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(Command, null, () => [
              h(CommandInput),
              h(CommandList, null, () => [h(CommandItem, { value: { id: 1 }, keywords: ['obj'] }, () => 'Object item')]),
            ]),
        }),
        { attachTo: document.body },
      )
      await type('obj')
      expect(labels()).toEqual(['Object item'])
      await type('Object')
      expect(labels()).toEqual([])
    })
  })

  describe('v-model:search', () => {
    it('reflects typing in the bound ref', async () => {
      const { search } = make()
      await type('cal')
      expect(search.value).toBe('cal')
    })

    it('programmatic search value updates input and results', async () => {
      const { search } = make()
      search.value = 'emoji'
      await nextTick()
      await tick()
      expect(input().value).toBe('emoji')
      expect(labels()).toEqual(['Search Emoji'])
    })
  })

  describe('keyboard navigation and selection', () => {
    it('ArrowDown / ArrowUp move the highlight through enabled items', async () => {
      make()
      await nextTick()
      input().focus()
      key(input(), 'ArrowDown')
      await nextTick()
      expect(highlighted()).toEqual(['Calendar'])
      key(input(), 'ArrowDown')
      await nextTick()
      expect(highlighted()).toEqual(['Search Emoji'])
      key(input(), 'ArrowUp')
      await nextTick()
      expect(highlighted()).toEqual(['Calendar'])
    })

    it('wraps around (loop) and skips disabled items', async () => {
      make()
      await nextTick()
      input().focus()
      key(input(), 'ArrowDown')
      await nextTick()
      expect(highlighted()).toEqual(['Calendar'])
      key(input(), 'ArrowUp')
      await nextTick()
      // wraps from the first item to the last enabled one (Billing is disabled)
      expect(highlighted()[0]).toContain('Profile')
      key(input(), 'ArrowDown')
      await nextTick()
      expect(highlighted()).toEqual(['Calendar'])
    })

    it('Enter selects the highlighted item: item select event + model update', async () => {
      const onSelect = vi.fn()
      const { model } = make({ onSelect })
      await nextTick()
      input().focus()
      key(input(), 'ArrowDown')
      await nextTick()
      key(input(), 'ArrowDown')
      await nextTick()
      key(input(), 'Enter')
      await nextTick()
      expect(onSelect).toHaveBeenCalledWith('Search Emoji')
      expect(model.value).toBe('Search Emoji')
    })

    it('highlights the first match after typing so Enter runs it', async () => {
      const onSelect = vi.fn()
      make({ onSelect })
      await type('calc')
      expect(highlighted()).toEqual(['Calculator'])
      key(input(), 'Enter')
      await nextTick()
      expect(onSelect).toHaveBeenCalledWith('Calculator')
    })

    it('clicking an item selects it', async () => {
      const onSelect = vi.fn()
      make({ onSelect })
      await nextTick()
      qa('[data-slot="command-item"]')[1].click()
      await nextTick()
      expect(onSelect).toHaveBeenCalledWith('Search Emoji')
    })

    it('disabled items cannot be selected', async () => {
      const { model } = make()
      await nextTick()
      const billing = qa('[data-slot="command-item"]')[4]
      expect(billing.hasAttribute('data-disabled')).toBe(true)
      billing.click()
      await nextTick()
      expect(model.value).toBeUndefined()
    })

    it('Enter with no match does nothing', async () => {
      const onSelect = vi.fn()
      make({ onSelect })
      await type('zzz')
      key(input(), 'Enter')
      await nextTick()
      expect(onSelect).not.toHaveBeenCalled()
    })

    it('exposes highlightFirstItem', async () => {
      wrapper = mount(Command, {
        slots: { default: () => [h(CommandInput), h(CommandList, null, () => h(CommandItem, { value: 'a' }, () => 'A'))] },
        attachTo: document.body,
      })
      await nextTick()
      ;(wrapper.vm as unknown as { highlightFirstItem: () => void }).highlightFirstItem()
      await nextTick()
      await tick()
      expect(highlighted()).toEqual(['A'])
    })
  })

  describe('customisation', () => {
    it('merges classes on every part and keeps data-slots', async () => {
      make()
      await nextTick()
      expect(q('[data-slot="command"]')!.className).toContain('custom-root')
      expect(q('[data-slot="command"]')!.className).toContain('bg-popover')
      expect(q('[data-slot="command-input"]')!.className).toContain('custom-input')
      expect(q('[data-slot="command-list"]')!.className).toContain('custom-list')
      expect(q('[data-slot="command-group"]')!.className).toContain('custom-group')
      expect(q('[data-slot="command-separator"]')!.className).toContain('custom-sep')
    })

    it('class override replaces conflicting defaults', async () => {
      wrapper = mount(Command, { props: { class: 'bg-red-500' }, attachTo: document.body })
      await nextTick()
      const c = q('[data-slot="command"]')!.className
      expect(c).toContain('bg-red-500')
      expect(c).not.toContain('bg-popover')
    })

    it('forwards input attributes (placeholder, aria-label, disabled)', async () => {
      wrapper = mount(Command, {
        slots: { default: () => h(CommandInput, { placeholder: 'Find', 'aria-label': 'Find command', disabled: true }) },
        attachTo: document.body,
      })
      await nextTick()
      expect(input().placeholder).toBe('Find')
      expect(input().getAttribute('aria-label')).toBe('Find command')
      expect(input().disabled).toBe(true)
    })

    it('items accept custom classes', async () => {
      wrapper = mount(Command, {
        slots: { default: () => h(CommandList, null, () => h(CommandItem, { value: 'x', class: 'custom-item' }, () => 'X')) },
        attachTo: document.body,
      })
      await nextTick()
      expect(q('[data-slot="command-item"]')!.className).toContain('custom-item')
    })
  })

  describe('edge cases', () => {
    it('renders with no children at all', async () => {
      wrapper = mount(Command, { attachTo: document.body })
      await nextTick()
      expect(q('[data-slot="command"]')).not.toBeNull()
    })

    it('handles unicode and emoji items', async () => {
      make({ items: ['東京 🗼', 'مرحبا'] })
      await type('🗼')
      expect(labels()).toEqual(['東京 🗼'])
      await type('مر')
      expect(labels()).toEqual(['مرحبا'])
    })

    it('handles a very long list quickly', async () => {
      const items = Array.from({ length: 300 }, (_, i) => `Item ${i}`)
      make({ items })
      await type('item 29')
      expect(labels()).toHaveLength(13) // 29, 129, 229, 290-299
    })

    it('removes everything on unmount', async () => {
      make()
      await nextTick()
      wrapper!.unmount()
      wrapper = undefined
      expect(q('[data-slot="command"]')).toBeNull()
    })
  })
})

describe('CommandDialog', () => {
  function makeDialog(props: Record<string, unknown> = {}) {
    const open = ref(props.open === undefined ? false : (props.open as boolean))
    const search = ref('')
    const onSelect = vi.fn()
    const Comp = defineComponent({
      setup: () => () =>
        h(
          CommandDialog,
          { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v), search: search.value, 'onUpdate:search': (v: string) => (search.value = v), ...props },
          () => [
            h(CommandInput, { placeholder: 'Jump to...' }),
            h(CommandList, null, () => [
              h(CommandEmpty, null, () => 'No match'),
              h(CommandGroup, { heading: 'Pages' }, () => [
                h(CommandItem, { value: 'home', onSelect: () => onSelect('home') }, () => 'Home'),
                h(CommandItem, { value: 'settings', onSelect: () => onSelect('settings') }, () => 'Settings'),
              ]),
            ]),
          ],
        ),
    })
    wrapper = mount(Comp, { attachTo: document.body })
    return { open, search, onSelect }
  }

  it('renders nothing while closed', () => {
    makeDialog()
    expect(q('[data-slot="command-input"]')).toBeNull()
    expect(q('[role="dialog"]')).toBeNull()
  })

  it('opens as a labelled dialog with sr-only title and description and no X', async () => {
    makeDialog({ open: true, title: 'Search pages', description: 'Jump anywhere' })
    await nextTick()
    const dlg = q('[role="dialog"]')!
    expect(dlg).not.toBeNull()
    const title = q('[data-slot="dialog-title"]')!
    expect(title.textContent).toBe('Search pages')
    expect(title.className).toContain('sr-only')
    expect(dlg.getAttribute('aria-labelledby')).toBe(title.id)
    expect(q('[data-slot="dialog-description"]')!.textContent).toBe('Jump anywhere')
    expect(q('[data-slot="dialog-close-x"]')).toBeNull()
  })

  it('has default title and description', async () => {
    makeDialog({ open: true })
    await nextTick()
    expect(q('[data-slot="dialog-title"]')!.textContent).toBe('Command palette')
    expect(q('[data-slot="dialog-description"]')!.textContent).toContain('Enter')
  })

  it('filters and selects inside the dialog', async () => {
    const { search, onSelect } = makeDialog({ open: true })
    await nextTick()
    await tick()
    await type('set')
    expect(search.value).toBe('set')
    expect(labels()).toEqual(['Settings'])
    key(input(), 'Enter')
    await nextTick()
    expect(onSelect).toHaveBeenCalledWith('settings')
  })

  it('shows the empty state', async () => {
    makeDialog({ open: true })
    await nextTick()
    await type('zzz')
    expect(q('[data-slot="command-empty"]')!.textContent).toBe('No match')
  })

  it('closes on Escape and reports update:open', async () => {
    const { open } = makeDialog({ open: true })
    await nextTick()
    q('[role="dialog"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('opens when the controlled state flips', async () => {
    const { open } = makeDialog()
    open.value = true
    await nextTick()
    expect(q('[data-slot="command-input"]')).not.toBeNull()
  })

  it('shouldFilter=false is forwarded', async () => {
    makeDialog({ open: true, shouldFilter: false })
    await nextTick()
    await type('zzz')
    expect(labels()).toHaveLength(2)
  })

  it('merges a class onto the dialog panel', async () => {
    makeDialog({ open: true, class: 'sm:max-w-3xl' })
    await nextTick()
    const c = q('[data-slot="dialog-content"]')!.className
    expect(c).toContain('sm:max-w-3xl')
    expect(c).not.toContain('sm:max-w-xl')
  })

  it('resets the search text when the dialog closes (v-model:search stays in sync)', async () => {
    const { open, search } = makeDialog()
    open.value = true
    await nextTick()
    await tick()
    await type('set')
    expect(search.value).toBe('set')
    open.value = false
    await nextTick()
    await tick()
    expect(search.value).toBe('')
    open.value = true
    await nextTick()
    await tick()
    expect(input().value).toBe('')
    expect(labels()).toHaveLength(2)
  })

  it('resets the search text when the dialog closes itself on Escape', async () => {
    const { search } = makeDialog({ open: true })
    await nextTick()
    await type('set')
    q('[role="dialog"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    await tick()
    expect(search.value).toBe('')
  })

  it('forwards fallthrough attrs to the dialog panel', async () => {
    makeDialog({ open: true, 'data-testid': 'palette', 'aria-label': 'Palette' })
    await nextTick()
    const panel = q('[data-slot="dialog-content"]')!
    expect(panel.getAttribute('data-testid')).toBe('palette')
  })

  it('removes the portalled dialog when unmounted while open', async () => {
    makeDialog({ open: true })
    await nextTick()
    wrapper!.unmount()
    wrapper = undefined
    expect(q('[role="dialog"]')).toBeNull()
  })
})
