<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useAttrs, useId, useSlots, watch, type Component, type FunctionalComponent } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Button from '../../primitives/Button/Button.vue'
import Switch from '../../forms/Switch/Switch.vue'
import Dialog from '../../overlays/Dialog/Dialog.vue'
import DialogContent from '../../overlays/Dialog/DialogContent.vue'
import DialogTitle from '../../overlays/Dialog/DialogTitle.vue'
import DialogDescription from '../../overlays/Dialog/DialogDescription.vue'
import { headingTag, oneOf } from '../shared/pick'
import { buildChoice, cleanCategories, resolveChoices, type ConsentCategory, type ConsentChoice } from './categories'
import { COOKIE_CONSENT_VARIANTS, cookieConsentActionsVariants, cookieConsentVariants, type CookieConsentVariant } from './variants'

export interface CookieConsentProps extends BaseProps {
  /** Look: `banner` (full-width bar, categories behind a button), `modal` (dialog with a focus trap) or `inline` (card, categories always shown). Unknown values fall back to `banner`. */
  variant?: CookieConsentVariant
  /** Categories with a toggle each. Entries without a usable `id` and duplicate ids are dropped. */
  categories?: ConsentCategory[]
  /** Current toggle state by category id (`v-model`). Optional categories are off unless this says `true`; necessary ones are always on. */
  modelValue?: Record<string, boolean>
  /** Whether the notice is shown (`v-model:open`). Omit it and the component hides itself after a choice. */
  open?: boolean
  /** Heading and accessible name. Required text (or `aria-label` / `aria-labelledby`). */
  title?: string
  /** Heading level of the title for `banner` and `inline` (1-6). Invalid values fall back to 2. The dialog title is always an `h2`. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  description?: string
  acceptLabel?: string
  rejectLabel?: string
  saveLabel?: string
  /** Button that shows and hides the categories in the `banner` variant. */
  manageLabel?: string
  /** Text next to a necessary category that says it cannot be switched off. */
  alwaysOnLabel?: string
  /** Accessible name of the list of categories. */
  categoriesLabel?: string
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<CookieConsentProps>(), {
  variant: 'banner',
  categories: () => [],
  modelValue: undefined,
  open: undefined,
  title: 'Cookie preferences',
  level: 2,
  description: 'We use cookies to run this site. Optional categories stay off until you turn them on.',
  acceptLabel: 'Accept all',
  rejectLabel: 'Reject all',
  saveLabel: 'Save choices',
  manageLabel: 'Choose categories',
  alwaysOnLabel: 'Always on',
  categoriesLabel: 'Cookie categories',
})
const emit = defineEmits<{
  /** The user picked an action. Closing the dialog with Escape or the close button never emits this. */
  change: [choice: ConsentChoice]
  'update:modelValue': [value: Record<string, boolean>]
  'update:open': [value: boolean]
  /** The modal was closed (Escape or the close button) without a choice. */
  dismiss: []
}>()
const attrs = useAttrs()
const slots = useSlots()

const uid = useId()
const titleId = `${uid}-title`
const panelId = `${uid}-categories`

onMounted(async () => {
  await nextTick()
  const named = !!(typeof props.title === 'string' && props.title.trim()) || !!slots.title || !!attrs['aria-label'] || !!attrs['aria-labelledby']
  if (!named) {
    violation('CookieConsent', 'requires-accessible-name', 'needs an accessible name: set `title` (or the `title` slot), `aria-label` or `aria-labelledby`. It names the region and the dialog.')
  }
})

const variant = computed<CookieConsentVariant>(() => oneOf(props.variant, COOKIE_CONSENT_VARIANTS, 'banner'))
const modal = computed(() => variant.value === 'modal')
const cats = computed(() => cleanCategories(props.categories))
const tag = computed(() => headingTag(props.level))

const internalOpen = ref(true)
const isOpen = computed(() => (typeof props.open === 'boolean' ? props.open : internalOpen.value))

const choices = ref<Record<string, boolean>>(resolveChoices(cats.value, props.modelValue))
watch([cats, () => props.modelValue], () => {
  choices.value = resolveChoices(cats.value, props.modelValue ?? choices.value)
})

const expanded = ref(false)
const showCategories = computed(() => cats.value.length > 0 && (variant.value !== 'banner' || expanded.value))
const canManage = computed(() => variant.value === 'banner' && cats.value.length > 0)

function toggle(category: ConsentCategory, value: boolean) {
  if (category.necessary) return
  choices.value = { ...choices.value, [category.id]: value === true }
  emit('update:modelValue', choices.value)
}

function decide(action: ConsentChoice['action']) {
  const choice = buildChoice(action, cats.value, choices.value)
  choices.value = choice.categories
  emit('change', choice)
  emit('update:modelValue', choice.categories)
  internalOpen.value = false
  emit('update:open', false)
}

function onDialogOpen(value: boolean) {
  if (value) return
  internalOpen.value = false
  emit('update:open', false)
  emit('dismiss')
}

