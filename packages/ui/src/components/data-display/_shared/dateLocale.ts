import { computed, getCurrentInstance, onMounted, ref, type ComputedRef } from 'vue'
import { useConfig } from '../../layout/ConfigProvider/config'
import { DEFAULT_TIME_LOCALE } from '../../typography/RelativeTime/format'

export const DEFAULT_TIME_ZONE = 'UTC'

/**
 * Locale and time zone for timestamps: prop, then `ConfigProvider`, then a fixed default. Until mount the zone falls back to
 * UTC so server and client print the same text; after mount it is the viewer's own zone (`undefined` for Intl), because
 * readers expect local times.
 */
export function useDateLocale(props: { locale?: string; timeZone?: string }): { locale: ComputedRef<string>; timeZone: ComputedRef<string | undefined> } {
  const config = useConfig()
  const mounted = ref(false)
  if (getCurrentInstance()) onMounted(() => (mounted.value = true))
  else mounted.value = true
  return {
    locale: computed(() => props.locale ?? config.value.locale ?? DEFAULT_TIME_LOCALE),
    timeZone: computed(() => props.timeZone ?? config.value.timeZone ?? (mounted.value ? undefined : DEFAULT_TIME_ZONE)),
  }
}
