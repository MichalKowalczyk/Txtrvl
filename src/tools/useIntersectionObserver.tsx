import { useEffect, useRef, useState } from "react";

export interface IntersectionObserverProps {
  root?: Element | null;
  onChange?: (isVisible: boolean) => void;
  offsetY?: number;
  resetPolicy?: "no-reset" | "above" | "both";
  delay?: number;
  threshold?: number;
  disabled?: boolean;
}

const useIntersectionObserver = (props: IntersectionObserverProps, targetRef: React.RefObject<HTMLDivElement>) => {
  const { root = null, offsetY = 0, resetPolicy = "both", delay = 0, threshold = 0.5, disabled = false } = props;
  const [isIntersecting, setIntersecting] = useState(false);
  const visibleRef = useRef(false);
  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;

  useEffect(() => {
    const target = targetRef.current;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let pendingVisible: boolean | undefined;
    let observer: IntersectionObserver | undefined;

    const clearPending = () => {
      if (timeout !== undefined) clearTimeout(timeout);
      timeout = undefined;
      pendingVisible = undefined;
    };
    const setVisible = (visible: boolean) => {
      if (visibleRef.current === visible) return;
      visibleRef.current = visible;
      setIntersecting(visible);
      onChangeRef.current?.(visible);
    };
    const scheduleVisible = (visible: boolean) => {
      if (pendingVisible === visible) return;
      clearPending();
      if (visibleRef.current === visible) return;
      if (delay > 0) {
        pendingVisible = visible;
        timeout = setTimeout(() => {
          clearPending();
          setVisible(visible);
        }, delay);
      }
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

    const clippingParents: Array<{ element: HTMLElement; x: boolean; y: boolean }> = [];
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      const style = window.getComputedStyle(parent);
      const x = /(auto|scroll|hidden|clip)/.test(style.overflowX);
      const y = /(auto|scroll|hidden|clip)/.test(style.overflowY);
      if (x || y || parent === root) clippingParents.push({ element: parent, x: x || parent === root, y: y || parent === root });
      if (parent === root) break;
    }
    const getRootBounds = () => {
      if (!root) return {
        height: Math.max(0, document.documentElement.clientHeight + offsetY * 2),
        width: document.documentElement.clientWidth,
        bottom: document.documentElement.clientHeight + offsetY,
      };
      const bounds = root.getBoundingClientRect();
      const scaleX = root instanceof HTMLElement ? bounds.width / Math.max(1, root.offsetWidth) : 1;
      const scaleY = root instanceof HTMLElement ? bounds.height / Math.max(1, root.offsetHeight) : 1;
      return {
        height: Math.max(0, root.clientHeight * scaleY + offsetY * 2),
        width: root.clientWidth * scaleX,
        bottom: bounds.top + (root.clientTop + root.clientHeight) * scaleY + offsetY,
      };
    };
    const observe = () => {
      observer?.disconnect();
      clearPending();
      // Intersection ratios measure area. Cap the requested threshold by the
      // space available in every clipping ancestor, including small scrollports.
      let { height, width } = getRootBounds();
      clippingParents.forEach(({ element, x, y }) => {
        if (element === root) return;
        const bounds = element.getBoundingClientRect();
        if (y) height = Math.min(height, element.clientHeight * bounds.height / Math.max(1, element.offsetHeight));
        if (x) width = Math.min(width, element.clientWidth * bounds.width / Math.max(1, element.offsetWidth));
      });
      const bounds = target.getBoundingClientRect();
      const requestedThreshold = Number.isFinite(threshold) ? Math.min(1, Math.max(0, threshold)) : 0.5;
      const effectiveThreshold = requestedThreshold * Math.min(1, height / Math.max(1, bounds.height)) * Math.min(1, width / Math.max(1, bounds.width));

      observer = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        const visible = entry.isIntersecting && entry.intersectionRatio >= effectiveThreshold;
        let bottom = entry.rootBounds?.bottom ?? getRootBounds().bottom;
        clippingParents.forEach(({ element, y }) => {
          if (y && element !== root) {
            const bounds = element.getBoundingClientRect();
            const scale = bounds.height / Math.max(1, element.offsetHeight);
            bottom = Math.min(bottom, bounds.top + (element.clientTop + element.clientHeight) * scale);
          }
        });
        const belowViewport = entry.boundingClientRect.top >= bottom;
        if (visible) scheduleVisible(true);
        else if (resetPolicy === "both" || (resetPolicy === "above" && belowViewport)) scheduleVisible(false);
        else clearPending();
      }, { root, rootMargin: `${offsetY}px 0px`, threshold: [0, effectiveThreshold] });
      observer.observe(target);
    };

    observe();
    const resizeObserver = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(observe);
    resizeObserver?.observe(target);
    clippingParents.forEach(({ element }) => resizeObserver?.observe(element));
    if (root) resizeObserver?.observe(root);
    window.addEventListener("resize", observe);

    return () => {
      clearPending();
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, [root, offsetY, resetPolicy, delay, threshold, targetRef, disabled]);

  return disabled ? false : isIntersecting;
};

export default useIntersectionObserver;
