import preview from '../.storybook/preview.js'
import { Stepper } from './stepper.js'

/**
 * `meta.args` supplies BOTH required and optional args, so no story should have
 * to repeat them. But because `direction` has a string-literal union type,
 * TypeScript abandons inference for `TMetaArgs` and falls back to its
 * constraint `Partial<TArgs>`. The guard inside `ReactMeta.story()`
 *
 *   Partial<TArgs> extends TMetaArgs ? {} : TMetaArgs
 *
 * then evaluates its true branch, erasing every captured arg. Each
 * `meta.story()` call below therefore re-demands `children`.
 */
const meta = preview.meta({
  title: 'bug/Stepper',
  component: Stepper,
  args: {
    direction: 'horizontal',
    isDisabled: false,
    children: 'step content',
  },
})

// ERROR TS2769: No overload matches this call.
//   Property 'children' is missing in type '{ tags: string[] }'
//   but required in type '{ children: ReactNode }'.
export const Playground = meta.story({
  tags: ['playground'],
})

// Same error. Note the error is reported here, NOT on the `meta()` call above —
// which is what makes this bug so hard to diagnose in a real story file.
export const Vertical = meta.story({
  args: { direction: 'vertical' },
})
