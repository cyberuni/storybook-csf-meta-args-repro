import type { ReactNode } from 'react'

export type StepperProps = {
  /** Required. The bug causes this to be re-demanded at the story level. */
  children: ReactNode
  /** A string-literal union. This is what breaks `meta({ args })` inference. */
  direction?: 'horizontal' | 'vertical' | undefined
  /** A boolean. Included to show that non-literal props are unaffected. */
  isDisabled?: boolean | undefined
}

export function Stepper({ children, direction = 'horizontal', isDisabled = false }: StepperProps) {
  return (
    <div data-direction={direction} data-disabled={isDisabled}>
      {children}
    </div>
  )
}
