"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { WorkspaceIcon } from "@/components/workspace-icon";

type WorkspaceTheme = "light" | "dark";
const storageKey = "permission-next-workspace-theme";

export function WorkspaceThemeToggle() {
  const [theme, setTheme] = useState<WorkspaceTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(storageKey); }
      catch { /* Storage is optional; keep the system preference usable. */ }
      const initial: WorkspaceTheme = saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(initial);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { window.localStorage.setItem(storageKey, theme); }
    catch { /* Apply the theme even when the preference cannot be persisted. */ }
  }, [ready, theme]);

  const isDark = theme === "dark";
  return (
    <button className="round-btn workspace-theme-toggle" type="button" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={isDark ? copy.feedback.themeLight : copy.feedback.themeDark} title={isDark ? copy.feedback.themeLight : copy.feedback.themeDark}>
      {isDark
        ? <WorkspaceIcon name="sun" size={18}/>
        : <WorkspaceIcon name="moon" size={18}/>}
    </button>
  );
}
