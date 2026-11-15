import type { Component } from 'vue'
import * as UI from './index'

/** Every Vue component exported by the library, keyed by PascalCase name. Used by docs + tests. */
export const allComponents: Record<string, Component> = Object.fromEntries(
  Object.entries(UI).filter(([k, v]) => /^[A-Z]/.test(k) && v !== null && typeof v === 'object' && ('setup' in v || 'render' in v || '__name' in v)),
) as Record<string, Component>
