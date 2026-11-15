import { computed, inject, provide, reactive, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import type { CommandSize } from './variants'

export interface CommandContext {
  search: Ref<string>
  shouldFilter: Ref<boolean>
  /** Size preset shared with every part (`md` when unset). */
  size: Ref<CommandSize>
  /** Ids of items that currently match the search (drives CommandEmpty / group visibility). */
  visible: Set<string>
  matches: (haystack: string) => boolean
  /** Item values by registration order, used to detect duplicates (a duplicate value selects two rows at once). */
  values: Map<unknown, string[]>
}

export interface CommandGroupContext {
  visible: Set<string>
}

const COMMAND_KEY: InjectionKey<CommandContext> = Symbol('perfect-design:command')
const GROUP_KEY: InjectionKey<CommandGroupContext> = Symbol('perfect-design:command-group')

/** Case-insensitive match: every whitespace-separated token of `search` must appear in `haystack`. */
export function matchesSearch(haystack: string, search: string): boolean {
  const tokens = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  const h = haystack.toLowerCase()
  return tokens.every((t) => h.includes(t))
}

export function provideCommand(ctx: Omit<CommandContext, 'visible' | 'matches' | 'values'>): CommandContext {
  const full: CommandContext = {
    ...ctx,
    visible: reactive(new Set<string>()) as Set<string>,
    values: new Map<unknown, string[]>(),
    matches: (h) => !ctx.shouldFilter.value || matchesSearch(h, ctx.search.value),
  }
  provide(COMMAND_KEY, full)
  return full
}

/** Returns the Command context, or `undefined` when used outside a Command (then nothing is filtered). */
export function useCommand(): CommandContext | undefined {
  return inject(COMMAND_KEY, undefined)
}

/** Size of the nearest Command, `md` outside one. */
export function useCommandSize(): ComputedRef<CommandSize> {
  const command = useCommand()
  return computed(() => command?.size.value ?? 'md')
}

export function provideCommandGroup(): CommandGroupContext {
  const ctx: CommandGroupContext = { visible: reactive(new Set<string>()) as Set<string> }
  provide(GROUP_KEY, ctx)
  return ctx
}

export function useCommandGroup(): CommandGroupContext | undefined {
  return inject(GROUP_KEY, undefined)
}
