<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, useId, useSlots, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { accessibleName, violation } from '../../../lib/contract'
import Label from '../Label/Label.vue'
import { provideFieldContext } from './useFieldContext'

export interface FieldProps {
  /** Label text. Use the `label` slot for rich content. */
  label?: string
  /** Helper text shown under the control (or between label and control, see `hintPlacement`). */
  hint?: string
  /** Error message. Presence marks the control invalid (aria-invalid) and replaces the hint visually. */
  error?: string
  /** Mark invalid without a message. */
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  /** Control id; generated when omitted. */
  id?: string
  /** `horizontal` puts the label beside the control (good for checkbox/switch rows). */
  orientation?: 'vertical' | 'horizontal'
  /** `above` puts the hint between the label and the control. Ignored when `orientation` is `horizontal`. */
  hintPlacement?: 'below' | 'above'
  /** Text size of the label, hint and error, and the gap between them. Unknown values fall back to `md`. */
  size?: 'sm' | 'md' | 'lg'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<FieldProps>(), { orientation: 'vertical', hintPlacement: 'below', size: 'md' })
const slots = useSlots()
const attrs = useAttrs()

const uid = useId()
const controlId = computed(() => props.id ?? `field-${uid}`)
const labelId = computed(() => `${controlId.value}-label`)
const hintId = computed(() => `${controlId.value}-hint`)
const errorId = computed(() => `${controlId.value}-error`)

// Message from the browser's :user-invalid state, reported by the control (see useNativeValidation).
const nativeError = ref('')
const errorText = computed(() => props.error || nativeError.value)

const SIZE = {
  sm: { gap: 'gap-1', text: 'text-xs' },
  md: { gap: 'gap-1.5', text: 'text-sm' },
  lg: { gap: 'gap-2', text: 'text-base' },
} as const
const size = computed(() => (props.size === 'sm' || props.size === 'lg' ? props.size : 'md'))

const hasLabel = computed(() => !!props.label || !!slots.label)
const hasHint = computed(() => !!props.hint || !!slots.hint)
const hasError = computed(() => !!errorText.value || !!slots.error)
const invalid = computed(() => props.invalid || hasError.value)
const hintAbove = computed(() => props.hintPlacement === 'above' && props.orientation !== 'horizontal')
const describedBy = computed(() => {
  const ids = [hasHint.value ? hintId.value : '', hasError.value ? errorId.value : ''].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
})

// Controls a Field wraps. Hidden helper elements (reka's form bubble inputs) are aria-hidden and do not count.
const CONTROLS =
  'input:not([type=hidden]):not([aria-hidden=true]),textarea,select:not([aria-hidden=true]),[role=combobox],[role=slider],[role=radiogroup],[role=switch],[role=checkbox],[role=spinbutton],[role=textbox]'
const controlArea = ref<HTMLElement | null>(null)
onMounted(async () => {
  await nextTick()
  const controls = controlArea.value ? [...controlArea.value.querySelectorAll(CONTROLS)] : []
  if (!controls.length) return
  if (!hasLabel.value) {
    // Named some other way (aria-label on the Field, or on every wrapped control): nothing to enforce.
    if (attrs['aria-label'] || attrs['aria-labelledby'] || controls.every((c) => accessibleName(c))) return
    violation('Field', 'requires-label', 'requires a `label` (prop or slot) or an `aria-label` when it wraps a control. Add `label="..."`, or wrap the text in `VisuallyHidden` inside the `label` slot if it must not be visible.')
    return
  }
  // The label points at `for=<id>`: a native control inside must carry that id (or the control is named by aria-labelledby).
  const id = controlId.value
  const native = controls.some((c) => c.matches('input,textarea,select'))
  const wired = [...controlArea.value!.querySelectorAll('[id],[aria-labelledby]')].some((e) => e.id === id || e.getAttribute('aria-labelledby')?.split(/\s+/).includes(labelId.value))
  if (native && !wired) {
    violation('Field', 'id-mismatch', `its label points at id "${id}", but the control inside has a different id. Pass that id to \`Field\` (\`<Field id="...">\`) and leave \`id\` off the control.`)
  }
})

provideFieldContext({
  id: controlId,
  hintId,
  errorId,
  describedBy,
  invalid,
  required: computed(() => !!props.required),
  disabled: computed(() => !!props.disabled),
  labelId: computed(() => (hasLabel.value ? labelId.value : undefined)),
  setNativeError: (message: string) => {
    nativeError.value = message
  },
})
</script>

<template>
  <div
    data-slot="field"
    :data-invalid="invalid ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :data-orientation="orientation"
    :data-size="size"
    :class="
      cn(
        'group/field grid min-w-0',
        SIZE[size].gap,
        orientation === 'horizontal' &&
          'grid-cols-[auto_1fr] items-start gap-x-3 [&>[data-slot=field-hint]]:col-start-2 [&>[data-slot=field-error-region]]:col-start-2',
        props.class,
      )
    "
  >
    <Label
      v-if="hasLabel"
      :id="labelId"
      data-slot="field-label"
      :for="controlId"
      :required="required"
      :disabled="disabled"
      :size="size"
      :class="orientation === 'horizontal' ? 'col-start-2 row-start-1' : undefined"
    >
      <slot name="label">{{ label }}</slot>
    </Label>
    <p v-if="hasHint && hintAbove" :id="hintId" data-slot="field-hint" :class="cn(SIZE[size].text, 'text-muted-foreground')">
      <slot name="hint">{{ hint }}</slot>
    </p>
    <div ref="controlArea" data-slot="field-control" :class="orientation === 'horizontal' ? 'col-start-1 row-start-1' : 'min-w-0'">
      <slot />
    </div>
    <p v-if="hasHint && !hintAbove" :id="hintId" data-slot="field-hint" :class="cn(SIZE[size].text, 'text-muted-foreground')">
      <slot name="hint">{{ hint }}</slot>
    </p>
    <!--
      One polite live region that always exists: an error that appears or changes is announced, while an error
      that is already present when the page loads is not. Empty, it is taken out of the layout but not the a11y tree.
    -->
    <div data-slot="field-error-region" aria-live="polite" aria-atomic="true" class="empty:absolute">
      <p v-if="hasError" :id="errorId" data-slot="field-error" :class="cn(SIZE[size].text, 'font-medium text-destructive')">
        <slot name="error">{{ errorText }}</slot>
      </p>
    </div>
  </div>
</template>
