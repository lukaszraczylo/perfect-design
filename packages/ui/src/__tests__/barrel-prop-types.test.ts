import { describe, expect, it } from 'vitest'
import type { CardActionProps, CardContentProps, CardDescriptionProps, CardFooterProps, CardHeaderProps, CardTitleProps } from '../components/data-display/Card'
import type { FaqEntryProps } from '../components/marketing/FaqList'
import type { LogoCloudLogoProps } from '../components/marketing/LogoCloud'
import type { TestimonialAvatarProps } from '../components/marketing/Testimonial'

// vue-tsc fails this file when a barrel stops exporting one of these prop types.
describe('part prop types are exported from their barrels', () => {
  it('can be used as types', () => {
    const header: CardHeaderProps = {}
    const title: CardTitleProps = {}
    const description: CardDescriptionProps = {}
    const content: CardContentProps = {}
    const footer: CardFooterProps = {}
    const action: CardActionProps = {}
    const faq: Partial<FaqEntryProps> = {}
    const logo: Partial<LogoCloudLogoProps> = {}
    const avatar: Partial<TestimonialAvatarProps> = {}
    expect([header, title, description, content, footer, action, faq, logo, avatar]).toHaveLength(9)
  })
})
