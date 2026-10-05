import { CSSProperties, RefObject, useEffect, useLayoutEffect, useState } from "react";

export interface TextLine {
  top: number;
  height: number;
  start: number;
  end: number;
  left: number;
  textTop: number;
  context: boolean;
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
  const rows: Array<{ top: number; bottom: number; left: number; start: number; end: number }> = [];

  Array.from(range.getClientRects())
    .filter((rect) => rect.height > 0)
    .sort((a, b) => a.top - b.top)
    .forEach((rect) => {
      const previous = rows[rows.length - 1];
      if (previous && Math.abs(previous.top - rect.top) < 1) {
        previous.bottom = Math.max(previous.bottom, rect.bottom);
        previous.left = Math.min(previous.left, rect.left);
      } else {
        rows.push({ top: rect.top, bottom: rect.bottom, left: rect.left, start: content.length, end: 0 });
      }
    });

  if (!rows.length) return [];

  // A geometric slice can include neighboring descenders. Find the actual
  // character range for each row so only that row's glyphs are painted.
  const offsets = [0];
  Array.from(content).forEach((character) => offsets.push(offsets[offsets.length - 1] + character.length));
  const rowAt = (index: number) => {
    range.setStart(textNode, offsets[index]);
    range.setEnd(textNode, offsets[index + 1]);
    let rect = range.getClientRects()[0];
    if (!rect || rect.height === 0) {
      // Unpainted controls may have no rectangle. Assign them to the next
      // measurable row so boundary search remains monotonic.
      range.setEnd(textNode, content.length);
      rect = Array.from(range.getClientRects()).find((candidate) => candidate.height > 0)!;
    }
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
      return low;
    }
    return rows.length - 1;
  };
  // Logical character offsets advance through visual rows even for bidi text.
  // Search each boundary instead of doing a layout read for every character.
  let start = 0;
  rows.forEach((row, index) => {
    let low = start;
    let high = offsets.length - 1;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (rowAt(middle) <= index) low = middle + 1;
      else high = middle;
    }
    row.start = offsets[start];
    row.end = offsets[low];
    start = low;
  });

  const style = window.getComputedStyle(source);
  const height = parseFloat(style.height);
  const scaleY = height / bounds.height;
  const scaleX = parseFloat(style.width) / bounds.width;
  // Preserve full paragraph context where isolated rows can change shaping,
  // justification, generated hyphens, tab stops or fallback-font line metrics.
  const context = /[\u00AD\u0590-\u08FF\u200E-\u200F\u202A-\u202E\u2066-\u2069\uFB1D-\uFDFF\uFE70-\uFEFF\uD800-\uDFFF\t]/.test(content) ||
    style.textAlign === "justify" || style.textTransform !== "none" || style.hyphens === "auto";
  // Rows can overlap geometrically: preserve each row's full font box rather
  // than cutting its own accents or descenders at the midpoint between rows.
  return rows.map((row, index) => {
    const previous = rows[index - 1];
    const next = rows[index + 1];
    const top = previous ? (Math.min((previous.bottom + row.top) / 2, row.top) - bounds.top) * scaleY : Math.min(0, (row.top - bounds.top) * scaleY);
    const bottom = next ? (Math.max((row.bottom + next.top) / 2, row.bottom) - bounds.top) * scaleY : Math.max(height, (row.bottom - bounds.top) * scaleY);
    return {
      top, height: Math.max(0, bottom - top), start: row.start, end: row.end,
      left: (row.left - bounds.left) * scaleX,
      textTop: (row.top - rows[0].top) * scaleY,
      context,
    };
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
          line.start === next[index].start && line.end === next[index].end &&
          Math.abs(line.left - next[index].left) < 0.1 && Math.abs(line.textTop - next[index].textTop) < 0.1 &&
          line.context === next[index].context
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
    const typography = () => {
      const computed = window.getComputedStyle(source);
      return [computed.font, computed.lineHeight, computed.letterSpacing, computed.wordSpacing,
        computed.textAlign, computed.textIndent, computed.textTransform, computed.direction,
        computed.hyphens, computed.tabSize, computed.wordBreak, computed.overflowWrap,
        computed.fontFeatureSettings, computed.fontVariationSettings].join(";");
    };
    let previousTypography = typography();
    const mutationObserver = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(() => {
      const next = typography();
      if (previousTypography !== next) {
        previousTypography = next;
        scheduleMeasure();
      }
    });
    // Theme classes and inherited styles can change line breaks without
    // changing the element's width, height, or number of rows.
    for (let ancestor: HTMLElement | null = source; ancestor; ancestor = ancestor.parentElement) {
      mutationObserver?.observe(ancestor, { attributes: true, attributeFilter: ["class", "style", "dir"] });
    }
    window.addEventListener("resize", scheduleMeasure);
    const fonts = document.fonts;
    fonts?.ready.then(() => { if (!disposed) scheduleMeasure(); });
    fonts?.addEventListener("loadingdone", scheduleMeasure);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      fonts?.removeEventListener("loadingdone", scheduleMeasure);
    };
  }, [sourceRef, text, className, style]);

  return lines;
};

export default useTextLines;
