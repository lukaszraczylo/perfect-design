<script setup lang="ts">
import { computed, provide } from 'vue'
import { TabsRoot, useForwardPropsEmits, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import { violation } from '../../../lib/contract'
import { duplicates, isBlank, useEntryRegistry } from '../contract'
import { TABS_OPTIONS_KEY, TABS_VARIANT_KEY } from './context'
import { TABS_SIZES, TABS_VARIANTS, type TabsSize, type TabsVariant } from './variants'

export interface TabsProps extends BaseProps {
  /** Controlled active tab (v-model). */
  modelValue?: string | number
  /** Initial active tab when uncontrolled. */
  defaultValue?: string | number
  orientation?: 'horizontal' | 'vertical'
  /** `automatic` activates on arrow-key focus, `manual` only on Enter/Space/click. */
  activationMode?: 'automatic' | 'manual'
  dir?: 'ltr' | 'rtl'
  /** `line` (default), `pill`, `segmented` or `enclosed`. Unknown values fall back to `line`. */
  variant?: TabsVariant
  /** `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: TabsSize
  /** Stretch a horizontal list across the container; the triggers share the width. */
  fullWidth?: boolean
  as?: PrimitiveProps['as']
  asChild?: boolean
}

const props = withDefaults(defineProps<TabsProps>(), { orientation: 'horizontal', activationMode: 'automatic', variant: 'line', size: 'md', fullWidth: false })
const emits = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const variant = computed<TabsVariant>(() => (TABS_VARIANTS.includes(props.variant as TabsVariant) ? (props.variant as TabsVariant) : 'line'))
const size = computed<TabsSize>(() => (TABS_SIZES.includes(props.size as TabsSize) ? (props.size as TabsSize) : 'md'))
const fullWidth = computed(() => props.fullWidth === true)
provide(TABS_VARIANT_KEY, variant)
provide(TABS_OPTIONS_KEY, computed(() => ({ variant: variant.value, size: size.value, fullWidth: fullWidth.value })))

useEntryRegistry('Tabs', (entries) => {
  const triggers = entries.filter((e) => e.kind === 'trigger').map((e) => e.value())
  const contents = entries.filter((e) => e.kind === 'content').map((e) => e.value())
  if (!triggers.length) violation('Tabs', 'requires-TabsTrigger', 'requires a TabsList with at least one TabsTrigger. Without a trigger no tab can be selected.')
  if ([...triggers, ...contents].some(isBlank)) violation('Tabs', 'requires-value', 'requires a non-empty `value` on every TabsTrigger and TabsContent. Pass the same value to a trigger and its content.')
  const problems: string[] = []
  for (const v of duplicates(triggers)) problems.push(`TabsTrigger value "${v}" is used more than once`)
  for (const v of duplicates(contents)) problems.push(`TabsContent value "${v}" is used more than once`)
  const has = (list: unknown[], v: unknown) => list.some((x) => String(x) === String(v))
  for (const v of new Set(triggers.filter((t) => !isBlank(t)).map(String))) if (!has(contents, v)) problems.push(`TabsTrigger "${v}" has no TabsContent`)
  for (const v of new Set(contents.filter((c) => !isBlank(c)).map(String))) if (!has(triggers, v)) problems.push(`TabsContent "${v}" has no TabsTrigger`)
  if (problems.length) violation('Tabs', 'requires-matching-values', `requires every TabsTrigger value to have exactly one TabsContent with the same value, and the reverse (${problems.join('; ')}). Give each pair the same \`value\`.`)
})

const delegated = computed(() => {
  const { class: _c, variant: _v, size: _s, fullWidth: _f, ...rest } = props
  return rest
})
const forwarded = useForwardPropsEmits(delegated, emits)
</script>

<template>
  <TabsRoot
    data-slot="tabs"
    :data-variant="variant"
    :data-size="size"
    :data-full-width="fullWidth ? '' : undefined"
    v-bind="forwarded"
    :class="cn('flex flex-col gap-3 data-[orientation=vertical]:flex-row', props.class)"
  >
    <slot />
  </TabsRoot>
</template>
