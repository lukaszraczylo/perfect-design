import { afterEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import CookieConsent from './CookieConsent.vue'
import { CookieConsent as Exported } from './index'

const categories = [
  { id: 'necessary', label: 'Strictly necessary', description: 'Keeps this choice.', necessary: true },
  { id: 'analytics', label: 'Analytics', description: 'Counts visits.' },
  { id: 'ads', label: 'Advertising', description: 'Shows relevant offers.' },
]
let wrappers: VueWrapper[] = []
const make = (props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) => {
  const w = mount(CookieConsent, { props: { categories, ...props }, slots: slots as never, attachTo: document.body })
  wrappers.push(w)
  return w
}
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  document.body.innerHTML = ''
})
const q = (slot: string) => document.body.querySelector(`[data-slot="${slot}"]`) as HTMLElement | null
const qa = (slot: string) => [...document.body.querySelectorAll(`[data-slot="${slot}"]`)] as HTMLElement[]
// Vue ignores a native event fired in the same millisecond its listener was attached, so wait a beat before clicking.
const beat = () => new Promise((r) => setTimeout(r, 2))
const click = async (slot: string) => {
  await beat()
  q(slot)!.click()
  await nextTick()
}
const toggles = () => [...document.body.querySelectorAll('[role="switch"]')] as HTMLElement[]
const last = (w: VueWrapper, name: string) => w.emitted(name)?.at(-1)

