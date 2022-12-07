import { Meta } from '@storybook/html';
import { AppShell as AppShellComponent } from './AppShell.js';

export default {
  title: 'Common/AppShell',
  argTypes: {},
} as Meta;

export const AppShell = (args: any) => <AppShellComponent tabs={[{
  label: "Activity",
  view: <div>Activity</div>
}, {
  label: "Performance",
  view: <div>Performance</div>
}, {
  label: "Workout",
  view: <div>Workout</div>
}, {
  label: "Learn",
  view: <div>Learn</div>
}, {
  label: "Settings",
  view: <div>Settings</div>
}]} />;