/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

export interface IntersectionObserverProps {
  onChange?: (isVisible: boolean) => void;
  offsetY?: number;
  resetPolicy?: "no-reset" | "above" | "both";
  delay?: number;
  threshold?: number;
  disabled?: boolean;
}

const useIntersectionObserver = (props: IntersectionObserverProps, targetRef: React.RefObject<HTMLDivElement>) => {
  const { offsetY = 0, resetPolicy = "bothReset", delay = 0, threshold = 0.5, disabled = false } = props;
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const handleVisibleChange = (isVisible: boolean) => {
      setIntersecting(isVisible);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        let isVisible = entry.isIntersecting;

        if (resetPolicy === "no-reset") {
          if (entry.intersectionRatio > 0) {
            setTimeout(() => handleVisibleChange(true), delay);
          }
        } else if (resetPolicy === "above") {
          if (window.scrollY <= (targetRef.current?.offsetTop ?? 0)) {
            setTimeout(() => handleVisibleChange(isVisible), delay);
          }
        } else {
          setTimeout(() => handleVisibleChange(isVisible), delay);
        }
      },
      {
        root: null,
        rootMargin: `${offsetY}px`,
        threshold: threshold,
      }
    );

    if (targetRef?.current && disabled !== true) {
      observer.observe(targetRef.current);
    } else if (targetRef?.current && disabled) {
      observer.unobserve(targetRef.current);
      handleVisibleChange(false);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
    };
  }, [offsetY, resetPolicy, delay, targetRef, disabled]);

  return disabled ? false : isIntersecting;
};

export default useIntersectionObserver;
