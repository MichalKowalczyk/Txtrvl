import { useEffect, useRef, useState } from "react";

export interface IntersectionObserverProps {
  onChange?: (isVisible: boolean) => void;
  offsetY?: number;
  resetPolicy?: "no-reset" | "above" | "both";
  delay?: number;
  threshold?: number;
  disabled?: boolean;
}

const useIntersectionObserver = (props: IntersectionObserverProps, targetRef: React.RefObject<HTMLDivElement>) => {
  const { offsetY = 0, resetPolicy = "both", delay = 0, threshold = 0.5, disabled = false } = props;
  const [isIntersecting, setIntersecting] = useState(false);
  const visibleRef = useRef(false);
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;

  useEffect(() => {
    const target = targetRef.current;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let observer: IntersectionObserver | undefined;

    const clearPending = () => {
      if (timeout !== undefined) clearTimeout(timeout);
      timeout = undefined;
    };
    const setVisible = (visible: boolean) => {
      if (visibleRef.current === visible) return;
      visibleRef.current = visible;
      setIntersecting(visible);
      onChangeRef.current?.(visible);
    };
    const scheduleVisible = (visible: boolean) => {
      clearPending();
      if (delay > 0) timeout = setTimeout(() => setVisible(visible), delay);
      else setVisible(visible);
    };

    if (disabled || !target) {
      setVisible(false);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observe = () => {
      observer?.disconnect();
      clearPending();
      // Apply the threshold to the portion of a tall block that fits in the viewport.
      const viewportHeight = Math.max(1, document.documentElement.clientHeight + offsetY * 2);
      const height = target.getBoundingClientRect().height;
      const effectiveThreshold = Math.min(1, Math.max(0, threshold)) * Math.min(1, viewportHeight / Math.max(1, height));

      observer = new IntersectionObserver(([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= effectiveThreshold;
        const belowViewport = entry.boundingClientRect.top >= (entry.rootBounds?.bottom ?? viewportHeight);
        if (visible) scheduleVisible(true);
        else if (resetPolicy === "both" || (resetPolicy === "above" && belowViewport)) scheduleVisible(false);
        else clearPending();
      }, { root: null, rootMargin: `${offsetY}px`, threshold: [0, effectiveThreshold] });
      observer.observe(target);
    };

    observe();
    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(observe);
    resizeObserver?.observe(target);
    window.addEventListener("resize", observe);

    return () => {
      clearPending();
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, [offsetY, resetPolicy, delay, threshold, targetRef, disabled]);

  return disabled ? false : isIntersecting;
};

export default useIntersectionObserver;
