import { nextTick, onMounted, useAttrs, useId } from 'vue'
import { requireText, violation } from '../../../lib/contract'

/**
 * Accessible-name wiring shared by DatePicker and DateRangePicker triggers.
 *
 * The trigger is a button whose visible text is the formatted value (or the placeholder). Its name is built with
 * `aria-labelledby="<label source> <value>"` so the visible text is always part of the name (WCAG 2.5.3):
 * the label source is the trigger itself (which resolves to its `aria-label` or the `<label for>` of a Field)
 * or the consumer's own `aria-labelledby`. `aria-required` is not allowed on a button, so "required" is exposed
 * as a visually hidden description instead.
 *
 * `triggerAttrs()` reads the live attrs, so call it from the template (it must run on every render).
 */
export function usePickerTrigger(opts: { id: () => string | undefined; describedBy: () => string | undefined; required: () => boolean }) {
  const attrs = useAttrs()
  const uid = useId()
  const valueId = `${uid}-value`
  const requiredId = `${uid}-required`

  function triggerAttrs() {
    const id = (attrs.id as string | undefined) || opts.id() || `${uid}-trigger`
    const ownLabelledBy = attrs['aria-labelledby'] as string | undefined
    const base = (attrs['aria-describedby'] as string | undefined) ?? opts.describedBy()
    const describedBy = [base, opts.required() ? requiredId : ''].filter(Boolean).join(' ') || undefined
    return { ...attrs, id, 'aria-labelledby': `${ownLabelledBy || id} ${valueId}`, 'aria-describedby': describedBy }
  }

  return { valueId, requiredId, triggerAttrs }
}

/**
 * Contract of both picker triggers. The trigger's own text is the value or the placeholder, which never says what the
 * date is for, so a label source is required: `Field` label (`<label for>`), `aria-label` or an own `aria-labelledby`
 * that points at text other than the trigger and its value. Also checks the labels of the clear button and the dialog.
 */
export function useRequirePickerName(
  component: string,
  trigger: () => HTMLElement | null | undefined,
  valueId: string,
  labels: () => { clearLabel?: string; clearable?: boolean; dialogLabel?: string },
) {
  const attrs = useAttrs()
  onMounted(async () => {
    await nextTick()
    const el = trigger()
    if (!el) return
    const textOf = (n: Element | null) => n?.textContent?.trim() ?? ''
    const own = String(attrs['aria-labelledby'] ?? '').split(/\s+/).filter(Boolean)
    const named =
      !!String(attrs['aria-label'] ?? '').trim() ||
      own.some((id) => id !== el.id && id !== valueId && textOf(el.ownerDocument.getElementById(id))) ||
      [...((el as HTMLButtonElement).labels ?? [])].some((l) => textOf(l))
    if (!named) {
      violation(component, 'requires-accessible-name', 'needs an accessible name. The trigger only shows the value or placeholder. Wrap it in `Field` with a `label`, or set `aria-label` / `aria-labelledby`.')
    }
    const { clearLabel, clearable, dialogLabel } = labels()
    if (clearable) requireText(component, 'clearLabel', clearLabel, 'It names the clear button; leave it unset for the default.')
    requireText(component, 'dialogLabel', dialogLabel, 'It names the dropdown dialog; leave it unset for the default.')
  })
}