function describe(category: ConsentCategory): string | undefined {
  const text = [category.necessary ? props.alwaysOnLabel : '', category.description ?? ''].map((s) => s.trim()).filter(Boolean)
  return text.length ? text.join('. ') : undefined
}

// The dialog shell for `modal`; the other variants render their panel straight into the page.
const Bare: FunctionalComponent = (_props, { slots }) => slots.default?.()
const Shell = computed<Component>(() => (modal.value ? DialogContent : Bare))
const Panel = computed(() => (modal.value ? 'div' : 'section'))
const Heading = computed<Component | string>(() => (modal.value ? DialogTitle : tag.value))
const Desc = computed<Component | string>(() => (modal.value ? DialogDescription : 'p'))
const hasTitle = computed(() => !!(props.title?.trim() || slots.title))
const hasDescription = computed(() => !!(props.description?.trim() || slots.description))
// Without a visible title the dialog is still named: `aria-label` becomes a hidden title (DialogContent does not pass attributes on).
const hiddenTitle = computed(() => (modal.value && !hasTitle.value && typeof attrs['aria-label'] === 'string' ? attrs['aria-label'].trim() : ''))

// DialogContent renders through a portal, so it takes no attributes: `class` and the rest go on the panel inside it.
// Escape and the close button dismiss; a click outside does not (a stray click is not a choice).
const shellProps = computed(() => (modal.value ? { size: 'lg', showClose: true, onInteractOutside: (e: Event) => e.preventDefault() } : {}))
const panelAttrs = computed(() => {
  const base = { ...attrs, 'data-slot': 'cookie-consent', 'data-variant': variant.value }
  return modal.value ? base : { ...base, 'aria-labelledby': attrs['aria-labelledby'] ?? (hasTitle.value ? titleId : undefined) }
})
const rootClass = computed(() => cn(cookieConsentVariants({ variant: variant.value }), props.class))
const actionsClass = cookieConsentActionsVariants()
// Same variant, size and classes on accept and reject: neither is easier to reach or to see than the other.
const choiceButton = 'w-full sm:w-auto'
</script>

<template>
  <Dialog :open="modal ? isOpen : false" @update:open="onDialogOpen">
    <component :is="Shell" v-if="modal || isOpen" v-bind="shellProps">
      <component :is="Panel" v-bind="panelAttrs" :class="rootClass">
        <DialogTitle v-if="hiddenTitle" class="sr-only">{{ hiddenTitle }}</DialogTitle>
        <div data-slot="cookie-consent-header" class="flex flex-col gap-2">
          <component
            :is="Heading"
            v-if="hasTitle"
            v-bind="modal ? {} : { id: titleId }"
            data-slot="cookie-consent-title"
            :as="modal ? tag : undefined"
            class="text-balance text-lg font-semibold leading-snug break-words"
          >
            <slot name="title">{{ title }}</slot>
          </component>
          <component :is="Desc" v-if="hasDescription" data-slot="cookie-consent-description" class="text-pretty text-sm text-muted-foreground break-words">
            <slot name="description">{{ description }}</slot>
          </component>
          <div v-if="$slots.policy" data-slot="cookie-consent-policy" class="text-sm break-words">
            <slot name="policy" />
          </div>
        </div>

        <ul v-if="showCategories" :id="panelId" data-slot="cookie-consent-categories" :aria-label="categoriesLabel" class="m-0 grid list-none gap-3 p-0">
          <li
            v-for="category in cats"
            :key="category.id"
            data-slot="cookie-consent-category"
            :data-necessary="category.necessary ? '' : undefined"
            class="rounded-md border p-3 [&_[data-slot=switch-description]]:opacity-100 [&_[data-slot=switch-label]]:break-words [&_[data-slot=switch-description]]:break-words"
          >
            <Switch
              size="md"
              :label="category.label"
              :description="describe(category)"
              :model-value="category.necessary ? true : choices[category.id] === true"
              :disabled="category.necessary"
              @update:model-value="(v: boolean) => toggle(category, v)"
            />
          </li>
        </ul>

        <div data-slot="cookie-consent-actions" :class="actionsClass">
          <Button data-slot="cookie-consent-reject" variant="default" size="md" :class="choiceButton" @click="decide('reject-all')">{{ rejectLabel }}</Button>
          <Button data-slot="cookie-consent-accept" variant="default" size="md" :class="choiceButton" @click="decide('accept-all')">{{ acceptLabel }}</Button>
          <Button v-if="showCategories" data-slot="cookie-consent-save" variant="outline" size="md" :class="choiceButton" @click="decide('save')">{{ saveLabel }}</Button>
          <Button
            v-if="canManage"
            data-slot="cookie-consent-manage"
            variant="outline"
            size="md"
            :class="choiceButton"
            :aria-expanded="expanded"
            :aria-controls="expanded ? panelId : undefined"
            @click="expanded = !expanded"
          >{{ manageLabel }}</Button>
        </div>
      </component>
    </component>
  </Dialog>
</template>
