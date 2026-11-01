import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { copy } from "@/lib/copy";
export default function NotFound() { return <AuthShell className="core-utility-page" title={copy.feedback.notFound} description={copy.feedback.notFoundDescription}><Link className="button" href="/">{copy.feedback.home}</Link></AuthShell>; }
