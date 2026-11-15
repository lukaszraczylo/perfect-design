import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { faList } from '@fortawesome/free-solid-svg-icons'
import SegmentedControl from './SegmentedControl.vue'
import { SegmentedControl as Exported, segmentedControlItemVariants, segmentedControlVariants } from './index'
import { normalizeSegmentedOrientation, normalizeSegmentedSize, normalizeSegmentedTone, normalizeSegmentedVariant } from './variants'
import { settle, useStrictHarness } from '../testing'

let wrapper: VueWrapper | undefined
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  document.body.innerHTML = ''
})

const OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]
const make = (props: Record<string, unknown> = {}) => {
  wrapper = mount(SegmentedControl, { props: { options: OPTIONS, defaultValue: 'week', ...props }, attrs: { 'aria-label': 'Range' }, attachTo: document.body })
  return wrapper
}
const root = (w: VueWrapper) => w.find('[data-slot="segmented-control"]')
const items = (w: VueWrapper) => w.findAll('[role="radio"]')
const press = async (item: { trigger: (e: string, o?: object) => Promise<void> }, key: string) => {
  await item.trigger('keydown', { key })
  await settle()
}
const checked = (w: VueWrapper) => items(w).find((i) => i.attributes('aria-checked') === 'true')!

const TONE_TOKENS = [
  ['primary', 'primary', 'primary-foreground'],
  ['success', 'success', 'success-foreground'],
  ['danger', 'destructive', 'destructive-foreground'],
  ['info', 'info', 'info-foreground'],
] as const
const ALL_TONES = ['default', 'primary', 'success', 'danger', 'neutral', 'info']
const VARIANTS = ['pill', 'underline', 'outline', 'filled']