describe('CookieConsent', () => {
  describe('good path', () => {
    it('exports the component', () => expect(Exported).toBe(CookieConsent))
    it('renders a named region with title, description and the three-way choice', () => {
      make({ variant: 'inline' })
      const region = q('cookie-consent')!
      expect(region.tagName).toBe('SECTION')
      expect(region.getAttribute('aria-labelledby')).toBe(q('cookie-consent-title')!.id)
      expect(q('cookie-consent-title')!.tagName).toBe('H2')
      expect(q('cookie-consent-title')!.textContent).toBe('Cookie preferences')
      expect(q('cookie-consent-description')!.textContent).toContain('Optional categories stay off')
      expect(q('cookie-consent-reject')!.textContent).toBe('Reject all')
      expect(q('cookie-consent-accept')!.textContent).toBe('Accept all')
      expect(q('cookie-consent-save')!.textContent).toBe('Save choices')
    })
    it('starts with optional categories off and the necessary one on and locked', () => {
      make({ variant: 'inline' })
      const [necessary, analytics, ads] = toggles()
      expect(necessary.getAttribute('aria-checked')).toBe('true')
      expect(necessary.hasAttribute('disabled')).toBe(true)
      expect(analytics.getAttribute('aria-checked')).toBe('false')
      expect(ads.getAttribute('aria-checked')).toBe('false')
      expect(q('cookie-consent-categories')!.getAttribute('aria-label')).toBe('Cookie categories')
    })
    it('explains each category and labels the locked one in words', () => {
      make({ variant: 'inline' })
      const items = qa('cookie-consent-category')
      expect(items[0].textContent).toContain('Always on')
      expect(items[0].textContent).toContain('Keeps this choice.')
      expect(items[1].textContent).toContain('Counts visits.')
      expect(items[1].textContent).not.toContain('Always on')
      expect(toggles()[0].getAttribute('aria-describedby')).toBeTruthy()
    })
    it('accept all emits every category on and hides the notice', async () => {
      const w = make({ variant: 'inline' })
      await click('cookie-consent-accept')
      expect(last(w, 'change')).toEqual([{ action: 'accept-all', categories: { necessary: true, analytics: true, ads: true } }])
      expect(last(w, 'update:modelValue')).toEqual([{ necessary: true, analytics: true, ads: true }])
      expect(last(w, 'update:open')).toEqual([false])
      expect(q('cookie-consent')).toBeNull()
    })
    it('reject all emits only the necessary category on, even after toggling', async () => {
      const w = make({ variant: 'inline' })
      await beat()
      toggles()[1].click()
      await nextTick()
      await click('cookie-consent-reject')
      expect(last(w, 'change')).toEqual([{ action: 'reject-all', categories: { necessary: true, analytics: false, ads: false } }])
    })
    it('save emits the toggles as set', async () => {
      const w = make({ variant: 'inline' })
      await beat()
      toggles()[2].click()
      await nextTick()
      expect(last(w, 'update:modelValue')).toEqual([{ necessary: true, analytics: false, ads: true }])
      await click('cookie-consent-save')
      expect(last(w, 'change')).toEqual([{ action: 'save', categories: { necessary: true, analytics: false, ads: true } }])
    })
    it('the locked toggle cannot be switched off', async () => {
      const w = make({ variant: 'inline' })
      await beat()
      toggles()[0].click()
      await nextTick()
      expect(w.emitted('update:modelValue')).toBeUndefined()
      expect(toggles()[0].getAttribute('aria-checked')).toBe('true')
    })
    it('policy slot renders under the description', () => {
      make({ variant: 'inline' }, { policy: () => h('a', { href: '/cookies' }, 'Cookie policy') })
      expect(q('cookie-consent-policy')!.querySelector('a')!.getAttribute('href')).toBe('/cookies')
    })
    it('title and description slots replace the props', () => {
      make({ variant: 'inline' }, { title: () => 'Custom title', description: () => 'Custom text' })
      expect(q('cookie-consent-title')!.textContent).toBe('Custom title')
      expect(q('cookie-consent-description')!.textContent).toBe('Custom text')
    })
    it('strings are overridable', () => {
      make({ variant: 'inline', title: 'T', description: 'D', acceptLabel: 'Yes', rejectLabel: 'No', saveLabel: 'Keep', alwaysOnLabel: 'Locked', categoriesLabel: 'Groups' })
      expect(q('cookie-consent-accept')!.textContent).toBe('Yes')
      expect(q('cookie-consent-reject')!.textContent).toBe('No')
      expect(q('cookie-consent-save')!.textContent).toBe('Keep')
      expect(qa('cookie-consent-category')[0].textContent).toContain('Locked')
      expect(q('cookie-consent-categories')!.getAttribute('aria-label')).toBe('Groups')
    })
    it('level sets the heading element; invalid levels fall back to h2', () => {
      make({ variant: 'inline', level: 4 })
      expect(q('cookie-consent-title')!.tagName).toBe('H4')
      wrappers.pop()!.unmount()
      make({ variant: 'inline', level: 9 })
      expect(q('cookie-consent-title')!.tagName).toBe('H2')
    })
    it('class wins and attributes fall through', () => {
      make({ variant: 'inline', class: 'custom-x', id: 'cc', 'data-test': '1' })
      const root = q('cookie-consent')!
      expect(root.classList.contains('custom-x')).toBe(true)
      expect(root.id).toBe('cc')
      expect(root.getAttribute('data-test')).toBe('1')
    })
  })

  describe('banner variant', () => {
    it('hides the categories until "Choose categories" is pressed', async () => {
      make()
      expect(q('cookie-consent-categories')).toBeNull()
      expect(q('cookie-consent-save')).toBeNull()
      const manage = q('cookie-consent-manage')!
      expect(manage.getAttribute('aria-expanded')).toBe('false')
      expect(manage.hasAttribute('aria-controls')).toBe(false)
      await click('cookie-consent-manage')
      expect(manage.getAttribute('aria-expanded')).toBe('true')
      expect(manage.getAttribute('aria-controls')).toBe(q('cookie-consent-categories')!.id)
      expect(q('cookie-consent-save')).not.toBeNull()
      await click('cookie-consent-manage')
      expect(q('cookie-consent-categories')).toBeNull()
    })
    it('accept and reject work without opening the categories', async () => {
      const w = make()
      await click('cookie-consent-reject')
      expect(last(w, 'change')).toEqual([{ action: 'reject-all', categories: { necessary: true, analytics: false, ads: false } }])
    })
    it('has no manage button and no save button without categories', async () => {
      const w = make({ categories: [] })
      expect(q('cookie-consent-manage')).toBeNull()
      expect(q('cookie-consent-save')).toBeNull()
      await click('cookie-consent-accept')
      expect(last(w, 'change')).toEqual([{ action: 'accept-all', categories: {} }])
    })
  })

  describe('equal prominence and no dark patterns', () => {
    it.each(['banner', 'inline', 'modal'])('accept and reject are the same button in %s', async (variant) => {
      make({ variant })
      await flushPromises()
      const accept = q('cookie-consent-accept')!
      const reject = q('cookie-consent-reject')!
      expect(accept.className).toBe(reject.className)
      expect(accept.tagName).toBe(reject.tagName)
      expect(accept.getAttribute('type')).toBe(reject.getAttribute('type'))
      expect(accept.hasAttribute('disabled')).toBe(false)
      expect(reject.hasAttribute('disabled')).toBe(false)
    })
    it('reject comes before accept in reading order', () => {
      make({ variant: 'inline' })
      const buttons = qa('cookie-consent-actions')[0].querySelectorAll('button')
      expect([...buttons].map((b) => b.getAttribute('data-slot'))).toEqual(['cookie-consent-reject', 'cookie-consent-accept', 'cookie-consent-save'])
    })
    it('never pre-ticks an optional category, whatever the data says', () => {
      make({ variant: 'inline', categories: [{ id: 'a', label: 'A', checked: true, default: true, value: true, necessary: 'true' }] })
      expect(toggles()[0].getAttribute('aria-checked')).toBe('false')
      expect(toggles()[0].hasAttribute('disabled')).toBe(false)
    })
  })

  describe('v-model', () => {
    it('starts from modelValue, only true turns a toggle on', () => {
      make({ variant: 'inline', modelValue: { analytics: true, ads: 'true' } })
      expect(toggles().map((t) => t.getAttribute('aria-checked'))).toEqual(['true', 'true', 'false'])
    })
    it('a tampered modelValue cannot switch the necessary category off', async () => {
      const w = make({ variant: 'inline', modelValue: { necessary: false } })
      expect(toggles()[0].getAttribute('aria-checked')).toBe('true')
      await click('cookie-consent-save')
      expect(last(w, 'change')).toEqual([{ action: 'save', categories: { necessary: true, analytics: false, ads: false } }])
    })
    it('follows later changes of modelValue and of categories', async () => {
      const w = make({ variant: 'inline', modelValue: {} })
      await w.setProps({ modelValue: { analytics: true } })
      expect(toggles()[1].getAttribute('aria-checked')).toBe('true')
      await w.setProps({ categories: [{ id: 'analytics', label: 'Analytics' }, { id: 'new', label: 'New' }], modelValue: undefined })
      expect(toggles().map((t) => t.getAttribute('aria-checked'))).toEqual(['true', 'false'])
    })
  })

  describe('open', () => {
    it('is hidden when open is false and shown when it becomes true', async () => {
      const w = make({ variant: 'inline', open: false })
      expect(q('cookie-consent')).toBeNull()
      await w.setProps({ open: true })
      expect(q('cookie-consent')).not.toBeNull()
    })
    it('a controlled notice stays until the parent closes it', async () => {
      const w = make({ variant: 'inline', open: true })
      await click('cookie-consent-accept')
      expect(last(w, 'update:open')).toEqual([false])
      expect(q('cookie-consent')).not.toBeNull()
      await w.setProps({ open: false })
      expect(q('cookie-consent')).toBeNull()
    })
  })

  describe('modal variant', () => {
    it('renders a dialog named by the title with a description and a close button', async () => {
      make({ variant: 'modal' })
      await flushPromises()
      const dialog = document.body.querySelector('[role="dialog"]')!
      const panel = q('cookie-consent')!
      expect(dialog.contains(panel)).toBe(true)
      expect(panel.getAttribute('data-variant')).toBe('modal')
      expect(dialog.getAttribute('aria-labelledby')).toBe(q('cookie-consent-title')!.id)
      expect(q('cookie-consent-title')!.tagName).toBe('H2')
      expect(dialog.getAttribute('aria-describedby')).toBe(q('cookie-consent-description')!.id)
      expect(q('cookie-consent-categories')).not.toBeNull()
      expect(q('dialog-close-x')).not.toBeNull()
    })
    it('moves focus into the dialog', async () => {
      make({ variant: 'modal' })
      await flushPromises()
      await new Promise((r) => setTimeout(r, 0))
      expect(document.body.querySelector('[role="dialog"]')!.contains(document.activeElement)).toBe(true)
    })
    it('Escape closes it, emits dismiss and never emits change', async () => {
      const w = make({ variant: 'modal' })
      await flushPromises()
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flushPromises()
      expect(w.emitted('dismiss')).toHaveLength(1)
      expect(last(w, 'update:open')).toEqual([false])
      expect(w.emitted('change')).toBeUndefined()
      expect(w.emitted('update:modelValue')).toBeUndefined()
    })
    it('the close button dismisses without a choice', async () => {
      const w = make({ variant: 'modal' })
      await flushPromises()
      await click('dialog-close-x')
      await flushPromises()
      expect(w.emitted('dismiss')).toHaveLength(1)
      expect(w.emitted('change')).toBeUndefined()
    })
    it('an outside click does not dismiss it', async () => {
      const w = make({ variant: 'modal' })
      await flushPromises()
      const overlay = q('dialog-overlay')!
      await beat()
      overlay.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
      overlay.click()
      await flushPromises()
      expect(w.emitted('dismiss')).toBeUndefined()
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    })
    it('a choice closes it and emits change', async () => {
      const w = make({ variant: 'modal' })
      await flushPromises()
      await click('cookie-consent-accept')
      await flushPromises()
      expect(last(w, 'change')).toEqual([{ action: 'accept-all', categories: { necessary: true, analytics: true, ads: true } }])
      expect(w.emitted('dismiss')).toBeUndefined()
      expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    })
    it('opens from a parent v-model:open and closes again', async () => {
      const open = ref(false)
      const w = mount(
        defineComponent({ setup: () => () => h(CookieConsent, { variant: 'modal', open: open.value, categories, 'onUpdate:open': (v: boolean) => (open.value = v) }) }),
        { attachTo: document.body },
      )
      wrappers.push(w)
      await flushPromises()
      expect(document.body.querySelector('[role="dialog"]')).toBeNull()
      open.value = true
      await flushPromises()
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
      await click('cookie-consent-reject')
      await flushPromises()
      expect(open.value).toBe(false)
      expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    })
    it('class and attributes land on the panel inside the dialog', async () => {
      make({ variant: 'modal', class: 'custom-x', 'data-test': '1' })
      await flushPromises()
      expect(q('cookie-consent')!.classList.contains('custom-x')).toBe(true)
      expect(q('cookie-consent')!.getAttribute('data-test')).toBe('1')
    })
    it('an empty title with an aria-label becomes a hidden dialog title', async () => {
      make({ variant: 'modal', title: '', 'aria-label': 'Privacy choices' })
      await flushPromises()
      expect(q('cookie-consent-title')).toBeNull()
      const dialog = document.body.querySelector('[role="dialog"]')!
      const title = document.getElementById(dialog.getAttribute('aria-labelledby')!)!
      expect(title.textContent).toBe('Privacy choices')
      expect(title.classList.contains('sr-only')).toBe(true)
    })
  })

  describe('edge and hostile input', () => {
    it('renders markup in labels and descriptions as text', () => {
      make({
        variant: 'inline',
        title: '<img src=x onerror=alert(1)>',
        description: '<script>alert(1)</script>',
        categories: [{ id: 'x', label: '<b>bold</b>', description: '<i onclick="x()">d</i>' }],
      })
      expect(document.body.querySelector('img')).toBeNull()
      expect(document.body.querySelector('script')).toBeNull()
      expect(document.body.querySelector('b')).toBeNull()
      expect(q('cookie-consent-title')!.textContent).toContain('<img')
      expect(qa('cookie-consent-category')[0].textContent).toContain('<b>bold</b>')
    })
    it('drops entries with no usable id and repeated ids', () => {
      make({ variant: 'inline', categories: [null, { id: '' }, { id: 7 }, { id: 'a', label: 'First' }, { id: 'a', label: 'Second' }, 'str'] })
      expect(toggles()).toHaveLength(1)
      expect(qa('cookie-consent-category')[0].textContent).toContain('First')
    })
    it('survives hostile ids such as __proto__ and constructor', async () => {
      const w = make({ variant: 'inline', categories: [{ id: '__proto__', label: 'P' }, { id: 'constructor', label: 'C' }, { id: 'toString', label: 'T' }] })
      await beat()
      await beat()
      toggles()[0].click()
      await nextTick()
      await click('cookie-consent-save')
      const choice = (last(w, 'change') as [{ categories: Record<string, boolean> }])[0].categories
      expect(Object.getPrototypeOf(choice)).toBe(Object.prototype)
      expect(Object.keys(choice)).toEqual(['__proto__', 'constructor', 'toString'])
      expect(Object.values(choice)).toEqual([true, false, false])
    })
    it('handles many categories and very long text without throwing', () => {
      const many = Array.from({ length: 80 }, (_, i) => ({ id: `c${i}`, label: 'L'.repeat(500), description: 'word '.repeat(400) }))
      make({ variant: 'inline', categories: many })
      expect(toggles()).toHaveLength(80)
    })
    it('non-array categories render the three-way notice only', () => {
      make({ variant: 'inline', categories: 'nope' })
      expect(q('cookie-consent-categories')).toBeNull()
      expect(q('cookie-consent-save')).toBeNull()
      expect(q('cookie-consent-accept')).not.toBeNull()
    })
    it('a category without a label shows its id', () => {
      make({ variant: 'inline', categories: [{ id: 'metrics' }] })
      expect(qa('cookie-consent-category')[0].textContent).toContain('metrics')
    })
    it('an unknown variant renders the banner', () => {
      make({ variant: 'bogus' })
      expect(q('cookie-consent')!.getAttribute('data-variant')).toBe('banner')
    })
  })

  describe('keyboard and RTL', () => {
    it('every control is a native button or switch reachable in DOM order', () => {
      make({ variant: 'inline' })
      const focusable = [...q('cookie-consent')!.querySelectorAll('button')].filter((b) => !b.disabled)
      expect(focusable.length).toBe(5)
      expect(focusable.every((b) => b.tabIndex === 0)).toBe(true)
    })
    it('a switch toggles from the keyboard path (click)', async () => {
      make({ variant: 'inline' })
      await beat()
      const t = toggles()[1]
      t.focus()
      t.click() // reka switch handles Space/Enter by clicking the button
      await nextTick()
      expect(t.getAttribute('aria-checked')).toBe('true')
    })
    it('uses logical properties only (no left/right utilities)', () => {
      make({ variant: 'inline' })
      expect(q('cookie-consent')!.outerHTML).not.toMatch(/\b(ml|mr|pl|pr|left|right|text-left|text-right)-/)
    })
    it('works inside a right-to-left container', () => {
      const w = mount({ template: '<div dir="rtl"><CookieConsent variant="inline" :categories="categories" /></div>', components: { CookieConsent }, setup: () => ({ categories }) }, { attachTo: document.body })
      wrappers.push(w)
      expect(q('cookie-consent')!.closest('[dir="rtl"]')).not.toBeNull()
      expect(toggles()).toHaveLength(3)
    })
  })
})
