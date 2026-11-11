"use client";
import { useCallback, useEffect } from "react";

/** Guard explicit tab navigation, Core/sidebar links, reload and closing the page. */
export function useDraftGuard(dirty: boolean, busy: boolean) {
  const mayLeave = useCallback(() => !busy && (!dirty || window.confirm("มีข้อมูลที่ยังไม่ได้บันทึก ต้องการทิ้งข้อมูลและออกจากหน้านี้หรือไม่?")), [dirty, busy]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const savedUrl = window.location.href, savedState = window.history.state;
    const back = (event: PopStateEvent) => {
      if (!mayLeave()) {
        // popstate is not cancelable. Restore the current entry before Next's
        // bubbling listener can unmount the editor; retain its router state.
        event.stopImmediatePropagation();
        window.history.pushState(savedState, "", savedUrl);
      }
    };
    const click = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download") || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const target = new URL(anchor.href, window.location.href);
      if (target.href === window.location.href || target.pathname === window.location.pathname && target.search === window.location.search) return;
      if (!mayLeave()) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", back, true);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", unload); window.removeEventListener("popstate", back, true); document.removeEventListener("click", click, true); };
  }, [dirty, busy, mayLeave]);
  return mayLeave;
}
