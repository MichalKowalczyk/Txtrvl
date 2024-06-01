import type { Meta, StoryObj } from "@storybook/react";

import Txtrvl from "./Txtrvl";

const meta: any = {
  title: "Example/Txtrvl",
  component: Txtrvl,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Txtrvl>;

export default meta;

type Story = StoryObj<typeof Txtrvl>; //meta>;

export const Basic: Story = {
  args: {
    text: "Lorem ipsum dolor septum",
  },
};
