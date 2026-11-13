"use client";

import Link,{useLinkStatus} from "next/link";
import type {ComponentProps} from "react";
import {createPortal} from "react-dom";
import {WorkspaceLoading} from "@/components/ui/workspace-loading";

export function NavigationLoading({pending}:{pending:boolean}) {
  if(!pending)return null;
  const shell=document.querySelector("[data-app-shell]");
  return shell?createPortal(<WorkspaceLoading className="navigation-loading"/>,shell):null;
}

function LinkLoading(){
  const {pending}=useLinkStatus();
  return <NavigationLoading pending={pending}/>;
}

export function WorkspaceLink({children,...props}:ComponentProps<typeof Link>){
  return <Link {...props}>{children}<LinkLoading/></Link>;
}
