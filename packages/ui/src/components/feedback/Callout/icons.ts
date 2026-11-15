import type { IconDefinition } from '../../../lib/icons-tools'

/** Small inline icons for Callout types that the shared icon set does not cover (24x24 grid). */
export const quoteIcon: IconDefinition = {
  prefix: 'pd',
  iconName: 'quote',
  icon: [24, 24, [], '', 'M4 18h4l2-4V6H4v8h3l-3 4zm10 0h4l2-4V6h-6v8h3l-3 4z'],
}

export const exampleIcon: IconDefinition = {
  prefix: 'pd',
  iconName: 'code',
  icon: [24, 24, [], '', 'M8.5 6 2.5 12l6 6 1.4-1.4L5.3 12l4.6-4.6L8.5 6zm7 0-1.4 1.4 4.6 4.6-4.6 4.6 1.4 1.4 6-6-6-6z'],
}
