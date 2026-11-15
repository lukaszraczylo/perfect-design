import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './index'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

function make(
  opts: {
    open?: boolean
    contentProps?: Record<string, unknown>
    actionProps?: Record<string, unknown>
    cancelProps?: Record<string, unknown>
    onAction?: () => void
  } = {},
) {
  const open = ref(opts.open ?? false)
  const Comp = defineComponent({
    setup: () => () =>
      h(AlertDialog, { open: open.value, 'onUpdate:open': (v: boolean) => (open.value = v) }, () => [
        h(AlertDialogTrigger, null, () => 'Delete'),
        h(AlertDialogContent, opts.contentProps ?? {}, () => [
          h(AlertDialogHeader, { class: 'custom-header' }, () => [
            h(AlertDialogTitle, { class: 'custom-title' }, () => 'Are you sure?'),
            h(AlertDialogDescription, { class: 'custom-desc' }, () => 'This cannot be undone.'),
          ]),
          h(AlertDialogFooter, { class: 'custom-footer' }, () => [
            h(AlertDialogCancel, opts.cancelProps ?? {}, () => 'Cancel'),
            h(AlertDialogAction, { onClick: opts.onAction, ...(opts.actionProps ?? {}) }, () => 'Confirm'),
          ]),
        ]),
      ]),
  })
  wrapper = mount(Comp, { attachTo: document.body })
  return { open }
}
const q = (s: string) => document.body.querySelector(s) as HTMLElement | null

