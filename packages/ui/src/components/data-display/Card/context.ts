import type { ComputedRef, InjectionKey } from 'vue'
import type { CardLayout, CardSize } from './variants'

/** Card provides its layout so `CardMedia` can size itself without the consumer repeating it. */
export const CARD_LAYOUT_KEY: InjectionKey<ComputedRef<CardLayout>> = Symbol('perfect-design:card-layout')

/** Card provides its size so the header, content, footer and body parts match its padding. */
export const CARD_SIZE_KEY: InjectionKey<ComputedRef<CardSize>> = Symbol('perfect-design:card-size')

/** Horizontal padding of the parts per card size (`md` is the original `px-6`). */
export const CARD_PART_PX: Record<CardSize, string> = { sm: 'px-4', md: 'px-6', lg: 'px-8' }
