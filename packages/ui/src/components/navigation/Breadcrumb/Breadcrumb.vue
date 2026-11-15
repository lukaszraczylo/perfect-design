<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue'
import type { IconDefinition } from '../../../lib/icons-tools'
import type { PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { RequiredPartsProbe, requireText, useRequiredParts } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import BreadcrumbEllipsis from './BreadcrumbEllipsis.vue'
import BreadcrumbItem from './BreadcrumbItem.vue'
import BreadcrumbLink from './BreadcrumbLink.vue'
import BreadcrumbList from './BreadcrumbList.vue'
import BreadcrumbPage from './BreadcrumbPage.vue'
import BreadcrumbSeparator from './BreadcrumbSeparator.vue'
import { BREADCRUMB_OPTIONS_KEY } from './context'
import { BREADCRUMB_SEPARATORS, BREADCRUMB_SIZES, type BreadcrumbSeparatorKind, type BreadcrumbSize } from './variants'

export interface BreadcrumbItemData {
  label: string
  href?: string
  to?: string | Record<string, unknown>
  icon?: IconDefinition
}

export interface BreadcrumbProps extends BaseProps {
  /** Items-array API. Omit and use the compound parts in the default slot for full control. The last item is the current page. */
  items?: BreadcrumbItemData[]
  /** Collapse middle items behind an ellipsis button when there are more than this many. `0` (default) never collapses; values below 2 are raised to 2. */
  maxItems?: number
  /** Element/component used for links, e.g. RouterLink (receives `to`). */
  linkAs?: PrimitiveProps['as']
  /** Accessible name of the landmark. */
  label?: string
  /** Text size and spacing: `sm`, `md` (default) or `lg`. Unknown values fall back to `md`. */
  size?: BreadcrumbSize
  /** Glyph between entries: `chevron` (default), `slash` or `dot`. Unknown values fall back to `chevron`. The `separator` slot replaces it. */
  separator?: BreadcrumbSeparatorKind
}

useRequiredParts('Breadcrumb', [{ part: 'BreadcrumbPage', hint: 'The last item of `items` is the current page; in compound mode render it with BreadcrumbPage.' }])
onMounted(() => requireText('Breadcrumb', 'label', props.label, 'It names the landmark, for example "Breadcrumb".'))

type Entry = { kind: 'item'; item: BreadcrumbItemData; index: number } | { kind: 'ellipsis'; hidden: number }

const props = withDefaults(defineProps<BreadcrumbProps>(), { maxItems: 0, label: 'Breadcrumb', size: 'md', separator: 'chevron' })
defineSlots<{
  default?: () => unknown
  separator?: () => unknown
  link?: (p: { item: BreadcrumbItemData; index: number }) => unknown
}>()

const size = computed<BreadcrumbSize>(() => (BREADCRUMB_SIZES.includes(props.size as BreadcrumbSize) ? (props.size as BreadcrumbSize) : 'md'))
const separatorKind = computed<BreadcrumbSeparatorKind>(() => (BREADCRUMB_SEPARATORS.includes(props.separator as BreadcrumbSeparatorKind) ? (props.separator as BreadcrumbSeparatorKind) : 'chevron'))
provide(BREADCRUMB_OPTIONS_KEY, computed(() => ({ size: size.value, separator: separatorKind.value })))

const list = computed(() => (Array.isArray(props.items) ? props.items.filter((i) => i && typeof i.label === 'string') : []))
const expanded = ref(false)
watch(
  () => list.value.length,
  () => (expanded.value = false),
)

const entries = computed<Entry[]>(() => {
  const all: Entry[] = list.value.map((item, index) => ({ kind: 'item', item, index }))
  const max = Number.isFinite(props.maxItems) && props.maxItems > 0 ? Math.max(2, Math.floor(props.maxItems)) : 0
  if (!max || expanded.value || all.length <= max) return all
  const tail = max - 1
  return [all[0], { kind: 'ellipsis', hidden: all.length - max }, ...all.slice(all.length - tail)]
})
const lastIndex = computed(() => list.value.length - 1)
</script>

<template>
  <nav data-slot="breadcrumb" :aria-label="label" :data-size="size" :data-separator="separatorKind" :class="cn(props.class)">
    <RequiredPartsProbe owner="Breadcrumb" />
    <BreadcrumbList v-if="list.length">
      <template v-for="(entry, i) in entries" :key="entry.kind === 'item' ? `i${entry.index}` : 'ellipsis'">
        <BreadcrumbSeparator v-if="i > 0"><slot name="separator" /></BreadcrumbSeparator>
        <BreadcrumbItem v-if="entry.kind === 'ellipsis'">
          <BreadcrumbEllipsis :label="`Show ${entry.hidden} hidden ${entry.hidden === 1 ? 'item' : 'items'}`" @click="expanded = true" />
        </BreadcrumbItem>
        <BreadcrumbItem v-else>
          <BreadcrumbPage v-if="entry.index === lastIndex">
            <Icon v-if="entry.item.icon" :icon="entry.item.icon" />{{ entry.item.label }}
          </BreadcrumbPage>
          <slot v-else name="link" :item="entry.item" :index="entry.index">
            <BreadcrumbLink :href="entry.item.href" :to="entry.item.to" :as="linkAs">
              <Icon v-if="entry.item.icon" :icon="entry.item.icon" />{{ entry.item.label }}
            </BreadcrumbLink>
          </slot>
        </BreadcrumbItem>
      </template>
    </BreadcrumbList>
    <slot v-else />
  </nav>
</template>
