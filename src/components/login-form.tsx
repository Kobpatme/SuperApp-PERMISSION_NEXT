"use client";
import { Button } from "@/components/ui/button";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, type LoginState } from "@/app/login/actions";
import { PasswordField } from "@/components/auth/password-field";
import { copy } from "@/lib/copy";
import { clearLoginTransition, prepareLoginTransition } from "@/components/auth/login-transition";

export function LoginForm({ next = "" }: { next?: string }) {
  const router=useRouter();
  const formRef=useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async(previous:LoginState,data:FormData)=>{
    data.set("navigation","client");
    const result=await loginAction(previous,data);
    if(result.destination){
      if(formRef.current)prepareLoginTransition(formRef.current);
      router.replace(result.destination);
    }
    return result;
  }, {});
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  useEffect(() => { if (state.error) { clearLoginTransition(); passwordRef.current?.focus(); } }, [state]);
  return <form ref={formRef} className="auth-form" action={action} noValidate onSubmit={event => {
    if (pending) { event.preventDefault(); return; }
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const nextErrors = { email: !email ? copy.auth.emailRequired : !/^\S+@\S+\.\S+$/.test(email) ? copy.auth.emailInvalid : undefined, password: !password ? copy.auth.passwordRequired : undefined };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) { event.preventDefault(); (nextErrors.email ? emailRef : passwordRef).current?.focus(); }
  }} aria-busy={pending}>
    {next && <input type="hidden" name="next" value={next} />}
    {state.error && !pending && <div className="auth-error" role="alert"><span aria-hidden="true">!</span> {state.error}</div>}
    <div className="auth-field"><label htmlFor="login-email">{copy.auth.email}</label><input id="login-email" ref={emailRef} name="email" type="email" autoComplete="email" placeholder={copy.auth.emailPlaceholder} defaultValue={state.email || ""} aria-invalid={Boolean(errors.email)} aria-describedby="login-email-error" required autoFocus className="ui-field-control ui-building-field"/><span id="login-email-error" className="auth-field-hint" aria-live="polite">{errors.email && `! ${errors.email}`}</span></div>
    <PasswordField label={copy.auth.password} inputRef={passwordRef} name="password" autoComplete="current-password" placeholder={copy.auth.passwordPlaceholder} minLength={8} maxLength={256} required error={errors.password} className="ui-field-control ui-building-field"/>
    <Button variant="primary" className="auth-submit-button" disabled={pending} type="submit">
      {pending && <span className="auth-spinner" aria-hidden="true"/>}{pending ? copy.auth.pending : copy.auth.login}
      {!pending && <span aria-hidden="true">→</span>}
    </Button>
  </form>;
}
