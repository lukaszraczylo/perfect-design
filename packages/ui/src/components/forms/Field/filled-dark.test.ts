import { describe, expect, it } from 'vitest'
import { cn } from '../../../lib/cn'
import { fieldLookClasses, fieldVariants } from './field-variants'
import { inputVariants } from '../Input/variants'
import { textareaVariants } from '../Textarea/variants'
import { numberInputVariants } from '../NumberInput/variants'
import { passwordInputVariants } from '../PasswordInput/variants'
import { searchInputVariants } from '../SearchInput/variants'
import { dateInputVariants } from '../DateInput/variants'
import { timeInputVariants } from '../TimeInput/variants'
import { nativeSelectVariants } from '../NativeSelect/variants'
import { copyFieldVariants } from '../CopyField/variants'
import { selectTriggerVariants } from '../Select/variants'
import { comboboxVariants } from '../Combobox/variants'
import { multiSelectTriggerVariants } from '../MultiSelect/variants'
import { tagsInputVariants } from '../TagsInput/variants'
import { pinInputCellVariants } from '../PinInput/variants'
import { datePickerVariants } from '../DatePicker/variants'
import { inputGroupVariants } from '../InputGroup/variants'

type Raw = (o?: Record<string, unknown>) => string
/** The helpers are plain cva (no tailwind-merge), so merge the way a component does: `cn(variants(...))`. */
const merged = (fn: Raw) => (o?: Record<string, unknown>) => cn(fn(o))
type Fn = Raw
/**
 * In dark mode `fieldSurface` fills every field with `dark:bg-input/30`, which is almost `muted` (about 1.10:1), so a `filled` field
 * that used `dark:bg-muted` was barely different from `outline`. `filled` now uses `dark:bg-card` (contrast.test.ts asserts it is at
 * least 1.15:1 from the outline fill over the page and over a card). Light mode and the default output are unchanged.
 */
const FIELDS: [string, Fn][] = [
  ['fieldVariants', fieldVariants as Fn],
  ['Input', inputVariants as Fn],
  ['Textarea', textareaVariants as Fn],
  ['NumberInput', numberInputVariants as Fn],
  ['PasswordInput', passwordInputVariants as Fn],
  ['SearchInput', searchInputVariants as Fn],
  ['DateInput', dateInputVariants as Fn],
  ['TimeInput', timeInputVariants as Fn],
  ['NativeSelect', nativeSelectVariants as Fn],
  ['CopyField', copyFieldVariants as Fn],
  ['Select trigger', selectTriggerVariants as Fn],
  ['Combobox', comboboxVariants as Fn],
  ['MultiSelect trigger', multiSelectTriggerVariants as Fn],
  ['TagsInput', tagsInputVariants as Fn],
  ['PinInput cell', pinInputCellVariants as Fn],
  ['DatePicker trigger', datePickerVariants as Fn],
  ['InputGroup', inputGroupVariants as Fn],
]

describe('filled text fields in dark mode', () => {
  it.each(FIELDS)('%s: filled keeps the light muted fill and uses card in dark; the outline default keeps input/30', (_name, raw) => {
    const fn = merged(raw)
    const filled = fn({ variant: 'filled' }).split(/\s+/)
    expect(filled).toContain('bg-muted')
    expect(filled).toContain('dark:bg-card')
    expect(filled).not.toContain('dark:bg-muted')
    expect(filled).not.toContain('dark:bg-input/30')
    const outline = fn().split(/\s+/)
    expect(outline).not.toContain('dark:bg-card')
    expect(outline).not.toContain('dark:bg-muted')
    expect(outline).toContain('dark:bg-input/30')
    expect(fn({ variant: 'outline' })).toBe(fn())
  })

  it('every other variant keeps its own dark fill and none adopts card', () => {
    for (const variant of ['underline', 'ghost'] as const) expect(fieldLookClasses({ variant })).not.toContain('dark:bg-card')
    expect(fieldLookClasses({ variant: 'underline' })).toContain('dark:bg-transparent')
    expect(fieldLookClasses({ variant: 'ghost' })).toContain('dark:bg-transparent')
  })

  it('light mode is unchanged: filled is still the muted fill without a shadow, and the shared look fragment lists dark:bg-card once', () => {
    expect(fieldLookClasses({ variant: 'filled' })).toBe('bg-muted shadow-none dark:bg-card')
    expect(fieldLookClasses({ variant: 'outline' })).toBe('')
  })

  it('a consumer class still wins over the dark fill', () => {
    const out = cn(fieldVariants({ variant: 'filled' }), 'dark:bg-accent')
    expect(out).toContain('dark:bg-accent')
    expect(out).not.toContain('dark:bg-card')
  })
})
