<script setup lang="ts">
// A visually hidden text input, not type=hidden: only a visible-type input takes part in constraint validation,
// so an empty `required` one blocks native form submit while a filled one submits `name=value`.
defineProps<{ name?: string; value: string; required?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ invalid: [] }>()
</script>

<template>
  <input
    type="text"
    data-slot="picker-form-input"
    class="sr-only"
    tabindex="-1"
    aria-hidden="true"
    autocomplete="off"
    :name="name"
    :value="value"
    :required="required"
    :disabled="disabled"
    @invalid="emit('invalid')"
  />
</template>
