import type { Meta, StoryObj } from '@storybook/react'
import { SkeletonGrid } from './Skeleton'

const meta: Meta<typeof SkeletonGrid> = {
  title: 'Components/SkeletonGrid',
  component: SkeletonGrid,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof SkeletonGrid>

export const Default: Story = { args: { count: 6 } }
export const Few: Story = { args: { count: 3 } }
