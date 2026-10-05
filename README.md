# Txtrvl - Text Reveal React Library

Txtrvl is a text animation library for React, built around a ready-to-use `Txtrvl` component. It is designed to keep text animations working through text changes, resolution variations, font size adjustments, and line wrapping. The library provides customizable styles, multiple reveal effects, trigger controls, and TypeScript support.

The component animates text one visual line at a time. Lines are measured from the browser's layout and update when the available width, text, or fonts change.

[![NPM Version](https://img.shields.io/npm/v/txtrvl?logo=npm&color=e02a1d&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Ftxtrvl)](https://www.npmjs.com/package/txtrvl) ![Static Badge](https://img.shields.io/badge/license-MIT-purple) ![React >= 16.17.0](https://img.shields.io/badge/react-%3E%3D%2016.17.0-61dbfb?logo=react) ![Static Badge](https://img.shields.io/badge/lang-typescript-0b52b0)

## [DEMO PAGE](https://txtrvl.com/)

## Motivation

### Common challenges with text animation libraries and components:

- ❌ Limited animation choices or different setup requirements for each effect
- ❌ Animations are disrupted when the text content changes
- ❌ Resizing the screen or container breaks the animation layout
- ❌ Font size changes and web font loading require extra handling
- ❌ Effects stop working correctly when text wraps onto more lines
- ❌ Complicated styling, timing, and playback control
- ❌ Missing TypeScript types or support for reduced-motion preferences

### Txtrvl outperforms other packages!

Txtrvl gives you six interchangeable animation effects through one shared React component API. Every effect follows the browser's actual text layout, so you can change the animation while keeping support for responsive widths, font changes, and multiline text.

- ✅ Six effects: `reveal`, `fade`, `slide-up`, `slide-left`, `blur`, and `scale`
- ✅ Switch effects with a single `animation` prop
- ✅ Supports text content updates without manual line splitting
- ✅ Adapts to changes in screen size and container width
- ✅ Adapts to font size changes and web font loading
- ✅ Animates visual lines whether the text wraps onto two lines or ten
- ✅ Customize styles, transition duration, and delay between lines
- ✅ Control playback with scroll and manual triggers
- ✅ TypeScript types included
- ✅ Supports reduced motion and keeps text accessible to assistive technology

## Installation

```bash
npm install txtrvl
```

## Usage

```tsx
import { Txtrvl } from "txtrvl";

export function Heading() {
  return (
    <Txtrvl
      text="Text that keeps its animation when it wraps onto more lines."
      animation="slide-up"
      duration={1000}
      delayPerRow={200}
      style={{
        width: "min(100%, 48rem)",
        maxWidth: "100%",
        fontSize: "clamp(1.5rem, 4vw, 3rem)",
        lineHeight: 1.25,
      }}
    />
  );
}
```

The default animation is `reveal`. Available modes are `reveal`, `fade`, `slide-up`, `slide-left`, `blur`, and `scale`. Each mode uses the same duration and delay between visual lines.

## Switch animations

Use the `animation` prop to change the effect. A manual trigger lets you reset and play it again. Disable the scroll trigger when you want the button to control visibility on its own.

```tsx
import { useState } from "react";
import { Txtrvl, type TxtrvlProps } from "txtrvl";

type Animation = NonNullable<TxtrvlProps["animation"]>;
const animations: Animation[] = [
  "reveal", "fade", "slide-up", "slide-left", "blur", "scale",
];

export function AnimationPicker() {
  const [animation, setAnimation] = useState<Animation>("reveal");
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div style={{ width: "100%", maxWidth: "48rem" }}>
      <label>
        Animation{" "}
        <select
          value={animation}
          onChange={(event) => {
            const next = animations.find((value) => value === event.target.value);
            if (next) setAnimation(next);
            setIsVisible(false);
          }}
        >
          {animations.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>
      {" "}
      <button type="button" onClick={() => setIsVisible((visible) => !visible)}>
        {isVisible ? "Reset animation" : "Play animation"}
      </button>
      <Txtrvl
        text="Resize this text to see the same effect across two lines or ten."
        animation={animation}
        scrollTrigger={{ disabled: true }}
        manualTrigger={{ isVisible }}
        style={{
          width: "100%",
          maxWidth: "100%",
          fontSize: "clamp(1.5rem, 4vw, 3rem)",
          lineHeight: 1.25,
        }}
      />
    </div>
  );
}
```

Select a mode, then press **Play animation**. Press **Reset animation** before replaying it.

## Responsive text

The component keeps natural text layout in the document, so its height follows the actual number of lines. It remeasures when its size changes and after fonts load. Use a fluid width and font size, and give the surrounding layout enough room to shrink. In flex or grid layouts, `minWidth: 0` on the text container can help.

Explicit newlines are supported. Long tokens can wrap instead of overflowing a narrow container:

```tsx
<Txtrvl
  text={"First line\nAnother line with a long token: verylongwordwithoutspaces1234567890"}
  animation="fade"
  style={{ width: "100%", maxWidth: "32rem", lineHeight: 1.5 }}
/>
```

Set typography through `style` or `className`, including your web font. When the user requests reduced motion with `prefers-reduced-motion: reduce`, text appears without animated transitions. The text remains available to assistive technology without repeated announcements from the visual line layers.

## Props

![image](https://github.com/MichalKowalczyk/Txtrvl/assets/17525378/50faf7cc-77d8-4acd-8d63-c364ba77d522)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | Required | Text to display, including optional newlines. |
| `animation` | `"reveal" \| "fade" \| "slide-up" \| "slide-left" \| "blur" \| "scale"` | `"reveal"` | Effect applied to each visual line. |
| `duration` | `number` | `1000` | Transition duration in milliseconds. |
| `delayPerRow` | `number` | `200` | Delay between successive lines in milliseconds. |
| `style` | `React.CSSProperties` | — | Container dimensions and text styling. |
| `className` | `string` | — | Additional CSS class for the container. |
| `onChange` | `(isVisible: boolean) => void` | — | Callback for scroll-trigger visibility changes. |
| `scrollTrigger` | See below | Enabled | Configure visibility from scrolling. |
| `manualTrigger` | `{ isVisible: boolean }` | — | Control visibility from React state. |

`scrollTrigger` accepts `offsetY`, `disabled`, `resetPolicy`, `threshold`, and `delay`. `resetPolicy` accepts `"no-reset"`, `"above"`, or `"both"`. `offsetY` is measured in pixels and `delay` in milliseconds. When both scroll and manual triggers are enabled, either trigger can reveal the text.

`TxtrvlProps` is exported for TypeScript consumers.

## Development

```bash
npm run storybook
```

Storybook includes an animation selector, a responsive paragraph, and examples of each effect. Use the controls to change the text, typography, width, duration, and delay between lines.

## Credits

If you like what you see, write to us and let's build or destroy something together.

[contact@txtrvl.com](mailto:contact@txtrvl.com)

#### Designed by [SPNM](https://www.spnm.pl) Szymon P. Nowak Mieszkiełło

#### Developed by [Codeebo](https://codeebo.pl) Michał Kowalczyk
