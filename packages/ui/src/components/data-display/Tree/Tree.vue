<script setup lang="ts">
import { computed, nextTick, ref, useAttrs } from 'vue'
import { violation } from '../../../lib/contract'
import { faCheck, faChevronRight, faMinus } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'
import { hasAriaName, hasText, useMountedCheck } from '../_shared/contract'
import { branchIds, checkState, connectorGuides, flattenTree, leafIds, type FlatTreeNode, type TreeCheckState, type TreeItem } from './flatten'
import {
  TREE_DENSITIES,
  TREE_SIZES,
  TREE_VARIANTS,
  treeCheckboxVariants,
  treeItemVariants,
  treeSizeMetrics,
  treeVariants,
  type TreeDensity,
  type TreeSize,
  type TreeVariant,
} from './variants'

export interface TreeProps extends BaseProps {
  items: TreeItem[]
  /** `compact` tightens row height, indentation and font size for dense sidebars. Without `size`, `compact` also uses the `sm` type scale. */
  density?: TreeDensity
  /** Type scale, toggle and checkbox size and indentation: `sm` (12px), `md` (14px, default) or `lg` (16px). Wins over the type scale `density` implies. */
  size?: TreeSize
  /**
   * `default`, `lines` (connector lines, same as the `lines` prop) or `boxed` (the tree sits in a bordered card surface and
   * the selected row is also set in a heavier weight). `boxed` combines with `lines`.
   */
  variant?: TreeVariant
  /** Show a visual checkbox per node. Branches derive checked / indeterminate from their leaves; toggling a branch toggles all its (enabled) leaves. Space toggles the focused node's checkbox. */
  checkboxes?: boolean
  /** Draw connector lines (vertical rules with elbows) between parents and children. */
  lines?: boolean
  /** Accessible name of the tree (`aria-label`). Required: or pass `aria-labelledby` as an attribute to name it from visible text instead. */
  label?: string
}

const props = withDefaults(defineProps<TreeProps>(), { density: 'default', size: undefined, variant: 'default', checkboxes: false, lines: false })
const attrs = useAttrs()
// Every node, collapsed ones included: a duplicate id inside a closed branch is dropped silently otherwise.
function checkContract() {
  if (!hasText(props.label) && !hasAriaName(attrs)) {
    violation('Tree', 'requires-accessible-name', 'needs an accessible name. Set `label` or `aria-label` (or `aria-labelledby`).')
  }
  const ids = new Set<string>()
  const seen = new Set<TreeItem>()
  const walk = (nodes: unknown) => {
    if (!Array.isArray(nodes)) return
    for (const node of nodes as TreeItem[]) {
      if (!node || typeof node !== 'object' || seen.has(node)) continue
      seen.add(node)
      if (!hasText(node.id)) violation('Tree', 'requires-node-id', `every node needs a non-empty string \`id\` (found one without an id${hasText(node.label) ? `, labelled "${node.label}"` : ''}).`)
      else if (ids.has(node.id)) violation('Tree', 'unique-node-ids', `node ids must be unique, but "${node.id}" appears more than once. Duplicates are dropped from the tree.`)
      else ids.add(node.id)
      walk(node.children)
    }
  }
  walk(props.items)
}
useMountedCheck(checkContract, [() => props.items, () => props.label])

/** Ids of expanded branches (`v-model:expanded`). Works uncontrolled too. */
const expanded = defineModel<string[]>('expanded', { default: () => [] })
/** Id of the selected node (`v-model:selected`). Works uncontrolled too. */
const selected = defineModel<string | null>('selected', { default: null })
/** Ids of checked LEAF nodes (`v-model:checked`, only with `checkboxes`). Works uncontrolled too. */
const checked = defineModel<string[]>('checked', { default: () => [] })
const emit = defineEmits<{ select: [item: TreeItem] }>()
defineSlots<{ item?: (p: { item: TreeItem; level: number; expanded: boolean; selected: boolean }) => unknown }>()

