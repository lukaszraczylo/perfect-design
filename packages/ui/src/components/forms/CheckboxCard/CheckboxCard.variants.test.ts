import { afterEach, describe, expect, it } from 'vitest'
import { mount as vtuMount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import CheckboxCard from './CheckboxCard.vue'
import CheckboxCardGroup from './CheckboxCardGroup.vue'
import { CARD_ICON_TONE, CARD_INDICATOR_TONE, checkboxCardVariants, normalizeCardLayout, normalizeCardSize, normalizeCardTone, normalizeCardVariant } from './variants'
import { useStrictHarness } from '../testing'

const mounted: VueWrapper[] = []
const mount = ((c: unknown, o: Record<string, unknown> = {}) => {
  const w = vtuMount(c as never, { attachTo: document.body, ...o })
  mounted.push(w)
  return w
}) as unknown as typeof vtuMount
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount()
  document.body.innerHTML = ''
})

const root = (w: VueWrapper) => w.find('[data-slot="checkbox-card"]')
const indicator = (w: VueWrapper) => w.find('[data-slot="checkbox-card-indicator"]')
const icon = (w: VueWrapper) => w.find('[data-slot="checkbox-card-icon"]')
const content = (w: VueWrapper) => w.find('[data-slot="checkbox-card-content"]')

const TONES = [
  ['success', 'success', 'success-foreground'],
  ['danger', 'destructive', 'destructive-foreground'],
  ['info', 'info', 'info-foreground'],
] as const