describe('AlertDialog', () => {
  it('is closed by default and renders no content', () => {
    make()
    expect(q('[data-slot="alert-dialog-content"]')).toBeNull()
    expect(q('[data-slot="alert-dialog-trigger"]')).not.toBeNull()
  })

  it('opens on trigger click and shows title and description', async () => {
    const { open } = make()
    q('[data-slot="alert-dialog-trigger"]')!.click()
    await nextTick()
    expect(open.value).toBe(true)
    expect(q('[data-slot="alert-dialog-title"]')?.textContent).toBe('Are you sure?')
    expect(q('[data-slot="alert-dialog-description"]')?.textContent).toBe('This cannot be undone.')
    expect(q('[data-slot="alert-dialog-overlay"]')).not.toBeNull()
  })

  it('has role=alertdialog labelled by its title and described by its description', async () => {
    make({ open: true })
    await nextTick()
    const dlg = q('[role="alertdialog"]')!
    expect(dlg).not.toBeNull()
    expect(dlg.getAttribute('aria-labelledby')).toBe(q('[data-slot="alert-dialog-title"]')?.id)
    expect(dlg.getAttribute('aria-describedby')).toBe(q('[data-slot="alert-dialog-description"]')?.id)
  })

  it('moves initial focus to the Cancel button (safe default)', async () => {
    make({ open: true })
    await nextTick()
    await new Promise((r) => setTimeout(r, 5))
    expect(document.activeElement).toBe(q('[data-slot="alert-dialog-cancel"]'))
  })

  it('has no built-in close (X) button', async () => {
    make({ open: true })
    await nextTick()
    expect(q('[aria-label="Close"]')).toBeNull()
  })

  it('Cancel closes without running the action', async () => {
    const onAction = vi.fn()
    const { open } = make({ open: true, onAction })
    await nextTick()
    q('[data-slot="alert-dialog-cancel"]')!.click()
    await nextTick()
    expect(open.value).toBe(false)
    expect(onAction).not.toHaveBeenCalled()
  })

  it('Action fires click and closes', async () => {
    const onAction = vi.fn()
    const { open } = make({ open: true, onAction })
    await nextTick()
    q('[data-slot="alert-dialog-action"]')!.click()
    await nextTick()
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(open.value).toBe(false)
  })

  it('closes on Escape', async () => {
    const { open } = make({ open: true })
    await nextTick()
    q('[role="alertdialog"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(open.value).toBe(false)
  })

  it('does NOT close on outside (overlay) click', async () => {
    const { open } = make({ open: true })
    await nextTick()
    const overlay = q('[data-slot="alert-dialog-overlay"]')!
    overlay.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }))
    overlay.click()
    await nextTick()
    expect(open.value).toBe(true)
    expect(q('[data-slot="alert-dialog-content"]')).not.toBeNull()
  })

  it('works uncontrolled with defaultOpen', async () => {
    wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(AlertDialog, { defaultOpen: true }, () => h(AlertDialogContent, null, () => [h(AlertDialogTitle, null, () => 'T'), h(AlertDialogDescription, null, () => 'D'), h(AlertDialogCancel, null, () => 'No')])),
      }),
      { attachTo: document.body },
    )
    await nextTick()
    expect(q('[data-slot="alert-dialog-content"]')).not.toBeNull()
    q('[data-slot="alert-dialog-cancel"]')!.click()
    await nextTick()
    await new Promise((r) => setTimeout(r, 0))
    expect(q('[data-slot="alert-dialog-content"]')).toBeNull()
  })

  describe('actions', () => {
    it('default action is the primary button, cancel is outline', async () => {
      make({ open: true })
      await nextTick()
      expect(q('[data-slot="alert-dialog-action"]')!.className).toContain('bg-primary')
      expect(q('[data-slot="alert-dialog-cancel"]')!.className).toContain('border')
    })

    it('destructive action uses buttonVariants destructive', async () => {
      make({ open: true, actionProps: { variant: 'destructive' } })
      await nextTick()
      const cls = q('[data-slot="alert-dialog-action"]')!.className
      expect(cls).toContain('bg-destructive')
      expect(cls).not.toContain('bg-primary')
    })

    it('size applies to action and cancel', async () => {
      make({ open: true, actionProps: { size: 'sm' }, cancelProps: { size: 'lg', variant: 'ghost' } })
      await nextTick()
      expect(q('[data-slot="alert-dialog-action"]')!.className).toContain('h-8')
      expect(q('[data-slot="alert-dialog-cancel"]')!.className).toContain('h-11')
    })

    it('class override wins over variant classes', async () => {
      make({ open: true, actionProps: { class: 'bg-success' } })
      await nextTick()
      const cls = q('[data-slot="alert-dialog-action"]')!.className
      expect(cls).toContain('bg-success')
      expect(cls.split(' ')).not.toContain('bg-primary')
    })
  })

  describe('customisation', () => {
    it('merges classes on every part', async () => {
      make({ open: true, contentProps: { class: 'bg-red-500' } })
      await nextTick()
      const c = q('[data-slot="alert-dialog-content"]')!
      expect(c.className).toContain('bg-red-500')
      expect(c.className).not.toContain('bg-popover')
      expect(q('[data-slot="alert-dialog-header"]')!.className).toContain('custom-header')
      expect(q('[data-slot="alert-dialog-footer"]')!.className).toContain('custom-footer')
      expect(q('[data-slot="alert-dialog-title"]')!.className).toContain('custom-title')
      expect(q('[data-slot="alert-dialog-description"]')!.className).toContain('custom-desc')
    })

    it('falls through attributes to the content element', async () => {
      make({ open: true, contentProps: { 'data-testid': 'alert', 'aria-label': 'Confirm delete' } })
      await nextTick()
      const c = q('[data-slot="alert-dialog-content"]')!
      expect(c.getAttribute('data-testid')).toBe('alert')
      expect(c.getAttribute('aria-label')).toBe('Confirm delete')
    })

    it('applies size presets and falls back to md for unknown sizes', async () => {
      make({ open: true, contentProps: { size: 'sm' } })
      await nextTick()
      expect(q('[data-slot="alert-dialog-content"]')!.className).toContain('sm:max-w-sm')
      wrapper?.unmount()
      document.body.innerHTML = ''
      make({ open: true, contentProps: { size: 'nope' } })
      await nextTick()
      expect(q('[data-slot="alert-dialog-content"]')!.className).toContain('sm:max-w-lg')
    })
  })

  describe('edge cases', () => {
    it('toggles rapidly without leaving stale content', async () => {
      const { open } = make()
      for (let i = 0; i < 5; i++) {
        open.value = !open.value
        await nextTick()
      }
      expect(open.value).toBe(true)
      expect(document.body.querySelectorAll('[data-slot="alert-dialog-content"]')).toHaveLength(1)
    })

    it('handles empty content and unicode/RTL titles', async () => {
      wrapper = mount(
        defineComponent({
          setup: () => () =>
            h(AlertDialog, { open: true }, () => h(AlertDialogContent, null, () => [h(AlertDialogTitle, null, () => 'מחק פריט 🗑️ 削除'), h(AlertDialogDescription)])),
        }),
        { attachTo: document.body },
      )
      await nextTick()
      expect(q('[data-slot="alert-dialog-title"]')!.textContent).toBe('מחק פריט 🗑️ 削除')
      expect(q('[data-slot="alert-dialog-description"]')!.textContent).toBe('')
    })

    it('removes content from the body when unmounted while open', async () => {
      make({ open: true })
      await nextTick()
      expect(q('[role="alertdialog"]')).not.toBeNull()
      wrapper!.unmount()
      wrapper = undefined
      expect(q('[role="alertdialog"]')).toBeNull()
      expect(q('[data-slot="alert-dialog-overlay"]')).toBeNull()
    })
  })
})
