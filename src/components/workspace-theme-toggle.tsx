"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";

type WorkspaceTheme = "light" | "dark";
const storageKey = "permission-next-workspace-theme";

export function WorkspaceThemeToggle() {
  const [theme, setTheme] = useState<WorkspaceTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem(storageKey);
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
    window.localStorage.setItem(storageKey, theme);
  }, [ready, theme]);

  const isDark = theme === "dark";
  return (
    <button className="round-btn workspace-theme-toggle" type="button" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={isDark ? copy.feedback.themeLight : copy.feedback.themeDark} title={isDark ? copy.feedback.themeLight : copy.feedback.themeDark}>
      {isDark
        ? <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>
        : <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/></svg>}
    </button>
  );
}
