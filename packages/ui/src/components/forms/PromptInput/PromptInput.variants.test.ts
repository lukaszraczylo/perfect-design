import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PromptInput from './PromptInput.vue'
import { promptInputVariants } from './variants'
import { PROMPT_INPUT_SIZES, PROMPT_INPUT_VARIANTS, normalizePromptSize, normalizePromptVariant } from './variants'

const m = (props: Record<string, unknown> = {}) => mount(PromptInput, { props, attrs: { 'aria-label': 'Sample' } })
const root = (props: Record<string, unknown> = {}) => m(props).element as HTMLElement
const cls = (props: Record<string, unknown> = {}) => new Set(root(props).className.split(/\s+/))

describe('PromptInput variations: defaults', () => {
  it('renders the default variant and size and matches the exported variants function', () => {
    const c = cls()
    for (const k of ['rounded-lg', 'border', 'border-input', 'bg-background', 'shadow-xs', 'p-2', 'text-md', 'md:text-base', 'w-full', 'min-w-0', 'flex', 'flex-col']) expect(c.has(k), k).toBe(true)
    expect(c).toEqual(new Set(promptInputVariants().split(/\s+/)))
    expect(c.has('bg-muted')).toBe(false)
  })
  it('exposes the value lists and normalisers', () => {
    expect([...PROMPT_INPUT_VARIANTS]).toEqual(['default', 'filled', 'minimal'])
    expect([...PROMPT_INPUT_SIZES]).toEqual(['sm', 'md', 'lg'])
    expect(normalizePromptVariant('nope')).toBe('default')
    expect(normalizePromptSize(undefined)).toBe('md')
    expect(normalizePromptSize('lg')).toBe('lg')
  })
})

describe('PromptInput variant', () => {
  it('filled has a muted fill and no visible border colour but a forced-colors border', () => {
    const c = cls({ variant: 'filled' })
    expect(c.has('bg-muted')).toBe(true)
    expect(c.has('border-transparent')).toBe(true)
    expect(c.has('forced-colors:border-[ButtonText]')).toBe(true)
    expect(c.has('border-input')).toBe(false)
    expect(c.has('shadow-xs')).toBe(false)
  })
  it('minimal is transparent, shows its border on hover and keeps a forced-colors border', () => {
    const c = cls({ variant: 'minimal' })
    expect(c.has('bg-transparent')).toBe(true)
    expect(c.has('hover:border-input')).toBe(true)
    expect(c.has('forced-colors:border-[ButtonText]')).toBe(true)
    expect(c.has('bg-background')).toBe(false)
  })
  it('every variant keeps the keyboard focus ring and a forced-colors outline', () => {
    for (const variant of PROMPT_INPUT_VARIANTS) {
      const c = cls({ variant })
      expect(c.has('has-[textarea:focus-visible]:ring-3'), variant).toBe(true)
      expect(c.has('forced-colors:has-[textarea:focus-visible]:outline-2'), variant).toBe(true)
    }
  })
  it('an unknown variant falls back to default', () => {
    expect(cls({ variant: 'neon' })).toEqual(cls())
  })
})

describe('PromptInput size', () => {
  it.each([
    ['sm', ['p-1.5', 'md:text-sm']],
    ['md', ['p-2', 'md:text-base']],
    ['lg', ['p-3']],
  ])('%s sets %j and keeps 16px text below md', (size, expected) => {
    const c = cls({ size })
    for (const k of expected) expect(c.has(k), k).toBe(true)
    expect(c.has('text-md')).toBe(true)
  })
  it('lg has no md downsize', () => {
    expect(cls({ size: 'lg' }).has('md:text-base')).toBe(false)
  })
  it('the buttons follow the size (32px, 36px, 44px) and grow on touch', () => {
    for (const [size, expected] of [['sm', 'size-8'], ['md', 'size-9'], ['lg', 'size-11']] as const) {
      const btn = m({ size }).find('[data-slot=prompt-input-submit]')
      expect(btn.classes(), size).toContain(expected)
      expect(btn.classes().join(' ')).toContain('rounded-full')
    }
    expect(m({ size: 'md' }).find('[data-slot=prompt-input-submit]').classes()).toContain('pointer-coarse:size-11')
  })
  it('an unknown size falls back to md', () => {
    expect(cls({ size: 'huge' })).toEqual(cls())
  })
})

describe('PromptInput combinations and class', () => {
  it.each(PROMPT_INPUT_VARIANTS.flatMap((v) => PROMPT_INPUT_SIZES.map((s) => [v, s] as const)))('%s + %s renders both dimensions', (variant, size) => {
    const c = cls({ variant, size })
    const v = new Set(promptInputVariants({ variant, size }).split(/\s+/))
    expect(c).toEqual(v)
  })
  it('class wins over variant classes', () => {
    const c = cls({ variant: 'filled', size: 'sm', class: 'p-6 bg-card' })
    expect(c.has('p-6')).toBe(true)
    expect(c.has('p-1.5')).toBe(false)
    expect(c.has('bg-card')).toBe(true)
    expect(c.has('bg-muted')).toBe(false)
  })
  it('uses logical properties and no physical left/right utilities', () => {
    const html = m({ maxLength: 10 }).html()
    expect(html).toContain('ms-auto')
    expect(html).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-/)
  })
  it('the destructive border follows aria-invalid and the disabled state dims the box', () => {
    const c = cls()
    expect(c.has('has-[textarea[aria-invalid=true]]:border-destructive')).toBe(true)
    expect(c.has('has-[textarea:disabled]:opacity-50')).toBe(true)
  })
})
