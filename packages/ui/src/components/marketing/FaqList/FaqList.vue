<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, useSlots, watch } from 'vue'
import { violation } from '../../../lib/contract'
import { cn } from '../../../lib/cn'
import type { BaseProps } from '../../../lib/types'
import Tabs from '../../navigation/Tabs/Tabs.vue'
import TabsContent from '../../navigation/Tabs/TabsContent.vue'
import TabsList from '../../navigation/Tabs/TabsList.vue'
import TabsTrigger from '../../navigation/Tabs/TabsTrigger.vue'
import FaqEntry from './FaqEntry.vue'
import { faqGroupClass, faqListVariants, resolveFaqListVariant, type FaqCategoryMode, type FaqListVariant } from './variants'

export interface FaqItem {
  q: string
  a: string
  /** Group name used by the `with-categories` variant. Items without one go to `uncategorizedLabel`. */
  category?: string
}

export interface FaqListProps extends BaseProps {
  items?: FaqItem[]
  /** `bordered` (default, original look), `separated` (cards), `plain`, `two-column`, `with-categories`, `numbered`. Unknown values fall back to `bordered`. */
  variant?: FaqListVariant
  /** `with-categories` only: show category `headings` (default) or switch between categories with `tabs`. */
  categoryMode?: FaqCategoryMode
  /** `with-categories` + `tabs`: category selected first. Unknown values select the first category. */
  defaultCategory?: string
  /** Heading/tab text for items that have no `category` when others do. */
  uncategorizedLabel?: string
  /** `with-categories` + `tabs`: accessible name of the tab list. */
  categoriesLabel?: string
  /** Only one answer open at a time. */
  single?: boolean
  /** Indexes open on first render (uncontrolled). With `single` only the first valid index is used. */
  defaultOpen?: number[]
}

const props = withDefaults(defineProps<FaqListProps>(), {
  items: () => [],
  variant: 'bordered',
  categoryMode: 'headings',
  uncategorizedLabel: 'Other',
  categoriesLabel: 'Question categories',
  single: false,
  defaultOpen: () => [],
})
const slots = useSlots()
const emit = defineEmits<{ toggle: [payload: { index: number; open: boolean }] }>()

const blank = (v: unknown) => typeof v !== 'string' || v.trim() === ''
// Reports the first incomplete item once, not once per item.
onMounted(async () => {
  await nextTick()
  const i = props.items.findIndex((item) => !item || blank(item.q) || (blank(item.a) && !slots.answer))
  if (i === -1) return
  const item = props.items[i]
  const what = !item || blank(item.q) ? 'question `q`' : 'answer `a`'
  violation('FaqList', 'requires-item-text', `requires a non-empty ${what} in every item (items[${i}] has none). Fill it in, or drop the item; an answer may be empty only when the \`answer\` slot renders it.`)
})

function initial(): number[] {
  const valid = props.defaultOpen.filter((i) => Number.isInteger(i) && i >= 0 && i < props.items.length)
  return props.single ? valid.slice(0, 1) : [...new Set(valid)]
}
const openIndexes = ref<number[]>(initial())

// When switching to single mode, collapse to one answer.
watch(
  () => props.single,
  (single) => {
    if (single && openIndexes.value.length > 1) openIndexes.value = openIndexes.value.slice(0, 1)
  },
)
// Drop indexes that no longer exist.
watch(
  () => props.items.length,
  (len) => {
    openIndexes.value = openIndexes.value.filter((i) => i < len)
  },
)

const uid = useId()
const variant = computed(() => resolveFaqListVariant(props.variant))
const classes = computed(() => cn(faqListVariants({ variant: variant.value }), props.class))
const isOpen = (i: number) => openIndexes.value.includes(i)

interface Group {
  label: string
  entries: { item: FaqItem; index: number }[]
}
const groups = computed<Group[]>(() => {
  const map = new Map<string, Group['entries']>()
  props.items.forEach((item, index) => {
    const category = typeof item.category === 'string' ? item.category.trim() : ''
    const label = category || props.uncategorizedLabel
    map.set(label, [...(map.get(label) ?? []), { item, index }])
  })
  return [...map].map(([label, entries]) => ({ label, entries }))
})
const hasCategories = computed(() => props.items.some((i) => typeof i.category === 'string' && i.category.trim() !== ''))
const mode = computed<'flat' | FaqCategoryMode>(() =>
  variant.value === 'with-categories' && hasCategories.value ? (props.categoryMode === 'tabs' ? 'tabs' : 'headings') : 'flat',
)
const flat = computed(() => props.items.map((item, index) => ({ item, index })))

const picked = ref<string | undefined>(props.defaultCategory)
const activeCategory = computed(() => groups.value.find((g) => g.label === picked.value)?.label ?? groups.value[0]?.label ?? '')

function onToggle(i: number, e: Event) {
  const open = (e.target as HTMLDetailsElement).open
  if (open === isOpen(i)) return
  if (open) openIndexes.value = props.single ? [i] : [...openIndexes.value, i]
  else openIndexes.value = openIndexes.value.filter((x) => x !== i)
  emit('toggle', { index: i, open })
}
</script>

<template>
  <div data-slot="faq-list" :data-variant="variant" :data-category-mode="mode === 'flat' ? undefined : mode" :class="classes">
    <template v-if="mode === 'flat'">
      <FaqEntry
        v-for="e in flat"
        :key="e.index"
        :item="e.item"
        :index="e.index"
        :open="isOpen(e.index)"
        :variant="variant"
        :numbered="variant === 'numbered'"
        @toggle="onToggle(e.index, $event)"
      >
        <template v-if="$slots.answer" #answer="s"><slot name="answer" v-bind="s" /></template>
      </FaqEntry>
    </template>

    <template v-else-if="mode === 'headings'">
      <div v-for="(g, gi) in groups" :key="g.label" data-slot="faq-category" role="group" :aria-labelledby="`${uid}-category-${gi}`">
        <h3 :id="`${uid}-category-${gi}`" data-slot="faq-category-title" class="mb-3 text-lg font-semibold">{{ g.label }}</h3>
        <div :class="faqGroupClass">
          <FaqEntry
            v-for="e in g.entries"
            :key="e.index"
            :item="e.item"
            :index="e.index"
            :open="isOpen(e.index)"
            :variant="variant"
            @toggle="onToggle(e.index, $event)"
          >
            <template v-if="$slots.answer" #answer="s"><slot name="answer" v-bind="s" /></template>
          </FaqEntry>
        </div>
      </div>
    </template>

    <Tabs v-else :model-value="activeCategory" data-slot="faq-tabs" @update:model-value="picked = String($event)">
      <TabsList class="h-auto flex-wrap" data-slot="faq-tabs-list" :aria-label="categoriesLabel">
        <TabsTrigger v-for="g in groups" :key="g.label" :value="g.label">{{ g.label }}</TabsTrigger>
      </TabsList>
      <TabsContent v-for="g in groups" :key="g.label" :value="g.label" data-slot="faq-category">
        <div :class="faqGroupClass">
          <FaqEntry
            v-for="e in g.entries"
            :key="e.index"
            :item="e.item"
            :index="e.index"
            :open="isOpen(e.index)"
            :variant="variant"
            @toggle="onToggle(e.index, $event)"
          >
            <template v-if="$slots.answer" #answer="s"><slot name="answer" v-bind="s" /></template>
          </FaqEntry>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
