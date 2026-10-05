import { CSSProperties, RefObject, useEffect, useLayoutEffect, useState } from "react";

export interface TextLine {
  top: number;
  height: number;
  start: number;
  end: number;
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Read the browser's own wrapping, including font metrics, spacing and bidi text.
const measureLines = (source: HTMLDivElement): TextLine[] => {
  const text = source.firstChild;
  const textNode = text?.firstChild;
  const bounds = source.getBoundingClientRect();
  if (!text?.textContent || !textNode || bounds.width === 0 || bounds.height === 0) return [];
  const content = text.textContent;

  const range = document.createRange();
  range.selectNodeContents(text);
  const rows: Array<{ top: number; bottom: number; start: number; end: number }> = [];

  Array.from(range.getClientRects())
    .filter((rect) => rect.height > 0)
    .sort((a, b) => a.top - b.top)
    .forEach((rect) => {
      const previous = rows[rows.length - 1];
      if (previous && Math.abs(previous.top - rect.top) < 1) {
        previous.bottom = Math.max(previous.bottom, rect.bottom);
      } else {
        rows.push({ top: rect.top, bottom: rect.bottom, start: content.length, end: 0 });
      }
    });

  if (!rows.length) return [];

  // A geometric slice can include neighboring descenders. Find the actual
  // character range for each row so only that row's glyphs are painted.
  let offset = 0;
  for (const character of Array.from(content)) {
    const end = offset + character.length;
    range.setStart(textNode, offset);
    range.setEnd(textNode, end);
    const rect = range.getClientRects()[0];
    if (rect && rect.height > 0) {
      const center = (rect.top + rect.bottom) / 2;
      let low = 0;
      let high = rows.length - 1;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        const boundary = (rows[middle].top + rows[middle].bottom + rows[middle + 1].top + rows[middle + 1].bottom) / 4;
        if (center <= boundary) high = middle;
        else low = middle + 1;
      }
      rows[low].start = Math.min(rows[low].start, offset);
      rows[low].end = Math.max(rows[low].end, end);
    }
    offset = end;
  }

  const height = parseFloat(window.getComputedStyle(source).height);
  const scaleY = height / bounds.height;
  // Rows can overlap geometrically: preserve each row's full font box rather
  // than cutting its own accents or descenders at the midpoint between rows.
  return rows.map((row, index) => {
    const previous = rows[index - 1];
    const next = rows[index + 1];
    const top = previous ? (Math.min((previous.bottom + row.top) / 2, row.top) - bounds.top) * scaleY : Math.min(0, (row.top - bounds.top) * scaleY);
    const bottom = next ? (Math.max((row.bottom + next.top) / 2, row.bottom) - bounds.top) * scaleY : Math.max(height, (row.bottom - bounds.top) * scaleY);
    return { top, height: Math.max(0, bottom - top), start: row.start, end: row.end };
  }).filter((row) => row.end > row.start);
};

const useTextLines = (sourceRef: RefObject<HTMLDivElement>, text: string, className: string, style?: CSSProperties) => {
  const [lines, setLines] = useState<TextLine[]>([]);

  useBrowserLayoutEffect(() => {
    const source = sourceRef.current;
    if (!source) return;

    let frame = 0;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const next = measureLines(source);
      setLines((previous) =>
        previous.length === next.length && previous.every((line, index) =>
          Math.abs(line.top - next[index].top) < 0.1 && Math.abs(line.height - next[index].height) < 0.1 &&
          line.start === next[index].start && line.end === next[index].end
        ) ? previous : next
      );
    };
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(scheduleMeasure);
    observer?.observe(source);
    window.addEventListener("resize", scheduleMeasure);
    const fonts = document.fonts;
    fonts?.ready.then(() => { if (!disposed) scheduleMeasure(); });
    fonts?.addEventListener("loadingdone", scheduleMeasure);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      fonts?.removeEventListener("loadingdone", scheduleMeasure);
    };
  }, [sourceRef, text, className, style]);

  return lines;
};

export default useTextLines;
