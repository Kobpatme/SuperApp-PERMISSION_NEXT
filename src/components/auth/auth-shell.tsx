import type { ReactNode } from "react";
import Image from "next/image";
import { copy } from "@/lib/copy";

export function AuthBrand({ imageSrc }: { imageSrc?: string }) {
  return <div className="auth-brand"><span className="auth-brand-mark" aria-hidden="true">{imageSrc ? <Image src={imageSrc} alt="" width={40} height={40}/> : "PN"}</span><strong>Permission Next</strong></div>;
}

export function AuthShell({ title, description, children, notice, contactText, imageSrc, className }: { title: string; description: string; children: ReactNode; notice?: string; contactText?: string; imageSrc?: string; className?: string }) {
  return <main className={`auth-page ${className ?? ""}`.trim()}><section className="auth-shell" aria-labelledby="auth-title">
    <div className="auth-intro"><AuthBrand imageSrc={imageSrc}/><div className="auth-intro-copy"><p className="auth-headline">{copy.auth.brandHeadline}</p><p>{copy.auth.brandDescription}</p></div></div>
    <div className="auth-panel"><div className="auth-panel-inner">
      <div className="auth-mobile-brand"><AuthBrand imageSrc={imageSrc}/></div>
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      <div className="auth-panel-heading"><h1 id="auth-title">{title}</h1><p className="auth-description">{description}</p></div>
      {children}
      <p className="auth-help">{copy.auth.help}<br/><strong>{copy.auth.contact}</strong>{contactText && <> · {contactText}</>}</p>
    </div></div>
  </section></main>;
}
