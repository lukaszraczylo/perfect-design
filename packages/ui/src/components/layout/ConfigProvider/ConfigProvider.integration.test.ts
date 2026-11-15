/**
 * Components that read the provider: with no provider they behave as before, a provider's `labels`, `locale` and `size`
 * apply, a component's own prop wins, and hostile values never reach the markup as HTML.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import ConfigProvider from './ConfigProvider.vue'
import Pagination from '../../navigation/Pagination/Pagination.vue'
import DatePicker from '../../forms/DatePicker/DatePicker.vue'
import ConfirmDialog from '../../feedback/ConfirmDialog/ConfirmDialog.vue'
import { configureStrictMode } from '../../../lib/contract'

let wrappers: VueWrapper[] = []
const track = (w: VueWrapper) => (wrappers.push(w), w)
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
  vi.useRealTimers()
  vi.restoreAllMocks()
  configureStrictMode('off')
  document.body.innerHTML = ''
})

const inProvider = (provider: Record<string, unknown> | null, child: Component, childProps: Record<string, unknown> = {}) =>
  track(
    mount(
      defineComponent({ setup: () => () => (provider ? h(ConfigProvider, provider, () => h(child, childProps)) : h(child, childProps)) }),
      { attachTo: document.body },
    ),
  )
const names = (w: VueWrapper) => w.findAll('button').map((b) => b.attributes('aria-label') ?? b.text())

describe('Pagination', () => {
  const page = { total: 100, pageSize: 10, defaultPage: 3 }
  const german = { 'pagination.nav': 'Seitennavigation', 'pagination.first': 'Erste', 'pagination.previous': 'Zurück', 'pagination.next': 'Weiter', 'pagination.last': 'Letzte', 'pagination.page': 'Seite', 'pagination.summary': 'Seite {page} von {total}' }

  it('falls back to the English defaults with no provider and with an empty provider', () => {
    for (const provider of [null, {}]) {
      const w = inProvider(provider, Pagination, page)
      expect(w.find('nav').attributes('aria-label')).toBe('Pagination')
      expect(names(w).slice(0, 3)).toEqual(['First page', 'Previous page', 'Page 1'])
      expect(w.find('[data-slot="pagination-next"]').attributes('aria-label')).toBe('Next page')
      expect(w.find('[data-slot="pagination-last"]').attributes('aria-label')).toBe('Last page')
      expect(w.find('[data-slot="pagination-summary"]').text()).toBe('Page 3 of 10')
      expect(w.find('nav').attributes('data-size')).toBe('md')
    }
  })
  it('a provider translates every built-in string', () => {
    const w = inProvider({ labels: german }, Pagination, page)
    expect(w.find('nav').attributes('aria-label')).toBe('Seitennavigation')
    expect(w.find('[data-slot="pagination-first"]').attributes('aria-label')).toBe('Erste')
    expect(w.find('[data-slot="pagination-prev"]').attributes('aria-label')).toBe('Zurück')
    expect(w.find('[data-slot="pagination-next"]').attributes('aria-label')).toBe('Weiter')
    expect(w.find('[data-slot="pagination-last"]').attributes('aria-label')).toBe('Letzte')
    expect(w.find('[data-slot="pagination-page"]').attributes('aria-label')).toBe('Seite 1')
    expect(w.find('[data-slot="pagination-summary"]').text()).toBe('Seite 3 von 10')
  })
  it('the labels prop wins per key; the provider fills the rest', () => {
    const w = inProvider({ labels: german }, Pagination, { ...page, labels: { next: 'Vor' } })
    expect(w.find('[data-slot="pagination-next"]').attributes('aria-label')).toBe('Vor')
    expect(w.find('[data-slot="pagination-prev"]').attributes('aria-label')).toBe('Zurück')
  })
  it('only the declared keys apply: unknown and other-component keys are ignored', () => {
    const w = inProvider({ labels: { 'pagination.bogus': 'x', 'datePicker.clear': 'y', next: 'z' } }, Pagination, page)
    expect(w.find('[data-slot="pagination-next"]').attributes('aria-label')).toBe('Next page')
  })
  it('nested providers merge per key', () => {
    const w = track(
      mount(defineComponent({ setup: () => () => h(ConfigProvider, { labels: german }, () => h(ConfigProvider, { labels: { 'pagination.next': 'Vor' } }, () => h(Pagination, page))) }), { attachTo: document.body }),
    )
    expect(w.find('[data-slot="pagination-next"]').attributes('aria-label')).toBe('Vor')
    expect(w.find('[data-slot="pagination-prev"]').attributes('aria-label')).toBe('Zurück')
  })
  it('updates when the provider labels change', async () => {
    const labels = ref<Record<string, string>>({ 'pagination.next': 'A' })
    const w = track(mount(defineComponent({ setup: () => () => h(ConfigProvider, { labels: labels.value }, () => h(Pagination, page)) }), { attachTo: document.body }))
    expect(w.find('[data-slot="pagination-next"]').attributes('aria-label')).toBe('A')
    labels.value = { 'pagination.next': 'B' }
    await nextTick()
    expect(w.find('[data-slot="pagination-next"]').attributes('aria-label')).toBe('B')
  })
  it('hostile labels render as text and non-strings are ignored', () => {
    const html = '<img src=x onerror=alert(1)>'
    const w = inProvider(
      { labels: { 'pagination.summary': `<b>{page}</b>${html}`, 'pagination.next': html, 'pagination.nav': 42, 'pagination.last': { toString: () => 'x' }, 'pagination.first': null, 'pagination.previous': '   ' } },
      Pagination,
      page,
    )
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('b').exists()).toBe(false)
    expect(w.find('[data-slot="pagination-summary"]').text()).toBe(`<b>3</b>${html}`)
    expect(w.find('[data-slot="pagination-next"]').attributes('aria-label')).toBe(html)
    expect(w.find('nav').attributes('aria-label')).toBe('Pagination')
    expect(w.find('[data-slot="pagination-last"]').attributes('aria-label')).toBe('Last page')
    expect(w.find('[data-slot="pagination-first"]').attributes('aria-label')).toBe('First page')
    expect(w.find('[data-slot="pagination-prev"]').attributes('aria-label')).toBe('Previous page')
  })
  it('passes the strict-mode name checks with translated labels', async () => {
    configureStrictMode('throw')
    const errors: Error[] = []
    const w = track(
      mount(
        defineComponent({
          errorCaptured: (e: unknown) => (errors.push(e as Error), false),
          setup: () => () => h(ConfigProvider, { labels: german }, () => h(Pagination, page)),
        }),
        { attachTo: document.body },
      ),
    )
    await flushPromises()
    expect(errors).toEqual([])
    expect(w.find('nav').attributes('aria-label')).toBe('Seitennavigation')
  })
  it('uses the provider size when the component has none; its own size and unsupported hints are respected', () => {
    expect(inProvider({ size: 'lg' }, Pagination, page).find('nav').attributes('data-size')).toBe('lg')
    expect(inProvider({ size: 'sm' }, Pagination, { ...page, size: 'lg' }).find('nav').attributes('data-size')).toBe('lg')
    expect(inProvider({ size: 'xl' }, Pagination, page).find('nav').attributes('data-size')).toBe('md')
    expect(inProvider({ size: 'huge' }, Pagination, page).find('nav').attributes('data-size')).toBe('md')
    expect(inProvider(null, Pagination, { ...page, size: 'nope' }).find('nav').attributes('data-size')).toBe('md')
  })
})

describe('DatePicker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2024, 1, 15, 10, 30))
  })
  const date = new Date(2024, 2, 5)
  const props = { modelValue: date, 'aria-label': 'Due date' }
  const fmt = (locale: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)

  it('falls back to the English defaults with no provider and with an empty provider', async () => {
    for (const provider of [null, {}]) {
      const w = inProvider(provider, DatePicker, { 'aria-label': 'Due date', clearable: true, modelValue: null, required: true })
      expect(w.find('[data-slot="date-picker-value"]').text()).toBe('Pick a date')
      expect(w.find('[data-slot="date-picker-required"]').text()).toBe('Required')
      const w2 = inProvider(provider, DatePicker, { ...props, clearable: true })
      expect(w2.find('[data-slot="date-picker-clear"]').attributes('aria-label')).toBe('Clear date')
      await w2.find('[data-slot="date-picker-trigger"]').trigger('click')
      await flushPromises()
      expect(w2.find('[data-slot="date-picker-content"]').attributes('aria-label')).toBe('Choose date')
    }
  })
  it('a provider translates placeholder, required text, clear button and dialog', async () => {
    const labels = { 'datePicker.placeholder': 'Datum wählen', 'datePicker.required': 'Pflichtfeld', 'datePicker.clear': 'Datum entfernen', 'datePicker.dialog': 'Datum auswählen' }
    const empty = inProvider({ labels }, DatePicker, { 'aria-label': 'Fällig', modelValue: null, required: true })
    expect(empty.find('[data-slot="date-picker-value"]').text()).toBe('Datum wählen')
    expect(empty.find('[data-slot="date-picker-required"]').text()).toBe('Pflichtfeld')
    const w = inProvider({ labels }, DatePicker, { ...props, clearable: true })
    expect(w.find('[data-slot="date-picker-clear"]').attributes('aria-label')).toBe('Datum entfernen')
    await w.find('[data-slot="date-picker-trigger"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-slot="date-picker-content"]').attributes('aria-label')).toBe('Datum auswählen')
  })
  it('the component props win over the provider', () => {
    const w = inProvider({ labels: { 'datePicker.placeholder': 'Datum wählen', 'datePicker.clear': 'Entfernen' } }, DatePicker, { 'aria-label': 'x', modelValue: null, placeholder: 'Pick one' })
    expect(w.find('[data-slot="date-picker-value"]').text()).toBe('Pick one')
    const c = inProvider({ labels: { 'datePicker.clear': 'Entfernen' } }, DatePicker, { ...props, clearable: true, clearLabel: 'Clear it' })
    expect(c.find('[data-slot="date-picker-clear"]').attributes('aria-label')).toBe('Clear it')
  })
  it('formats the value in the provider locale; a locale prop wins', () => {
    expect(inProvider({ locale: 'de-DE' }, DatePicker, props).find('[data-slot="date-picker-value"]').text()).toBe(fmt('de-DE'))
    expect(inProvider({ locale: 'de-DE' }, DatePicker, { ...props, locale: 'en-US' }).find('[data-slot="date-picker-value"]').text()).toBe(fmt('en-US'))
    expect(fmt('de-DE')).not.toBe(fmt('en-US'))
  })
  it('an invalid provider locale keeps the component default', () => {
    const base = inProvider(null, DatePicker, props).find('[data-slot="date-picker-value"]').text()
    expect(inProvider({ locale: 'not a locale' }, DatePicker, props).find('[data-slot="date-picker-value"]').text()).toBe(base)
  })
  it('the calendar reads the provider locale too', async () => {
    const w = inProvider({ locale: 'de-DE' }, DatePicker, props)
    await w.find('[data-slot="date-picker-trigger"]').trigger('click')
    await flushPromises()
    expect(w.find('[data-slot="calendar"]').exists()).toBe(true)
    expect(w.find('[data-slot="date-picker-content"]').text()).toContain('März')
  })
  it('uses the provider size when it has none; its own size wins and unsupported hints fall back', () => {
    const cls = (provider: Record<string, unknown> | null, extra: Record<string, unknown> = {}) => inProvider(provider, DatePicker, { ...props, ...extra }).find('[data-slot="date-picker-trigger"]').classes().join(' ')
    expect(cls({ size: 'lg' })).not.toBe(cls(null))
    expect(cls({ size: 'lg' })).toBe(cls(null, { size: 'lg' }))
    expect(cls({ size: 'lg' }, { size: 'sm' })).toBe(cls(null, { size: 'sm' }))
    expect(cls({ size: 'xl' })).toBe(cls(null))
  })
  it('hostile labels render as text and non-strings are ignored', async () => {
    const html = '<img src=x onerror=alert(1)>'
    const w = inProvider(
      { labels: { 'datePicker.placeholder': html, 'datePicker.required': `<b>${html}</b>`, 'datePicker.clear': 7, 'datePicker.dialog': ['x'] } },
      DatePicker,
      { 'aria-label': 'x', modelValue: null, required: true, clearable: true },
    )
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('[data-slot="date-picker-value"]').text()).toBe(html)
    expect(w.find('[data-slot="date-picker-required"]').text()).toBe(`<b>${html}</b>`)
    const full = inProvider({ labels: { 'datePicker.clear': 7, 'datePicker.dialog': ['x'] } }, DatePicker, { ...props, clearable: true })
    expect(full.find('[data-slot="date-picker-clear"]').attributes('aria-label')).toBe('Clear date')
    await full.find('[data-slot="date-picker-trigger"]').trigger('click')
    await flushPromises()
    expect(full.find('[data-slot="date-picker-content"]').attributes('aria-label')).toBe('Choose date')
  })
  it('keeps the strict-mode name checks quiet with translated labels, and still enforces blank explicit labels', async () => {
    configureStrictMode('throw')
    const errors: Error[] = []
    const mountIt = (p: Record<string, unknown>) =>
      track(mount(defineComponent({ errorCaptured: (e: unknown) => (errors.push(e as Error), false), setup: () => () => h(ConfigProvider, { labels: { 'datePicker.clear': 'Entfernen', 'datePicker.dialog': 'Datum' } }, () => h(DatePicker, p)) }), { attachTo: document.body }))
    mountIt({ ...props, clearable: true })
    await flushPromises()
    expect(errors).toEqual([])
    mountIt({ ...props, clearable: true, clearLabel: '' })
    await flushPromises()
    expect(errors[0]?.name).toBe('ContractError')
    expect(errors[0].message).toContain('clearLabel')
  })
})

describe('ConfirmDialog', () => {
  const q = <T extends Element = HTMLElement>(s: string) => document.body.querySelector<T>(s)
  const base = { title: 'Delete item?', description: 'This cannot be undone.', open: true, onConfirm: () => {} }
  const show = async (...a: Parameters<typeof inProvider>) => {
    const w = inProvider(...a)
    await flushPromises()
    return w
  }
  const text = (s: string) => q(s)?.textContent?.trim()

  it('falls back to the English defaults with no provider and with an empty provider', async () => {
    for (const provider of [null, {}]) {
      await show(provider, ConfirmDialog, base)
      expect(text('[data-slot="confirm-dialog-cancel"]')).toBe('Cancel')
      expect(text('[data-slot="confirm-dialog-confirm"]')).toBe('Confirm')
      wrappers.pop()!.unmount()
      document.body.innerHTML = ''
    }
  })
  it('a provider translates the buttons, even though the dialog is portalled', async () => {
    await show({ labels: { 'confirmDialog.confirm': 'Löschen', 'confirmDialog.cancel': 'Abbrechen' } }, ConfirmDialog, base)
    expect(text('[data-slot="confirm-dialog-cancel"]')).toBe('Abbrechen')
    expect(text('[data-slot="confirm-dialog-confirm"]')).toBe('Löschen')
  })
  it('the component props win over the provider', async () => {
    await show({ labels: { 'confirmDialog.confirm': 'Löschen', 'confirmDialog.cancel': 'Abbrechen' } }, ConfirmDialog, { ...base, confirmLabel: 'Remove', cancelLabel: 'Keep' })
    expect(text('[data-slot="confirm-dialog-cancel"]')).toBe('Keep')
    expect(text('[data-slot="confirm-dialog-confirm"]')).toBe('Remove')
  })
  it('translates the fallback title and the generic error message', async () => {
    await show({ labels: { 'confirmDialog.defaultTitle': 'Sind Sie sicher?', 'confirmDialog.error': 'Etwas ist schiefgelaufen.' } }, ConfirmDialog, { ...base, title: '   ', onConfirm: () => Promise.reject('plain string') })
    expect(text('[data-slot="confirm-dialog-title"]')).toBe('Sind Sie sicher?')
    q<HTMLElement>('[data-slot="confirm-dialog-confirm"]')!.click()
    await flushPromises()
    expect(text('[data-slot="confirm-dialog-error"]')).toBe('Etwas ist schiefgelaufen.')
  })
  it('keeps the English fallback title and error with no provider', async () => {
    await show(null, ConfirmDialog, { ...base, title: '   ', onConfirm: () => Promise.reject('plain string') })
    expect(text('[data-slot="confirm-dialog-title"]')).toBe('Are you sure?')
    q<HTMLElement>('[data-slot="confirm-dialog-confirm"]')!.click()
    await flushPromises()
    expect(text('[data-slot="confirm-dialog-error"]')).toBe('Something went wrong. Please try again.')
  })
  it('an Error message from the handler still wins over the translated generic message', async () => {
    await show({ labels: { 'confirmDialog.error': 'Etwas ist schiefgelaufen.' } }, ConfirmDialog, { ...base, onConfirm: () => Promise.reject(new Error('Server said no')) })
    q<HTMLElement>('[data-slot="confirm-dialog-confirm"]')!.click()
    await flushPromises()
    expect(text('[data-slot="confirm-dialog-error"]')).toBe('Server said no')
  })
  it('hostile labels render as text and non-strings are ignored', async () => {
    const html = '<img src=x onerror=alert(1)>'
    await show({ labels: { 'confirmDialog.confirm': html, 'confirmDialog.cancel': 12, 'confirmDialog.defaultTitle': `<script>alert(1)</script>` } }, ConfirmDialog, { ...base, title: '' })
    expect(document.body.querySelector('img')).toBeNull()
    expect(document.body.querySelector('script')).toBeNull()
    expect(text('[data-slot="confirm-dialog-confirm"]')).toBe(html)
    expect(text('[data-slot="confirm-dialog-cancel"]')).toBe('Cancel')
    expect(text('[data-slot="confirm-dialog-title"]')).toBe('<script>alert(1)</script>')
  })
  it('nested providers merge per key', async () => {
    track(
      mount(
        defineComponent({ setup: () => () => h(ConfigProvider, { labels: { 'confirmDialog.confirm': 'Outer', 'confirmDialog.cancel': 'Outer cancel' } }, () => h(ConfigProvider, { labels: { 'confirmDialog.confirm': 'Inner' } }, () => h(ConfirmDialog, base))) }),
        { attachTo: document.body },
      ),
    )
    await flushPromises()
    expect(text('[data-slot="confirm-dialog-confirm"]')).toBe('Inner')
    expect(text('[data-slot="confirm-dialog-cancel"]')).toBe('Outer cancel')
  })
})
