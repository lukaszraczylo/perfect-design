<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import { violation } from '../../../lib/contract'
import type { BaseProps } from '../../../lib/types'
import { THEME_STYLES, type ThemeStyle } from '../../../stores/theme'

export interface StyleScopeProps extends BaseProps {
  /** Style pack to apply to everything inside: `quiet` (core), `workbench`, `tactile`, `editorial`, `raw`, `contrast` or `terminal`. */
  look: ThemeStyle
  as?: PrimitiveProps['as']
}

const props = withDefaults(defineProps<StyleScopeProps>(), { as: 'div' })

const known = computed(() => (THEME_STYLES as readonly string[]).includes(props.look))
onMounted(() => {
  if (!known.value) violation('StyleScope', 'requires-look', `requires \`look\` to be one of ${THEME_STYLES.join(', ')}, for example look="workbench".`)
})
</script>

<template>
  <Primitive data-slot="style-scope" :as="as" :data-style="known ? look : undefined" :class="cn('bg-background text-foreground', props.class)">
    <slot />
  </Primitive>
</template>
