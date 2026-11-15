/**
 * Helpers for the contract checks of marketing lists (`items`, `logos`, `images`, `links`).
 * - `checkItems` reports once per list: the first failing item, named by index.
 * - `ItemsChecked` wraps a card that a grid generates from `items`: the grid already checked the data, so the card
 *   skips its own check (slot-provided cards are not wrapped and still check themselves).
 */
import { defineComponent, inject, provide, type InjectionKey } from 'vue'
import { violation } from '../../../lib/contract'

/** One broken requirement: `rule` is the machine name, `text` the sentence (starts with "requires"). */
export interface Problem {
  rule: string
  text: string
}

const CHECKED: InjectionKey<boolean> = Symbol('pd:items-checked')

export const ItemsChecked = defineComponent({
  name: 'ItemsChecked',
  setup(_, { slots }) {
    provide(CHECKED, true)
    return () => slots.default?.()
  },
})

/** True inside an `ItemsChecked`: the parent grid checks the data, the card stays quiet. */
export const parentChecksItems = (): boolean => inject(CHECKED, false)

export const isBlank = (value: unknown): boolean => typeof value !== 'string' || value.trim() === ''

/** Report a single problem for a component. */
export const report = (component: string, problem: Problem | undefined): void => {
  if (problem) violation(component, problem.rule, problem.text)
}

/** Report the first failing item of a list, naming it as `list[index]`. */
export function checkItems<T>(component: string, list: string, items: readonly T[] | undefined, problem: (item: T) => Problem | undefined): void {
  if (!Array.isArray(items)) return
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const found = item && typeof item === 'object' ? problem(item) : undefined
    if (found) {
      violation(component, found.rule, `${list}[${i}] ${found.text}`)
      return
    }
  }
}
