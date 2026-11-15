/**
 * The contract rules of the feedback components must hold in every variation (appearance, size, layout, tone, shape...):
 * a variant never relaxes a requirement, and a complete usage never trips one. Strict mode is on, so a violation throws.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { configureStrictMode } from '../../lib/contract'
import { Alert, AlertDescription, AlertTitle } from './Alert'
import { Banner } from './Banner'
import { Callout } from './Callout'
import { ConfirmDialog } from './ConfirmDialog'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { NotificationList } from './NotificationList'
import { OfflineIndicator } from './OfflineIndicator'
import { StaleNotice } from './StaleNotice'
import { ToastItem } from './ToastItem'
import { Toaster } from './Toaster'

/** `h` with loose typing: these tests pass arbitrary variation props on purpose. */
const hh = h as unknown as (c: unknown, props?: Record<string, unknown> | null, slots?: unknown) => ReturnType<typeof h>

const settle = async () => {
  for (let i = 0; i < 4; i++) await Promise.resolve()
  await nextTick()
  await nextTick()
  await new Promise((r) => setTimeout(r, 0))
}
const errors: Error[] = []
let wrapper: VueWrapper | undefined
async function open(root: () => unknown) {
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
  await settle()
}
const messages = () => errors.map((e) => e.message).join('\n')
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

async function expectRule(comp: unknown, variations: Record<string, unknown>[], bad: Record<string, unknown>, good: Record<string, unknown>, message: string, slot?: () => unknown) {
  for (const v of variations) {
    await open(() => hh(comp, { ...bad, ...v }, slot ? { default: slot } : undefined))
    expect(messages(), `${JSON.stringify(v)} must still throw`).toContain(message)
    await open(() => hh(comp, { ...good, ...v }, slot ? { default: slot } : undefined))
    expect(errors, `${JSON.stringify(v)} must not throw`).toEqual([])
  }
}

describe('Callout, Alert and Banner variations keep the content rule', () => {
  it('Callout', () =>
    expectRule(
      Callout,
      ['soft', 'solid', 'outline', 'minimal'].flatMap((appearance) => ['sm', 'lg'].map((size) => ({ appearance, size, dismissible: true }))),
      {},
      { title: 'Heads up' },
      'Callout: is empty and requires a title or text',
    ))
  it('Callout dismissLabel stays required in every appearance', async () => {
    for (const appearance of ['solid', 'minimal']) {
      await open(() => hh(Callout, { title: 'Note', appearance, dismissible: true, dismissLabel: '' }))
      expect(messages()).toContain('Callout: requires a non-empty `dismissLabel`')
    }
  })
  it('Alert with a title passes in the inline layout, an empty one throws', async () => {
    await open(() => hh(Alert, { layout: 'inline' }, { default: () => [h(AlertTitle, null, () => 'Heads up'), h(AlertDescription, null, () => 'Detail')], actions: () => hh('button', { type: 'button' }, 'Retry') }))
    expect(errors).toEqual([])
    await open(() => hh(Alert, { layout: 'inline' }))
    expect(messages()).toContain('Alert: is empty and requires a title or text')
  })
  it('Banner', async () => {
    for (const v of [{ size: 'sm' }, { layout: 'centered' }, { size: 'lg', layout: 'centered' }]) {
      await open(() => hh(Banner, v))
      expect(messages()).toContain('Banner: is empty and requires a title or text')
      await open(() => hh(Banner, v, () => 'Maintenance tonight'))
      expect(errors).toEqual([])
    }
  })
})

describe('States keep their rules in every variation', () => {
  it('EmptyState needs a title in every layout and tone', async () => {
    for (const v of [{ layout: 'start' }, { tone: 'danger' }, { variant: 'inline', layout: 'start', tone: 'info' }]) {
      await open(() => hh(EmptyState, { description: 'Nothing here', ...v }))
      expect(messages()).toContain('EmptyState: requires a non-empty `title`')
      await open(() => hh(EmptyState, { title: 'No invoices yet', ...v }))
      expect(errors).toEqual([])
    }
  })
  it('ErrorState needs a message in every size, layout and tone', async () => {
    for (const v of [{ size: 'sm' }, { layout: 'start', variant: 'page' }, { tone: 'warning', variant: 'inline' }, { tone: 'neutral', size: 'lg', variant: 'card' }]) {
      await open(() => hh(ErrorState, { title: 'Could not load', ...v }))
      expect(messages()).toContain('ErrorState: requires a `message`')
      await open(() => hh(ErrorState, { message: 'The server did not answer.', ...v }))
      expect(errors).toEqual([])
    }
  })
  it('LoadingState needs a label in every size, layout and shape', async () => {
    for (const v of [{ size: 'sm', layout: 'inline' }, { variant: 'table', shape: 'pill' }, { variant: 'list', shape: 'square', size: 'lg' }]) {
      await open(() => hh(LoadingState, { label: ' ', ...v }))
      expect(messages()).toContain('LoadingState: requires a non-empty `label`')
      await open(() => hh(LoadingState, { label: 'Loading invoices', ...v }))
      expect(errors).toEqual([])
    }
  })
  it('StaleNotice needs a valid timestamp in every variant and tone', async () => {
    for (const v of [{ variant: 'banner' }, { variant: 'pill', tone: 'info' }, { variant: 'inline', tone: 'danger' }]) {
      await open(() => hh(StaleNotice, { timestamp: 'garbage', ...v }))
      expect(messages()).toContain('StaleNotice: requires a valid `timestamp`')
      await open(() => hh(StaleNotice, { timestamp: Date.now() - 60_000, ...v }))
      expect(errors).toEqual([])
    }
  })
  it('OfflineIndicator has no requirement and mounts in every variant', async () => {
    for (const variant of ['default', 'banner', 'pill', 'inline']) {
      await open(() => hh(OfflineIndicator, { variant, offline: true }))
      expect(errors).toEqual([])
    }
  })
})

