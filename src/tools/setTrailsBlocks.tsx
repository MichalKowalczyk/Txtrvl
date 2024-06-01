import { getTextWidth } from "./getTextWidth";

export const convertToTrailsBlocks = (ref: React.MutableRefObject<any>, text: string): string[] => {
  let el = ref.current! as any;

  if (el === null) return [];

  let styleWindow = window;
  let maxWidth = Number(styleWindow.getComputedStyle(el, null).getPropertyValue("width").slice(0, -2));
  let fontSize = styleWindow.getComputedStyle(el, null).getPropertyValue("font-size");
  let fontFamily = styleWindow.getComputedStyle(el, null).getPropertyValue("font-family");
  let fontWeight = styleWindow.getComputedStyle(el, null).getPropertyValue("font-weight");
  let fullFont = `${fontWeight} ${fontSize} ${fontFamily}`;

  let textReplace = text;
  let lettersToReplace = ["a", "i", "o", "u", "w", "z", "A", "I", "O", "U", "W", "Z", "&"];
  let arrayLength = lettersToReplace.length;
  for (let i = 0; i < arrayLength; i++) {
    let textSplit = textReplace.split(" " + lettersToReplace[i] + " ");
    textReplace = textSplit.join(" " + lettersToReplace[i] + "|");
  }

  let arrayOfWords = textReplace.split(" ");
  let tempText = arrayOfWords[0];
  let tempTrails = [] as Array<string>;

  for (let i = 1; i < arrayOfWords.length; i++) {
    if (getTextWidth(tempText + " " + arrayOfWords[i], fullFont) >= maxWidth) {
      tempTrails = [...tempTrails, tempText];
      tempText = arrayOfWords[i];
    } else {
      tempText = tempText + " " + arrayOfWords[i];
    }
  }
  if (tempText.length > 0) {
    tempTrails = [...tempTrails, tempText];
  }

  return tempTrails;
};
