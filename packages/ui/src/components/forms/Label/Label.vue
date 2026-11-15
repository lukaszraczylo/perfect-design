<script setup lang="ts">
import { computed, nextTick, onMounted, ref, type HTMLAttributes } from 'vue'
import { Label as RekaLabel, type LabelProps as RekaLabelProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import { labelVariants, type LabelSize, type LabelVariant } from './variants'

export interface LabelProps {
  /** Id of the labelled control. */
  for?: string
  as?: RekaLabelProps['as']
  asChild?: boolean
  /** Shows a destructive-coloured asterisk (decorative, aria-hidden) after the text. Pair with `required` on the control. */
  required?: boolean
  /** Dimmed style. Also set `disabled` on the control itself. */
  disabled?: boolean
  /** Text size: `sm` 12px, `md` 14px (default), `lg` 16px. Unknown values fall back to `md`. */
  size?: LabelSize
  /** `muted` renders the label in the muted text colour. Unknown values fall back to `default`. */
  variant?: LabelVariant
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<LabelProps>(), { size: 'md', variant: 'default' })

const LABELABLE = 'input:not([type=hidden]),select,textarea,button,meter,output,progress,[role=checkbox],[role=switch],[role=radio],[role=combobox],[role=slider],[role=spinbutton],[role=textbox]'
const labelRef = ref<{ $el?: Element } | null>(null)
// A label that points at nothing names nothing: it needs `for` (matching a control id) or a control nested inside it.
onMounted(async () => {
  await nextTick()
  const el = labelRef.value?.$el
  if (!el || el.nodeType !== 1) return
  if (props.for) {
    // `Field` wires its own label (a radio group is named through aria-labelledby, so `for` has no target there).
    if (el.getAttribute('data-slot') === 'field-label') return
    const root = el.getRootNode() as Document | ShadowRoot | Element
    // Only a label attached to a document can be checked; a detached tree cannot resolve ids.
    if ('getElementById' in root && !root.getElementById(props.for)) {
      violation('Label', 'for-target-missing', `\`for="${props.for}"\` does not match the id of any element. Give the control that id, or use the \`id\` of the \`Field\` that wraps it.`)
    }
    return
  }
  if (!el.matches(LABELABLE) && !el.querySelector(LABELABLE)) {
    violation('Label', 'requires-for', 'requires `for` (the id of the control it labels) or a control nested inside it. Wrap the control in `Field`, which sets `for` and `id` for you.')
  }
})
const SIZES: readonly LabelSize[] = ['sm', 'md', 'lg']
const classes = computed(() =>
  cn(
    labelVariants({ size: SIZES.includes(props.size) ? props.size : 'md', variant: props.variant === 'muted' ? 'muted' : 'default' }),
    props.disabled && 'cursor-not-allowed opacity-50',
    props.class,
  ),
)
</script>

<template>
  <RekaLabel
    ref="labelRef"
    data-slot="label"
    :for="props.for"
    :as="as"
    :as-child="asChild"
    :data-disabled="disabled ? '' : undefined"
    :class="classes"
  >
    <slot v-if="asChild" />
    <template v-else>
      <slot />
      <span v-if="required" data-slot="label-required" aria-hidden="true" class="text-destructive">*</span>
    </template>
  </RekaLabel>
</template>
