import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'Lead',
  group: 'typography',
  subgroup: 'Text',
  summary: 'Large muted intro paragraph that follows a page or section title.',
  description:
    'Use `Lead` once under a `Heading` to introduce a page or section. For regular paragraphs use `Text`.\n\nVariations: `size` `md` (16px), `lg` (default, 18px), `xl` (20px); `tone` `muted` (default) or `foreground` for a lead that carries the argument and should read at full contrast; `align` `start` (default) or `center` (short display leads only).',
  status: 'stable',
  props: [
    { name: 'size', type: "'md' | 'lg' | 'xl'", default: "'lg'", description: 'Font size: md text-md (16px), lg text-lg, xl text-xl. Unknown values fall back to `lg`.' },
    { name: 'tone', type: "'muted' | 'foreground'", default: "'muted'", description: 'Text colour: muted-foreground or foreground. Unknown values fall back to `muted`.' },
    { name: 'align', type: "'start' | 'center'", default: "'start'", description: 'Text alignment: `center` adds text-center. Unknown values fall back to `start`.' },
    { name: 'as', type: 'string | Component', default: "'p'", description: 'Element to render.' },
    { name: 'asChild', type: 'boolean', default: 'false', description: 'Style the single slot child instead of rendering a wrapper.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last with tailwind-merge; wins over internal classes.' },
  ],
  slots: [{ name: 'default', description: 'Intro text.' }],
  examples: [
    {
      title: 'Under a heading',
      code: `<div class="max-w-xl space-y-2">
  <Heading :level="4">Sample page title</Heading>
  <Lead>Sample introduction that explains what the page covers in one or two sentences.</Lead>
</div>`,
    },
    {
      title: 'Sizes, tones and alignment',
      code: `<div class="max-w-xl space-y-4">
  <Lead size="md">Medium lead in the muted tone.</Lead>
  <Lead tone="foreground">Large lead at full contrast.</Lead>
  <Lead size="xl" align="center">Extra large, centred.</Lead>
</div>`,
    },
    {
      title: 'Extra large with actions',
      code: `<div class="max-w-xl space-y-4">
  <Lead size="xl">Sample introduction in the extra large size.</Lead>
  <Button>Open the component list</Button>
</div>`,
    },
  ],
  a11y: ['Plain paragraph semantics; no special roles.', 'Muted and foreground text use tested token pairs (AA contrast on the page background).', 'Centred text is a visual choice only; keep centred leads to one or two lines.', 'It wraps with `text-pretty` and has no fixed width, so it reflows at 320px and at 200% zoom.'],
  related: ['Heading', 'Text', 'Eyebrow'],
  llmNotes: ['One Lead per page or section.', 'Use `tone="foreground"` instead of a colour class when the lead needs full contrast.', 'Use `align="center"` only for short display leads, never for paragraphs.'],
  replaces: ['marketing hero subtitle paragraphs'],
}
export default doc