describe('SegmentedControl variations', () => {
  it('is exported with its variant functions', () => {
    expect(Exported).toBe(SegmentedControl)
    expect(typeof segmentedControlVariants).toBe('function')
    expect(typeof segmentedControlItemVariants).toBe('function')
  })

  describe('defaults are unchanged', () => {
    it('pins the exact default class strings of the root and the segments', () => {
      expect(segmentedControlVariants()).toBe('max-w-full flex-wrap items-center gap-1 rounded-lg border border-transparent bg-muted p-1 text-muted-foreground forced-colors:aria-invalid:border-dashed inline-flex')
      expect(segmentedControlVariants({ fullWidth: true })).toBe('max-w-full flex-wrap items-center gap-1 rounded-lg border border-transparent bg-muted p-1 text-muted-foreground forced-colors:aria-invalid:border-dashed flex w-full')
      expect(segmentedControlItemVariants()).toBe('inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap select-none transition-[color,box-shadow,background-color] motion-reduce:transition-none pointer-coarse:min-h-9 hover:text-foreground data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm forced-colors:data-[state=checked]:bg-[Highlight] forced-colors:data-[state=checked]:text-[HighlightText] disabled:pointer-events-none disabled:opacity-50 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 h-7 px-3 text-sm')
      expect(segmentedControlItemVariants({ fullWidth: true, size: 'lg' })).toBe('inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap select-none transition-[color,box-shadow,background-color] motion-reduce:transition-none pointer-coarse:min-h-9 hover:text-foreground data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-sm forced-colors:data-[state=checked]:bg-[Highlight] forced-colors:data-[state=checked]:text-[HighlightText] disabled:pointer-events-none disabled:opacity-50 outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 h-9 px-4 text-base flex-1')
    })

    it('renders the pill look with horizontal orientation', () => {
      const w = make()
      expect(root(w).classes().join(' ')).toBe(segmentedControlVariants())
      expect(items(w)[0].classes().join(' ')).toBe(segmentedControlItemVariants())
      expect(root(w).attributes('aria-orientation')).toBe('horizontal')
      expect(items(w)[0].classes()).toEqual(expect.arrayContaining(['data-[state=checked]:bg-background', 'data-[state=checked]:text-foreground', 'data-[state=checked]:shadow-sm']))
    })
  })

  describe('variant', () => {
    it('underline draws a rule under the tray and a marker under the selected segment', () => {
      const w = make({ variant: 'underline' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-b', 'border-border', 'bg-transparent', 'p-0', 'gap-0']))
      expect(root(w).classes()).not.toContain('bg-muted')
      expect(items(w)[0].classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-b-2', 'border-transparent', '-mb-px', 'data-[state=checked]:border-foreground', 'data-[state=checked]:bg-transparent', 'data-[state=checked]:shadow-none', 'data-[state=checked]:text-foreground']))
      expect(items(w)[0].classes()).not.toContain('data-[state=checked]:bg-background')
    })

    it('outline gives the tray and the selected segment a border', () => {
      const w = make({ variant: 'outline' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['border', 'border-input', 'bg-transparent']))
      expect(root(w).classes()).not.toContain('border-transparent')
      expect(items(w)[0].classes()).toEqual(expect.arrayContaining(['border', 'border-transparent', 'data-[state=checked]:border-foreground', 'data-[state=checked]:bg-transparent', 'data-[state=checked]:shadow-none']))
    })

    it('filled makes the selected segment solid', () => {
      const w = make({ variant: 'filled' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['bg-muted', 'rounded-md']))
      expect(items(w)[0].classes()).toEqual(expect.arrayContaining(['rounded-sm', 'data-[state=checked]:bg-foreground', 'data-[state=checked]:text-background', 'data-[state=checked]:shadow-none']))
      expect(items(w)[0].classes()).not.toContain('data-[state=checked]:bg-background')
    })

    it('unknown variant falls back to pill', () => {
      const w = make({ variant: 'ribbon' })
      expect(root(w).classes().join(' ')).toBe(segmentedControlVariants())
      expect(items(w)[0].classes().join(' ')).toBe(segmentedControlItemVariants())
      expect(normalizeSegmentedVariant('ribbon')).toBe('pill')
    })

    it.each(VARIANTS)('%s keeps the forced-colors checked fragments, focus ring and coarse-pointer height', (variant) => {
      const w = make({ variant })
      expect(items(w)[0].classes()).toEqual(
        expect.arrayContaining(['forced-colors:data-[state=checked]:bg-[Highlight]', 'forced-colors:data-[state=checked]:text-[HighlightText]', 'focus-visible:ring-3', 'pointer-coarse:min-h-9', 'disabled:opacity-50']),
      )
      expect(root(w).classes()).toContain('forced-colors:aria-invalid:border-dashed')
    })
  })

  describe('tone', () => {
    it.each(TONE_TOKENS)('pill: %s selects with a solid chip', (tone, token, fg) => {
      const cls = items(make({ tone }))[0].classes()
      expect(cls).toEqual(expect.arrayContaining([`data-[state=checked]:bg-${token}`, `data-[state=checked]:text-${fg}`, `data-[state=checked]:hover:text-${fg}`, 'data-[state=checked]:shadow-sm']))
      expect(cls).not.toContain('data-[state=checked]:bg-background')
      expect(cls).not.toContain('data-[state=checked]:text-foreground')
    })

    it('pill: neutral is foreground on background', () => {
      expect(items(make({ tone: 'neutral' }))[0].classes()).toEqual(expect.arrayContaining(['data-[state=checked]:bg-foreground', 'data-[state=checked]:text-background']))
    })

    it('pill: the default tone keeps the neutral raised chip', () => {
      expect(items(make({ tone: 'default' }))[0].classes()).toContain('data-[state=checked]:bg-background')
    })

    it.each(['underline', 'outline'])('%s: the tone colours the marker border and keeps foreground text', (variant) => {
      for (const [tone, token] of TONE_TOKENS) {
        const cls = items(make({ variant, tone }))[0].classes()
        expect(cls).toContain(`data-[state=checked]:border-${token}`)
        expect(cls).not.toContain('data-[state=checked]:border-foreground')
        expect(cls).toContain('data-[state=checked]:text-foreground')
      }
      expect(items(make({ variant, tone: 'neutral' }))[0].classes()).toContain('data-[state=checked]:border-foreground')
    })

    it.each(TONE_TOKENS)('filled: %s is a solid selection', (tone, token, fg) => {
      expect(items(make({ variant: 'filled', tone }))[0].classes()).toEqual(expect.arrayContaining([`data-[state=checked]:bg-${token}`, `data-[state=checked]:text-${fg}`]))
    })

    it('unknown tone falls back to default', () => {
      expect(items(make({ tone: 'rainbow' }))[0].classes().join(' ')).toBe(segmentedControlItemVariants())
      expect(items(make({ tone: 'rainbow', variant: 'filled' }))[0].classes().join(' ')).toBe(segmentedControlItemVariants({ variant: 'filled' }))
      expect(normalizeSegmentedTone('rainbow')).toBe('default')
      expect(normalizeSegmentedTone(undefined)).toBe('default')
    })

    it('every variant and tone renders a selected segment with aria-checked', () => {
      for (const variant of VARIANTS) {
        for (const tone of ALL_TONES) {
          const w = make({ variant, tone })
          expect(checked(w).text()).toBe('Week')
          expect(checked(w).attributes('data-state')).toBe('checked')
          w.unmount()
        }
      }
    })

    it('does not tint unselected segments', () => {
      const cls = items(make({ tone: 'success' }))[0].classes()
      expect(cls.some((c) => /^bg-(success|primary|destructive|info)/.test(c))).toBe(false)
    })
  })

  describe('orientation', () => {
    it('vertical stacks the segments in a column and sets aria-orientation', () => {
      const w = make({ orientation: 'vertical' })
      expect(root(w).attributes('aria-orientation')).toBe('vertical')
      expect(root(w).classes()).toEqual(expect.arrayContaining(['flex-col', 'flex-nowrap', 'items-stretch', 'inline-flex']))
      expect(root(w).classes()).not.toContain('flex-wrap')
      expect(items(w)[0].classes()).toContain('justify-start')
      expect(items(w)[0].classes()).not.toContain('justify-center')
    })

    it('vertical with fullWidth fills the width without stretching the segments in height', () => {
      const w = make({ orientation: 'vertical', fullWidth: true })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['flex', 'w-full', 'flex-col']))
      expect(items(w)[0].classes()).toContain('flex-none')
      expect(items(w)[0].classes()).not.toContain('flex-1')
    })

    it('horizontal with fullWidth still gives equal segments', () => {
      const w = make({ fullWidth: true })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['flex', 'w-full']))
      expect(items(w)[0].classes()).toContain('flex-1')
    })

    it('vertical underline moves the rule and the marker to the start side', () => {
      const w = make({ orientation: 'vertical', variant: 'underline' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['border-s', 'border-b-0']))
      expect(items(w)[0].classes()).toEqual(expect.arrayContaining(['border-s-2', 'border-b-0', '-ms-px', 'mb-0']))
      expect(items(w)[0].classes()).not.toContain('border-b-2')
      expect(items(w)[0].classes()).not.toContain('-mb-px')
    })

    it('unknown orientation falls back to horizontal', () => {
      const w = make({ orientation: 'diagonal' })
      expect(root(w).attributes('aria-orientation')).toBe('horizontal')
      expect(root(w).classes()).not.toContain('flex-col')
      expect(normalizeSegmentedOrientation('diagonal')).toBe('horizontal')
    })

    it('uses logical properties only', () => {
      for (const variant of VARIANTS) {
        const w = make({ orientation: 'vertical', variant })
        const all = [...root(w).classes(), ...items(w)[0].classes()]
        expect(all.some((c) => /(^|:)(ml|mr|pl|pr|left|right|border-l|border-r)(-|$)/.test(c))).toBe(false)
        w.unmount()
      }
    })
  })

  describe('keyboard and roles are identical in every variant', () => {
    const KEYS = { horizontal: ['ArrowRight', 'ArrowLeft'], vertical: ['ArrowDown', 'ArrowUp'] } as const
    for (const orientation of ['horizontal', 'vertical'] as const) {
      for (const variant of VARIANTS) {
        it(`${variant} ${orientation}: roving tabindex, arrows, Home and End`, async () => {
          const w = make({ variant, orientation, tone: 'success' })
          await settle()
          expect(root(w).attributes('role')).toBe('radiogroup')
          expect(root(w).attributes('aria-orientation')).toBe(orientation)
          await items(w)[1].trigger('focus')
          ;(items(w)[1].element as HTMLElement).focus()
          await settle()
          expect(items(w).map((i) => i.attributes('tabindex'))).toEqual(['-1', '0', '-1'])
          await press(items(w)[1], KEYS[orientation][0])
          expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['month'])
          expect(document.activeElement).toBe(items(w)[2].element)
          await press(items(w)[2], KEYS[orientation][1])
          expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['week'])
          // Home and End move focus to the ends (selection follows only the arrow keys, as in a native radio group)
          await press(items(w)[1], 'Home')
          expect(document.activeElement).toBe(items(w)[0].element)
          await press(items(w)[0], 'End')
          expect(document.activeElement).toBe(items(w)[2].element)
          // the keys of the other axis do not move the selection
          const before = w.emitted('update:modelValue')?.length
          await press(items(w)[2], KEYS[orientation === 'vertical' ? 'horizontal' : 'vertical'][1])
          expect(w.emitted('update:modelValue')?.length).toBe(before)
        })
      }
    }

    it('click selects in every variant and reports the value', async () => {
      for (const variant of VARIANTS) {
        const w = make({ variant, orientation: 'vertical' })
        await items(w)[0].trigger('click')
        expect(w.emitted('update:modelValue')?.[0]).toEqual(['day'])
        expect(checked(w).text()).toBe('Day')
        w.unmount()
      }
    })

    it('segments keep their accessible names and icons stay decorative', () => {
      const w = make({ variant: 'outline', options: [{ value: 'a', label: 'List', icon: faList }, { value: 'b', label: 'Grid' }] })
      expect(items(w).map((i) => i.text())).toEqual(['List', 'Grid'])
      expect(items(w)[0].find('svg').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('combinations', () => {
    it('variant x tone x size x fullWidth x orientation merge without leftovers', () => {
      const w = make({ variant: 'outline', tone: 'danger', size: 'lg', fullWidth: true, orientation: 'vertical' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['flex', 'w-full', 'flex-col', 'border-input']))
      const cls = items(w)[0].classes()
      expect(cls).toEqual(expect.arrayContaining(['h-9', 'px-4', 'text-base', 'flex-none', 'justify-start', 'data-[state=checked]:border-destructive']))
      expect(cls).not.toContain('flex-1')
      expect(cls).not.toContain('h-7')
    })

    it('pill x tone x size', () => {
      expect(items(make({ tone: 'info', size: 'sm' }))[0].classes()).toEqual(expect.arrayContaining(['h-6', 'px-2.5', 'text-xs', 'data-[state=checked]:bg-info']))
    })

    it('size falls back to md for unknown values in every variant', () => {
      for (const variant of VARIANTS) {
        expect(items(make({ variant, size: 'xl' }))[0].classes()).toContain('h-7')
      }
      expect(normalizeSegmentedSize('xl')).toBe('md')
    })

    it('class wins over the variant classes on the root', () => {
      const w = make({ variant: 'underline', class: 'border-primary bg-card custom' })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['custom', 'bg-card', 'border-primary']))
      expect(root(w).classes()).not.toContain('border-border')
      expect(root(w).classes()).not.toContain('bg-transparent')
    })

    it('the variant functions let a caller class win', () => {
      expect(segmentedControlVariants({ variant: 'filled', class: 'rounded-none' })).toContain('rounded-none')
      expect(segmentedControlVariants({ variant: 'filled', class: 'rounded-none' })).not.toContain('rounded-md')
      expect(segmentedControlItemVariants({ class: 'px-8' })).toContain('px-8')
    })
  })

  describe('edge cases', () => {
    it('renders an empty tray for no options in every variant', () => {
      for (const variant of VARIANTS) {
        const w = make({ variant, options: [] })
        expect(items(w)).toHaveLength(0)
        expect(root(w).exists()).toBe(true)
        w.unmount()
      }
    })

    it('disabled segments and a disabled group stay inert in a toned variant', async () => {
      const w = make({ variant: 'filled', tone: 'success', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true }] })
      expect(items(w)[1].attributes('disabled')).toBeDefined()
      await items(w)[1].trigger('click')
      expect(w.emitted('update:modelValue')).toBeUndefined()
      const g = make({ variant: 'outline', disabled: true })
      expect(items(g).every((i) => i.attributes('disabled') !== undefined)).toBe(true)
    })

    it('invalid sets aria-invalid on the group and keeps the dashed forced-colors border', () => {
      const w = make({ variant: 'underline', invalid: true })
      expect(root(w).attributes('aria-invalid')).toBe('true')
      expect(root(w).classes()).toContain('forced-colors:aria-invalid:border-dashed')
    })

    it('long labels do not wrap inside a segment', () => {
      const w = make({ variant: 'filled', options: [{ value: 'a', label: 'A very long segment label '.repeat(5) }] })
      expect(items(w)[0].classes()).toContain('whitespace-nowrap')
      expect(root(w).classes()).toContain('max-w-full')
    })

    it('the option slot still replaces the content in a vertical variant', () => {
      wrapper = mount(SegmentedControl, { props: { options: OPTIONS, orientation: 'vertical', variant: 'underline' }, attrs: { 'aria-label': 'Range' }, slots: { option: ({ option }: { option: { label: string } }) => h('b', option.label.toUpperCase()) } })
      expect(items(wrapper).map((i) => i.text())).toEqual(['DAY', 'WEEK', 'MONTH'])
    })
  })
})

describe('SegmentedControl variations: contract', () => {
  const { errors, mountTree } = useStrictHarness()
  const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
  it('a vertical underline control without a name still throws', async () => {
    await mountTree(() => h(SegmentedControl, { options, variant: 'underline', orientation: 'vertical', tone: 'success' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('SegmentedControl: needs an accessible name')
  })
  it('a filled control with an unlabelled option still throws', async () => {
    await mountTree(() => h(SegmentedControl, { 'aria-label': 'x', variant: 'filled', tone: 'danger', options: [{ value: 'a', label: '', icon: faList }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires a text `label` on every option')
  })
  it('an outline control with a duplicate value still throws', async () => {
    await mountTree(() => h(SegmentedControl, { 'aria-label': 'x', variant: 'outline', orientation: 'vertical', options: [{ value: 'a', label: 'A' }, { value: 'a', label: 'B' }] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('unique')
  })
  it('a correct vertical toned control does not throw', async () => {
    await mountTree(() => h(SegmentedControl, { 'aria-label': 'x', variant: 'underline', orientation: 'vertical', tone: 'info', options }))
    expect(errors).toEqual([])
  })
})
