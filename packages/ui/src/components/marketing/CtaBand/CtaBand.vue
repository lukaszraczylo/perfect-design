<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, useAttrs, useSlots } from 'vue'
import { violation } from '../../../lib/contract'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { headingTag, oneOf } from '../shared/pick'
import {
  ctaBandActionsVariants,
  ctaBandHeadlineVariants,
  ctaBandInnerVariants,
  ctaBandSubtextVariants,
  ctaBandTextVariants,
  ctaBandToneNames,
  ctaBandVariantNames,
  ctaBandVariants,
  resolveCtaBandShape,
  resolveCtaBandSize,
  type CtaBandShape,
  type CtaBandSize,
  type CtaBandTone,
  type CtaBandVariant,
} from './variants'

export interface CtaBandProps extends BaseProps {
  /** Layout. Unknown values fall back to `card` (the original look). */
  variant?: CtaBandVariant
  headline?: string
  subtext?: string
  /** Colour treatment: `primary` | `muted` | `inverted`. Unknown values (including the removed `gradient`) fall back to `primary`. */
  tone?: CtaBandTone
  /** Heading level of the headline (1-6). Invalid values fall back to 2. */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Padding and headline scale: `sm`, `md` (default, the original spacing) or `lg`. Unknown values fall back to `md`. */
  size?: CtaBandSize
  /** Corners of the boxed layouts: `rounded` (default) or `square`. Unknown values fall back to `rounded`. */
  shape?: CtaBandShape
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<CtaBandProps>(), { variant: 'card', tone: 'primary', size: 'md', shape: 'rounded', level: 2, as: 'section' })

const slots = useSlots()
const attrs = useAttrs()
const self = getCurrentInstance()

// A call to action needs a heading that says what it asks for. `headline` (or its slot), your own heading in a slot,
// or an `aria-label` / `aria-labelledby` on the band all satisfy it.
onMounted(async () => {
  await nextTick()
  const el = self?.proxy?.$el as Element | undefined
  if (props.headline?.trim() || slots.headline || attrs['aria-label'] || attrs['aria-labelledby'] || !el?.querySelector) return
  if ([...el.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')].some((h) => h.textContent?.trim() || h.getAttribute('aria-label'))) return
  violation('CtaBand', 'requires-headline', 'requires a `headline` (or the `headline` slot, a heading in another slot, or `aria-label` / `aria-labelledby` on the band).')
})
const kind = computed(() => oneOf(props.variant, ctaBandVariantNames, 'card'))
const toneName = computed(() => oneOf(props.tone, ctaBandToneNames, 'primary'))
const sizeName = computed(() => resolveCtaBandSize(props.size))
const shapeName = computed(() => resolveCtaBandShape(props.shape))
const hasText = computed(() => !!(props.headline || props.subtext || slots.headline || slots.subtext))
const tag = computed(() => headingTag(props.level, 'h2'))
const classes = computed(() => cn(ctaBandVariants({ variant: kind.value, tone: toneName.value, size: sizeName.value, shape: shapeName.value }), props.class))
</script>

<template>
  <Primitive data-slot="cta-band" :as="as" :data-variant="kind" :data-tone="toneName" :data-size="sizeName" :data-shape="shapeName" :class="classes">
    <div data-slot="cta-band-inner" :class="ctaBandInnerVariants({ variant: kind })">
      <div v-if="hasText" data-slot="cta-band-text" :class="ctaBandTextVariants({ variant: kind })">
        <component :is="tag" v-if="headline || $slots.headline" data-slot="cta-band-headline" :class="ctaBandHeadlineVariants({ variant: kind, size: sizeName })">
          <slot name="headline">{{ headline }}</slot>
        </component>
        <p v-if="subtext || $slots.subtext" data-slot="cta-band-subtext" :class="ctaBandSubtextVariants({ variant: kind })">
          <slot name="subtext">{{ subtext }}</slot>
        </p>
      </div>
      <div v-if="kind === 'newsletter' && $slots.form" data-slot="cta-band-form" class="w-full max-w-md">
        <slot name="form" />
      </div>
      <div v-if="$slots.actions" data-slot="cta-band-actions" :class="ctaBandActionsVariants({ variant: kind })">
        <slot name="actions" />
      </div>
      <div
        v-if="kind === 'split' && ($slots.media || $slots.form)"
        data-slot="cta-band-media"
        class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-3 lg:row-start-1"
      >
        <slot name="media" />
        <slot name="form" />
      </div>
    </div>
  </Primitive>
</template>
