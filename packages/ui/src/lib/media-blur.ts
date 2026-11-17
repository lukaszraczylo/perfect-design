import { computed, ref, watch, type ComputedRef } from 'vue'
import { useConfig } from '../components/layout/ConfigProvider/config'

/** Blur of the media element only. The container must clip (`overflow-hidden`) so the 5% scale hides the faded edge. */
export const MEDIA_BLUR = 'scale-105 blur-md motion-safe:transition-[filter,scale]'
/** For a container that clips (`overflow-hidden`) and holds arbitrary content: blurs its direct children, not the container. */
export const MEDIA_BLUR_CHILDREN = 'overflow-hidden [&>*]:scale-105 [&>*]:blur-md [&>*]:motion-safe:transition-[filter,scale]'
/** For a free-standing image that has no clipping container: blur without the scale. */
export const MEDIA_BLUR_SOFT = 'blur-md motion-safe:transition-[filter]'
/** Keeps the un-blur animated on components that can toggle; never present on a component that cannot. */
const MEDIA_BLUR_CHILDREN_IDLE = '[&>*]:motion-safe:transition-[filter,scale]'
const MEDIA_BLUR_IDLE = 'motion-safe:transition-[filter,scale]'
const MEDIA_BLUR_SOFT_IDLE = 'motion-safe:transition-[filter]'

/** Classes for the media element. `toggles` keeps the transition while it is not blurred so revealing animates too. */
export function mediaBlurClass(blurred: boolean, toggles = false): string | undefined {
  if (blurred) return MEDIA_BLUR
  return toggles ? MEDIA_BLUR_IDLE : undefined
}

export function mediaBlurChildrenClass(blurred: boolean, toggles = false): string | undefined {
  if (blurred) return MEDIA_BLUR_CHILDREN
  return toggles ? MEDIA_BLUR_CHILDREN_IDLE : undefined
}

export function mediaBlurSoftClass(blurred: boolean, toggles = false): string | undefined {
  if (blurred) return MEDIA_BLUR_SOFT
  return toggles ? MEDIA_BLUR_SOFT_IDLE : undefined
}

/** The component's own `blurred` (true or false) wins, then `ConfigProvider blurMedia`, then false. */
export function useMediaBlur(own: () => boolean | undefined): ComputedRef<boolean> {
  const config = useConfig()
  return computed(() => own() ?? config.value.blurMedia ?? false)
}

export interface MediaBlurToggle {
  /** Resolved state: controlled value, else local state, else the provider, else false. */
  blurred: ComputedRef<boolean>
  /** True once the media has been blurred, so a revealed image can offer "Hide". */
  hideable: ComputedRef<boolean>
  toggle: () => void
}

/** Controlled (`blurred`) or uncontrolled (`defaultBlurred`) blur state for a component with a reveal control. */
export function useMediaBlurToggle(blurredProp: () => boolean | undefined, defaultBlurred: () => boolean | undefined, onChange: (value: boolean) => void): MediaBlurToggle {
  const local = ref<boolean | undefined>(defaultBlurred())
  const blurred = useMediaBlur(() => blurredProp() ?? local.value)
  const seen = ref(blurred.value)
  watch(blurred, (v) => v && (seen.value = true))
  return {
    blurred,
    hideable: computed(() => seen.value),
    toggle() {
      const next = !blurred.value
      if (blurredProp() === undefined) local.value = next
      onChange(next)
    },
  }
}
