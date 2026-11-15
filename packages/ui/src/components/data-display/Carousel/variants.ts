import { cva, type VariantProps } from '../../../lib/cva'
import { focusRing } from '../../../lib/styles'

export const carouselContentVariants = cva(
  ['relative flex overflow-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-[inherit]', focusRing],
  {
    variants: {
      orientation: {
        horizontal: 'snap-x snap-mandatory flex-row',
        vertical: 'snap-y snap-mandatory flex-col',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
)

export const carouselItemVariants = cva('min-w-0 shrink-0 grow-0 basis-full snap-start', {
  variants: {
    orientation: {
      horizontal: '',
      vertical: '',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export const carouselDotsVariants = cva('flex items-center justify-center gap-2', {
  variants: {
    orientation: {
      horizontal: 'pt-3',
      vertical: 'absolute top-1/2 end-2 -translate-y-1/2 flex-col',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
})

export type CarouselContentVariants = VariantProps<typeof carouselContentVariants>
export type CarouselOrientation = NonNullable<CarouselContentVariants['orientation']>
