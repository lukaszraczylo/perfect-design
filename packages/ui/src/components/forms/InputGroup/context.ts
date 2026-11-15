import { inject, provide, type InjectionKey } from 'vue'
import type { InputGroupLayout } from './variants'

export const INPUT_GROUP_KEY: InjectionKey<{ layout: () => InputGroupLayout }> = Symbol('perfect-design:input-group')
export const provideInputGroup = (ctx: { layout: () => InputGroupLayout }) => provide(INPUT_GROUP_KEY, ctx)
export const useInputGroup = () => inject(INPUT_GROUP_KEY, null)
