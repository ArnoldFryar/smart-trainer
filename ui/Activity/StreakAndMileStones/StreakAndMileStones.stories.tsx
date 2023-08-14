import { Story, Meta } from '@storybook/html';
import { StreakAndMileStones } from './StreakAndMileStones.js';

export default {
  title: 'Activity/StreakAndMileStones',
  argTypes: {
    weeks: { control: 'number' },
    weight: { control: 'number' },
    days: { control: 'number' },
  },
} as Meta;

const Template: Story<StreakAndMileStones.Props> = (
  args: StreakAndMileStones.Props
) => <StreakAndMileStones {...args} />;

export const Test = Template.bind({});
Test.args = {
  weeks: 30,
  weight: 2019340,
  days: 116,
};
