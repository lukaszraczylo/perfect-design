import type { Component } from 'vue'
import type { BaseProps } from '../../../lib/types'
import type { MarkdownSize, MarkdownTone } from './variants'

/** Props passed to a custom `link` renderer. The label is the default slot. `href` has already passed the URL allow-list. */
export interface MarkdownLinkProps {
  href: string
  title?: string
  /** Leaves the current site (absolute http(s) or protocol-relative). */
  external: boolean
  target?: '_blank'
  rel?: string
}
/** Props passed to a custom `image` renderer. `src` has already passed the URL allow-list. */
export interface MarkdownImageProps {
  src: string
  alt: string
  title?: string
}
/** Props passed to a custom fenced or indented `code` renderer. */
export interface MarkdownCodeProps {
  code: string
  /** First word of the info string, or an empty string. */
  language: string
  /** Whole info string. */
  info: string
  /** From `title="..."` or `filename=...` in the info string. */
  filename?: string
  /** `false` when the fence has no closing line yet (streaming or truncated input). */
  closed: boolean
}
/** Renderers for specific node types. Each is a component or an element name. */
export interface MarkdownComponents {
  link?: Component | string
  image?: Component | string
  code?: Component | string
}

export type MarkdownTarget = '_self' | '_blank'

export interface MarkdownOptions {
  headingOffset?: number
  headingIds?: boolean
  headingAnchors?: boolean
  idPrefix?: string
  linkTarget?: MarkdownTarget
  externalTarget?: MarkdownTarget
  baseUrl?: string
  allowedProtocols?: readonly string[]
  highlight?: boolean
  codeFold?: boolean
  size?: MarkdownSize
  components?: MarkdownComponents
}

export interface MarkdownProps extends BaseProps, MarkdownOptions {
  /** Markdown text. When omitted, the text of the default slot is used. */
  source?: string
  tone?: MarkdownTone
  /** Render only inline content (no block wrappers) in a `span`. */
  inline?: boolean
  /** The text is still arriving: dangling syntax in the last block is closed instead of shown raw. */
  streaming?: boolean
  maxDepth?: number
  maxLength?: number
}
