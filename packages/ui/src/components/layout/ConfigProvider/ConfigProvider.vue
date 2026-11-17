<script setup lang="ts">
import { computed } from 'vue'
import { ConfigProvider as RekaConfigProvider, injectConfigProviderContext, Primitive, useDirection, useLocale, type PrimitiveProps } from 'reka-ui'
import { cn } from '../../../lib/cn'
import type { BaseProps, Size } from '../../../lib/types'
import { provideConfig, sanitizeConfig, type ConfigDensity, type ConfigDir, type ConfigLabels, type ConfigReducedMotion } from './config'

export interface ConfigProviderProps extends BaseProps {
  /** Text direction of the subtree: `ltr`, `rtl` or `auto`. Set on the wrapper and passed to the headless primitives. Unset keeps the surrounding direction. */
  dir?: ConfigDir
  /** BCP 47 locale (`de-DE`), set as `lang` on the wrapper. Components that format dates read it as their default `locale`. Invalid tags are ignored. */
  locale?: string
  /** IANA time zone (`Europe/Berlin`) for components that ask `useConfig()`. Invalid names are ignored. */
  timeZone?: string
  /** `user` (default) follows the operating system; `reduce` or `no-preference` is an app-level override exposed as `data-reduced-motion` and `useConfig().reducedMotion`. */
  reducedMotion?: ConfigReducedMotion
  /** Default `size` hint for components that read it (Pagination, DatePicker), also set as `data-size`. A component's own `size` prop wins; values it does not support are ignored. */
  size?: Size
  /** Default `density` hint (`default`, `compact`, `comfortable`) for components that read it, also set as `data-density`. */
  density?: ConfigDensity
  /** Translations of built-in strings, keyed `<component>.<string>` (for example `pagination.next`). Merged per key with outer providers; non-string and blank values are ignored. */
  labels?: ConfigLabels
  /** Blur every avatar and photo in the subtree (privacy, not decoration). A component's own `blurred` (true or false) wins. Unset keeps the surrounding value. */
  blurMedia?: boolean
  as?: PrimitiveProps['as']
  /** Render no wrapper element: `dir`, `lang` and `data-reduced-motion` go onto the single child instead. */
  asChild?: boolean
}

defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<ConfigProviderProps>(), { as: 'div', blurMedia: undefined })

const own = computed(() => sanitizeConfig(props))
provideConfig(() => props)

// The headless primitives (menus, tabs, sliders) read their direction and locale from reka-ui's own provider, which also reaches portalled content.
const outerDir = useDirection()
const outerLocale = useLocale()
const outer = injectConfigProviderContext(null)
const rekaDir = computed(() => (own.value.dir === 'ltr' || own.value.dir === 'rtl' ? own.value.dir : outerDir.value))
const rekaLocale = computed(() => own.value.locale ?? outerLocale.value)
const motion = computed(() => (own.value.reducedMotion && own.value.reducedMotion !== 'user' ? own.value.reducedMotion : undefined))
</script>

<template>
  <RekaConfigProvider
    :dir="rekaDir"
    :locale="rekaLocale"
    :scroll-body="outer?.scrollBody?.value ?? true"
    :nonce="outer?.nonce?.value"
    :teleport-to="outer?.teleportTo?.value"
    :use-id="outer?.useId"
  >
    <Primitive
      v-bind="$attrs"
      data-slot="config-provider"
      :as="as"
      :as-child="asChild"
      :dir="own.dir"
      :lang="own.locale"
      :data-reduced-motion="motion"
      :data-size="own.size"
      :data-density="own.density"
      :data-blur-media="own.blurMedia ? '' : undefined"
      :class="cn(props.class) || undefined"
    >
      <slot />
    </Primitive>
  </RekaConfigProvider>
</template>
