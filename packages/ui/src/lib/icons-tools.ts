/** Structural type compatible with FontAwesome's IconDefinition — no FontAwesome package needed at runtime. */
export type IconPathData = [
  width: number,
  height: number,
  ligatures: (string | number)[],
  unicode: string,
  svgPathData: string | string[],
]
export interface IconDefinition {
  prefix: string
  iconName: string
  icon: IconPathData
}
