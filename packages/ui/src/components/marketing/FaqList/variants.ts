import { cva, type VariantProps } from '../../../lib/cva'

export const FAQ_LIST_VARIANTS = ['bordered', 'separated', 'plain', 'two-column', 'with-categories', 'numbered'] as const
export type FaqListVariant = (typeof FAQ_LIST_VARIANTS)[number]
export type FaqCategoryMode = 'headings' | 'tabs'

/** Unknown values fall back to `bordered` (the original look). */
export function resolveFaqListVariant(value: unknown): FaqListVariant {
  return (FAQ_LIST_VARIANTS as readonly unknown[]).includes(value) ? (value as FaqListVariant) : 'bordered'
}

export const faqListVariants = cva('', {
  variants: {
    variant: {
      bordered: 'divide-y border-y',
      numbered: 'divide-y border-y',
      separated: 'flex flex-col gap-3',
      plain: 'flex flex-col gap-2',
      'two-column': 'grid grid-cols-1 items-start gap-x-12 md:grid-cols-2',
      'with-categories': 'flex flex-col gap-10',
    },
  },
  defaultVariants: { variant: 'bordered' },
})

export const faqItemVariants = cva('group', {
  variants: {
    variant: {
      bordered: 'py-4',
      numbered: 'py-4',
      'with-categories': 'py-4',
      separated: 'rounded-lg border bg-card px-5 py-4 text-card-foreground',
      plain: 'py-3',
      'two-column': 'border-b py-4',
    },
  },
  defaultVariants: { variant: 'bordered' },
})

/** Wrapper around the items of one category (headings and tabs modes). */
export const faqGroupClass = 'divide-y border-y'

export type FaqListVariants = VariantProps<typeof faqListVariants>
