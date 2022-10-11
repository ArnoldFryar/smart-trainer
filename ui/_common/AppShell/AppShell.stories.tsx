import { Meta } from '@storybook/html';
import { AppShell as AppShellComponent } from './AppShell.js';

export default {
  title: 'Common/AppShell',
  argTypes: {},
} as Meta;

export const AppShell = (args: any) => <AppShellComponent {...args} />;
