import { afterEach, describe, expect, it } from 'vitest'
import { mount as vtuMount, type VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import RadioCard from './RadioCard.vue'
import RadioCardGroup from './RadioCardGroup.vue'
import { radioCardVariants } from './variants'
import { checkboxCardVariants } from '../CheckboxCard/variants'
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

const cards = (w: VueWrapper) => w.findAll('[data-slot="radio-card"]')
const indicators = (w: VueWrapper) => w.findAll('[data-slot="radio-card-indicator"]')
const icons = (w: VueWrapper) => w.findAll('[data-slot="radio-card-icon"]')
const radios = (w: VueWrapper) => w.findAll('input[type="radio"]')

function group(props: Record<string, unknown> = {}, items: Record<string, unknown>[] = [{ value: 'a' }, { value: 'b' }, { value: 'c' }], attrs: Record<string, unknown> = {}) {
  return mount(RadioCardGroup, {
    props,
    attrs: { 'aria-label': 'Plan', ...attrs },
    slots: { default: () => items.map((p) => h(RadioCard, { key: String(p.value), title: String(p.value), icon: faUser, ...p } as never)) },
  })
}

const TONES = [
  ['success', 'success', 'success-foreground'],
  ['danger', 'destructive', 'destructive-foreground'],
  ['info', 'info', 'info-foreground'],
] as const

describe('RadioCard variations', () => {
  it('shares the card surface with CheckboxCard', () => {
    expect(radioCardVariants).toBe(checkboxCardVariants)
  })

  it('defaults keep the primary look, plain layout and a round indicator', () => {
    const w = group({}, [{ value: 'a' }])
    expect(cards(w)[0].classes()).toEqual(expect.arrayContaining(['data-[state=checked]:border-primary', 'data-[state=checked]:bg-primary/5', 'p-4']))
    expect(cards(w)[0].classes()).not.toContain('flex-col')
    expect(indicators(w)[0].classes()).toEqual(expect.arrayContaining(['rounded-full', 'data-[state=checked]:bg-primary']))
    expect(icons(w)[0].classes()).toContain('group-data-[state=checked]:text-primary')
  })

  describe('tone', () => {
    it.each(TONES)('%s colours the checked card, indicator dot and icon', (tone, token, fg) => {
      const w = group({}, [{ value: 'a', tone }])
      expect(cards(w)[0].classes()).toEqual(expect.arrayContaining([`data-[state=checked]:border-${token}`, `data-[state=checked]:bg-${token}/5`]))
      expect(indicators(w)[0].classes()).toEqual(expect.arrayContaining([`data-[state=checked]:bg-${token}`, `data-[state=checked]:text-${fg}`, 'rounded-full']))
      expect(icons(w)[0].classes()).toContain(`group-data-[state=checked]:text-${token}`)
    })

    it('neutral is foreground on background', () => {
      const w = group({}, [{ value: 'a', tone: 'neutral', variant: 'filled' }])
      expect(cards(w)[0].classes()).toEqual(expect.arrayContaining(['data-[state=checked]:border-foreground', 'data-[state=checked]:bg-foreground/10']))
      expect(indicators(w)[0].classes()).toEqual(expect.arrayContaining(['data-[state=checked]:bg-foreground', 'data-[state=checked]:text-background']))
    })

    it('the selected card keeps its forced-colors fragments and filled dot for every tone', async () => {
      for (const tone of ['primary', 'success', 'danger', 'neutral', 'info']) {
        const w = group({ tone, defaultValue: 'a' })
        expect(cards(w)[0].attributes('data-state')).toBe('checked')
        expect(cards(w)[0].classes()).toContain('forced-colors:data-[state=checked]:border-[Highlight]')
        expect(indicators(w)[0].classes()).toEqual(expect.arrayContaining(['forced-colors:data-[state=checked]:bg-[Highlight]', 'forced-colors:data-[state=checked]:text-[HighlightText]']))
        expect(indicators(w)[0].find('span').exists()).toBe(true)
        expect(indicators(w)[1].attributes('data-state')).toBe('unchecked')
      }
    })

    it('unknown tone falls back to primary and class wins', () => {
      const w = group({}, [{ value: 'a', tone: 'rainbow' }, { value: 'b', tone: 'danger', class: 'data-[state=checked]:border-info' }])
      expect(cards(w)[0].classes()).toContain('data-[state=checked]:border-primary')
      expect(cards(w)[1].classes()).toContain('data-[state=checked]:border-info')
      expect(cards(w)[1].classes()).not.toContain('data-[state=checked]:border-destructive')
    })
  })

  describe('layout', () => {
    it('stacked stacks the icon above the text and pins the round indicator', () => {
      const w = group({}, [{ value: 'a', layout: 'stacked', description: 'D' }])
      expect(cards(w)[0].classes()).toContain('flex-col')
      expect(indicators(w)[0].classes()).toEqual(expect.arrayContaining(['absolute', 'end-3', 'top-3', 'rounded-full']))
      expect(w.find('[data-slot="radio-card-content"]').classes()).toContain('pe-7')
    })

    it('unknown layout falls back to the default', () => {
      const w = group({}, [{ value: 'a', layout: 'x' }])
      expect(cards(w)[0].classes()).not.toContain('flex-col')
    })
  })

  describe('group cascade', () => {
    it('applies the group tone and layout, a card overrides them', () => {
      const w = group({ tone: 'info', layout: 'stacked' }, [{ value: 'a' }, { value: 'b', tone: 'success', layout: 'default' }])
      expect(cards(w)[0].classes()).toEqual(expect.arrayContaining(['flex-col', 'data-[state=checked]:border-info']))
      expect(cards(w)[1].classes()).toContain('data-[state=checked]:border-success')
      expect(cards(w)[1].classes()).not.toContain('flex-col')
    })

    it('combines with variant, size and columns', () => {
      const w = group({ tone: 'danger', layout: 'stacked', variant: 'filled', size: 'sm', columns: 2 })
      expect(cards(w)[0].classes()).toEqual(expect.arrayContaining(['bg-muted', 'p-3', 'flex-col', 'data-[state=checked]:bg-destructive/10']))
      expect(w.find('[data-slot="radio-card-group"]').classes()).toContain('sm:grid-cols-2')
    })

    it('keyboard and selection are unchanged by tone and layout', async () => {
      const w = group({ tone: 'success', layout: 'stacked', defaultValue: 'a' })
      ;(radios(w)[0].element as HTMLElement).focus()
      await w.find('[data-slot="radio-card-group"]').findAll('input')[0].trigger('keydown', { key: 'ArrowDown' })
      expect(w.emitted('update:modelValue')?.[0]).toEqual(['b'])
      expect(w.find('[data-slot="radio-card-group"]').attributes('role')).toBe('radiogroup')
      await w.findAll('input')[2].setValue(true)
      expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['c'])
    })

    it('disabled and invalid groups keep their state attributes', () => {
      const w = group({ tone: 'neutral', disabled: true, invalid: true })
      expect(cards(w)[0].attributes('data-disabled')).toBeDefined()
      expect(cards(w)[0].attributes('data-invalid')).toBeDefined()
      expect(w.find('[data-slot="radio-card-group"]').attributes('aria-invalid')).toBe('true')
    })
  })
})

