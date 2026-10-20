"use client";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
/** Keep the native modal/focus trap until its 120ms exit completes. */
export function useDialogDismiss(ref: RefObject<HTMLDialogElement | null>, finish: () => void) {
  const [closing,setClosing]=useState(false);
  const pending=useRef(false);
  const timer=useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  const dismiss=useCallback(()=>{
    if(pending.current)return;
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){finish();return;}
    pending.current=true;setClosing(true);
    const end=()=>{if(!pending.current)return;if(timer.current)clearTimeout(timer.current);pending.current=false;setClosing(false);finish();};
    // Fallback also closes if an animation is interrupted by a theme/OS change.
    timer.current=setTimeout(end,160);
    ref.current?.addEventListener("animationend",end,{once:true});
  },[finish,ref]);
  return {closing,dismiss};
}
