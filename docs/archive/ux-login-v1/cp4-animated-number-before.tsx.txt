"use client";

import { useCallback, useEffect, useRef, useState, type HTMLAttributes } from "react";

type AnimatedNumberProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  value: number;
  duration?: number;
  format?: (value: number) => string;
};

const defaultFormat = (value: number) => value.toLocaleString("th-TH");

export function AnimatedNumber({ value, duration = 700, format = defaultFormat, className = "", ...props }: AnimatedNumberProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const currentValueRef = useRef(value);
  const startedRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const [displayValue, setDisplayValue] = useState(value);

  const animateTo = useCallback((target: number, from: number) => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || duration <= 0 || from === target) {
      currentValueRef.current = target;
      setDisplayValue(target);
      return;
    }

    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (target - from) * eased;
      currentValueRef.current = next;
      setDisplayValue(next);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
      else currentValueRef.current = target;
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [duration]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      animateTo(value, 0);
    };
    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        start();
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [animateTo, value]);

  useEffect(() => {
    if (!startedRef.current || currentValueRef.current === value) return;
    animateTo(value, currentValueRef.current);
  }, [animateTo, value]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  return <span {...props} ref={elementRef} className={className}>{format(displayValue)}</span>;
}
