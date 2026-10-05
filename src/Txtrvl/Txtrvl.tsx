"use client";

import "./Txtrvl.scss";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import useIntersectionObserver from "../tools/useIntersectionObserver";
import useTextLines from "../tools/useTextLines";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface ManualTriggerConfig {
  isVisible: boolean;
}
interface ScrollTriggerConfig {
  root?: Element | null;
  offsetY?: number;
  disabled?: boolean;
  resetPolicy?: "no-reset" | "above" | "both";
  threshold?: number;
  delay?: number;
}

export type TxtrvlAnimation = "reveal" | "fade" | "slide-up" | "slide-left" | "blur" | "scale";

export interface TxtrvlProps {
  text: string;
  animation?: TxtrvlAnimation;
  duration?: number;
  delayPerRow?: number;
  style?: React.CSSProperties;
  className?: string;
  onChange?: (isVisible: boolean) => void;
  scrollTrigger?: ScrollTriggerConfig;
  manualTrigger?: ManualTriggerConfig;
}

const Txtrvl = ({
  text,
  animation = "reveal",
  manualTrigger,
  duration = 1000,
  delayPerRow = 200,
  className = "",
  style,
  onChange,
  scrollTrigger = {},
}: TxtrvlProps): React.ReactElement => {
  const ref = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const lines = useTextLines(sourceRef, text, className, style);
  const [animationReady, setAnimationReady] = useState(false);
  const observerIsVisible = useIntersectionObserver({ ...scrollTrigger, resetPolicy: scrollTrigger.resetPolicy ?? "above", onChange }, ref);

  useBrowserLayoutEffect(() => {
    setAnimationReady(false);
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => setAnimationReady(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [text, animation]);

  const isRevealed = animationReady && (scrollTrigger.disabled
    ? manualTrigger?.isVisible ?? false
    : observerIsVisible || manualTrigger?.isVisible === true);

  return (
    <div ref={ref} className={`trailsWrapper${lines.length ? " isMeasured" : ""}${animationReady ? "" : " isPreparing"} ${className}`} style={style} data-animation={animation}>
      <div ref={sourceRef} className="trailsText trailsContent">
        <span className="trailsSource">{text}</span>
        <div className="trailsOverlay" aria-hidden="true">
          {lines.map((line, index) => (
            <div key={index} className={`tailWrapper${isRevealed ? " isOpen" : ""}`} style={{ top: line.top, height: line.height }}>
              <div className="tail" style={{
                transitionDelay: `${isRevealed ? Math.max(0, delayPerRow) * index : 0}ms`,
                transitionDuration: `${Math.max(0, duration)}ms`,
              }}>
                <div className={`trailsText trailsCopy${line.context ? "" : " trailsIsolated"}`} style={line.context
                  ? { top: -line.top }
                  : { top: line.textTop - line.top, left: line.left }}>
                  {line.context && <span className="trailsContext">{text.slice(0, line.start)}</span>}
                  <span className="trailsLine">{text.slice(line.start, line.end)}</span>
                  {line.context && <span className="trailsContext">{text.slice(line.end)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Txtrvl;
