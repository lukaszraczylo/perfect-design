<script setup lang="ts">
import { computed } from 'vue'
import { faArrowDown, faArrowUp, faSort } from '../../../lib/icons'
import { cn } from '../../../lib/cn'
import { focusRing } from '../../../lib/styles'
import type { BaseProps } from '../../../lib/types'
import Icon from '../../primitives/Icon/Icon.vue'

export interface SortHeaderButtonProps extends BaseProps {
  /** Current sort direction of the column; `null` = unsorted. */
  direction?: 'asc' | 'desc' | null
  align?: 'left' | 'center' | 'right'
}

const props = withDefaults(defineProps<SortHeaderButtonProps>(), { direction: null, align: 'left' })
const emit = defineEmits<{ click: [event: MouseEvent] }>()

const ALIGN = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const
const icon = computed(() => (props.direction === 'asc' ? faArrowUp : props.direction === 'desc' ? faArrowDown : faSort))
const classes = computed(() =>
  cn(
    '-mx-2 inline-flex h-8 w-[calc(100%+1rem)] items-center gap-1.5 rounded-md px-2 text-sm font-medium whitespace-nowrap select-none transition-colors',
    'hover:bg-accent hover:text-accent-foreground',
    ALIGN[props.align] ?? ALIGN.left,
    props.direction ? 'text-foreground' : 'text-muted-foreground',
    focusRing,
    props.class,
  ),
)
</script>

<template>
  <button
    type="button"
    data-slot="sort-header-button"
    :data-direction="direction ?? 'none'"
    :class="classes"
    @click="emit('click', $event)"
  >
    <slot />
    <Icon :icon="icon" size="xs" :class="direction ? '' : 'opacity-50'" />
  </button>
</template>
