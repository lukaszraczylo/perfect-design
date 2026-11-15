<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, useSlots } from 'vue'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import SectionHeading from '../SectionHeading/SectionHeading.vue'
import { walkVNodes } from '../shared/vnodeWalk'
import { oneOf } from '../shared/pick'
import {
  CONTACT_ALIGNS,
  CONTACT_SIZES,
  CONTACT_TONES,
  CONTACT_VARIANTS,
  contactSectionContentVariants,
  contactSectionDetailsVariants,
  contactSectionFormVariants,
  contactSectionIntroVariants,
  contactSectionVariants,
  type ContactSectionAlign,
  type ContactSectionSize,
  type ContactSectionTone,
  type ContactSectionVariant,
} from './variants'

export interface ContactSectionProps extends BaseProps {
  /** Layout: `split`, `centered`, `card` or `inline` (compact one row: heading and description left, form and details right). Unknown values fall back to `split`. */
  variant?: ContactSectionVariant
  /** Spacing, surface padding and heading scale: `sm`, `md` (the original) or `lg`. Unknown values fall back to `md`. */
  size?: ContactSectionSize
  /** Surface: `default` (none; `card` keeps its card surface) or `muted` (secondary surface). Unknown values fall back to `default`. */
  tone?: ContactSectionTone
  /** Text alignment of `split` and `card`: `start` (the original) or `center`. `centered` is always centred and `inline` always start-aligned. Unknown values fall back to `start`. */
  align?: ContactSectionAlign
  eyebrow?: string
  title?: string
  description?: string
  /** Heading level of the title (1-6). Invalid values fall back to 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

const props = withDefaults(defineProps<ContactSectionProps>(), { variant: 'split', size: 'md', tone: 'default', align: 'start', level: 2 })
const slots = useSlots()
const instance = getCurrentInstance()

// A `<form>` in the slots with neither a submit listener nor an `action` submits nowhere.
onMounted(async () => {
  await nextTick()
  let broken = 0
  walkVNodes(instance?.subTree, (v) => {
    if (v.type === 'form' && !v.props?.onSubmit && !v.props?.action) broken++
  })
  if (broken > 0) {
    violation('ContactSection', 'requires-submit-handler', `requires a submit handler on every form (\`@submit.prevent="..."\`) or an \`action\`; ${broken === 1 ? 'a form submits' : `${broken} forms submit`} nowhere. Add the handler or remove the form.`)
  }
})

const variant = computed<ContactSectionVariant>(() => (CONTACT_VARIANTS.includes(props.variant) ? props.variant : 'split'))
const size = computed<ContactSectionSize>(() => oneOf(props.size, CONTACT_SIZES, 'md'))
const tone = computed<ContactSectionTone>(() => oneOf(props.tone, CONTACT_TONES, 'default'))
const centered = computed(() => variant.value === 'centered')
const inline = computed(() => variant.value === 'inline')
/** `centered` is always centred and `inline` always start-aligned; the prop moves `split` and `card`. */
const align = computed<ContactSectionAlign>(() => (centered.value ? 'center' : inline.value ? 'start' : oneOf(props.align, CONTACT_ALIGNS, 'start')))
/** SectionHeading has `sm | md | lg`: the compact inline layout uses a smaller step. */
const headingSize = computed(() => (inline.value ? { sm: 'sm', md: 'sm', lg: 'md' } as const : { sm: 'md', md: 'lg', lg: 'lg' } as const)[size.value])
const hasHeading = computed(() => !!(props.eyebrow || props.title || props.description))
// Plain functions (not computed): slots are not reactive, so re-evaluate on every render.
const hasDetails = () => !!slots.details
/** Details sit under the heading in `split` and `card`; `centered` and `inline` render them after the form. */
const detailsInIntro = computed(() => !centered.value && !inline.value)
const hasIntro = () => hasHeading.value || (hasDetails() && detailsInIntro.value)
const classes = computed(() => cn(contactSectionVariants({ variant: variant.value, size: size.value, tone: tone.value }), props.class))
const introClass = computed(() => contactSectionIntroVariants({ variant: variant.value, size: size.value, align: align.value }))
const formClass = () => cn(contactSectionFormVariants({ variant: variant.value }), !hasIntro() && detailsInIntro.value && 'lg:col-span-2')
const contentClass = computed(() => contactSectionContentVariants({ size: size.value }))
const detailsClass = computed(() => contactSectionDetailsVariants({ variant: variant.value, size: size.value, align: align.value }))
</script>

<template>
  <section data-slot="contact-section" :data-variant="variant" :data-size="size" :data-tone="tone" :data-align="align" :class="classes">
    <div v-if="hasIntro()" data-slot="contact-section-intro" :class="introClass">
      <SectionHeading
        v-if="hasHeading"
        :eyebrow="eyebrow"
        :title="title"
        :description="description"
        :level="level"
        :align="align === 'center' ? 'center' : 'left'"
        :size="headingSize"
      />
      <div v-if="hasDetails() && detailsInIntro" data-slot="contact-section-details" :class="detailsClass">
        <slot name="details" />
      </div>
    </div>
    <div v-if="inline && ($slots.form || hasDetails())" data-slot="contact-section-content" :class="contentClass">
      <div v-if="$slots.form" data-slot="contact-section-form" :class="formClass()">
        <slot name="form" />
      </div>
      <div v-if="hasDetails()" data-slot="contact-section-details" :class="detailsClass">
        <slot name="details" />
      </div>
    </div>
    <template v-else-if="!inline">
      <div v-if="$slots.form" data-slot="contact-section-form" :class="formClass()">
        <slot name="form" />
      </div>
      <div v-if="hasDetails() && centered" data-slot="contact-section-details" :class="detailsClass">
        <slot name="details" />
      </div>
    </template>
  </section>
</template>
