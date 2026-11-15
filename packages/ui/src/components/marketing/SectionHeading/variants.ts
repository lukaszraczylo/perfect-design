import { cva, type VariantProps } from '../../../lib/cva'

export const sectionHeadingAlignNames = ['left', 'center', 'right'] as const
export const sectionHeadingSizeNames = ['sm', 'md', 'lg', 'full'] as const
export const sectionHeadingEyebrowNames = ['text', 'pill'] as const

export const sectionHeadingVariants = cva('flex flex-col gap-3', {
  variants: {
    align: {
      left: 'items-start text-start',
      center: 'mx-auto items-center text-center',
      right: 'ms-auto items-end text-end',
    },
    size: {
      sm: 'max-w-xl',
      md: 'max-w-2xl',
      lg: 'max-w-3xl',
      full: 'max-w-none',
    },
  },
  defaultVariants: { align: 'left', size: 'md' },
})

export type SectionHeadingVariants = VariantProps<typeof sectionHeadingVariants>
export type SectionHeadingAlign = (typeof sectionHeadingAlignNames)[number]
export type SectionHeadingSize = (typeof sectionHeadingSizeNames)[number]
export type SectionHeadingEyebrowStyle = (typeof sectionHeadingEyebrowNames)[number]

/** Title typography per heading level is fixed to one scale so `level` only changes semantics; `size` scales it. */
export const sectionHeadingTitleClass = 'text-balance text-3xl font-semibold tracking-tight sm:text-4xl'

export const sectionHeadingTitleVariants = cva('text-balance break-words font-semibold tracking-tight', {
  variants: {
    size: {
      sm: 'text-2xl sm:text-3xl',
      md: 'text-3xl sm:text-4xl',
      lg: 'text-4xl sm:text-5xl',
      full: 'text-3xl sm:text-4xl',
    },
  },
  defaultVariants: { size: 'md' },
})

export const sectionHeadingDescriptionVariants = cva('text-pretty text-muted-foreground', {
  variants: {
    size: {
      sm: 'text-sm sm:text-base',
      md: 'text-base sm:text-lg',
      lg: 'text-lg sm:text-xl',
      full: 'text-base sm:text-lg',
    },
  },
  defaultVariants: { size: 'md' },
})

/** Sentence case, no tracking (LLMSlop T4/T5). `text` is a plain accent label; `pill` is a bordered badge. */
export const sectionHeadingEyebrowVariants = cva('text-sm font-medium', {
  variants: {
    style: {
      text: 'text-primary',
      pill: 'inline-flex items-center rounded-md border bg-muted px-3 py-1 text-foreground',
    },
  },
  defaultVariants: { style: 'text' },
})

export const sectionHeadingActionsVariants = cva('mt-2 flex flex-wrap items-center gap-3', {
  variants: {
    align: { left: 'justify-start', center: 'justify-center', right: 'justify-end' },
  },
  defaultVariants: { align: 'left' },
})
