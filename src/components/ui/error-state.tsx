"use client";
import Link from "next/link";
import { copy } from "@/lib/copy";
export function ErrorState({ digest, reset, embedded = false }: { digest?: string; reset: () => void; embedded?: boolean }) {
  const Heading = embedded ? "h2" : "h1";
  return <section className="queue-empty error-state" role="alert"><Heading>{copy.feedback.errorTitle}</Heading><p>{copy.feedback.errorDescription}</p>{digest && <p>{copy.feedback.reference}: <code>{digest}</code></p>}<div className="error-state-actions"><button type="button" className="primary" onClick={reset}>{copy.feedback.retry}</button><Link className="secondary-action" href="/">{copy.feedback.home}</Link></div></section>;
}
