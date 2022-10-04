import { Story, Meta } from '@storybook/html';
import { WeightAndRangeOfMotion } from './WeightAndRangeOfMotion.js';

export default {
  title: 'Example/WeightAndRangeOfMotion',
  argTypes: {
    unit: {
      options: ['lbs', 'kg'],
      control: { type: 'radio' },
    },
    weight: { control: { type: 'range', min: 0, max: 200, step: 0.5 } },
    leftROM: { control: { type: 'range', min: -0.2, max: 1.2, step: 0.01 } },
    rightROM: { control: { type: 'range', min: -0.2, max: 1.2, step: 0.01 } },
  },
} as Meta;

const Template: Story<WeightAndRangeOfMotion.Props> = (
  args: WeightAndRangeOfMotion.Props
) => <WeightAndRangeOfMotion {...args} />;

export const Test = Template.bind({});
Test.args = {
  unit: 'lbs',
  weight: 10,
  leftROM: 0.3,
  rightROM: 0.3,
};
