<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/cn'
import Icon from '../../primitives/Icon/Icon.vue'
import { FIELD_STATUS_ICONS, FIELD_STATUS_ICON_CLASSES, FIELD_STATUS_TEXT, normalizeStatus, type FieldStatus } from './field-variants'

/**
 * Status icon of a text field (success, warning, error), positioned inside a `relative` wrapper at the inline end.
 * The icon is decorative; success and warning add visually hidden text with `id` so the control can reference it
 * from `aria-describedby`. Renders nothing for `default`. Internal helper of the text fields, not exported from the package.
 */
const props = defineProps<{ status?: FieldStatus; id?: string; label?: string; class?: HTMLAttributes['class'] }>()
const status = computed(() => normalizeStatus(props.status))
const text = computed(() => (status.value === 'success' || status.value === 'warning' ? (props.label ?? FIELD_STATUS_TEXT[status.value]) : ''))
</script>

<template>
  <span
    v-if="status !== 'default'"
    data-slot="field-status"
    :data-status="status"
    :class="cn('pointer-events-none absolute end-2.5 top-1/2 inline-flex -translate-y-1/2 items-center', FIELD_STATUS_ICON_CLASSES[status], props.class)"
  >
    <Icon :icon="FIELD_STATUS_ICONS[status]" size="sm" />
    <span v-if="text" :id="id" class="sr-only">{{ text }}</span>
  </span>
</template>
