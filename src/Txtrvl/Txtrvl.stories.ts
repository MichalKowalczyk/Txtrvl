import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import Txtrvl, { type TxtrvlProps } from "./Txtrvl";

type Animation = NonNullable<TxtrvlProps["animation"]>;

const animations: Animation[] = ["reveal", "fade", "slide-up", "slide-left", "blur", "scale"];
const responsiveText =
  "Text animation should follow the space available to it. Resize the preview, change the width in the style control, or try a different font size. This paragraph can wrap into two lines on a wide screen and many more on a narrow one.\nExplicit newlines also work, and long tokens such as verylongwordwithoutspaces1234567890 can wrap when the container becomes smaller.";

const meta = {
  title: "Example/Txtrvl",
  component: Txtrvl,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    animation: {
      control: "select",
      options: animations,
      description: "Animation applied to each visual line.",
    },
    text: { control: "text" },
    style: { control: "object", description: "Change width, fontSize, or other text styles." },
    duration: { control: { type: "number", min: 0, step: 100 } },
    delayPerRow: { control: { type: "number", min: 0, step: 50 } },
  },
  args: {
    text: "Text that moves with your layout.",
    animation: "reveal",
    duration: 1000,
    delayPerRow: 200,
    scrollTrigger: { disabled: true },
    manualTrigger: { isVisible: true },
    style: {
      width: "min(100%, 48rem)",
      maxWidth: "100%",
      fontSize: "clamp(1.5rem, 4vw, 3rem)",
      lineHeight: 1.25,
    },
  },
} satisfies Meta<typeof Txtrvl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

export const Responsive: Story = {
  args: {
    text: responsiveText,
    style: {
      width: "min(100%, 48rem)",
      maxWidth: "100%",
      fontSize: "clamp(1rem, 2.5vw, 2rem)",
      lineHeight: 1.5,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Resize the preview or edit style.width and text in Controls to see how the visual lines adapt.",
      },
    },
  },
};

function AnimationSwitcherDemo(args: TxtrvlProps) {
  const [animation, setAnimation] = useState<Animation>(args.animation ?? "reveal");
  const [isVisible, setIsVisible] = useState(false);

  return React.createElement(
    "div",
    { style: { width: "100%", maxWidth: "56rem", minWidth: 0 } },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        },
      },
      React.createElement(
        "label",
        null,
        "Animation ",
        React.createElement(
          "select",
          {
            value: animation,
            onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
              const next = animations.find((value) => value === event.target.value);
              if (next) setAnimation(next);
              setIsVisible(false);
            },
          },
          animations.map((value) => React.createElement("option", { key: value, value }, value))
        )
      ),
      React.createElement(
        "button",
        {
          type: "button",
          "aria-pressed": isVisible,
          onClick: () => setIsVisible((visible) => !visible),
        },
        isVisible ? "Reset animation" : "Play animation"
      )
    ),
    React.createElement(
      "p",
      { style: { marginBottom: "1rem" } },
      "Choose an effect and press Play animation. Reset before replaying. Resize the preview to change the number of lines."
    ),
    React.createElement(Txtrvl, {
      ...args,
      animation,
      scrollTrigger: { disabled: true },
      manualTrigger: { isVisible },
    })
  );
}

export const AnimationSwitcher: Story = {
  args: {
    text: responsiveText,
  },
  argTypes: {
    animation: { control: false },
    manualTrigger: { control: false },
    scrollTrigger: { control: false },
  },
  render: (args) => React.createElement(AnimationSwitcherDemo, args),
};

export const Descenders: Story = {
  ...AnimationSwitcher,
  args: {
    text: "yyyy gggg jjjj pppp\nmmmm nnnn rrrr ssss\ngyjp gyjp gyjp gyjp\naaaa eeee oooo uuuu",
    duration: 1600,
    delayPerRow: 400,
    style: {
      width: "min(100%, 48rem)",
      maxWidth: "100%",
      fontSize: "clamp(1.5rem, 6vw, 4rem)",
      lineHeight: 1,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Lowercase descenders with tight line spacing. Choose reveal or blur, then play and resize the preview.",
      },
    },
  },
};

export const Fade: Story = {
  args: { animation: "fade" },
};

export const SlideUp: Story = {
  args: { animation: "slide-up" },
};

export const SlideLeft: Story = {
  args: { animation: "slide-left" },
};

export const Blur: Story = {
  args: { animation: "blur" },
};

export const Scale: Story = {
  args: { animation: "scale" },
};
