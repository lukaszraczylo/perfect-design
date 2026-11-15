<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useConfirmStore, type ConfirmRequest } from './useConfirm'
import ConfirmDialog from './ConfirmDialog.vue'

const store = useConfirmStore()
onMounted(() => store.hosts++)
onBeforeUnmount(() => store.hosts--)

// Keep the last request around so the dialog content does not blank out while it animates closed.
const shown = ref<ConfirmRequest | null>(store.current)
watch(
  () => store.current,
  (c) => {
    if (c) shown.value = c
  },
)

// ConfirmDialog closes itself after `onConfirm` resolves; remember the outcome so the resulting
// `update:open(false)` settles the request with the right value (and never the next queued one).
let confirmed = false
const onConfirm = () => {
  confirmed = true
}
function onOpenChange(next: boolean) {
  if (next) return
  const result = confirmed
  confirmed = false
  if (result) store.accept()
  else store.cancel()
}
</script>

<template>
  <ConfirmDialog
    v-if="shown"
    :key="shown.id"
    :open="!!store.current"
    :title="shown.title"
    :description="shown.description"
    :confirm-label="shown.confirmLabel"
    :cancel-label="shown.cancelLabel"
    :destructive="shown.destructive"
    :tone="shown.tone"
    :size="shown.size"
    :variant="shown.variant"
    :on-confirm="onConfirm"
    @update:open="onOpenChange"
  />
</template>
