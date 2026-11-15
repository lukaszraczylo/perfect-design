import type { BaseProps } from '../../../lib/types'
import type { CodeViewerSize, CodeViewerVariant } from './variants'

/** Props shared by CodeViewer, YamlViewer and GoViewer (everything except the source and the language). */
export interface CodeViewerBaseProps extends BaseProps {
  /** Shown in the header and used as the accessible name of the code region. */
  filename?: string
  /** Show a line-number gutter (not selectable, hidden from assistive tech). */
  lineNumbers?: boolean
  /** Show fold toggles for regions the language defines (blocks, tables, indentation, imports, comments). */
  foldable?: boolean
  /** Regions nested this deep (0 = outermost) or deeper start folded. Leave unset to start fully expanded. */
  defaultFoldDepth?: number
  /** Lines to mark, as displayed numbers: `[2, 5]` or `"3-5,9"`. Invalid parts are ignored. */
  highlightLines?: number[] | string
  /** Number shown for the first line (default 1). Fold names and `highlightLines` use the displayed numbers. */
  startLine?: number
  /** Wrap long lines instead of scrolling sideways. */
  wrap?: boolean
  /** CSS length (for example `20rem`); the code scrolls vertically beyond it. */
  maxHeight?: string
  /** Show the copy button. */
  copy?: boolean
  /** `bordered` card panel (default), `plain` no frame, `flush` full-bleed with top and bottom rules. Unknown values fall back to `bordered`. */
  variant?: CodeViewerVariant
  /** Text size: `sm` text-xs, `md` text-sm (default), `lg` text-base. Row height stays at least 1.5rem (`lg` uses 1.75rem). */
  size?: CodeViewerSize
  /** Overrides the accessible name of the code region. */
  label?: string
}

export interface CodeViewerFoldEvent {
  /** Displayed number of the first line of the region. */
  start: number
  /** Displayed number of the last line of the region. */
  end: number
  collapsed: boolean
}
