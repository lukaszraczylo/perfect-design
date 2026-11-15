<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import Button from '../../primitives/Button/Button.vue'
import {
  FORM_ACTIONS_ALIGNS,
  FORM_ACTIONS_LAYOUTS,
  FORM_ACTIONS_SIZES,
  FORM_ACTIONS_VARIANTS,
  formActionsVariants,
  type FormActionsAlign,
  type FormActionsLayout,
  type FormActionsSize,
  type FormActionsVariant,
} from './variants'

export interface FormActionsProps {
  /** Horizontal alignment of the actions. Ignored by `layout="split"`, which places the first action at the start. */
  align?: FormActionsAlign
  /**
   * `stacked` (default): full-width buttons in a column below `sm`, a row from `sm`. `inline`: a wrapping row at every width.
   * `split`: as `stacked`, with the first action at the start and the others at the end from `sm`.
   */
  layout?: FormActionsLayout
  /** Gap between actions, bar padding, and the size of the built-in buttons. Buttons in the default slot keep their own size. */
  size?: FormActionsSize
  /** Surface: `plain` (default), `bar` (full-width footer with a top border) or `boxed` (bordered, rounded panel). */
  variant?: FormActionsVariant
  /** Stick to the bottom of the scroll container with a top border and an opaque background. */
  sticky?: boolean
  /** Stack full-width buttons on small screens, in DOM order so focus order matches what is seen. Set `false` to keep a wrapping row. */
  stacked?: boolean
  /** Renders a primary `type="submit"` Button with this label (ignored when the default slot is used). */
  submitLabel?: string
  /** Renders an outline Button with this label that emits `cancel` (ignored when the default slot is used). */
  cancelLabel?: string
  /** Shows a spinner on the submit button and blocks it. */
  loading?: boolean
  submitDisabled?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<FormActionsProps>(), { align: 'end', stacked: true, layout: 'stacked', size: 'md', variant: 'plain' })
const emit = defineEmits<{
  /** Click on the built-in submit button. The native form submit still happens for `type="submit"`. */
  submit: [event: MouseEvent]
  cancel: [event: MouseEvent]
}>()

const attrs = useAttrs()
const root = ref<HTMLElement | null>(null)
// A bar with no buttons is a mistake, not an empty state: it needs slot content or a `submitLabel` / `cancelLabel`.
onMounted(async () => {
  await nextTick()
  const el = root.value
  if (el && !el.children.length && !el.textContent?.trim()) {
    violation('FormActions', 'requires-actions', 'renders no actions. Pass `submitLabel` / `cancelLabel` or put buttons in the default slot.')
  }
})
// An unnamed group adds noise for screen readers: only expose `role="group"` when the consumer names it.
const named = () => !!(attrs['aria-label'] || attrs['aria-labelledby'])

const pick = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback)
const size = computed(() => pick(FORM_ACTIONS_SIZES, props.size, 'md'))

const classes = computed(() => {
  const layout = pick(FORM_ACTIONS_LAYOUTS, props.layout, 'stacked')
  return cn(
    formActionsVariants({
      // `stacked="false"` is the older way to ask for a wrapping row; it only applies to the default layout.
      layout: layout === 'stacked' && !props.stacked ? 'inline' : layout,
      align: pick(FORM_ACTIONS_ALIGNS, props.align, 'end'),
      size: size.value,
      variant: pick(FORM_ACTIONS_VARIANTS, props.variant, 'plain'),
      sticky: !!props.sticky,
    }),
    props.class,
  )
})
</script>

<template>
  <div ref="root" data-slot="form-actions" :role="named() ? 'group' : undefined" :data-sticky="sticky ? '' : undefined" :class="classes">
    <slot>
      <Button v-if="cancelLabel" data-slot="form-actions-cancel" type="button" variant="outline" :size="size" @click="emit('cancel', $event)">
        {{ cancelLabel }}
      </Button>
      <Button
        v-if="submitLabel"
        data-slot="form-actions-submit"
        type="submit"
        :size="size"
        :loading="loading"
        :disabled="submitDisabled"
        @click="emit('submit', $event)"
      >
        {{ submitLabel }}
      </Button>
    </slot>
  </div>
</template>
