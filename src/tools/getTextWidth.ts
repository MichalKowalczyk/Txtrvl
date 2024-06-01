export const getTextWidth = (text: string, font: string): number => {
  let  canvas = (getTextWidth as any).canvas || ((getTextWidth as any).canvas = document.createElement("canvas"));
  canvas.setAttribute("class", "textWidth");
  let  context = canvas.getContext("2d");
  context.font = font;
  let  metrics = context.measureText(text);
  return metrics.width;
};