describe('CheckboxCard variations', () => {
  describe('defaults are unchanged', () => {
    it('keeps the primary look and the plain layout', () => {
      const cls = root(mount(CheckboxCard, { props: { title: 'A' } })).classes()
      expect(cls).toEqual(
        expect.arrayContaining(['group', 'relative', 'flex', 'rounded-lg', 'border-input', 'bg-transparent', 'p-4', 'data-[state=checked]:border-primary', 'data-[state=checked]:bg-primary/5']),
      )
      expect(cls).not.toContain('flex-col')
      expect(cls.filter((c) => c.startsWith('data-[state=checked]:border-'))).toEqual(['data-[state=checked]:border-primary'])
    })

    it('renders the primary indicator and icon colours by default', () => {
      const w = mount(CheckboxCard, { props: { title: 'A', icon: faUser } })
      expect(indicator(w).classes()).toEqual(expect.arrayContaining(['data-[state=checked]:border-primary', 'data-[state=checked]:bg-primary', 'data-[state=checked]:text-primary-foreground']))
      expect(icon(w).classes()).toContain('group-data-[state=checked]:text-primary')
      expect(indicator(w).classes()).not.toContain('absolute')
    })

    it('pins the exact default class strings', () => {
      expect(checkboxCardVariants()).toBe('relative flex w-full cursor-pointer items-start gap-3 rounded-lg border text-left transition-[color,box-shadow,background-color,border-color] motion-reduce:transition-none has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/40 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[invalid]:border-destructive data-[invalid]:ring-destructive/20 dark:data-[invalid]:ring-destructive/40 forced-colors:has-focus-visible:outline-2 forced-colors:has-focus-visible:outline-offset-2 forced-colors:has-focus-visible:outline-solid forced-colors:data-[state=checked]:border-[Highlight] forced-colors:data-[invalid]:border-dashed border-input bg-transparent shadow-xs not-data-[disabled]:hover:bg-accent/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 p-4 text-sm')
      expect(checkboxCardVariants({ variant: 'filled', size: 'lg' })).toBe('relative flex w-full cursor-pointer items-start rounded-lg border text-left transition-[color,box-shadow,background-color,border-color] motion-reduce:transition-none has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/40 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[invalid]:border-destructive data-[invalid]:ring-destructive/20 dark:data-[invalid]:ring-destructive/40 forced-colors:has-focus-visible:outline-2 forced-colors:has-focus-visible:outline-offset-2 forced-colors:has-focus-visible:outline-solid forced-colors:data-[state=checked]:border-[Highlight] forced-colors:data-[invalid]:border-dashed border-transparent bg-muted not-data-[disabled]:hover:bg-muted/70 data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 gap-4 p-5 text-base')
      expect(root(mount(CheckboxCard, { props: { title: 'A' } })).classes().join(' ')).toBe(`group ${checkboxCardVariants()}`)
    })
  })

  describe('tone', () => {
    it.each(TONES)('%s tints and borders the checked outline card with the %s token', (tone, token, fg) => {
      const w = mount(CheckboxCard, { props: { title: 'A', icon: faUser, tone, defaultValue: true } })
      const cls = root(w).classes()
      expect(cls).toContain(`data-[state=checked]:border-${token}`)
      expect(cls).toContain(`data-[state=checked]:bg-${token}/5`)
      expect(cls).not.toContain('data-[state=checked]:border-primary')
      expect(cls).not.toContain('data-[state=checked]:bg-primary/5')
      expect(indicator(w).classes()).toEqual(expect.arrayContaining([`data-[state=checked]:border-${token}`, `data-[state=checked]:bg-${token}`, `data-[state=checked]:text-${fg}`]))
      expect(indicator(w).classes()).not.toContain('data-[state=checked]:bg-primary')
      expect(icon(w).classes()).toContain(`group-data-[state=checked]:text-${token}`)
      expect(icon(w).classes()).not.toContain('group-data-[state=checked]:text-primary')
    })

    it('neutral uses foreground on background', () => {
      const w = mount(CheckboxCard, { props: { title: 'A', icon: faUser, tone: 'neutral' } })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['data-[state=checked]:border-foreground', 'data-[state=checked]:bg-foreground/5']))
      expect(indicator(w).classes()).toEqual(expect.arrayContaining(['data-[state=checked]:bg-foreground', 'data-[state=checked]:text-background', 'data-[state=checked]:border-foreground']))
      expect(icon(w).classes()).toContain('group-data-[state=checked]:text-foreground')
    })

    it('the filled variant uses the stronger tint for every tone', () => {
      for (const [tone, token] of TONES) {
        expect(root(mount(CheckboxCard, { props: { title: 'A', variant: 'filled', tone } })).classes()).toEqual(
          expect.arrayContaining([`data-[state=checked]:border-${token}`, `data-[state=checked]:bg-${token}/10`, 'bg-muted']),
        )
      }
      expect(root(mount(CheckboxCard, { props: { title: 'A', variant: 'filled', tone: 'neutral' } })).classes()).toContain('data-[state=checked]:bg-foreground/10')
    })

    it('every tone keeps the forced-colors checked fragments and the check icon', () => {
      for (const tone of ['primary', 'success', 'danger', 'neutral', 'info']) {
        const w = mount(CheckboxCard, { props: { title: 'A', tone: tone as never, defaultValue: true } })
        expect(root(w).classes()).toContain('forced-colors:data-[state=checked]:border-[Highlight]')
        expect(indicator(w).classes()).toEqual(expect.arrayContaining(['forced-colors:data-[state=checked]:bg-[Highlight]', 'forced-colors:data-[state=checked]:text-[HighlightText]']))
        expect(indicator(w).find('svg').exists()).toBe(true)
        expect(root(w).attributes('data-state')).toBe('checked')
      }
    })

    it('unknown tone falls back to primary', () => {
      const w = mount(CheckboxCard, { props: { title: 'A', icon: faUser, tone: 'rainbow' as never } })
      expect(root(w).classes().join(' ')).toBe(root(mount(CheckboxCard, { props: { title: 'A', icon: faUser } })).classes().join(' '))
      expect(indicator(w).classes()).toContain('data-[state=checked]:bg-primary')
      expect(normalizeCardTone('rainbow')).toBe('primary')
    })

    it('class wins over the tone classes', () => {
      const cls = root(mount(CheckboxCard, { props: { title: 'A', tone: 'danger', class: 'data-[state=checked]:border-info custom' } })).classes()
      expect(cls).toContain('data-[state=checked]:border-info')
      expect(cls).not.toContain('data-[state=checked]:border-destructive')
      expect(cls).toContain('custom')
    })

    it('does not change the accessible semantics', () => {
      const w = mount(CheckboxCard, { props: { title: 'Alerts', description: 'By email', tone: 'danger' } })
      const input = w.find('input')
      expect(input.attributes('type')).toBe('checkbox')
      expect(input.attributes('aria-labelledby')).toBe(w.find('[data-slot="checkbox-card-title"]').attributes('id'))
      expect(input.attributes('aria-describedby')).toBe(w.find('[data-slot="checkbox-card-description"]').attributes('id'))
    })

    it('the checked state changes the data attribute for every tone', async () => {
      for (const tone of ['success', 'danger', 'neutral', 'info']) {
        const w = mount(CheckboxCard, { props: { title: 'A', tone: tone as never } })
        expect(root(w).attributes('data-state')).toBe('unchecked')
        await w.find('input').setValue(true)
        expect(root(w).attributes('data-state')).toBe('checked')
      }
    })
  })

  describe('layout', () => {
    it('stacked puts the icon above the text and the indicator in the top end corner', () => {
      const w = mount(CheckboxCard, { props: { title: 'A', description: 'B', icon: faUser, layout: 'stacked' } })
      expect(root(w).classes()).toContain('flex-col')
      expect(indicator(w).classes()).toEqual(expect.arrayContaining(['absolute', 'end-3', 'top-3', 'mt-0']))
      expect(indicator(w).classes()).not.toContain('mt-0.5')
      expect(content(w).classes()).toEqual(expect.arrayContaining(['w-full', 'pe-7']))
    })

    it('uses logical positions only', () => {
      const w = mount(CheckboxCard, { props: { title: 'A', layout: 'stacked' } })
      const all = [...root(w).classes(), ...indicator(w).classes(), ...content(w).classes()]
      expect(all.some((c) => /(^|:)(left|right|ml|mr|pl|pr)-/.test(c) || /^(left|right)-/.test(c))).toBe(false)
    })

    it('keeps the DOM order: input, icon, content, indicator', () => {
      const w = mount(CheckboxCard, { props: { title: 'A', icon: faUser, layout: 'stacked' } })
      const slots = [...root(w).element.children].map((c) => c.getAttribute('data-slot'))
      expect(slots).toEqual(['checkbox-card-input', 'checkbox-card-icon', 'checkbox-card-content', 'checkbox-card-indicator'])
    })

    it('unknown layout falls back to the default', () => {
      const w = mount(CheckboxCard, { props: { title: 'A', layout: 'diagonal' as never } })
      expect(root(w).classes()).not.toContain('flex-col')
      expect(indicator(w).classes()).not.toContain('absolute')
      expect(normalizeCardLayout('diagonal')).toBe('default')
    })

    it('stacked x tone x size x variant combine without conflict', () => {
      const w = mount(CheckboxCard, { props: { title: 'A', layout: 'stacked', tone: 'info', size: 'lg', variant: 'filled' } })
      expect(root(w).classes()).toEqual(expect.arrayContaining(['flex-col', 'p-5', 'text-base', 'bg-muted', 'data-[state=checked]:border-info', 'data-[state=checked]:bg-info/10']))
      expect(indicator(w).classes()).toEqual(expect.arrayContaining(['absolute', 'data-[state=checked]:bg-info']))
    })
  })

  describe('group cascade', () => {
    const make = (groupProps: Record<string, unknown>, cardProps: Record<string, unknown>[] = [{ value: 'a' }, { value: 'b' }]) =>
      mount(CheckboxCardGroup, {
        props: groupProps,
        attrs: { 'aria-label': 'Channels' },
        slots: { default: () => cardProps.map((p) => h(CheckboxCard, { title: String(p.value), icon: faUser, ...p } as never)) },
      })
    const cards = (w: VueWrapper) => w.findAll('[data-slot="checkbox-card"]')

    it('passes tone and layout to every card', () => {
      const w = make({ tone: 'success', layout: 'stacked' })
      for (const c of cards(w)) {
        expect(c.classes()).toEqual(expect.arrayContaining(['flex-col', 'data-[state=checked]:border-success']))
      }
      expect(w.findAll('[data-slot="checkbox-card-indicator"]')[1].classes()).toContain('absolute')
    })

    it('a card can override the group tone and layout', () => {
      const w = make({ tone: 'success', layout: 'stacked' }, [{ value: 'a' }, { value: 'b', tone: 'danger', layout: 'default' }])
      expect(cards(w)[0].classes()).toContain('data-[state=checked]:border-success')
      expect(cards(w)[1].classes()).toContain('data-[state=checked]:border-destructive')
      expect(cards(w)[1].classes()).not.toContain('flex-col')
    })

    it('selection still works with a toned group', async () => {
      const w = make({ tone: 'info' })
      await w.findAll('input')[1].setValue(true)
      expect(w.emitted('update:modelValue')?.[0]).toEqual([['b']])
      expect(cards(w)[1].attributes('data-state')).toBe('checked')
    })

    it('without group tone the cards keep the primary look', () => {
      expect(cards(make({}))[0].classes()).toContain('data-[state=checked]:border-primary')
    })
  })

  describe('variant function', () => {
    it('normalizes unknown values', () => {
      expect(normalizeCardVariant('x')).toBe('outline')
      expect(normalizeCardSize('x')).toBe('md')
      expect(checkboxCardVariants({ variant: 'x', size: 'x', tone: 'x', layout: 'x' })).toBe(checkboxCardVariants())
    })

    it('resolves a tone override instead of listing both colours', () => {
      const cls = checkboxCardVariants({ tone: 'success' })
      expect(cls).toContain('data-[state=checked]:border-success')
      expect(cls).not.toContain('data-[state=checked]:border-primary')
    })

    it('appends a caller class last', () => {
      expect(checkboxCardVariants({ class: 'rounded-none' })).toContain('rounded-none')
      expect(checkboxCardVariants({ class: 'rounded-none' })).not.toContain('rounded-lg')
    })

    it('exposes a class map for every tone', () => {
      expect(Object.keys(CARD_INDICATOR_TONE).sort()).toEqual(['danger', 'info', 'neutral', 'primary', 'success'])
      expect(Object.keys(CARD_ICON_TONE).sort()).toEqual(['danger', 'info', 'neutral', 'primary', 'success'])
    })
  })

  describe('edge cases', () => {
    it('disabled and invalid cards keep their state attributes under a tone', () => {
      const w = mount(CheckboxCard, { props: { title: 'A', tone: 'success', disabled: true, invalid: true } })
      expect(root(w).attributes('data-disabled')).toBeDefined()
      expect(root(w).attributes('data-invalid')).toBeDefined()
      expect(w.find('input').attributes('aria-invalid')).toBe('true')
      expect(root(w).classes()).toContain('data-[invalid]:border-destructive')
    })

    it('a long title wraps inside the stacked content column', () => {
      const w = mount(CheckboxCard, { props: { title: 'A very long title '.repeat(20), layout: 'stacked' } })
      expect(content(w).classes()).toContain('min-w-0')
    })
  })
})

describe('CheckboxCard variations: contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it('a stacked danger card without any name still throws', async () => {
    await mountTree(() => h(CheckboxCard, { icon: faUser, tone: 'danger', layout: 'stacked' }))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('CheckboxCard: needs an accessible name')
  })
  it('a toned group without a name still throws', async () => {
    await mountTree(() => h(CheckboxCardGroup, { tone: 'info', layout: 'stacked' }, () => h(CheckboxCard, { value: 'a', title: 'A' })))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('CheckboxCardGroup: needs an accessible name')
  })
  it('a toned card with a duplicate value still throws', async () => {
    await mountTree(() => h(CheckboxCardGroup, { 'aria-label': 'x', tone: 'success' }, () => [h(CheckboxCard, { value: 'a', title: 'A' }), h(CheckboxCard, { value: 'a', title: 'B', tone: 'danger' })]))
    expect(errors.some((e) => e.message.includes('"a" is used more than once') || e.message.includes('unique'))).toBe(true)
  })
  it('a correct toned, stacked card does not throw', async () => {
    await mountTree(() => h(CheckboxCard, { title: 'Email', tone: 'success', layout: 'stacked' }))
    expect(errors).toEqual([])
  })
})
