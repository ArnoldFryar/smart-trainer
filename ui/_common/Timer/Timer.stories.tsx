import { Story, Meta } from '@storybook/html';
import { Timer } from './Timer.js';

export default {
  title: 'common/Timer',
  argTypes: {
    weeks: { control: 'number' },
    weight: { control: 'number' },
    days: { control: 'number' },
  },
} as Meta;

const Template: Story<Timer.Props> = (
  args: Timer.Props
) => <Timer {...args} />;

export const Test = Template.bind({});
Test.args = {
  since: Date.now() - 90000
};