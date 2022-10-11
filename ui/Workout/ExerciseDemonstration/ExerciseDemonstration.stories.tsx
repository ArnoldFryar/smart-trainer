import { Story, Meta } from '@storybook/html';
import { ExerciseDemonstration } from './ExerciseDemonstration.js';

export default {
  title: 'Workout/ExerciseDemonstration',
  argTypes: {
    video: { control: 'text' },
  },
} as Meta;

const Template: Story<ExerciseDemonstration.Props> = (
  args: ExerciseDemonstration.Props
) => <ExerciseDemonstration {...args} />;

export const Test = Template.bind({});
Test.args = {
  video:
    'https://stream.mux.com/PPL7006dmn5rMIde4DBrp6zWRwKMR1jU3sosLT6FA6gU.m3u8',
};
