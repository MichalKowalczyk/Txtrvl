import "./Txtrvl.scss";
import { useEffect, useRef, useState } from "react";
import useIntersectionObserver from "../tools/useIntersectionObserver";
import { convertToTrailsBlocks } from "../tools/setTrailsBlocks";

interface ManualTriggerConfig {
  isVisible: boolean;
}
interface ScrollTriggerConfig {
  offsetY?: number;
  disabled?: boolean;
  resetPolicy?: "no-reset" | "above" | "both";
  threshold?: number;
  delay?: number;
}

export interface TxtrvlProps {
  text: string;
  duration?: number;
  delayPerRow?: number;
  style?: React.CSSProperties | undefined;
  className?: string;
  onChange?: (isVisible: boolean) => void;
  scrollTrigger?: ScrollTriggerConfig;
  manualTrigger?: ManualTriggerConfig;
}

const Txtrvl = (props: TxtrvlProps) => {
  const { text, manualTrigger, duration = 1000, delayPerRow: delay = 200, className = "", style, onChange, scrollTrigger = { offsetY: 0, disabled: false, resetPolicy: "above", delay: 0, threshold: 0.5 } } = props;

  const ref = useRef<any>();
  const [trails, setTrails] = useState([] as Array<string>);
  const [isOpen, setIsOpen] = useState(false);

  const observerIsVisible = useIntersectionObserver(
    {
      disabled: scrollTrigger.disabled,
      onChange: onChange,
      threshold: scrollTrigger.threshold,
      offsetY: scrollTrigger.offsetY,
      delay: scrollTrigger.delay,
      resetPolicy: scrollTrigger.resetPolicy,
    },
    ref
  );

  let interval: NodeJS.Timeout | undefined;

  useEffect(() => {
    if (interval !== undefined) clearInterval(interval);
    setIsOpen(false);

    if (ref) {
      setTrails(convertToTrailsBlocks(ref, text));
      setIsOpen(true);

      interval = setInterval(() => {
        setTrails(convertToTrailsBlocks(ref, text));
        setIsOpen(true);
      }, delay);
    }

    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const isRevealed = (isOpen: boolean, observerIsVisible: boolean, manualTrigger?: ManualTriggerConfig, scrollTrigger?: ScrollTriggerConfig) => {
    if (scrollTrigger?.disabled && manualTrigger) {
      return isOpen && manualTrigger.isVisible;
    } else if (scrollTrigger && !scrollTrigger.disabled && manualTrigger) {
      return isOpen && (observerIsVisible || manualTrigger?.isVisible);
    } else if (scrollTrigger && !scrollTrigger.disabled) {
      return isOpen && observerIsVisible;
    } else {
      return false;
    }
  };

  return (
    <div ref={ref} className={`trailsWrapper ${className}`} style={style}>
      {trails
        ? trails.map((trail: string, index: number) => {
            return (
              <span
                key={index}
                className={`tailWrapper ${isRevealed(isOpen, observerIsVisible, manualTrigger, scrollTrigger) ? "isOpen" : ""}`}
                style={{
                  transitionDelay: (isRevealed(isOpen, observerIsVisible, manualTrigger, scrollTrigger) ? delay * index : 0) + "ms",
                  transitionDuration: duration + "ms",
                }}
              >
                <span
                  className={`tail`}
                  style={{
                    transitionDelay: delay * index + "ms",
                    transitionDuration: duration + "ms",
                  }}
                >
                  {" " + trail.replace("|", "\u00A0").replace("|", "\u00A0") + " "}
                </span>
              </span>
            );
          })
        : null}
    </div>
  );
};

export default Txtrvl;
