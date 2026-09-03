import type { ReactNode } from 'react'
import preview from '../.storybook/preview.js'

type BoxProps = {
  children: ReactNode
  /** No literal union anywhere — only `string` and `boolean`. */
  label?: string | undefined
  isDisabled?: boolean | undefined
}

function Box({ children }: BoxProps) {
  return <div>{children}</div>
}

/**
 * CONTROL — no literal-union prop, no `as const`, and no error. `string`,
 * `number`, `boolean`, `ReactNode` and `unknown` args all infer correctly;
 * only string/number literal unions trigger the collapse.
 */
const meta = preview.meta({
  title: 'control/Box',
  component: Box,
  args: {
    label: 'hello',
    isDisabled: false,
    children: 'box content',
  },
})

// OK.
export const Playground = meta.story({
  tags: ['playground'],
})
