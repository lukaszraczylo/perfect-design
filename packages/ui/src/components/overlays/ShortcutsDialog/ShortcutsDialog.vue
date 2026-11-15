<script setup lang="ts">
import { computed, nextTick, onMounted, useId, type HTMLAttributes } from 'vue'
import { formatHotkey, listHotkeys, parseHotkey, useHotkeys } from '../../../lib/hotkeys'
import { requireText, violation } from '../../../lib/contract'
import Kbd from '../../primitives/Kbd/Kbd.vue'
import KbdGroup from '../../primitives/Kbd/KbdGroup.vue'
import Dialog from '../Dialog/Dialog.vue'
import DialogContent from '../Dialog/DialogContent.vue'
import DialogDescription from '../Dialog/DialogDescription.vue'
import DialogHeader from '../Dialog/DialogHeader.vue'
import DialogTitle from '../Dialog/DialogTitle.vue'
import DialogTrigger from '../Dialog/DialogTrigger.vue'
import {
  normalizeShortcutsDialogDensity,
  normalizeShortcutsDialogHeadingLevel,
  normalizeShortcutsDialogLayout,
  normalizeShortcutsDialogSize,
  shortcutsDialogItemVariants,
  shortcutsDialogVariants,
  type ShortcutsDialogDensity,
  type ShortcutsDialogHeadingLevel,
  type ShortcutsDialogLayout,
  type ShortcutsDialogSize,
} from './variants'

/** A shortcut listed next to the registered ones, e.g. one the browser or the OS owns. */
export interface ShortcutItem {
  /** Combo such as `mod+k`, `?` or `g then d`. Invalid combos are not listed. */
  keys: string
  description: string
  /** Heading it is listed under. Default `General`. */
  group?: string
}

export interface ShortcutsDialogProps {
  class?: HTMLAttributes['class']
  /** Accessible name of the dialog and its visible heading. Required. */
  title: string
  /** Supporting text under the title. */
  description?: string
  /** Combo that opens the dialog. Default `?`. An empty string turns the shortcut off. */
  hotkey?: string
  /** Description the dialog's own shortcut gets in the list. */
  hotkeyLabel?: string
  /** Also list every shortcut registered with `useHotkeys`. Default `true`. */
  registered?: boolean
  /** Extra shortcuts to list (not registered, display only). */
  shortcuts?: ShortcutItem[]
  /** Shown when nothing is listed. */
  emptyText?: string
  /** Max width from the `sm` breakpoint: `sm`, `md`, `lg` or `xl`. */
  size?: ShortcutsDialogSize
  /** `list` (one column) or `columns` (two columns from `sm` up). */
  layout?: ShortcutsDialogLayout
  /** Row spacing and text size: `comfortable` or `compact`. */
  density?: ShortcutsDialogDensity
  /** Heading level of the group names: 3, 4, 5 or 6. The dialog title is an h2. */
  headingLevel?: ShortcutsDialogHeadingLevel
}

const props = withDefaults(defineProps<ShortcutsDialogProps>(), {
  description: undefined,
  hotkey: '?',
  hotkeyLabel: 'Show keyboard shortcuts',
  registered: true,
  shortcuts: () => [],
  emptyText: 'No keyboard shortcuts are registered on this page.',
  size: 'md',
  layout: 'list',
  density: 'comfortable',
  headingLevel: 3,
})
defineOptions({ inheritAttrs: false })
const open = defineModel<boolean>('open', { default: false })

const hotkeyValid = computed(() => props.hotkey.trim() !== '' && parseHotkey(props.hotkey) !== null)

onMounted(async () => {
  await nextTick()
  requireText('ShortcutsDialog', 'title', props.title, 'It is the accessible name of the dialog.')
  if (props.hotkey.trim() !== '' && !hotkeyValid.value) {
    violation('ShortcutsDialog', 'requires-valid-hotkey', `requires a valid \`hotkey\` such as "?" or "mod+/" (got ${JSON.stringify(props.hotkey.slice(0, 40))}). Use an empty string to turn the shortcut off.`)
  }
})

