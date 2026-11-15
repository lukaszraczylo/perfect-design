import type { ComponentDoc } from '../../../docs-types'

const doc: ComponentDoc = {
  name: 'StyleScope',
  group: 'layout',
  subgroup: 'Style packs',
  summary: 'Applies one style pack (density, corners, depth, type) to everything inside it.',
  description:
    'A style pack restyles the whole system by overriding tokens (`--spacing`, `--radius`, shadows, text sizes, fonts, borders), so every component follows without changing its markup. `StyleScope` sets `data-style` on a wrapper, which lets one page mix looks: a dense `workbench` data panel next to the core `quiet` marketing page, or an `editorial` article inside an app. The pack CSS must be imported once (`@perfect-design/ui/packs.css` or a single `@perfect-design/ui/packs/<name>.css`). To switch the whole app, use `useThemeStore().setStyle()` or `StylePicker`, which set `data-style` on `<html>`. The packs are: `quiet` (core), `workbench` (dense, hairlines), `tactile` (raised surfaces), `editorial` (serif, square, reading-first), `raw` (hard shadows, ink borders), `contrast` (7:1 text, bold focus) and `terminal` (mono, dense). Each one is justified in DESIGN.md.',
  status: 'stable',
  props: [
    { name: 'look', type: "'quiet' | 'workbench' | 'tactile' | 'editorial' | 'raw' | 'contrast' | 'terminal'", required: true, description: 'Style pack for the subtree. `quiet` restores the core look inside another pack.' },
    { name: 'as', type: 'string | Component', default: "'div'", description: 'Element to render.' },
    { name: 'class', type: 'string | object | array', description: 'Merged last.' },
  ],
  slots: [{ name: 'default', description: 'Content styled by the pack.' }],
  examples: [
    {
      title: 'Workbench panel',
      description: 'Denser spacing, smaller text and hairline depth for tools used all day.',
      code: `<StyleScope look="workbench" class="rounded-lg border p-4">
  <Stack :gap="3">
    <Input aria-label="Filter" placeholder="Filter rows" />
    <HStack><Button size="sm">Apply</Button><Button size="sm" variant="outline">Reset</Button></HStack>
  </Stack>
</StyleScope>`,
    },
    {
      title: 'Editorial article',
      description: 'Serif display face, square corners and a wider reading measure.',
      code: `<StyleScope look="editorial" class="rounded-lg border p-5">
  <h3 class="text-2xl">Reading comes first</h3>
  <p class="mt-2 text-base">Long text sits in a serif face at a comfortable size and line height, with rules instead of shadows.</p>
  <Button class="mt-4" variant="outline">Read the full report</Button>
</StyleScope>`,
    },
    {
      title: 'Tactile controls',
      description: 'Raised surfaces with a top highlight. Buttons sink one pixel when pressed, only if motion is allowed.',
      code: `<StyleScope look="tactile" class="rounded-lg border p-4">
  <HStack><Button>Save</Button><Button variant="secondary">Cancel</Button><Badge>Draft</Badge></HStack>
</StyleScope>`,
    },
    {
      title: 'Raw',
      description: 'Square corners, ink borders and hard offset shadows, chosen on purpose.',
      code: `<StyleScope look="raw" class="border-2 p-4">
  <Card><CardHeader><CardTitle>Plain facts</CardTitle></CardHeader><CardContent>No softening, no tricks.</CardContent></Card>
</StyleScope>`,
    },
    {
      title: 'Contrast',
      description: 'Higher-contrast neutrals and a thick focus outline.',
      code: `<StyleScope look="contrast" class="rounded-lg border p-4">
  <Stack :gap="3"><Input aria-label="Reference number" placeholder="Reference number" /><Button>Check status</Button></Stack>
</StyleScope>`,
    },
    {
      title: 'Terminal',
      description: 'Monospace interface for developer tools.',
      code: `<StyleScope look="terminal" class="rounded-lg border p-4">
  <Stack :gap="3"><Input aria-label="Command" placeholder="deploy --env staging" /><HStack><Button size="sm">Run</Button><Badge variant="outline">exit 0</Badge></HStack></Stack>
</StyleScope>`,
    },
  ],
  a11y: [
    'Renders a plain element: no role, no name, no effect on the accessibility tree.',
    'The `contrast` pack keeps text pairs at 7:1 or better and draws a 3px focus outline; `workbench` and `terminal` restore normal spacing on coarse pointers so touch targets stay at least 44px.',
    'Motion in `tactile` only runs under `prefers-reduced-motion: no-preference`.',
  ],
  related: ['StylePicker', 'ThemeToggle'],
  requires: ['Throws a ContractError when `look` is not one of the known packs.'],
  llmNotes: [
    'Pick a pack for the product (workbench for tools, editorial for reading, quiet for most apps), never per component.',
    'Do not restyle with inline colours or shadows to imitate a pack; wrap in `StyleScope` or set the pack on `<html>`.',
    'Import the pack CSS once; without it `StyleScope` has no visible effect.',
  ],
  replaces: ['ad-hoc density and corner overrides repeated on every component'],
}
export default doc
