import { computed, inject, provide, toValue, useAttrs, type ComputedRef, type InjectionKey, type MaybeRefOrGetter } from 'vue'

/** Shared state a `Field` exposes to the control(s) it wraps. */
export interface FieldContext {
  /** Id the control must use so `<label for>` points at it. */
  id: ComputedRef<string>
  /** Id of the hint element (always rendered id; only referenced when a hint exists). */
  hintId: ComputedRef<string>
  /** Id of the error element. */
  errorId: ComputedRef<string>
  /** Space separated ids for `aria-describedby`, or undefined when nothing to describe. */
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
  required: ComputedRef<boolean>
  disabled: ComputedRef<boolean>
  /** Id of the rendered `<label>`, or undefined when the field has no label. Group controls use it for `aria-labelledby`. */
  labelId?: ComputedRef<string | undefined>
  /**
   * Controls report the browser's own `:user-invalid` message here. The Field shows it as the error text
   * (when no `error` prop is set) so `aria-invalid` and `aria-describedby` always point at a visible message.
   */
  setNativeError?: (message: string) => void
}

export const FIELD_CONTEXT_KEY: InjectionKey<FieldContext> = Symbol('perfect-design:field')

export function provideFieldContext(ctx: FieldContext): void {
  provide(FIELD_CONTEXT_KEY, ctx)
}

/** Returns the surrounding `Field` context, or `null` when the control is used standalone. */
export function useFieldContext(): FieldContext | null {
  return inject(FIELD_CONTEXT_KEY, null)
}

export interface FieldControlOptions {
  invalid?: MaybeRefOrGetter<boolean | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  required?: MaybeRefOrGetter<boolean | undefined>
}

/**
 * One-liner for form controls: merges the control's own props with the surrounding Field (if any).
 * Own `invalid`/`disabled`/`required` OR with the field's; `id` and `describedBy` come from the field only
 * (an explicit `id` / `aria-describedby` attribute on the control still wins through attribute fallthrough).
 */
export function useFieldControl(own: FieldControlOptions = {}) {
  const field = useFieldContext()
  const attrs = useAttrs()
  const invalid = computed(() => !!toValue(own.invalid) || !!field?.invalid.value)
  const required = computed(() => !!toValue(own.required) || !!field?.required.value)
  return {
    field,
    id: computed(() => field?.id.value),
    describedBy: computed(() => field?.describedBy.value),
    invalid,
    disabled: computed(() => !!toValue(own.disabled) || !!field?.disabled.value),
    required,
    /**
     * Value for the `aria-invalid` attribute: `'true'` when invalid, `'false'` for a required control that is
     * currently valid (Firefox and Safari expose an empty required field as invalid from page load otherwise),
     * and `undefined` otherwise.
     */
    ariaInvalid: computed(() => (invalid.value ? ('true' as const) : required.value ? ('false' as const) : undefined)),
    /** `aria-labelledby` for group controls (radiogroup, group): the Field label, unless the control carries its own name. */
    labelledBy: (): string | undefined => (attrs['aria-label'] || attrs['aria-labelledby'] ? undefined : field?.labelId?.value),
  }
}
