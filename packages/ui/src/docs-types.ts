/**
 * Documentation contract. Every component folder contains `<Name>.docs.ts` with a default export
 * of type ComponentDoc. The docs website, the `llms.txt` generator and the structure tests all read it.
 * This file must stay dependency-free (types only) so scripts can import docs files without Vue tooling.
 */
export interface PropDoc {
  name: string
  /** TypeScript type as a string, e.g. `'default' | 'outline'`. */
  type: string
  default?: string
  required?: boolean
  description: string
}

export interface SlotDoc {
  name: string
  description: string
  /** Scoped slot props, e.g. `{ open: boolean }`. */
  props?: string
}

export interface EmitDoc {
  name: string
  /** Payload type, e.g. `[value: string]`. */
  payload?: string
  description: string
}

export interface ExampleDoc {
  title: string
  description?: string
  /**
   * Vue TEMPLATE snippet (no <template> wrapper). Rendered live on the docs site with every library
   * component globally registered, and shown as copy-paste code. Must mount without warnings.
   */
  code: string
  /** Display-only `<script setup>` body shown above the template, for examples that use state. */
  script?: string
  /**
   * Returns the reactive state the template uses (refs/reactive/functions). Called inside setup().
   * Keep it consistent with `script`.
   */
  state?: () => Record<string, unknown>
}

/** A compound sub-part, e.g. DialogContent. */
export interface PartDoc {
  name: string
  description: string
  props?: PropDoc[]
}

export interface ComponentDoc {
  /** PascalCase name; must equal the main export of the folder's index.ts. */
  name: string
  /** Top-level group; must equal the folder under components/ (e.g. `primitives`, `forms`). */
  group: string
  /** Human-facing subgroup inside the group, e.g. `Buttons`, `Text fields`, `Menus`. */
  subgroup: string
  /** One sentence, imperative/descriptive, used in lists and llms.txt. */
  summary: string
  /** Longer explanation: when to use, when NOT to use, design intent. Markdown allowed. */
  description?: string
  status?: 'stable' | 'beta'
  /** Compound parts exported alongside (DialogTrigger, DialogContent, ...). */
  parts?: PartDoc[]
  props: PropDoc[]
  slots?: SlotDoc[]
  emits?: EmitDoc[]
  /** At least 2 examples: a minimal one and a realistic one. */
  examples: ExampleDoc[]
  /** Accessibility behaviour: roles, keyboard, labelling. */
  a11y?: string[]
  /** Other component names, for cross-links. */
  related?: string[]
  /**
   * Requirements the component ENFORCES at runtime (a ContractError is thrown when they are missing, see lib/contract.ts).
   * One sentence each, naming the error condition, e.g. "Throws when no `DialogTitle` is rendered inside `DialogContent` (or `aria-label` is set)."
   * Every entry must have a test that triggers it.
   */
  requires?: string[]
  /** Terse imperative rules for LLM authors ("Always give icon-only buttons an aria-label"). */
  llmNotes?: string[]
  /** Existing app components this replaces, e.g. `shadcn-vue Button` or a hand-rolled markup pattern. */
  replaces?: string[]
}
