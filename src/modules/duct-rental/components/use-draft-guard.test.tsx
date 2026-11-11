// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { useDraftGuard } from "./use-draft-guard";
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it("guards dirty tab navigation and sidebar links, and blocks leaving during a save", async () => {
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host); let mayLeave = () => true;
  // Native anchor fixture exercises the delegated browser boundary, not Next navigation.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  function Fixture({ dirty, busy }: { dirty: boolean; busy: boolean }) { mayLeave = useDraftGuard(dirty, busy); return <a href="/duct-rental/elsewhere">ออก</a>; }
  const confirm = vi.fn(() => false); vi.stubGlobal("confirm", confirm);
  try {
    await act(async () => root.render(<Fixture dirty busy={false}/>));
    expect(mayLeave()).toBe(false);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    host.querySelector("a")!.dispatchEvent(click); expect(click.defaultPrevented).toBe(true);
    const unload = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(unload); expect(unload.defaultPrevented).toBe(true);
    const push = vi.spyOn(window.history, "pushState");
    window.dispatchEvent(new PopStateEvent("popstate")); expect(push).toHaveBeenCalledOnce();
    confirm.mockReturnValue(true); expect(mayLeave()).toBe(true);
    await act(async () => root.render(<Fixture dirty={false} busy/>)); expect(mayLeave()).toBe(false);
    await act(async () => root.render(<Fixture dirty={false} busy={false}/>)); expect(mayLeave()).toBe(true);
  } finally { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); }
});