const expandedSet = computed(() => new Set(Array.isArray(expanded.value) ? expanded.value : []))
const flat = computed(() => flattenTree(props.items, expandedSet.value))
const density = computed<TreeDensity>(() => (TREE_DENSITIES.includes(props.density) ? props.density : 'default'))
const explicitSize = computed<TreeSize | undefined>(() => (props.size && TREE_SIZES.includes(props.size) ? props.size : undefined))
// `compact` alone keeps meaning the small scale; an explicit size wins.
const size = computed<TreeSize>(() => explicitSize.value ?? (density.value === 'compact' ? 'sm' : 'md'))
const variant = computed<TreeVariant>(() => (TREE_VARIANTS.includes(props.variant) ? props.variant : 'default'))
const showLines = computed(() => props.lines || variant.value === 'lines')
const boxed = computed(() => variant.value === 'boxed')
const metrics = computed(() => treeSizeMetrics[size.value])
const checkedSet = computed(() => new Set(Array.isArray(checked.value) ? checked.value : []))
const guides = computed(() => (showLines.value ? connectorGuides(flat.value) : new Map()))
const states = computed(() => {
  const map = new Map<string, TreeCheckState>()
  if (props.checkboxes) for (const n of flat.value) map.set(n.item.id, checkState(n.item, checkedSet.value))
  return map
})
const rem = (n: number) => `${Math.round(n * 10000) / 10000}rem`
const indent = (level: number) => rem((level - 1) * metrics.value.step + metrics.value.pad)
const guideX = (depth: number) => rem((depth - 1) * metrics.value.step + metrics.value.pad + metrics.value.toggle / 2)
const focusedId = ref<string | null>(null)
const tabbableId = computed(() => {
  const ids = flat.value.map((n) => n.item.id)
  if (focusedId.value && ids.includes(focusedId.value)) return focusedId.value
  if (selected.value && ids.includes(selected.value)) return selected.value
  return ids[0] ?? null
})

const els = new Map<string, HTMLElement>()
function setEl(id: string, el: unknown) {
  if (el instanceof HTMLElement) els.set(id, el)
  else els.delete(id)
}
function focusNode(id: string | undefined) {
  if (id === undefined) return
  focusedId.value = id
  void nextTick(() => els.get(id)?.focus())
}

function setExpanded(id: string, open: boolean) {
  const has = expandedSet.value.has(id)
  if (open === has) return
  expanded.value = open ? [...expandedSet.value, id] : [...expandedSet.value].filter((x) => x !== id)
}
function toggle(node: FlatTreeNode) {
  if (node.item.disabled || !node.hasChildren) return
  setExpanded(node.item.id, !expandedSet.value.has(node.item.id))
}
function select(node: FlatTreeNode) {
  if (node.item.disabled) return
  selected.value = node.item.id
  emit('select', node.item)
}
function toggleCheck(node: FlatTreeNode) {
  if (!props.checkboxes || node.item.disabled) return
  const leaves = leafIds(node.item)
  const set = new Set(checkedSet.value)
  if (states.value.get(node.item.id) === 'checked') for (const id of leaves) set.delete(id)
  else for (const id of leaves) set.add(id)
  checked.value = [...set]
}
function activate(node: FlatTreeNode) {
  select(node)
  toggle(node)
}

function onKeydown(e: KeyboardEvent) {
  const list = flat.value
  const fromTarget = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-slot="tree-item"]')?.dataset.id
  const index = list.findIndex((n) => n.item.id === (fromTarget ?? tabbableId.value))
  const node = list[index]
  if (!node) return
  const isOpen = expandedSet.value.has(node.item.id)
  switch (e.key) {
    case 'ArrowDown':
      focusNode(list[Math.min(index + 1, list.length - 1)]?.item.id)
      break
    case 'ArrowUp':
      focusNode(list[Math.max(index - 1, 0)]?.item.id)
      break
    case 'Home':
      focusNode(list[0]?.item.id)
      break
    case 'End':
      focusNode(list[list.length - 1]?.item.id)
      break
    case 'ArrowRight':
      if (!node.hasChildren || node.item.disabled) return
      if (!isOpen) setExpanded(node.item.id, true)
      else focusNode(list[index + 1]?.item.id)
      break
    case 'ArrowLeft':
      if (node.hasChildren && isOpen && !node.item.disabled) setExpanded(node.item.id, false)
      else if (node.parentId !== null) focusNode(node.parentId)
      break
    case ' ':
      if (props.checkboxes) toggleCheck(node)
      else activate(node)
      break
    case 'Enter':
      activate(node)
      break
    default:
      return
  }
  e.preventDefault()
}

