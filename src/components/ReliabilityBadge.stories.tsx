import type { Meta, StoryObj } from '@storybook/react'
import { ReliabilityBadge } from './ReliabilityBadge'

const meta: Meta<typeof ReliabilityBadge> = {
  title: 'Components/ReliabilityBadge',
  component: ReliabilityBadge,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof ReliabilityBadge>

export const Confirmed: Story = { args: { reliability: 'confirmed' } }
export const Rumor: Story = { args: { reliability: 'rumor' } }
export const Unconfirmed: Story = { args: { reliability: 'unconfirmed' } }