describe('RadioCard variations: contract', () => {
  const { errors, mountTree } = useStrictHarness()
  it('a toned card outside a group still throws', async () => {
    await mountTree(() => h(RadioCard, { value: 'a', title: 'A', tone: 'danger', layout: 'stacked' }))
    expect(errors.some((e) => e.message.includes('requires a surrounding RadioCardGroup'))).toBe(true)
  })
  it('a toned, stacked group without a name still throws', async () => {
    await mountTree(() => h(RadioCardGroup, { tone: 'info', layout: 'stacked' }, () => h(RadioCard, { value: 'a', title: 'A' })))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('RadioCardGroup: needs an accessible name')
  })
  it('a stacked card without a name still throws', async () => {
    await mountTree(() => h(RadioCardGroup, { 'aria-label': 'x' }, () => h(RadioCard, { value: 'a', icon: faUser, tone: 'danger', layout: 'stacked' })))
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('RadioCard: needs an accessible name')
  })
  it('a toned card with an empty value still throws', async () => {
    await mountTree(() => h(RadioCardGroup, { 'aria-label': 'x', tone: 'success' }, () => h(RadioCard, { value: '', title: 'A', tone: 'danger' })))
    expect(errors.length).toBeGreaterThan(0)
  })
  it('a correct stacked toned group does not throw', async () => {
    await mountTree(() => h(RadioCardGroup, { 'aria-label': 'x', tone: 'success', layout: 'stacked' }, () => [h(RadioCard, { value: 'a', title: 'A' }), h(RadioCard, { value: 'b', title: 'B' })]))
    expect(errors).toEqual([])
  })
})
