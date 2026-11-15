import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, nextTick, onErrorCaptured, ref } from 'vue'
import { configureStrictMode } from '../../lib/contract'
import { Alert, AlertDescription, AlertTitle } from './Alert'
import { Banner } from './Banner'
import { Callout } from './Callout'
import { ConfirmDialog, ConfirmHost, useConfirmStore } from './ConfirmDialog'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { NotificationList } from './NotificationList'
import { OfflineIndicator } from './OfflineIndicator'
import { StaleNotice } from './StaleNotice'
import { ToastItem } from './ToastItem'
import { Toaster } from './Toaster'

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}

/** Checks run after mount; errors surface through Vue's error handling, captured here. */
const errors: Error[] = []
let wrapper: VueWrapper | undefined
const open = (root: () => unknown) => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  errors.length = 0
  wrapper = mount(
    defineComponent({
      setup() {
        onErrorCaptured((e) => {
          errors.push(e as Error)
          return false
        })
        return root
      },
    }),
    { attachTo: document.body, global: { plugins: [createPinia()] } },
  )
  return settle()
}
const messages = () => errors.map((e) => e.message).join('\n')
const spyError = () => vi.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
  errors.length = 0
  configureStrictMode('throw')
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
  configureStrictMode('off')
})

/** A component with one required rule: throws when `bad`, passes with each of `good`, warns and stays silent in the other modes. */
async function expectRule(bad: () => unknown, message: string, good: Array<() => unknown>) {
  await open(bad)
  expect(errors, `bad usage should throw: ${message}`).toHaveLength(1)
  expect(errors[0].name).toBe('ContractError')
  expect(errors[0].message).toContain(message)
  for (const ok of good) {
    await open(ok)
    expect(errors).toEqual([])
  }
  const spy = spyError()
  configureStrictMode('warn')
  await open(bad)
  expect(errors).toEqual([])
  expect(spy.mock.calls.map((c) => String(c[0])).join('\n')).toContain(message)
  spy.mockClear()
  configureStrictMode('off')
  await open(bad)
  expect(errors).toEqual([])
  expect(spy).not.toHaveBeenCalled()
  spy.mockRestore()
  configureStrictMode('throw')
}

describe('Alert, Banner and Callout contract', () => {
  it('Alert is empty without a title or text', () =>
    expectRule(() => h(Alert), 'Alert: is empty and requires a title or text', [
      () => h(Alert, null, () => 'Saved'),
      () => h(Alert, null, () => [h(AlertTitle, null, () => 'Heads up'), h(AlertDescription, null, () => 'Details')]),
      () => h(Alert, null, () => h('img', { src: 'x.png', alt: 'Status' })),
    ]))
  it('Alert with only an empty AlertTitle is still empty', async () => {
    await open(() => h(Alert, null, () => h(AlertTitle)))
    expect(messages()).toContain('Alert: is empty')
  })
  it('Alert dismissible needs a dismissLabel', () =>
    expectRule(() => h(Alert, { dismissible: true, dismissLabel: ' ' }, () => 'Saved'), 'Alert: requires a non-empty `dismissLabel`', [
      () => h(Alert, { dismissible: true }, () => 'Saved'),
      () => h(Alert, { dismissLabel: '' }, () => 'Not dismissible, so the label is unused'),
    ]))

  it('Banner is empty without text', () =>
    expectRule(() => h(Banner), 'Banner: is empty and requires a title or text', [() => h(Banner, null, () => 'Maintenance tonight'), () => h(Banner, { actionLabel: 'Details' }, () => 'Maintenance')]))
  it('Banner dismissible needs a dismissLabel, and without a storageKey it is allowed', async () => {
    await open(() => h(Banner, { dismissible: true, dismissLabel: '' }, () => 'Maintenance'))
    expect(messages()).toContain('Banner: requires a non-empty `dismissLabel`')
    await open(() => h(Banner, { dismissible: true }, () => 'Dismissal is not remembered without a storageKey'))
    expect(errors).toEqual([])
  })

  it('Callout is empty without a title or text', () =>
    expectRule(() => h(Callout), 'Callout: is empty and requires a title or text', [() => h(Callout, { title: 'Note' }), () => h(Callout, null, () => 'Body text')]))
})

