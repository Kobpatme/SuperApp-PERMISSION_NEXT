// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { LogoMotion } from "./logo-motion";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("decorative logo motion", () => {
  it("starts the entrance only after the logo loads, without adding controls", async () => {
    const host = document.createElement("div"); document.body.append(host);
    const root = createRoot(host);
    try {
      // Native image fixture: exercise the browser load event, not Next image optimization.
      // eslint-disable-next-line @next/next/no-img-element
      await act(async () => root.render(<LogoMotion><img alt="logo" src="/logo.png"/></LogoMotion>));
      const node = host.firstElementChild as HTMLDivElement;
      expect(node.classList.contains("is-ready")).toBe(false);
      await act(async () => node.querySelector("img")?.dispatchEvent(new Event("load")));
      expect(node.classList.contains("is-ready")).toBe(true);
      expect(host.querySelector("button")).toBeNull();
    } finally {
      await act(async () => root.unmount()); host.remove();
    }
  });
  it("bounds tilt, resets on leave, and ignores touch or reduced-motion input", async () => {
    const host = document.createElement("div"); document.body.append(host);
    const root = createRoot(host);
    const media = vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    let nextFrame: FrameRequestCallback | undefined;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { nextFrame = callback; return 1; });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    try {
      await act(async () => root.render(<LogoMotion><span>logo</span></LogoMotion>));
      const node = host.firstElementChild as HTMLDivElement;
      vi.spyOn(node, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 100, height: 100 } as DOMRect);
      await act(async () => node.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", clientX: 1000, clientY: 1000, bubbles: true })));
      nextFrame?.(0);
      expect(node.style.getPropertyValue("--logo-rotate-x")).toBe("-4deg");
      expect(node.style.getPropertyValue("--logo-rotate-y")).toBe("4deg");
      await act(async () => node.dispatchEvent(new PointerEvent("pointerout", { bubbles: true })));
      expect(node.style.getPropertyValue("--logo-rotate-x")).toBe("");
      nextFrame = undefined;
      media.mockReturnValue({ matches: false } as MediaQueryList);
      await act(async () => node.dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", bubbles: true })));
      expect(nextFrame).toBeUndefined();
      media.mockReturnValue({ matches: true } as MediaQueryList);
      await act(async () => node.dispatchEvent(new PointerEvent("pointermove", { pointerType: "touch", bubbles: true })));
      expect(nextFrame).toBeUndefined();
    } finally {
      await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals();
    }
  });
});
