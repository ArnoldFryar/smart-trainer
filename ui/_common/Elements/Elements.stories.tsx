import { Meta } from '@storybook/html';
import { Button, Input, Radio } from './Elements.js';

export default {
  title: 'Common/Elements',
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
export const DefaultRadio = (args: any) => <Radio {...args} />;
DefaultRadio.args = {
  
};