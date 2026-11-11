import type { ReactNode } from "react";
import Image from "next/image";
import { copy } from "@/lib/copy";
import { LogoMotion } from "./logo-motion";

export function AuthBrand({ imageSrc, large = false }: { imageSrc?: string; large?: boolean }) {
  if (large && imageSrc) return <div className="auth-team-logo"><LogoMotion><Image src={imageSrc} alt="Permission Next" width={360} height={120} draggable={false}/></LogoMotion></div>;
  return <div className="auth-brand"><span className="auth-brand-mark" aria-hidden="true">{imageSrc ? <Image src={imageSrc} alt="" width={40} height={40}/> : "PN"}</span><strong>Permission Next</strong></div>;
}

function TeamName() {
  return <>Permission <span className="auth-team-word">Team</span></>;
}

export function AuthShell({ title, description, children, notice, contactText, imageSrc, className, teamBrand = false }: { title: string; description?: string; children: ReactNode; notice?: string; contactText?: string; imageSrc?: string; className?: string; teamBrand?: boolean }) {
  return <main className={`auth-page ${className ?? ""}`.trim()}><section className="auth-shell" aria-labelledby="auth-title">
    <div className={`auth-intro${teamBrand ? " auth-team-intro" : ""}`}>
      {teamBrand ? <div className="auth-team-identity"><AuthBrand imageSrc={imageSrc} large/><p className="auth-headline"><TeamName/></p></div>
        : <><AuthBrand imageSrc={imageSrc}/><div className="auth-intro-copy"><p className="auth-headline">{copy.auth.brandHeadline}</p><p>{copy.auth.brandDescription}</p></div></>}
    </div>
    <div className="auth-panel"><div className="auth-panel-inner">
      <div className="auth-mobile-brand"><AuthBrand imageSrc={imageSrc} large={teamBrand}/>{teamBrand && <p className="auth-team-mobile-title"><TeamName/></p>}</div>
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      <div className="auth-panel-heading"><h1 id="auth-title">{title}</h1>{description && <p className="auth-description">{description}</p>}</div>
      {children}
      <p className="auth-help">{copy.auth.help}<br/><strong>{copy.auth.contact}</strong>{contactText && <> · {contactText}</>}</p>
    </div></div>
  </section></main>;
}