useHotkeys(() => (hotkeyValid.value ? { [props.hotkey]: { handler: () => (open.value = true), description: props.hotkeyLabel, group: 'General' } } : {}))

interface Row {
  key: string
  labels: string[][]
  spoken: string
  description: string
  group: string
}

const rows = computed<Row[]>(() => {
  const out: Row[] = []
  const seen = new Set<string>()
  const add = (group: string, description: string, labels: string[][], spoken: string) => {
    const id = `${group}\u0000${description}\u0000${JSON.stringify(labels)}`
    if (seen.has(id)) return
    seen.add(id)
    out.push({ key: id, labels, spoken, description, group })
  }
  if (props.registered) for (const item of listHotkeys()) add(item.group, item.description, item.labels, item.spoken)
  for (const item of props.shortcuts ?? []) {
    const formatted = formatHotkey(item?.keys)
    if (!formatted || typeof item.description !== 'string' || item.description.trim() === '') continue
    add(item.group?.trim() || 'General', item.description, formatted.labels, formatted.spoken)
  }
  return out
})

const groups = computed(() => {
  const map = new Map<string, Row[]>()
  for (const row of rows.value) map.set(row.group, [...(map.get(row.group) ?? []), row])
  return [...map].map(([name, items]) => ({ name, items }))
})

const baseId = useId()
const sizeKey = computed(() => normalizeShortcutsDialogSize(props.size))
const layoutKey = computed(() => normalizeShortcutsDialogLayout(props.layout))
const densityKey = computed(() => normalizeShortcutsDialogDensity(props.density))
const headingTag = computed(() => `h${normalizeShortcutsDialogHeadingLevel(props.headingLevel)}`)
const kbdSize = computed(() => (densityKey.value === 'compact' ? 'sm' : 'md'))
</script>

<template>
  <Dialog v-model:open="open" data-slot="shortcuts-dialog">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogContent :size="sizeKey" :class="props.class">
      <DialogHeader data-slot="shortcuts-dialog-header">
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription v-if="description">{{ description }}</DialogDescription>
      </DialogHeader>
      <div v-bind="$attrs" data-slot="shortcuts-dialog-body" :data-layout="layoutKey" :class="shortcutsDialogVariants({ layout: layoutKey })">
        <div v-for="(group, index) in groups" :key="group.name" data-slot="shortcuts-dialog-group" class="min-w-0">
          <component :is="headingTag" :id="`${baseId}-${index}`" data-slot="shortcuts-dialog-group-title" class="mb-1 break-words text-sm font-semibold text-foreground">
            {{ group.name }}
          </component>
          <ul :aria-labelledby="`${baseId}-${index}`" data-slot="shortcuts-dialog-list" class="m-0 list-none p-0">
            <li v-for="row in group.items" :key="row.key" data-slot="shortcuts-dialog-item" :data-density="densityKey" :class="shortcutsDialogItemVariants({ density: densityKey })">
              <span data-slot="shortcuts-dialog-label" class="min-w-0 break-words text-foreground">{{ row.description }}</span>
              <span data-slot="shortcuts-dialog-keys" class="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                <span class="sr-only">{{ row.spoken }}</span>
                <template v-for="(step, stepIndex) in row.labels" :key="stepIndex">
                  <span v-if="stepIndex > 0" aria-hidden="true" class="text-xs text-muted-foreground">then</span>
                  <KbdGroup aria-hidden="true" :size="kbdSize">
                    <Kbd v-for="(label, labelIndex) in step" :key="labelIndex" :size="kbdSize">{{ label }}</Kbd>
                  </KbdGroup>
                </template>
              </span>
            </li>
          </ul>
        </div>
        <p v-if="groups.length === 0" data-slot="shortcuts-dialog-empty" class="text-sm text-muted-foreground">{{ emptyText }}</p>
      </div>
    </DialogContent>
  </Dialog>
</template>
