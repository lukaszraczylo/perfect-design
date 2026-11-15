import type { BaseProps } from '../../../lib/types'
import type { NodeShape } from '../_diagram/shapes'
import type { DiagramTone, Direction } from '../_diagram/types'

export type FlowSide = 'top' | 'right' | 'bottom' | 'left'
/** `source` ports start connections, `target` ports receive them, `both` does either. */
export type FlowPortType = 'source' | 'target' | 'both'
export type FlowEdgeLine = 'solid' | 'dashed' | 'dotted'
export type FlowCanvasVariant = 'plain' | 'dots' | 'grid'
export type FlowCanvasSize = 'sm' | 'md' | 'lg'
export type FlowCanvasEdgeStyle = 'straight' | 'curved' | 'orthogonal'
export type FlowChangeReason = 'move' | 'connect' | 'disconnect' | 'delete' | 'layout' | 'undo' | 'redo'

/** A connection point on the outline of a node. */
export interface FlowPort {
  /** Unique inside its node. Edges refer to it with `fromPort` / `toPort`. */
  id: string
  /** Which side of the node the port sits on. Default `right`. Ports on one side are spread evenly. */
  side?: FlowSide
  /** Default `both`. */
  type?: FlowPortType
  /** Shown as a tooltip on the port. */
  label?: string
}

export interface FlowNode {
  /** Unique, non-empty. */
  id: string
  /** Text drawn in the node and used as its accessible name. Defaults to the id. */
  label?: string
  /** Top-left corner in canvas units. */
  x: number
  y: number
  /** Default 148 x 52. */
  width?: number
  height?: number
  /** Outline: any Mermaid node shape (`rect`, `round`, `stadium`, `rhombus`, `circle`...). Default `rect`. */
  shape?: NodeShape
  tone?: DiagramTone
  /** Omit for four ports (one per side). `[]` makes the node impossible to connect. */
  ports?: FlowPort[]
}

export interface FlowEdge {
  /** Unique, non-empty. */
  id: string
  /** Id of the source node. */
  from: string
  /** Id of the target node. */
  to: string
  label?: string
  /** Port id on the source node. Omitted: the nearest compatible port is used. */
  fromPort?: string
  /** Port id on the target node. */
  toPort?: string
  /** Line style. Default `solid`. */
  style?: FlowEdgeLine
}

export interface FlowViewport {
  /** Translation in CSS pixels. */
  x: number
  y: number
  zoom: number
}

export interface FlowSelection {
  nodes: string[]
  edges: string[]
}

export interface FlowNodeMoveEvent {
  /** Every node that moved with its new position. */
  nodes: { id: string; x: number; y: number }[]
}
export interface FlowConnectEvent {
  edge: FlowEdge
}
export interface FlowDisconnectEvent {
  edge: FlowEdge
}
export interface FlowChangeEvent {
  reason: FlowChangeReason
  nodes: FlowNode[]
  edges: FlowEdge[]
}

/** Scoped slot props of the `node` slot (drawn in the node's own coordinates: 0,0 is its top-left corner). */
export interface FlowNodeSlotProps {
  node: FlowNode
  selected: boolean
  /** The node that is the tab stop of the canvas. */
  active: boolean
  /** A connection is being made and this node is the source or the current target. */
  connecting: boolean
  width: number
  height: number
}

/** Scoped slot props of the `toolbar` slot. */
export interface FlowToolbarSlotProps {
  zoom: number
  readonly: boolean
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  zoomIn: () => void
  zoomOut: () => void
  fit: () => void
  autoLayout: () => void
  undo: () => void
  redo: () => void
  deleteSelected: () => void
}

export interface FlowCanvasProps extends BaseProps {
  /** Accessible name of the canvas. Required unless `aria-label` or `aria-labelledby` is set. */
  label?: string
  /** No editing by pointer or keyboard: selecting, panning and zooming still work. */
  readonly?: boolean
  /** Snap node positions to this many canvas units while dragging and moving. `true` is 20; `false` is off. */
  grid?: number | boolean
  /** Background: `plain`, `dots` or `grid` lines. */
  variant?: FlowCanvasVariant
  /** Canvas height: 288 / 384 / 512 px. */
  size?: FlowCanvasSize
  /** Edge shape: `straight`, `curved` or `orthogonal`. */
  edgeStyle?: FlowCanvasEdgeStyle
  /** Layout direction of `autoLayout()`. */
  direction?: Direction
  /** Show the default toolbar (zoom, fit, layout, undo, redo, delete, area select). */
  toolbar?: boolean
  /** Show a small overview with the visible area. */
  minimap?: boolean
  minZoom?: number
  maxZoom?: number
  /** Most undo steps kept (1 to 500). */
  historyLimit?: number
  /** Fit all nodes into view once the canvas has a size. */
  autoFit?: boolean
  /** Text shown while there are no nodes. */
  emptyText?: string
}
