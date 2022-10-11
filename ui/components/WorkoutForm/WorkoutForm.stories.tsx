import { Story, Meta } from '@storybook/html';
import { WorkoutForm } from './WorkoutForm.js';

export default {
  title: 'Components/WorkoutForm',
  argTypes: {
    exercises: { control: 'object' },
    onSubmit: { action: 'submit' },
  },
} as Meta;

const Template: Story<WorkoutForm.Props> = (args: WorkoutForm.Props) => (
  <WorkoutForm {...args} />
);

export const Test = Template.bind({});
Test.args = {
  exercises: [{}],
};
