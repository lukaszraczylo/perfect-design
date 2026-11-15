export { default as CodeBlock } from './CodeBlock.vue'
export type { CodeBlockProps, CodeBlockTab } from './CodeBlock.vue'
export {
  codeBlockVariants,
  codeBlockHeaderVariants,
  codeBlockTabVariants,
  codeBlockLineVariants,
  codeBlockMarkerVariants,
  CODE_BLOCK_VARIANTS,
  CODE_BLOCK_SIZES,
} from './variants'
export type { CodeBlockSize, CodeBlockVariant, CodeBlockVariants, CodeBlockDiffKind } from './variants'
export { diffKind, parseHighlightLines } from './lines'
