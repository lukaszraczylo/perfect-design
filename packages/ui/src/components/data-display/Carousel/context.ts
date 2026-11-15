import { inject, type ComputedRef, type InjectionKey, type Ref, type ShallowRef } from 'vue'
import type { CarouselOrientation } from './variants'

export interface CarouselContext {
  orientation: ComputedRef<CarouselOrientation>
  /** Index of the active slide (always within range once slides are registered). */
  current: ComputedRef<number>
  count: ComputedRef<number>
  slides: ShallowRef<HTMLElement[]>
  contentEl: Ref<HTMLElement | null>
  live: ComputedRef<'off' | 'polite' | 'assertive'>
  playing: ComputedRef<boolean>
  /** Autoplay is requested, motion is allowed and there is more than one slide. */
  autoplayAvailable: ComputedRef<boolean>
  /** The user pressed pause. */
  userPaused: Ref<boolean>
  toggleAutoplay: () => void
  canPrev: ComputedRef<boolean>
  canNext: ComputedRef<boolean>
  prev: () => void
  next: () => void
  goTo: (index: number) => void
  registerSlide: (el: HTMLElement) => void
  unregisterSlide: (el: HTMLElement) => void
  onScroll: () => void
}

export const carouselKey: InjectionKey<CarouselContext> = Symbol('carousel')

export function useCarouselContext(part: string): CarouselContext {
  const ctx = inject(carouselKey, null)
  if (!ctx) throw new Error(`<${part}> must be used inside <Carousel>`)
  return ctx
}
