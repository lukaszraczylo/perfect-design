import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { Toolbar, ToolbarButton, ToolbarLink, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem, toolbarVariants } from './index'
import { faCopy } from '../../../lib/icons'
import Icon from '../../primitives/Icon/Icon.vue'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const labels = ['One', 'Two', 'Three']

function build(rootProps: Record<string, unknown> = {}, children?: () => unknown[]) {
  wrapper = mount(
    defineComponent({
      setup: () => () =>
        h(Toolbar, { 'aria-label': 'Sample tools', ...rootProps }, () => children?.() ?? labels.map((l) => h(ToolbarButton, null, () => l))),
    }),
    { attachTo: document.body },
  )
  return wrapper
}

const root = () => document.body.querySelector('[data-slot="toolbar"]') as HTMLElement
const buttons = () => [...document.body.querySelectorAll<HTMLElement>('[data-slot="toolbar-button"]')]
const press = (el: Element, key: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
const tabbable = () => [...document.body.querySelectorAll<HTMLElement>('[data-slot="toolbar"] [tabindex]')].filter((e) => e.tabIndex === 0)

describe('Toolbar', () => {
  describe('good path', () => {
    it('renders role=toolbar with the name, data-slot and orientation', () => {
      build()
      expect(root().getAttribute('role')).toBe('toolbar')
      expect(root().getAttribute('aria-label')).toBe('Sample tools')
      expect(root().getAttribute('aria-orientation')).toBe('horizontal')
      expect(buttons().map((b) => b.textContent)).toEqual(labels)
    })

    it('vertical orientation sets aria-orientation and column layout', () => {
      build({ orientation: 'vertical' })
      expect(root().getAttribute('aria-orientation')).toBe('vertical')
      expect(root().className).toContain('flex-col')
    })

    it('exposes the resolved look as data attributes', () => {
      build({ variant: 'outline', size: 'lg', density: 'compact', gap: 'md', overflow: 'scroll' })
      expect(root().dataset).toMatchObject({ variant: 'outline', size: 'lg', density: 'compact', gap: 'md', overflow: 'scroll' })
    })

    it('default output equals the explicit defaults', () => {
      build()
      const a = root().className
      wrapper!.unmount()
      build({ variant: 'plain', size: 'md', density: 'default', orientation: 'horizontal', gap: 'sm', overflow: 'wrap', loop: true })
      expect(root().className).toBe(a)
      expect(a).toBe(toolbarVariants())
    })

    it('buttons render as type=button and emit click', async () => {
      let clicks = 0
      build({}, () => [h(ToolbarButton, { onClick: () => clicks++ }, () => 'Go')])
      expect(buttons()[0].getAttribute('type')).toBe('button')
      buttons()[0].click()
      expect(clicks).toBe(1)
    })

    it('parts follow the size, density and variant of the bar through context', () => {
      build({ size: 'lg', density: 'spacious', variant: 'filled' })
      expect(buttons()[0].className).toContain('h-11')
      expect(buttons()[0].className).toContain('px-3.5')
    })

    it('a part can override the size of the bar', () => {
      build({ size: 'lg' }, () => [h(ToolbarButton, { size: 'sm' }, () => 'Small')])
      expect(buttons()[0].className).toContain('h-8')
      expect(buttons()[0].className).not.toContain('h-11')
    })

    it('a primary button has the solid fill', () => {
      build({}, () => [h(ToolbarButton, { tone: 'primary' }, () => 'Save'), h(ToolbarButton, { tone: 'nope' as never }, () => 'Other')])
      expect(buttons()[0].className).toContain('bg-primary')
      expect(buttons()[1].className).not.toContain('bg-primary')
    })

    it('icon plus text button keeps the text as its name', () => {
      build({}, () => [h(ToolbarButton, null, () => [h(Icon, { icon: faCopy }), 'Copy'])])
      expect(buttons()[0].textContent).toContain('Copy')
      expect(buttons()[0].querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  describe('customisation', () => {
    it('class wins over internal classes on every part', () => {
      build({ class: 'bg-card p-6' }, () => [
        h(ToolbarButton, { class: 'h-20' }, () => 'A'),
        h(ToolbarToggleGroup, { class: 'gap-9' }, () => h(ToolbarToggleItem, { value: 'x', class: 'h-16' }, () => 'X')),
        h(ToolbarSeparator, { class: 'my-9' }),
        h(ToolbarLink, { href: '/sample', class: 'h-14' }, () => 'Link'),
      ])
      expect(root().className).toContain('p-6')
      expect(root().className).not.toContain('p-1 ')
      expect(buttons()[0].className).toContain('h-20')
      expect(buttons()[0].className).not.toContain('h-9')
      expect(document.querySelector('[data-slot="toolbar-toggle-group"]')!.className).toContain('gap-9')
      expect(document.querySelector('[data-slot="toolbar-toggle-item"]')!.className).toContain('h-16')
      expect(document.querySelector('[data-slot="toolbar-separator"]')!.className).toContain('my-9')
      expect(document.querySelector('[data-slot="toolbar-link"]')!.className).toContain('h-14')
    })

    it('attributes fall through on every part', () => {
      build({ id: 'bar', 'data-test': 'bar' }, () => [
        h(ToolbarButton, { 'aria-label': 'Copy', 'data-test': 'b' }, () => h(Icon, { icon: faCopy })),
        h(ToolbarToggleGroup, { 'aria-label': 'Style', 'data-test': 'g' }, () => h(ToolbarToggleItem, { value: 'x', 'data-test': 'i' }, () => 'X')),
        h(ToolbarSeparator, { 'data-test': 's' }),
        h(ToolbarLink, { href: '/sample', 'data-test': 'l' }, () => 'Link'),
      ])
      expect(root().id).toBe('bar')
      for (const k of ['bar', 'b', 'g', 'i', 's', 'l']) expect(document.querySelector(`[data-test="${k}"]`), k).not.toBeNull()
    })

    it('as and asChild render another element', () => {
      build({ as: 'section' }, () => [
        h(ToolbarButton, { as: 'div' }, () => 'Div button'),
        h(ToolbarButton, { asChild: true }, () => h('a', { href: '/sample' }, 'Anchor')),
      ])
      expect(root().tagName).toBe('SECTION')
      expect(buttons()[0].tagName).toBe('DIV')
      expect(buttons()[0].getAttribute('type')).toBeNull()
      expect(buttons()[1].tagName).toBe('A')
    })

    it('asChild on the root renders the single child', () => {
      wrapper = mount(
        defineComponent({ setup: () => () => h(Toolbar, { 'aria-label': 'Sample', asChild: true }, () => h('nav', null, [h(ToolbarButton, null, () => 'A')])) }),
        { attachTo: document.body },
      )
      expect(root().tagName).toBe('NAV')
      expect(root().getAttribute('role')).toBe('toolbar')
    })
  })

  describe('bad path and edge cases', () => {
    it('unknown prop values fall back to the defaults', () => {
      build({ variant: 'nope', size: 'nope', density: 'nope', orientation: 'nope', gap: 'nope', overflow: 'nope' })
      const cls = root().className
      wrapper!.unmount()
      build()
      expect(root().className).toBe(cls)
      expect(root().dataset.variant).toBe('plain')
    })

    it('an empty toolbar renders without error', () => {
      build({}, () => [])
      expect(root().children).toHaveLength(0)
    })

    it('parts render alone without a toolbar (no context)', () => {
      wrapper = mount(
        defineComponent({ setup: () => () => h('div', null, [h(ToolbarSeparator)]) }),
        { attachTo: document.body },
      )
      expect(document.querySelector('[data-slot="toolbar-separator"]')).toBeNull()
    })

    it('handles 200 buttons and keeps exactly one tab stop', async () => {
      build({}, () => Array.from({ length: 200 }, (_, i) => h(ToolbarButton, { key: i }, () => `Item ${i}`)))
      await flushPromises()
      expect(buttons()).toHaveLength(200)
      expect(tabbable()).toHaveLength(1)
    })

    it('hostile and long text stays text', () => {
      const evil = '<img src=x onerror=alert(1)>'
      const long = 'W'.repeat(500)
      build({}, () => [h(ToolbarButton, null, () => evil), h(ToolbarButton, null, () => long)])
      expect(document.querySelector('img')).toBeNull()
      expect(buttons()[0].textContent).toBe(evil)
      expect(buttons()[1].className).toContain('whitespace-nowrap')
    })

    it('unmounting removes the toolbar', () => {
      build()
      wrapper!.unmount()
      expect(root()).toBeNull()
    })
  })

  describe('keyboard (roving focus)', () => {
    it('only the first item is tabbable and Tab leaves the toolbar', async () => {
      build()
      await flushPromises()
      expect(tabbable()).toHaveLength(1)
      expect(tabbable()[0]).toBe(buttons()[0])
      expect(buttons().slice(1).every((b) => b.tabIndex === -1)).toBe(true)
    })

    it('ArrowRight and ArrowLeft move focus and the tab stop', async () => {
      build()
      await flushPromises()
      buttons()[0].focus()
      press(buttons()[0], 'ArrowRight')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[1])
      expect(tabbable()).toEqual([buttons()[1]])
      press(buttons()[1], 'ArrowLeft')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[0])
    })

    it('ArrowDown and ArrowUp do nothing in a horizontal toolbar', async () => {
      build()
      await flushPromises()
      buttons()[0].focus()
      press(buttons()[0], 'ArrowDown')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[0])
    })

    it('vertical: ArrowDown and ArrowUp move, ArrowRight does not', async () => {
      build({ orientation: 'vertical' })
      await flushPromises()
      buttons()[0].focus()
      press(buttons()[0], 'ArrowRight')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[0])
      press(buttons()[0], 'ArrowDown')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[1])
      press(buttons()[1], 'ArrowUp')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[0])
    })

    it('Home and End jump to the first and last item', async () => {
      build()
      await flushPromises()
      buttons()[0].focus()
      press(buttons()[0], 'End')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[2])
      press(buttons()[2], 'Home')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[0])
    })

    it('loop wraps from last to first by default and can be turned off', async () => {
      build()
      await flushPromises()
      buttons()[2].focus()
      press(buttons()[2], 'ArrowRight')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[0])
      wrapper!.unmount()
      build({ loop: false })
      await flushPromises()
      buttons()[2].focus()
      press(buttons()[2], 'ArrowRight')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[2])
    })

    it('rtl swaps the horizontal arrows', async () => {
      build({ dir: 'rtl' })
      await flushPromises()
      expect(root().getAttribute('dir')).toBe('rtl')
      buttons()[0].focus()
      press(buttons()[0], 'ArrowLeft')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[1])
      press(buttons()[1], 'ArrowRight')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[0])
    })

    it('disabled buttons are skipped', async () => {
      build({}, () => [
        h(ToolbarButton, null, () => 'A'),
        h(ToolbarButton, { disabled: true }, () => 'B'),
        h(ToolbarButton, null, () => 'C'),
      ])
      await flushPromises()
      expect(buttons()[1].hasAttribute('disabled')).toBe(true)
      buttons()[0].focus()
      press(buttons()[0], 'ArrowRight')
      await flushPromises()
      expect(document.activeElement).toBe(buttons()[2])
    })

    it('roving focus spans buttons, toggle items and links as one sequence', async () => {
      build({}, () => [
        h(ToolbarButton, null, () => 'A'),
        h(ToolbarToggleGroup, { type: 'multiple', 'aria-label': 'Style' }, () => [h(ToolbarToggleItem, { value: 'b' }, () => 'B'), h(ToolbarToggleItem, { value: 'i' }, () => 'I')]),
        h(ToolbarSeparator),
        h(ToolbarLink, { href: '/sample' }, () => 'Docs'),
      ])
      await flushPromises()
      const items = [...document.querySelectorAll<HTMLElement>('[data-slot="toolbar"] button, [data-slot="toolbar"] a')]
      expect(items).toHaveLength(4)
      expect(tabbable()).toHaveLength(1)
      items[0].focus()
      for (const next of items.slice(1)) {
        press(document.activeElement!, 'ArrowRight')
        await flushPromises()
        expect(document.activeElement).toBe(next)
      }
    })

    it('Space on a link activates it like a button', async () => {
      let clicked = false
      build({}, () => [h(ToolbarLink, { href: '/sample', onClick: (e: Event) => { e.preventDefault(); clicked = true } }, () => 'Docs')])
      await flushPromises()
      const link = document.querySelector<HTMLElement>('[data-slot="toolbar-link"]')!
      press(link, ' ')
      expect(clicked).toBe(true)
    })
  })

  describe('toggle group', () => {
    it('single: one pressed at a time, v-model updates', async () => {
      const value = ref<string | string[] | undefined>('left')
      build({}, () => [
        h(
          ToolbarToggleGroup,
          { type: 'single', 'aria-label': 'Alignment', modelValue: value.value, 'onUpdate:modelValue': (v: unknown) => (value.value = v as string) },
          () => ['left', 'center', 'right'].map((v) => h(ToolbarToggleItem, { value: v }, () => v)),
        ),
      ])
      const items = () => [...document.querySelectorAll<HTMLElement>('[data-slot="toolbar-toggle-item"]')]
      expect(items().map((i) => i.dataset.state)).toEqual(['on', 'off', 'off'])
      items()[1].click()
      await flushPromises()
      expect(value.value).toBe('center')
    })

    it('multiple: several pressed, uncontrolled with defaultValue, aria-pressed set', async () => {
      build({}, () => [
        h(ToolbarToggleGroup, { type: 'multiple', defaultValue: ['b'], 'aria-label': 'Style' }, () => ['b', 'i', 'u'].map((v) => h(ToolbarToggleItem, { value: v }, () => v))),
      ])
      const items = [...document.querySelectorAll<HTMLElement>('[data-slot="toolbar-toggle-item"]')]
      expect(items[0].getAttribute('aria-pressed')).toBe('true')
      items[1].click()
      await flushPromises()
      expect(items.map((i) => i.getAttribute('aria-pressed'))).toEqual(['true', 'true', 'false'])
      items[0].click()
      await flushPromises()
      expect(items[0].getAttribute('aria-pressed')).toBe('false')
    })

    it('a pressed item is marked beyond colour: border classes and data-state', () => {
      build({}, () => [h(ToolbarToggleGroup, { type: 'multiple', defaultValue: ['b'] }, () => h(ToolbarToggleItem, { value: 'b' }, () => 'Bold'))])
      const item = document.querySelector<HTMLElement>('[data-slot="toolbar-toggle-item"]')!
      expect(item.dataset.state).toBe('on')
      expect(item.className).toContain('data-[state=on]:border-foreground')
      expect(item.className).toContain('forced-colors:data-[state=on]:border-2')
    })

    it('filled bars press to the background surface', () => {
      build({ variant: 'filled' }, () => [h(ToolbarToggleGroup, { type: 'multiple' }, () => h(ToolbarToggleItem, { value: 'b' }, () => 'Bold'))])
      expect(document.querySelector('[data-slot="toolbar-toggle-item"]')!.className).toContain('data-[state=on]:bg-background')
    })

    it('a disabled group blocks presses and a disabled item is skipped', async () => {
      build({}, () => [h(ToolbarToggleGroup, { type: 'multiple', disabled: true }, () => h(ToolbarToggleItem, { value: 'b' }, () => 'Bold'))])
      const item = document.querySelector<HTMLElement>('[data-slot="toolbar-toggle-item"]')!
      item.click()
      await flushPromises()
      expect(item.dataset.state).toBe('off')
    })

    it('the group follows the bar orientation', () => {
      build({ orientation: 'vertical' }, () => [h(ToolbarToggleGroup, null, () => h(ToolbarToggleItem, { value: 'b' }, () => 'Bold'))])
      expect(document.querySelector('[data-slot="toolbar-toggle-group"]')!.className).toContain('flex-col')
    })
  })

  describe('separator', () => {
    it('runs across the bar: vertical line in a horizontal bar, horizontal line in a vertical bar', () => {
      build({}, () => [h(ToolbarSeparator)])
      const sep = () => document.querySelector<HTMLElement>('[data-slot="toolbar-separator"]')!
      expect(sep().getAttribute('role')).toBe('separator')
      expect(sep().getAttribute('aria-orientation')).toBe('vertical')
      expect(sep().className).toContain('border-s')
      wrapper!.unmount()
      build({ orientation: 'vertical' }, () => [h(ToolbarSeparator)])
      expect(sep().getAttribute('aria-orientation')).toBe('horizontal')
      expect(sep().className).toContain('border-t')
    })

    it('is not a tab stop', async () => {
      build({}, () => [h(ToolbarButton, null, () => 'A'), h(ToolbarSeparator), h(ToolbarButton, null, () => 'B')])
      await flushPromises()
      expect(document.querySelector('[data-slot="toolbar-separator"]')!.hasAttribute('tabindex')).toBe(false)
    })
  })

  describe('overflow', () => {
    it('wrap lets items flow onto more lines', () => {
      build({ overflow: 'wrap' })
      expect(root().className).toContain('flex-wrap')
      expect(root().className).not.toContain('overflow-x-auto')
    })

    it('scroll keeps one line and scrolls inside the bar without adding a tab stop', async () => {
      build({ overflow: 'scroll' })
      await flushPromises()
      expect(root().className).toContain('flex-nowrap')
      expect(root().className).toContain('overflow-x-auto')
      expect(root().hasAttribute('tabindex')).toBe(false)
      expect(tabbable()).toHaveLength(1)
      expect(buttons()[0].className).toContain('focus-visible:ring-inset')
      expect(buttons()[0].className).toContain('shrink-0')
    })

    it('vertical scroll scrolls on the block axis', () => {
      build({ overflow: 'scroll', orientation: 'vertical' })
      expect(root().className).toContain('overflow-y-auto')
      expect(root().className).not.toContain('overflow-x-auto')
    })
  })

  describe('accessibility hooks', () => {
    it('targets are at least 24px and 44px on coarse pointers for every size', () => {
      for (const size of ['sm', 'md', 'lg']) {
        build({ size })
        const cls = buttons()[0].className
        expect(cls).toMatch(/\bh-(8|9|11)\b/)
        expect(cls).toContain('min-w-')
        expect(cls).toContain('pointer-coarse:min-h-11')
        expect(cls).toContain('pointer-coarse:min-w-11')
        wrapper!.unmount()
      }
    })

    it('items carry the shared focus ring and the reduced motion override', () => {
      build()
      expect(buttons()[0].className).toContain('focus-visible:ring-3')
      expect(buttons()[0].className).toContain('outline-hidden')
      expect(buttons()[0].className).toContain('motion-reduce:transition-none')
    })

    it('separator keeps a border so it survives forced colors', () => {
      build({}, () => [h(ToolbarSeparator)])
      expect(document.querySelector('[data-slot="toolbar-separator"]')!.className).toContain('border-s')
    })
  })
})
