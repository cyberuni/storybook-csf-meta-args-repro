import preview from '../.storybook/preview.js'
import { Stepper } from './stepper.js'

/**
 * CONTROL — identical to `stepper.stories.tsx` except `direction` carries
 * `as const`. This file typechecks cleanly on stock Storybook, proving the
 * trigger is literal-type widening in `meta({ args })` and nothing else.
 */
const meta = preview.meta({
  title: 'workaround/Stepper',
  component: Stepper,
  args: {
    direction: 'horizontal' as const,
    isDisabled: false,
    children: 'step content',
  },
})

// OK — `children` is correctly recognized as already supplied by meta.
export const Playground = meta.story({
  tags: ['playground'],
})

export const Vertical = meta.story({
  args: { direction: 'vertical' },
})
