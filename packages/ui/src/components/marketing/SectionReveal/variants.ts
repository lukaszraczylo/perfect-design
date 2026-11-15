import { cva, type VariantProps } from '../../../lib/cva'

export const SECTION_REVEAL_EFFECTS = ['fade-up', 'fade', 'fade-down', 'slide-left', 'slide-right'] as const
export const SECTION_REVEAL_DISTANCES = ['sm', 'md', 'lg'] as const
export const SECTION_REVEAL_SPEEDS = ['fast', 'normal', 'slow'] as const

export type SectionRevealEffect = (typeof SECTION_REVEAL_EFFECTS)[number]
export type SectionRevealDistance = (typeof SECTION_REVEAL_DISTANCES)[number]
export type SectionRevealSpeed = (typeof SECTION_REVEAL_SPEEDS)[number]

/**
 * Hidden-state classes per moving effect and distance (0.5rem, 1rem, 2rem). Written out in full because Tailwind finds
 * classes by scanning the source for whole class names. Moves use `translate`, never layout properties.
 */
const HIDDEN: Record<Exclude<SectionRevealEffect, 'fade'>, Record<SectionRevealDistance, string>> = {
  'fade-up': { sm: 'translate-y-2 opacity-0', md: 'translate-y-4 opacity-0', lg: 'translate-y-8 opacity-0' },
  'fade-down': { sm: '-translate-y-2 opacity-0', md: '-translate-y-4 opacity-0', lg: '-translate-y-8 opacity-0' },
  'slide-left': { sm: '-translate-x-2 opacity-0', md: '-translate-x-4 opacity-0', lg: '-translate-x-8 opacity-0' },
  'slide-right': { sm: 'translate-x-2 opacity-0', md: 'translate-x-4 opacity-0', lg: 'translate-x-8 opacity-0' },
}

const hiddenCompounds = (Object.keys(HIDDEN) as (keyof typeof HIDDEN)[]).flatMap((effect) =>
  SECTION_REVEAL_DISTANCES.map((distance) => ({ effect, distance, revealed: false, class: HIDDEN[effect][distance] })),
)

/**
 * The revealed and hidden states of an enabled `SectionReveal`. Only `opacity` and `translate` change, so the box never
 * moves in the layout (no layout shift). `fade` ignores `distance`. Reduced motion removes the transition.
 */
export const sectionRevealVariants = cva('transition-[opacity,translate] ease-out motion-reduce:transition-none', {
  variants: {
    effect: { 'fade-up': '', fade: '', 'fade-down': '', 'slide-left': '', 'slide-right': '' },
    distance: { sm: '', md: '', lg: '' },
    speed: { fast: 'duration-300', normal: 'duration-700', slow: 'duration-1000' },
    revealed: { true: '', false: '' },
  },
  compoundVariants: [
    { effect: 'fade', revealed: false, class: 'opacity-0' },
    { effect: ['fade-up', 'fade-down', 'fade'], revealed: true, class: 'translate-y-0 opacity-100' },
    { effect: ['slide-left', 'slide-right'], revealed: true, class: 'translate-x-0 opacity-100' },
    ...hiddenCompounds,
  ],
  defaultVariants: { effect: 'fade-up', distance: 'md', speed: 'normal', revealed: true },
})

export type SectionRevealVariants = VariantProps<typeof sectionRevealVariants>
