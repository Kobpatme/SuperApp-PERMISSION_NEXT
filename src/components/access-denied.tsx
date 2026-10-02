import Link from "next/link";
import { copy } from "@/lib/copy";
import { getServerEnv } from "@/lib/env";

export function AccessDenied({ moduleName }: { moduleName: string }) {
  return <section className="access-denied" role="alert">
    <span className="access-denied-mark" aria-hidden="true">!</span>
    <div>
      <p className="eyebrow">สิทธิ์การใช้งาน</p>
      <h1>{moduleName}</h1>
      <p>{copy.feedback.denied}</p>
      <p className="support-contact"><strong>{copy.auth.contact}</strong>{getServerEnv().SUPPORT_CONTACT_TEXT && <> · {getServerEnv().SUPPORT_CONTACT_TEXT}</>}</p>
      <Link className="primary" href="/">{copy.feedback.home}</Link>
    </div>
  </section>;
}
