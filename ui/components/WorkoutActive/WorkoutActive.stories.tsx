import { Story, Meta } from '@storybook/html';
import { WorkoutActiveView } from './WorkoutActive.js';

export default {
  title: 'Example/WorkoutActive',
  argTypes: {
    exercise: { control: 'text' },
    video: { control: 'text' },
    unit: {
      options: ['lbs', 'kg'],
      control: { type: 'radio' },
    },
    leftWeight: { control: { type: 'range', min: 0, max: 100 } },
    rightWeight: { control: { type: 'range', min: 0, max: 100 } },
    targetWeight: { control: { type: 'range', min: 0, max: 100 } },
    leftROM: { control: { type: 'range', min: -0.2, max: 1.2 } },
    rightROM: { control: { type: 'range', min: -0.2, max: 1.2 } },
    powerPerRep: { control: 'object' },
    currentRep: { control: 'number' },
    totalReps: { control: 'number' },
  },
} as Meta;

const Template: Story<WorkoutActiveView.Props> = (
  args: WorkoutActiveView.Props
) => <WorkoutActiveView {...args} />;

export const Test = Template.bind({});
Test.args = {
  unit: 'lbs',
  leftWeight: 10,
  rightWeight: 10,
  targetWeight: 10,
  leftROM: 0.3,
  rightROM: 0.3,
  powerPerRep: [234, 219, 198, 173, 175],
  currentRep: 5,
  totalReps: 8,
  exercise: 'Bench Press',
  video: 'https://cdn.jwplayer.com/manifests/3RYV3I0A.m3u8',
};

export const Warmup = Template.bind({});
Warmup.args = {
  ...Test.args,
  currentRep: -3,
};
