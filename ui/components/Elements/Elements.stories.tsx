import { Meta } from '@storybook/html';
import { Button, Input } from './Elements.js';

export default {
  title: 'Example/Elements',
  argTypes: {},
} as Meta;

export const DefaultButton = (args: any) => <Button {...args} />;
DefaultButton.args = {
  children: "Click"
};
export const DefaultInput = (args: any) => <Input {...args} />;
DefaultInput.args = {
  placeholder: "Type",
  value: ""
};