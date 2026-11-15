import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import InstallTabs from './InstallTabs.vue'
import { INSTALL_TABS_SIZES, INSTALL_TABS_VARIANTS, installTabsCopyVariants, installTabsHeaderVariants, installTabsListVariants, installTabsPanelVariants, installTabsTabVariants, installTabsVariants } from './variants'

const tabs = [
  { label: 'pnpm', code: 'pnpm add @perfect-design/ui', language: 'bash' },
  { label: 'npm', code: 'npm i @perfect-design/ui' },
  { label: 'yarn', code: 'yarn add @perfect-design/ui' },
]
let w: VueWrapper | undefined
const tabEls = () => w!.findAll('[role="tab"]')
const selected = () => tabEls().findIndex((t) => t.attributes('aria-selected') === 'true')
const flush = async () => {
  await Promise.resolve()
  await nextTick()
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  w?.unmount()
  w = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})
const stubClipboard = (impl: () => Promise<void> = () => Promise.resolve()) => {
  const writeText = vi.fn(impl)
  vi.stubGlobal('navigator', { clipboard: { writeText } })
  return writeText
}

describe('InstallTabs', () => {
  describe('good path', () => {
    it('renders a tablist with the first tab selected and its panel', () => {
      w = mount(InstallTabs, { props: { tabs } })
      expect(w.attributes('data-slot')).toBe('install-tabs')
      expect(w.find('[role="tablist"]').attributes('aria-label')).toBe('Install commands')
      expect(tabEls()).toHaveLength(3)
      expect(selected()).toBe(0)
      const panel = w.find('[role="tabpanel"]')
      expect(panel.text()).toBe('pnpm add @perfect-design/ui')
      expect(panel.attributes('aria-labelledby')).toBe(tabEls()[0].attributes('id'))
      expect(tabEls()[0].attributes('aria-controls')).toBeUndefined() // inactive panels are not rendered, so aria-controls would dangle
      expect(w.find('code').attributes('data-language')).toBe('bash')
    })
    it('roving tabindex: only the selected tab is tabbable', () => {
      w = mount(InstallTabs, { props: { tabs } })
      expect(tabEls().map((t) => t.attributes('tabindex'))).toEqual(['0', '-1', '-1'])
    })
    it('clicking a tab selects it and emits update:modelValue', async () => {
      w = mount(InstallTabs, { props: { tabs } })
      await tabEls()[2].trigger('click')
      expect(selected()).toBe(2)
      expect(w.find('[role="tabpanel"]').text()).toContain('yarn add')
      expect(w.emitted('update:modelValue')).toEqual([[2]])
    })
    it('arrow keys, Home and End move selection with wrap-around and focus', async () => {
      w = mount(InstallTabs, { props: { tabs }, attachTo: document.body })
      await tabEls()[0].trigger('keydown', { key: 'ArrowRight' })
      expect(selected()).toBe(1)
      expect(document.activeElement).toBe(tabEls()[1].element)
      await tabEls()[1].trigger('keydown', { key: 'ArrowLeft' })
      await tabEls()[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(selected()).toBe(2)
      await tabEls()[2].trigger('keydown', { key: 'ArrowRight' })
      expect(selected()).toBe(0)
      await tabEls()[0].trigger('keydown', { key: 'End' })
      expect(selected()).toBe(2)
      await tabEls()[2].trigger('keydown', { key: 'Home' })
      expect(selected()).toBe(0)
    })
    it('copies the active snippet, shows Copied, then resets', async () => {
      const writeText = stubClipboard()
      w = mount(InstallTabs, { props: { tabs } })
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      expect(writeText).toHaveBeenCalledWith('pnpm add @perfect-design/ui')
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copied')
      expect(w.find('[data-slot="install-tabs-status"]').text()).toBe('Copied')
      expect(w.emitted('copy')).toEqual([['pnpm add @perfect-design/ui']])
      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copy')
    })
    it('v-model controls the selected tab', async () => {
      w = mount(InstallTabs, { props: { tabs, modelValue: 1 } })
      expect(selected()).toBe(1)
      await w.setProps({ modelValue: 2 })
      expect(selected()).toBe(2)
    })
  })
  describe('variants and sizes', () => {
    it('default variant keeps the bordered card look and md size', () => {
      w = mount(InstallTabs, { props: { tabs } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toEqual(expect.arrayContaining(['rounded-lg', 'border', 'bg-card', 'overflow-hidden']))
      expect(w.find('[data-slot="install-tabs-header"]').classes()).toEqual(expect.arrayContaining(['border-b', 'bg-muted/50']))
      expect(tabEls()[0].classes()).toEqual(expect.arrayContaining(['px-3', 'py-1.5', 'text-sm', 'bg-background']))
      expect(tabEls()[1].classes()).not.toContain('bg-background')
    })
    it('minimal has no frame and underlines the active tab', () => {
      w = mount(InstallTabs, { props: { tabs, variant: 'minimal' } })
      expect(w.attributes('data-variant')).toBe('minimal')
      expect(w.classes()).not.toContain('border')
      expect(w.classes()).not.toContain('rounded-lg')
      expect(tabEls()[0].classes()).toEqual(expect.arrayContaining(['border-b-2', 'border-primary', 'text-foreground']))
      expect(tabEls()[1].classes()).toEqual(expect.arrayContaining(['border-transparent', 'text-muted-foreground']))
      expect(tabEls()[0].classes()).not.toContain('bg-background')
      expect(w.find('[data-slot="install-tabs-panel"]').classes()).toContain('py-4')
    })
    it('contained uses a tray, pill tabs and a raised code panel', () => {
      w = mount(InstallTabs, { props: { tabs, variant: 'contained' } })
      expect(w.classes()).toEqual(expect.arrayContaining(['bg-muted', 'p-2', 'rounded-lg']))
      expect(tabEls()[0].classes()).toEqual(expect.arrayContaining(['bg-background', 'ring-1']))
      expect(w.find('[data-slot="install-tabs-panel"]').classes()).toEqual(expect.arrayContaining(['rounded-md', 'border', 'bg-background']))
    })
    it.each([
      ['sm', ['px-2', 'py-1', 'text-xs']],
      ['md', ['px-3', 'py-1.5', 'text-sm']],
      ['lg', ['px-4', 'py-2', 'text-base']],
    ] as const)('size %s scales tabs, copy button and panel', (size, tabCls) => {
      w = mount(InstallTabs, { props: { tabs, size } })
      expect(w.attributes('data-size')).toBe(size)
      expect(tabEls()[0].classes()).toEqual(expect.arrayContaining([...tabCls]))
      expect(w.find('[data-slot="install-tabs-panel"]').classes()).toContain(tabCls[2])
    })
    it('lg copy button is larger than sm', () => {
      expect(installTabsCopyVariants({ size: 'lg' })).toContain('text-sm')
      expect(installTabsCopyVariants({ size: 'sm' })).toContain('px-2')
    })
    it.each(INSTALL_TABS_VARIANTS)('%s: tabs, keyboard, copy and v-model work identically', async (variant) => {
      const writeText = stubClipboard()
      w = mount(InstallTabs, { props: { tabs, variant }, attachTo: document.body })
      await tabEls()[0].trigger('keydown', { key: 'ArrowRight' })
      expect(selected()).toBe(1)
      await tabEls()[1].trigger('click')
      await tabEls()[2].trigger('click')
      expect(w.emitted('update:modelValue')).toEqual([[1], [2]])
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      expect(writeText).toHaveBeenCalledWith('yarn add @perfect-design/ui')
      expect(w.find('[data-slot="install-tabs-status"]').text()).toBe('Copied')
      expect(w.find('[role="tablist"]').attributes('aria-label')).toBe('Install commands')
    })
    it.each(INSTALL_TABS_VARIANTS)('%s: class merges last and attrs fall through', (variant) => {
      w = mount(InstallTabs, { props: { tabs, variant, class: 'rounded-none custom p-0' }, attrs: { id: 'it', 'data-x': '1' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('rounded-lg')
      expect(w.classes()).not.toContain('p-2')
      expect(w.attributes('id')).toBe('it')
      expect(w.attributes('data-x')).toBe('1')
    })
    it('exposes class helpers for reuse', () => {
      expect(installTabsVariants({ variant: 'contained' })).toContain('bg-muted')
      expect(installTabsHeaderVariants({ variant: 'minimal' })).toContain('border-b')
      expect(installTabsListVariants()).toContain('py-1.5')
      expect(installTabsTabVariants({ variant: 'minimal', active: true })).toContain('border-primary')
      expect(installTabsPanelVariants({ variant: 'contained', size: 'lg' })).toContain('text-base')
      expect(INSTALL_TABS_SIZES).toEqual(['sm', 'md', 'lg'])
    })
    it('active styling follows selection', async () => {
      w = mount(InstallTabs, { props: { tabs, variant: 'minimal' } })
      await tabEls()[2].trigger('click')
      expect(tabEls()[2].classes()).toContain('border-primary')
      expect(tabEls()[0].classes()).not.toContain('border-primary')
    })
  })
  describe('accessibility regressions', () => {
    it('the status live region exists before any copy so announcements are reliable, and sits outside the button', () => {
      w = mount(InstallTabs, { props: { tabs } })
      const status = w.find('[data-slot="install-tabs-status"]')
      expect(status.attributes('role')).toBe('status')
      expect(status.text()).toBe('')
      expect(w.find('[data-slot="install-tabs-copy"]').find('[role="status"]').exists()).toBe(false)
    })
    it('the copy button is a typed button whose visible text is its name (no differing aria-label)', () => {
      w = mount(InstallTabs, { props: { tabs } })
      const b = w.find('[data-slot="install-tabs-copy"]')
      expect(b.attributes('type')).toBe('button')
      expect(b.attributes('aria-label')).toBeUndefined()
      expect(b.text()).toBe('Copy')
    })
    it('tabs and the copy button meet target size (24px, 44px on coarse pointers)', () => {
      w = mount(InstallTabs, { props: { tabs, size: 'sm' } })
      for (const el of [...tabEls(), w.find('[data-slot="install-tabs-copy"]')]) expect(el.classes()).toEqual(expect.arrayContaining(['min-h-6', 'pointer-coarse:min-h-11']))
    })
    it('the active tab keeps a visible cue in forced-colors mode and no variant uses shadows', () => {
      for (const variant of INSTALL_TABS_VARIANTS) {
        w = mount(InstallTabs, { props: { tabs, variant } })
        expect(tabEls()[0].classes()).toEqual(expect.arrayContaining(['forced-colors:underline', 'forced-colors:underline-offset-4']))
        expect(w.html()).not.toMatch(/shadow|rounded-xl/)
        w.unmount()
      }
      w = undefined
    })
    it('the panel is a focusable scroll region with an inset focus outline, named by its tab', () => {
      w = mount(InstallTabs, { props: { tabs } })
      const panel = w.find('[role="tabpanel"]')
      expect(panel.attributes('tabindex')).toBe('0')
      expect(panel.classes()).toEqual(expect.arrayContaining(['overflow-x-auto', 'focus-visible:outline-2', 'focus-visible:outline-solid', 'focus-visible:-outline-offset-2']))
      expect(panel.attributes('aria-labelledby')).toBe(tabEls()[0].attributes('id'))
    })
    it('arrow keys swap in a right-to-left list', async () => {
      w = mount(InstallTabs, { props: { tabs }, attachTo: document.body })
      const list = w.find('[role="tablist"]').element as HTMLElement
      list.dir = 'rtl'
      const spy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({ direction: 'rtl' } as CSSStyleDeclaration)
      await tabEls()[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(selected()).toBe(1)
      await tabEls()[1].trigger('keydown', { key: 'ArrowRight' })
      expect(selected()).toBe(0)
      spy.mockRestore()
    })
    it('ArrowUp and ArrowDown are left to the page (horizontal tablist)', async () => {
      w = mount(InstallTabs, { props: { tabs } })
      const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true })
      tabEls()[0].element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
      expect(selected()).toBe(0)
    })
  })
  describe('customisation', () => {
    it('merges class, attrs and custom labels', () => {
      w = mount(InstallTabs, { props: { tabs, class: 'rounded-none custom', copyLabel: 'Kopieren', label: 'Installation' }, attrs: { id: 'i' } })
      expect(w.classes()).toContain('custom')
      expect(w.classes()).not.toContain('rounded-lg')
      expect(w.attributes('id')).toBe('i')
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Kopieren')
      expect(w.find('[role="tablist"]').attributes('aria-label')).toBe('Installation')
    })
  })
  describe('bad path', () => {
    it('unknown variant and size fall back to default / md', () => {
      // @ts-expect-error deliberately invalid
      w = mount(InstallTabs, { props: { tabs, variant: 'neon', size: 'huge' } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.attributes('data-size')).toBe('md')
      expect(w.classes()).toContain('bg-card')
      expect(tabEls()[0].classes()).toContain('text-sm')
    })
    it('null variant and size are treated as unset', () => {
      // @ts-expect-error deliberately invalid
      w = mount(InstallTabs, { props: { tabs, variant: null, size: null } })
      expect(w.attributes('data-variant')).toBe('default')
      expect(w.attributes('data-size')).toBe('md')
    })
    it.each(INSTALL_TABS_VARIANTS)('%s with empty tabs renders only the frame', (variant) => {
      w = mount(InstallTabs, { props: { tabs: [], variant, size: 'lg' } })
      expect(w.findAll('[role="tab"]')).toHaveLength(0)
      expect(w.find('[data-slot="install-tabs-panel"]').exists()).toBe(false)
    })
    it('empty tabs render no tabs, panel or copy button', () => {
      w = mount(InstallTabs, { props: { tabs: [] } })
      expect(w.findAll('[role="tab"]')).toHaveLength(0)
      expect(w.find('[role="tabpanel"]').exists()).toBe(false)
      expect(w.find('[data-slot="install-tabs-copy"]').exists()).toBe(false)
    })
    it('keyboard on empty tabs is a no-op', async () => {
      w = mount(InstallTabs, { props: { tabs: [] } })
      await w.find('[role="tablist"]').trigger('keydown', { key: 'ArrowRight' })
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
    it.each([-3, 99, Number.NaN])('modelValue %s is clamped', (modelValue) => {
      w = mount(InstallTabs, { props: { tabs, modelValue } })
      expect([0, 2]).toContain(selected())
    })
    it('unrelated keys do not change selection or get prevented', async () => {
      w = mount(InstallTabs, { props: { tabs } })
      const ev = new KeyboardEvent('keydown', { key: 'a', cancelable: true, bubbles: true })
      tabEls()[0].element.dispatchEvent(ev)
      expect(ev.defaultPrevented).toBe(false)
      expect(selected()).toBe(0)
    })
    it('missing clipboard API emits copy-error and never shows Copied', async () => {
      vi.stubGlobal('navigator', {})
      w = mount(InstallTabs, { props: { tabs } })
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      expect(w.emitted('copy-error')).toHaveLength(1)
      expect(w.emitted('copy')).toBeUndefined()
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copy failed')
      expect(w.find('[data-slot="install-tabs-status"]').text()).toBe('Copy failed')
      vi.advanceTimersByTime(2000)
      await nextTick()
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copy')
      expect(w.find('[data-slot="install-tabs-status"]').text()).toBe('')
    })
    it('rejected clipboard write emits copy-error', async () => {
      stubClipboard(() => Promise.reject(new Error('denied')))
      w = mount(InstallTabs, { props: { tabs } })
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      expect((w.emitted('copy-error')![0][0] as Error).message).toBe('denied')
      expect(w.find('[data-slot="install-tabs-status"]').text()).toBe('Copy failed')
    })
    it('copyErrorLabel is customisable; a later success replaces the failure message', async () => {
      stubClipboard(() => Promise.reject(new Error('no')))
      w = mount(InstallTabs, { props: { tabs, copyErrorLabel: 'Fehler' } })
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Fehler')
      stubClipboard()
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copied')
      expect(vi.getTimerCount()).toBe(1)
    })
  })
  describe('edge cases', () => {
    it.each(INSTALL_TABS_VARIANTS)('%s: very long code, 100 tabs and unicode labels', (variant) => {
      w = mount(InstallTabs, { props: { tabs: [{ label: '終'.repeat(200), code: 'x'.repeat(20000) }], variant } })
      expect(tabEls()[0].text()).toHaveLength(200)
      expect(w.find('code').text()).toHaveLength(20000)
      w.unmount()
      const many = Array.from({ length: 100 }, (_, i) => ({ label: `t${i}`, code: `c${i}` }))
      w = mount(InstallTabs, { props: { tabs: many, variant, modelValue: 50 } })
      expect(tabEls()).toHaveLength(100)
      expect(w.find('code').text()).toBe('c50')
    })
    it('rapid variant and size toggling keeps selection and cleans up the timer on unmount', async () => {
      stubClipboard()
      w = mount(InstallTabs, { props: { tabs, modelValue: 1 } })
      for (let i = 0; i < 30; i++) await w.setProps({ variant: INSTALL_TABS_VARIANTS[i % 3], size: INSTALL_TABS_SIZES[i % 3] })
      expect(selected()).toBe(1)
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      w.unmount()
      w = undefined
      expect(vi.getTimerCount()).toBe(0)
    })
    it('switching tabs resets the Copied state', async () => {
      stubClipboard()
      w = mount(InstallTabs, { props: { tabs } })
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      await tabEls()[1].trigger('click')
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copy')
    })
    it('rapid copy clicks keep a single reset timer', async () => {
      stubClipboard()
      w = mount(InstallTabs, { props: { tabs, resetAfter: 1000 } })
      for (let i = 0; i < 5; i++) {
        await w.find('[data-slot="install-tabs-copy"]').trigger('click')
        await flush()
        vi.advanceTimersByTime(500)
      }
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copied')
      vi.advanceTimersByTime(1000)
      await nextTick()
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copy')
    })
    it('unmount clears the pending timer', async () => {
      stubClipboard()
      w = mount(InstallTabs, { props: { tabs } })
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      expect(vi.getTimerCount()).toBe(1)
      w.unmount()
      w = undefined
      expect(vi.getTimerCount()).toBe(0)
    })
    it('invalid resetAfter falls back to 2000ms', async () => {
      stubClipboard()
      w = mount(InstallTabs, { props: { tabs, resetAfter: Number.NaN } })
      await w.find('[data-slot="install-tabs-copy"]').trigger('click')
      await flush()
      vi.advanceTimersByTime(1999)
      await nextTick()
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copied')
      vi.advanceTimersByTime(1)
      await nextTick()
      expect(w.find('[data-slot="install-tabs-copy"]').text()).toBe('Copy')
    })
    it('very long multi-line unicode code, 1 and 100 tabs', () => {
      w = mount(InstallTabs, { props: { tabs: [{ label: '終', code: `${'x'.repeat(10000)}\n# 日本語` }] } })
      expect(w.find('code').text()).toContain('日本語')
      w.unmount()
      const many = Array.from({ length: 100 }, (_, i) => ({ label: `t${i}`, code: `c${i}` }))
      w = mount(InstallTabs, { props: { tabs: many, modelValue: 99 } })
      expect(tabEls()).toHaveLength(100)
      expect(w.find('code').text()).toBe('c99')
    })
    it('tab removal keeps the selection valid', async () => {
      w = mount(InstallTabs, { props: { tabs, modelValue: 2 } })
      await w.setProps({ tabs: tabs.slice(0, 1) })
      expect(selected()).toBe(0)
    })
  })
})
