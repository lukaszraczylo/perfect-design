<script setup lang="ts">
import { faEye, faEyeSlash } from '../../../lib/icons'
import Button from '../../primitives/Button/Button.vue'

/** Internal part of the media components: the reveal / hide switch of a blurred image. */
export interface MediaBlurToggleProps {
  /** True while the media is blurred: the button reveals. False: the button hides again. */
  blurred: boolean
  revealLabel: string
  hideLabel: string
  /** `auto` centres the reveal button on the media and parks the hide button in the top end corner; `inline` leaves placement to the parent. */
  placement?: 'auto' | 'inline'
}

const props = withDefaults(defineProps<MediaBlurToggleProps>(), { placement: 'auto' })
const emit = defineEmits<{ toggle: [] }>()

const OVERLAY = 'absolute inset-0 z-10 m-auto w-fit'
const CORNER = 'absolute end-2 top-2 z-10'
const place = () => (props.placement === 'inline' ? '' : props.blurred ? OVERLAY : CORNER)
</script>

<template>
  <Button
    type="button"
    data-slot="media-blur-toggle"
    variant="secondary"
    size="sm"
    :icon="blurred ? faEye : faEyeSlash"
    :class="[place(), 'pointer-coarse:min-h-11 pointer-coarse:min-w-11']"
    @pointerdown.stop
    @click.stop="emit('toggle')"
  >
    {{ blurred ? revealLabel : hideLabel }}
  </Button>
</template>
