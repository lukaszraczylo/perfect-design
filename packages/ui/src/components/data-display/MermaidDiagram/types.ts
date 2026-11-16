import type { BaseProps } from '../../../lib/types'
import type { DiagramDensity, DiagramRounded, DiagramSize, DiagramTone, Direction, EdgeStyle } from '../_diagram/types'
import type { DiagramVariant } from '../_diagram/palette'

export type MermaidDiagramVariant = DiagramVariant
export type MermaidDiagramSize = DiagramSize
export type MermaidDiagramDensity = DiagramDensity
export type MermaidDiagramEdgeStyle = EdgeStyle
export type MermaidDiagramDirection = Direction
export type MermaidDiagramRounded = DiagramRounded
export type MermaidDiagramTone = DiagramTone
export type MermaidDiagramFit = 'width' | 'scroll' | 'auto'

export interface MermaidDiagramBaseProps extends BaseProps {
  /** Mermaid source text. Required and not blank. */
  source: string
  /** `outline` (default) draws bordered nodes, `filled` tints them, `soft` drops the outlines, `mono` is single-colour ink. */
  variant?: MermaidDiagramVariant
  size?: MermaidDiagramSize
  density?: MermaidDiagramDensity
  edgeStyle?: MermaidDiagramEdgeStyle
  direction?: MermaidDiagramDirection
  rounded?: MermaidDiagramRounded
  tone?: MermaidDiagramTone
  fit?: MermaidDiagramFit
  showSource?: boolean
  showCode?: boolean
  showTable?: boolean
  title?: string
  description?: string
  maxNodes?: number
  maxEdges?: number
  /** Longest source, in characters, that is parsed. Longer text shows a size error. Default 100000. */
  maxSourceLength?: number
  /** Longest single source line, in characters, that is parsed. Default 2000. */
  maxLineLength?: number
  as?: string
}

export interface MermaidRenderedEvent {
  type: string
  nodes: number
  edges: number
}

export interface MermaidErrorEvent {
  message: string
  line: number
  column: number
}
