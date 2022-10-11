import { Meta } from '@storybook/html';
import { App as AppComponent } from './App.js';

export default {
  title: 'App',
  argTypes: {},
} as Meta;

export const App = (args: any) => <AppComponent {...args} />;