describe('Callout dismiss contract', () => {
  it('Callout dismissible needs a dismissLabel', () =>
    expectRule(() => h(Callout, { title: 'Note', dismissible: true, dismissLabel: ' ' }), 'Callout: requires a non-empty `dismissLabel`', [
      () => h(Callout, { title: 'Note', dismissible: true }),
      () => h(Callout, { title: 'Note', dismissLabel: '' }),
    ]))
})

describe('EmptyState, ErrorState and LoadingState contract', () => {
  it('EmptyState needs a title', () =>
    expectRule(() => h(EmptyState, { description: 'Nothing here' }), 'EmptyState: requires a non-empty `title`', [
      () => h(EmptyState, { title: 'No invoices yet' }),
      () => h(EmptyState, null, { title: () => 'No invoices yet' }),
    ]))
  it('EmptyState rejects a blank title', async () => {
    await open(() => h(EmptyState, { title: '   ' }))
    expect(messages()).toContain('EmptyState: requires a non-empty `title`')
  })

  it('ErrorState needs a message', () =>
    expectRule(() => h(ErrorState, { title: 'Could not load' }), 'ErrorState: requires a `message`', [
      () => h(ErrorState, { message: 'The server did not answer.' }),
      () => h(ErrorState, { status: 404 }),
      () => h(ErrorState, null, () => 'The server did not answer.'),
    ]))

  it('LoadingState needs a label, on the spinner and on skeletons', async () => {
    await expectRule(() => h(LoadingState, { label: '' }), 'LoadingState: requires a non-empty `label`', [() => h(LoadingState), () => h(LoadingState, { label: 'Loading invoices' }), () => h(LoadingState, null, () => 'Loading invoices')])
    await open(() => h(LoadingState, { variant: 'table', label: ' ' }))
    expect(messages()).toContain('LoadingState: requires a non-empty `label`')
    await open(() => h(LoadingState, { variant: 'table' }))
    expect(errors).toEqual([])
  })
})

describe('ConfirmDialog contract', () => {
  const dialog = (props: Record<string, unknown> = {}) => () => h(ConfirmDialog, { open: true, title: 'Delete 3 invoices?', onConfirm: () => {}, ...props })
  it('a complete dialog satisfies the AlertDialog it is built from (title, description, wiring)', async () => {
    await open(dialog({ description: 'This cannot be undone.' }))
    expect(errors).toEqual([])
    await open(dialog())
    expect(errors).toEqual([])
  })
  it('needs a title and does not hide a blank one behind the generic fallback', () =>
    expectRule(dialog({ title: ' ' }), 'ConfirmDialog: requires a non-empty `title`', [dialog()]))
  it('needs `open`: it has no trigger of its own', () =>
    expectRule(() => h(ConfirmDialog, { title: 'Delete?', onConfirm: () => {} }), 'ConfirmDialog: requires `open`', [dialog(), () => h(ConfirmDialog, { open: false, title: 'Delete?', onConfirm: () => {} })]))
  it('needs a confirm handler, or the answer is lost', () =>
    expectRule(() => h(ConfirmDialog, { open: true, title: 'Delete?' }), 'ConfirmDialog: requires an `@confirm` handler', [dialog()]))
})

describe('useConfirm and ConfirmHost contract', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('confirm() throws when no ConfirmHost is mounted, because the promise could never settle', () => {
    const store = useConfirmStore()
    expect(() => store.confirm({ title: 'Delete?' })).toThrow(/useConfirm: requires a <ConfirmHost \/>/)
    expect(store.queue).toHaveLength(0)
  })
  it('confirm() works while a ConfirmHost is mounted, and stops once it unmounts', async () => {
    await open(() => h(ConfirmHost))
    const store = useConfirmStore()
    expect(store.hosts).toBe(1)
    const answer = store.confirm({ title: 'Delete?' })
    store.accept()
    await expect(answer).resolves.toBe(true)
    wrapper?.unmount()
    wrapper = undefined
    expect(store.hosts).toBe(0)
    expect(() => store.confirm({ title: 'Delete?' })).toThrow(/ConfirmHost/)
  })
  it('confirm() requires a non-empty title; warn mode falls back to the generic question', async () => {
    await open(() => h(ConfirmHost))
    const store = useConfirmStore()
    expect(() => store.confirm({ title: '  ' })).toThrow(/useConfirm: requires a non-empty `title`/)
    const spy = spyError()
    configureStrictMode('warn')
    void store.confirm({ title: '' })
    expect(store.current?.title).toBe('Are you sure?')
    expect(spy.mock.calls.map((c) => String(c[0])).join('\n')).toContain('requires a non-empty `title`')
    spy.mockRestore()
    configureStrictMode('off')
    store.cancel()
    void store.confirm({ title: '' })
    expect(store.current?.title).toBe('Are you sure?')
    store.clear()
  })
})

