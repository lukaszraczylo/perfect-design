<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, useId, useSlots, watch } from 'vue'
import { cn } from '../../../lib/cn'
import { requireText, violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Input from '../../forms/Input/Input.vue'
import { oneOf } from '../shared/pick'
import {
  NEWSLETTER_BUTTON_ROUNDED,
  NEWSLETTER_CONTROL_SIZES,
  NEWSLETTER_SHAPES,
  NEWSLETTER_SIZES,
  NEWSLETTER_STATUSES,
  NEWSLETTER_VARIANTS,
  newsletterSignupButtonVariants,
  newsletterSignupDescriptionVariants,
  newsletterSignupFieldVariants,
  newsletterSignupFormVariants,
  newsletterSignupHeaderVariants,
  newsletterSignupSideVariants,
  newsletterSignupTitleVariants,
  newsletterSignupVariants,
  type NewsletterSignupShape,
  type NewsletterSignupSize,
  type NewsletterSignupVariant,
  type NewsletterStatus,
} from './variants'

export interface NewsletterSignupProps extends BaseProps {
  /** Layout: `inline`, `stacked`, `card` or `split` (copy left, form right from `lg`). Unknown values fall back to `inline`. */
  variant?: NewsletterSignupVariant
  /** Controls, title and spacing: `sm` (36px controls), `md` (the original, 44px) or `lg` (48px). Unknown values fall back to `md`. */
  size?: NewsletterSignupSize
  /** Corners of the field and the button: `rounded` (the original), `pill` or `square`. Unknown values fall back to `rounded`. */
  shape?: NewsletterSignupShape
  /** Driven by the parent after handling `subscribe`. Unknown values fall back to `idle`. */
  status?: NewsletterStatus
  /** Email value (v-model). Optional: the component also works uncontrolled. */
  modelValue?: string
  title?: string
  description?: string
  /** Heading level of the title (1-6). Invalid values fall back to 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  placeholder?: string
  buttonLabel?: string
  /** Visually hidden label of the email input. */
  label?: string
  /** Shown (role="status") when `status` is `success`. */
  successMessage?: string
  /** Shown (role="alert") when `status` is `error`. */
  errorMessage?: string
  /** Shown (role="alert") when the typed email fails validation; focus also moves to the input. */
  invalidMessage?: string
  /** Clear the input when `status` becomes `success`. */
  resetOnSuccess?: boolean
}

const props = withDefaults(defineProps<NewsletterSignupProps>(), {
  variant: 'inline',
  size: 'md',
  shape: 'rounded',
  status: 'idle',
  level: 2,
  placeholder: 'Enter your email',
  buttonLabel: 'Subscribe',
  label: 'Email address',
  successMessage: 'Thanks for subscribing!',
  errorMessage: 'Something went wrong. Please try again.',
  invalidMessage: 'Enter a valid email address.',
  resetOnSuccess: false,
})
const emit = defineEmits<{
  /** Valid, trimmed email. The parent performs the request and drives `status`. */
  subscribe: [email: string]
  'update:modelValue': [value: string]
}>()

// The form emits `subscribe`; without a listener a valid submit goes nowhere.
const instance = getCurrentInstance()
const slots = useSlots()
onMounted(async () => {
  await nextTick()
  const listening = Object.keys(instance?.vnode.props ?? {}).some((k) => /^onSubscribe(Once|Capture)?$/.test(k))
  if (!listening) {
    violation('NewsletterSignup', 'requires-subscribe-handler', 'requires a `@subscribe` handler. The form only emits `subscribe` with the email and makes no request itself, so without a listener it submits nowhere.')
  }
  requireText('NewsletterSignup', 'label', props.label, 'It is the accessible name of the email input.')
  requireText('NewsletterSignup', 'buttonLabel', props.buttonLabel, 'It is the accessible name of the submit button.')
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const uid = useId()
const inputId = `${uid}-email`
const errorId = `${uid}-error`
const titleId = `${uid}-title`

const variant = computed<NewsletterSignupVariant>(() => (NEWSLETTER_VARIANTS.includes(props.variant) ? props.variant : 'inline'))
const size = computed<NewsletterSignupSize>(() => oneOf(props.size, NEWSLETTER_SIZES, 'md'))
const shape = computed<NewsletterSignupShape>(() => oneOf(props.shape, NEWSLETTER_SHAPES, 'rounded'))
const status = computed<NewsletterStatus>(() => (NEWSLETTER_STATUSES.includes(props.status) ? props.status : 'idle'))
const loading = computed(() => status.value === 'loading')
const tag = computed(() => (Number.isInteger(props.level) && props.level >= 1 && props.level <= 6 ? `h${props.level}` : 'h2'))

const email = ref(props.modelValue ?? '')
watch(
  () => props.modelValue,
  (v) => (email.value = v ?? ''),
)

const invalid = ref(false)
const formEl = ref<HTMLFormElement | null>(null)
const error = computed(() => (invalid.value ? props.invalidMessage : status.value === 'error' ? props.errorMessage : ''))

watch(status, (s) => {
  if (s === 'success' && props.resetOnSuccess) {
    email.value = ''
    invalid.value = false
    emit('update:modelValue', '')
  }
})

function isValidEmail(value: string) {
  return value.length <= 254 && EMAIL_RE.test(value)
}

function onInput(value: string | number) {
  const next = String(value)
  email.value = next
  if (invalid.value && isValidEmail(next.trim())) invalid.value = false
  emit('update:modelValue', next)
}

// Blocks a second submit in the same tick, before the parent had a chance to flip `status` to `loading`.
let latched = false
function onSubmit() {
  if (loading.value || latched) return
  const value = email.value.trim()
  if (!isValidEmail(value)) {
    invalid.value = true
    // The form is `novalidate`, so native validation will not move focus: do it here (the error is then read with the field).
    formEl.value?.querySelector('input')?.focus()
    return
  }
  invalid.value = false
  latched = true
  void nextTick(() => (latched = false))
  emit('subscribe', value)
}

const classes = computed(() => cn(newsletterSignupVariants({ variant: variant.value, size: size.value }), props.class))
const hasHeader = (): boolean => !!(props.title || props.description || slots.title || slots.description)
// Plain functions (not computed): slots are not reactive, so re-evaluate on every render.
const sideClass = () => newsletterSignupSideVariants({ variant: variant.value, header: hasHeader() })
const headerClass = computed(() => newsletterSignupHeaderVariants({ variant: variant.value }))
const formClass = () => cn(newsletterSignupFormVariants({ variant: variant.value }), sideClass())
const titleClass = computed(() => newsletterSignupTitleVariants({ size: size.value }))
const descriptionClass = computed(() => newsletterSignupDescriptionVariants({ size: size.value }))
const fieldClass = computed(() => newsletterSignupFieldVariants({ variant: variant.value, size: size.value, shape: shape.value }))
const buttonClass = computed(() => newsletterSignupButtonVariants({ size: size.value }))
const controlSize = computed(() => NEWSLETTER_CONTROL_SIZES[size.value])
const buttonRounded = computed(() => NEWSLETTER_BUTTON_ROUNDED[shape.value])
</script>

<template>
  <div data-slot="newsletter-signup" :data-variant="variant" :data-size="size" :data-shape="shape" :data-status="status" :class="classes">
    <div v-if="title || description || $slots.title || $slots.description" data-slot="newsletter-signup-header" :class="headerClass">
      <component :is="tag" v-if="title || $slots.title" :id="titleId" data-slot="newsletter-signup-title" :class="titleClass">
        <slot name="title">{{ title }}</slot>
      </component>
      <p v-if="description || $slots.description" data-slot="newsletter-signup-description" :class="descriptionClass">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
    <form
      ref="formEl"
      data-slot="newsletter-signup-form"
      novalidate
      :aria-labelledby="title || $slots.title ? titleId : undefined"
      :aria-busy="loading ? 'true' : undefined"
      :class="formClass()"
      @submit.prevent="onSubmit"
    >
      <label data-slot="newsletter-signup-label" :for="inputId" class="sr-only">{{ label }}</label>
      <Input
        :id="inputId"
        type="email"
        name="email"
        autocomplete="email"
        :size="controlSize"
        :class="fieldClass"
        :model-value="email"
        :placeholder="placeholder"
        :readonly="loading"
        :invalid="invalid"
        :aria-describedby="error ? errorId : undefined"
        @update:model-value="onInput"
      />
      <Button type="submit" :size="controlSize" :rounded="buttonRounded" :loading="loading" :class="buttonClass">{{ buttonLabel }}</Button>
    </form>
    <p v-if="error" :id="errorId" data-slot="newsletter-signup-error" role="alert" :class="cn('text-sm text-destructive', sideClass())">{{ error }}</p>
    <!-- Persistent live region: announcements are more reliable when the region exists before its text changes. -->
    <p data-slot="newsletter-signup-status" role="status" :class="cn('text-sm font-medium text-success empty:hidden', sideClass())"><template v-if="status === 'success' && !error">{{ successMessage }}</template></p>
  </div>
</template>
