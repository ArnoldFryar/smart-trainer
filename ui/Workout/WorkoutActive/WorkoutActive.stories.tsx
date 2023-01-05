import { Story, Meta } from '@storybook/html';
import { WorkoutActiveView, Reps } from './WorkoutActive.js';

export default {
  title: 'Workout/WorkoutActive',
  argTypes: {
    set: { control: 'object' },
    video: { control: 'text' },
    unit: {
      options: ['lbs', 'kg'],
      control: { type: 'radio' },
    },
    leftWeight: { control: { type: 'range', min: 0, max: 100 } },
    rightWeight: { control: { type: 'range', min: 0, max: 100 } },
    targetWeight: { control: { type: 'range', min: 0, max: 100 } },
    leftROM: { control: { type: 'range', min: -0.2, max: 1.2, step:0.1 } },
    rightROM: { control: { type: 'range', min: -0.2, max: 1.2, step:0.1 } },
    targetVelocity: { control: 'number' },
    stopVelocity: { control: 'number' },
    meanVelocityPerRep: { control: 'object' },
    currentRep: { control: 'number' },
    totalReps: { control: 'number' },
    calibrationRepsRemaining: { control: 'number' },
    state: {
      options: ['calibrating', 'rest', 'workout', 'paused', 'complete'],
      control: { type: 'radio' },
    },
    actions: { control: 'object' },
    onComplete: { action: 'onComplete' },
  } as { [prop in keyof WorkoutActiveView.Props]: any }
} as Meta;

const Template: Story<WorkoutActiveView.Props> = (
  args: WorkoutActiveView.Props
) => <WorkoutActiveView {...args} />;

const Base = {
  unit: 'lbs',
  leftWeight: 10,
  rightWeight: 10,
  targetWeight: 10,
  leftROM: 0.3,
  rightROM: 0.3,
  targetVelocity: 600,
  meanVelocityPerRep: [820, 640, 650, 550, 540, 390],
  currentRep: 5,
  totalReps: 8,
  set: {
    exercise: 'Bench Press',
    limit: "VELOCITY_LOSS",
    limitConfig: {
      velocityThreshold: 0.6
    }
  },
  video: 'https://cdn.jwplayer.com/manifests/3RYV3I0A.m3u8',
  calibrationRepsRemaining: 0,
  state: 'workout',
};

export const Warmup = Template.bind({});
Warmup.args = {
  ...Base,
  state: 'calibrating',
  calibrationRepsRemaining: 3,
  currentRep: -3,
};

export const VelocityLoss = Template.bind({});
VelocityLoss.args = {
  ...Base,
  set: {
    ...Base.set,
    limit: "VELOCITY_LOSS",
    limitConfig: {
      velocityThreshold: 0.6
    }
  },
};

export const Assessment = Template.bind({});
Assessment.args = {
  ...Base,
  set: {
    ...Base.set,
    limit: "ASSESSMENT",
    limitConfig: {
      stopVelocity: 600,
    }
  },
};