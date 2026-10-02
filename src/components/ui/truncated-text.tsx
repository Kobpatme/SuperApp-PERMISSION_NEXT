"use client";

import { useEffect, useId, useRef, useState, type HTMLAttributes } from "react";

export type TruncatedTextLines = 1 | 2 | 3;

export function getTextClampClass(lines: TruncatedTextLines) {
  return `text-clamp-${lines}`;
}

type TruncatedTextProps = Omit<HTMLAttributes<HTMLSpanElement>, "children" | "title"> & {
  text: string;
  lines?: TruncatedTextLines;
};

export function TruncatedText({ text, lines = 2, className = "", ...props }: TruncatedTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const measure = () => setIsTruncated(element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [lines, text]);

  const classes = ["truncated-text", getTextClampClass(lines), "text-safe", className].filter(Boolean).join(" ");
  return <span className="truncated-text-wrap" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
    <span
      {...props}
      ref={textRef}
      className={classes}
      tabIndex={isTruncated ? 0 : -1}
      title={isTruncated ? text : undefined}
      aria-describedby={isTruncated ? tooltipId : undefined}
      onFocus={(event) => { setShowTooltip(true); props.onFocus?.(event); }}
      onBlur={(event) => { setShowTooltip(false); props.onBlur?.(event); }}
    >{text}</span>
    {isTruncated && <span id={tooltipId} className="truncated-text-tooltip" role="tooltip" hidden={!showTooltip}>{text}</span>}
  </span>;
}