function expandAll() {
  expanded.value = branchIds(props.items)
}
function collapseAll() {
  expanded.value = []
}
defineExpose({ expandAll, collapseAll })

const classes = computed(() =>
  cn(
    treeVariants({ density: density.value, size: size.value, lines: showLines.value, boxed: boxed.value }),
    // `compact` implies the small type scale; an explicit `md` restores the regular one.
    density.value === 'compact' && explicitSize.value === 'md' && 'text-sm',
    props.class,
  ),
)
</script>

<template>
  <ul
    data-slot="tree"
    role="tree"
    :aria-label="label"
    :data-size="explicitSize && explicitSize !== 'md' ? explicitSize : undefined"
    :data-variant="variant === 'default' ? undefined : variant"
    :class="classes"
    @keydown="onKeydown"
  >
    <li
      v-for="node in flat"
      :key="node.item.id"
      :ref="(el) => setEl(node.item.id, el)"
      data-slot="tree-item"
      role="treeitem"
      :data-id="node.item.id"
      :aria-level="node.level"
      :aria-posinset="node.posinset"
      :aria-setsize="node.setsize"
      :aria-expanded="node.hasChildren ? (expandedSet.has(node.item.id) ? 'true' : 'false') : undefined"
      :aria-selected="selected === node.item.id ? 'true' : 'false'"
      :aria-checked="checkboxes ? (states.get(node.item.id) === 'indeterminate' ? 'mixed' : states.get(node.item.id) === 'checked' ? 'true' : 'false') : undefined"
      :aria-disabled="node.item.disabled ? 'true' : undefined"
      :data-state="selected === node.item.id ? 'selected' : undefined"
      :tabindex="tabbableId === node.item.id ? 0 : -1"
      :style="{ paddingInlineStart: indent(node.level) }"
      :class="
        cn(
          treeItemVariants({ density, lines: showLines }),
          focusRing,
          selected === node.item.id && 'bg-accent text-accent-foreground forced-colors:outline-2 forced-colors:outline-offset-0',
          selected === node.item.id && boxed && 'font-medium',
          node.item.disabled && 'pointer-events-none opacity-50',
        )
      "
      @click="activate(node)"
      @focus="focusedId = node.item.id"
    >
      <template v-if="showLines">
        <span
          v-for="g in guides.get(node.item.id)"
          :key="g.depth"
          data-slot="tree-guide"
          aria-hidden="true"
          :class="cn('pointer-events-none absolute top-0 w-px bg-border', g.half ? 'h-1/2' : 'bottom-0')"
          :style="{ insetInlineStart: guideX(g.depth) }"
        />
        <span
          v-if="node.level > 1"
          data-slot="tree-elbow"
          aria-hidden="true"
          class="pointer-events-none absolute top-1/2 h-px bg-border"
          :style="{ insetInlineStart: guideX(node.level - 1), width: rem(metrics.step - metrics.toggle / 2) }"
        />
      </template>
      <span
        data-slot="tree-toggle"
        aria-hidden="true"
:class="cn('flex shrink-0 items-center justify-center text-muted-foreground', size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-5' : 'size-4')"
        @click.stop="toggle(node)"
      >
        <Icon v-if="node.hasChildren" :icon="faChevronRight" size="xs" :class="cn('transition-transform motion-reduce:transition-none', expandedSet.has(node.item.id) && 'rotate-90')" />
      </span>
      <span
        v-if="checkboxes"
        data-slot="tree-checkbox"
        aria-hidden="true"
        :data-state="states.get(node.item.id)"
        :class="treeCheckboxVariants({ density: size === 'sm' ? 'compact' : 'default', size, state: states.get(node.item.id) })"
        @click.stop="toggleCheck(node)"
      >
        <Icon v-if="states.get(node.item.id) === 'checked'" :icon="faCheck" size="xs" class="size-2.5" />
        <Icon v-else-if="states.get(node.item.id) === 'indeterminate'" :icon="faMinus" size="xs" class="size-2.5" />
      </span>
      <slot name="item" :item="node.item" :level="node.level" :expanded="expandedSet.has(node.item.id)" :selected="selected === node.item.id">
        <Icon v-if="node.item.icon" :icon="node.item.icon" class="text-muted-foreground" />
        <span data-slot="tree-label" class="min-w-0 truncate">{{ node.item.label }}</span>
      </slot>
    </li>
  </ul>
</template>