describe('Toasts, notifications and ConfirmDialog keep their rules in every variation', () => {
  it('ToastItem needs a title and a dismiss label in every layout and appearance', async () => {
    for (const v of [{ layout: 'compact' }, { layout: 'inline', appearance: 'solid' }, { appearance: 'soft', variant: 'danger' }]) {
      await open(() => hh(ToastItem, { title: ' ', ...v }))
      expect(messages()).toContain('ToastItem: requires a non-empty `title`')
      await open(() => hh(ToastItem, { title: 'Saved', dismissLabel: '', ...v }))
      expect(messages()).toContain('ToastItem: requires a non-empty `dismissLabel`')
      await open(() => hh(ToastItem, { title: 'Saved', action: { label: '', onClick: () => {} }, ...v }))
      expect(messages()).toContain('ToastItem: requires a non-empty `action.label`')
      await open(() => hh(ToastItem, { title: 'Saved', action: { label: 'Undo', onClick: () => {} }, ...v }))
      expect(errors).toEqual([])
    }
  })
  it('Toaster needs a label with layout and appearance set', async () => {
    await open(() => hh(Toaster, { label: '', layout: 'compact', appearance: 'solid' }))
    expect(messages()).toContain('Toaster: requires a non-empty `label`')
    await open(() => hh(Toaster, { layout: 'compact', appearance: 'solid' }))
    expect(errors).toEqual([])
  })
  it('NotificationList keeps its item and label rules in flush and square', async () => {
    const good = [{ id: 1, title: 'Deploy finished' }]
    await open(() => hh(NotificationList, { items: good, appearance: 'flush', shape: 'square' }))
    expect(errors).toEqual([])
    await open(() => hh(NotificationList, { items: [{ title: 'No id' }], appearance: 'flush', shape: 'square' }))
    expect(messages()).toContain('requires an `id`')
    await open(() => hh(NotificationList, { items: good, label: '', appearance: 'flush' }))
    expect(messages()).toContain('NotificationList: requires a non-empty `label`')
  })
  it('ConfirmDialog keeps the AlertDialog title, description and its own rules for every tone, size and variant', async () => {
    const dialog = (extra: Record<string, unknown>) => () => hh(ConfirmDialog, { open: true, title: 'Delete 3 invoices?', onConfirm: () => {}, ...extra })
    const sizes = ['xs', 'sm', 'md', 'lg']
    const variants = ['default', 'centered']
    const tones = ['neutral', 'danger', 'warning', 'success', 'info']
    // every tone, size and variant is covered at least twice (with and without a description)
    for (const [i, tone] of tones.entries()) {
      for (const j of [0, 1]) {
        const extra = { tone, size: sizes[(i + j) % 4], variant: variants[(i + j) % 2] }
        await open(dialog(extra))
        expect(errors, JSON.stringify(extra)).toEqual([])
        await open(dialog({ ...extra, description: 'This cannot be undone.' }))
        expect(errors, JSON.stringify(extra)).toEqual([])
      }
    }
    await open(dialog({ tone: 'danger', title: ' ' }))
    expect(messages()).toContain('ConfirmDialog: requires a non-empty `title`')
    await open(() => hh(ConfirmDialog, { open: true, title: 'Delete?', tone: 'warning' }))
    expect(messages()).toContain('ConfirmDialog: requires an `@confirm` handler')
    await open(() => hh(ConfirmDialog, { title: 'Delete?', tone: 'warning', onConfirm: () => {} }))
    expect(messages()).toContain('ConfirmDialog: requires `open`')
  })
})
