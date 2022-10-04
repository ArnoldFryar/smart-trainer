import { Meta } from '@storybook/html';
import { App } from './App.js';

export default {
  title: 'Example/App',
  argTypes: {},
} as Meta;

export const DefaultApp = (args: any) => <App {...args} />;
