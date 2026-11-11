"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";

/** Decorative only: no focus target, timers or continuous animation loop. */
export function LogoMotion({ children }: { children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const point = useRef({ x: 0, y: 0 });
  const reset = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    element.current?.style.removeProperty("--logo-rotate-x");
    element.current?.style.removeProperty("--logo-rotate-y");
    element.current?.style.removeProperty("--logo-shadow-x");
  };
  useEffect(() => {
    const node = element.current;
    const image = node?.querySelector("img");
    const ready = () => node?.classList.add("is-ready");
    if (image?.complete && image.naturalWidth > 0) ready();
    else image?.addEventListener("load", ready, { once: true });
    return () => {
      image?.removeEventListener("load", ready);
      node?.classList.remove("is-ready");
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !window.matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement && active.closest(".auth-panel") && active.value) { reset(); return; }
    point.current = { x: event.clientX, y: event.clientY };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const node = element.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(-1, Math.min(1, (point.current.x - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (point.current.y - rect.top) / rect.height * 2 - 1));
      node.style.setProperty("--logo-rotate-x", `${-y * 4}deg`);
      node.style.setProperty("--logo-rotate-y", `${x * 4}deg`);
      node.style.setProperty("--logo-shadow-x", `${-x * 5}px`);
    });
  }

  return <div ref={element} className="auth-logo-motion" onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
    <div className="auth-logo-motion-surface">{children}</div>
  </div>;
}