describe('Toaster and ToastItem contract', () => {
  it('Toaster needs a label for its region', () =>
    expectRule(() => h(Toaster, { label: '' }), 'Toaster: requires a non-empty `label`', [() => h(Toaster), () => h(Toaster, { label: 'Alerts' })]))
  it('ToastItem needs a title, like the toast store', () =>
    expectRule(() => h(ToastItem, { title: ' ' }), 'ToastItem: requires a non-empty `title`', [() => h(ToastItem, { title: 'Saved' })]))
  it('ToastItem needs names for the dismiss button and the action', async () => {
    await open(() => h(ToastItem, { title: 'Saved', dismissLabel: '' }))
    expect(messages()).toContain('ToastItem: requires a non-empty `dismissLabel`')
    await open(() => h(ToastItem, { title: 'Saved', action: { label: ' ', onClick: () => {} } }))
    expect(messages()).toContain('ToastItem: requires a non-empty `action.label`')
    await open(() => h(ToastItem, { title: 'Saved', action: { label: 'Undo', onClick: () => {} } }))
    expect(errors).toEqual([])
  })
})

describe('NotificationList contract', () => {
  const item = (over: Record<string, unknown> = {}) => ({ id: 1, title: 'Build finished', ...over })
  it('needs a label', () =>
    expectRule(() => h(NotificationList, { label: '', items: [item()] }), 'NotificationList: requires a non-empty `label`', [() => h(NotificationList, { items: [item()] }), () => h(NotificationList, { label: 'Deploys', items: [item()] })]))
  it('every item needs an id, unique in the list', async () => {
    await open(() => h(NotificationList, { items: [item({ id: undefined })] }))
    expect(messages()).toContain('NotificationList: item 1 requires an `id`')
    await open(() => h(NotificationList, { items: [item({ id: '' })] }))
    expect(messages()).toContain('item 1 requires an `id`')
    await open(() => h(NotificationList, { items: [item(), item({ title: 'Other' })] }))
    expect(messages()).toContain('NotificationList: item 2 repeats the id 1')
    await open(() => h(NotificationList, { items: [item({ id: 'a' }), item({ id: 2 }), item({ id: 3, read: true })] }))
    expect(errors).toEqual([])
  })
  it('every item needs a title', () =>
    expectRule(() => h(NotificationList, { items: [item({ title: ' ' })] }), 'NotificationList: item 1 requires a non-empty `title`', [() => h(NotificationList, { items: [] }), () => h(NotificationList, { items: [item()] })]))
  it('checks again when the items change', async () => {
    const items = ref([item()])
    await open(() => h(NotificationList, { items: items.value }))
    expect(errors).toEqual([])
    items.value = [item(), item()]
    await settle()
    expect(messages()).toContain('repeats the id 1')
  })
})

describe('StaleNotice contract', () => {
  it('needs a valid timestamp: missing or unparsable values are reported', async () => {
    await expectRule(() => h(StaleNotice), 'StaleNotice: requires a valid `timestamp`', [() => h(StaleNotice, { timestamp: new Date() }), () => h(StaleNotice, { timestamp: Date.now() - 60_000 }), () => h(StaleNotice, { timestamp: '2026-01-02T03:04:05Z' })])
    await open(() => h(StaleNotice, { timestamp: 'not a date' }))
    expect(messages()).toContain('StaleNotice: requires a valid `timestamp`')
    await open(() => h(StaleNotice, { timestamp: new Date('nope') }))
    expect(messages()).toContain('requires a valid `timestamp`')
  })
  it('checks again when the timestamp changes', async () => {
    const at = ref<unknown>(Date.now())
    await open(() => h(StaleNotice, { timestamp: at.value as number }))
    expect(errors).toEqual([])
    at.value = 'garbage'
    await settle()
    expect(messages()).toContain('requires a valid `timestamp`')
  })
})

describe('OfflineIndicator and InlineMessage', () => {
  it('OfflineIndicator has no requirements: it renders with nothing but defaults', async () => {
    await open(() => h(OfflineIndicator))
    await open(() => h(OfflineIndicator, { offline: true }))
    expect(errors).toEqual([])
  })
})
