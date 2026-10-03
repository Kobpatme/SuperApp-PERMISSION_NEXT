"use client";
import "@/styles/tokens.css";
import "@/app/globals.css";
import "@/styles/ui.css";
import "@/styles/auth.css";
import { appFontClassName } from "@/app/fonts";
import { AuthShell } from "@/components/auth/auth-shell";
import { ErrorState } from "@/components/ui/error-state";
import { copy } from "@/lib/copy";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="th" className={appFontClassName}><body><AuthShell title={copy.feedback.errorTitle} description={copy.feedback.errorDescription}><ErrorState digest={error.digest} reset={reset} embedded/></AuthShell></body></html>;
}
