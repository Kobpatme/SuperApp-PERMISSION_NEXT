import "@/styles/tokens.css";
import "@/app/globals.css";
import "@/styles/shell.css";
import "@/styles/components.css";
import "@/styles/ui.css";
import "@/styles/notifications.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Permission Next — Operations Workspace",
  description: "Unified workspace for MAXIWA KPI, building expenses and building guarantee refunds",
};

const themeScript = `(function(){try{var t=localStorage.getItem('permission-next-workspace-theme');if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
