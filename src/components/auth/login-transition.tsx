"use client";

import {useLayoutEffect,useState} from "react";
import {usePathname} from "next/navigation";

type MotionState={cover?:HTMLElement;animations:Animation[];arriving?:boolean;allowLoading?:boolean;expiry?:ReturnType<typeof setTimeout>};
type MotionWindow=Window&{__permissionNextLoginMotion?:MotionState};
const storageKey="permission-next-login-transition";
function motionState(){return (window as MotionWindow).__permissionNextLoginMotion??={animations:[]};}
function pendingArrival(){try{const time=Number(sessionStorage.getItem(storageKey));return time>0&&Date.now()>=time&&Date.now()-time<60_000;}catch{return false;}}

export function clearLoginTransition(){
 const state=motionState();state.animations.forEach(animation=>animation.cancel());state.cover?.remove();clearTimeout(state.expiry);
 (window as MotionWindow).__permissionNextLoginMotion={animations:[]};
 delete document.documentElement.dataset.loginArrival;
 try{sessionStorage.removeItem(storageKey);}catch{/* Storage is optional. */}
}

// Keep a decorative copy visible while the destination streams behind it.
// Only a timestamp crosses a full navigation; the copy stays in this document.
export function prepareLoginTransition(form:HTMLFormElement){
 clearLoginTransition();
 const page=form.closest<HTMLElement>(".auth-page"),shell=page?.querySelector<HTMLElement>(".auth-shell");
 if(!page||!shell)return;
 const rect=shell.getBoundingClientRect(),cover=page.cloneNode(true) as HTMLElement;
 cover.classList.add("auth-transition-cover");cover.inert=true;cover.setAttribute("aria-hidden","true");
 cover.querySelectorAll("[id]").forEach(element=>element.removeAttribute("id"));
 cover.querySelectorAll<HTMLInputElement>("input").forEach(input=>{
  if(input.name==="password"||input.type==="password"){input.value="";input.removeAttribute("value");input.type="password";input.placeholder="••••••••";}
  if(input.type==="hidden")input.remove();
 });
 const cloneShell=cover.querySelector<HTMLElement>(".auth-shell")!;
 Object.assign(cloneShell.style,{position:"absolute",left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,minHeight:"0",margin:"0"});
 const button=cover.querySelector(".auth-submit-button");if(button)button.textContent="กำลังเปิดพื้นที่ทำงาน…";
 document.body.append(cover);
 const state=motionState();state.cover=cover;state.expiry=setTimeout(clearLoginTransition,60_000);
 document.documentElement.dataset.loginArrival="preparing";
 try{sessionStorage.setItem(storageKey,String(Date.now()));}catch{/* SPA handoff still works. */}
}

function destinationReady(destination:HTMLElement){
 if(destination.matches("[data-app-shell]")&&destination.dataset.shellReady!=="true")return false;
 const main=destination.querySelector("[data-shell-main]")??destination;
 return !Array.from(main.querySelectorAll<HTMLElement>(".loading-workspace,[aria-busy='true']")).some(element=>element.checkVisibility());
}

function playTransition(destination:HTMLElement,state:MotionState){
 if(!destination.isConnected){clearLoginTransition();return;}
 const cover=state.cover;
 if(cover){
  cover.classList.add("auth-is-departing");
  cover.querySelectorAll<HTMLElement>(".auth-intro,.auth-panel").forEach(panel=>{
   if(getComputedStyle(panel).display==="none")return;
   const rect=panel.getBoundingClientRect();
   const distance=panel.classList.contains("auth-intro")?-(rect.right+24):innerWidth-rect.left+24;
   state.animations.push(panel.animate([{transform:"translate3d(0,0,0)",opacity:1},{transform:`translate3d(${distance}px,0,0)`,opacity:0}],{duration:1000,easing:"cubic-bezier(.65,0,.35,1)",fill:"forwards"}));
  });
 }
 document.documentElement.dataset.loginArrival="true";
 const entrance=destination.getAnimations({subtree:true}).filter(animation=>"animationName" in animation&&animation.animationName==="login-destination-enter");
 state.animations.push(...entrance);
 // Let the 1000 ms split finish, then pause 500 ms before the page enters.
 if(cover)entrance.forEach(animation=>animation.effect?.updateTiming({delay:1500}));
 if(state.animations.length)void Promise.all(state.animations.map(animation=>animation.finished.catch(()=>{}))).then(clearLoginTransition);
 else clearLoginTransition();
}

export function LoginTransitionArrival(){
 const pathname=usePathname();const[revision,setRevision]=useState(0);
 useLayoutEffect(()=>{
  if(pathname==="/login")return;
  const state=motionState();
  if(state.arriving||(!state.cover&&!pendingArrival()))return;
  const selector=pathname==="/change-password"?".auth-page:not(.auth-transition-cover)":"[data-app-shell]";
  const destination=document.querySelector<HTMLElement>(selector);
  if(!destination||(!state.allowLoading&&!destinationReady(destination))){
   const observer=new MutationObserver(()=>{const next=document.querySelector<HTMLElement>(selector);if(next&&destinationReady(next)){observer.disconnect();setRevision(value=>value+1);}});
   observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["data-shell-ready","aria-busy","hidden"]});
   const timeout=setTimeout(()=>{state.allowLoading=true;observer.disconnect();setRevision(value=>value+1);},5000);
   return()=>{observer.disconnect();clearTimeout(timeout);};
  }
  state.arriving=true;
  // Finish font/layout work while the original login view still covers the page.
  void Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1000))]).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>playTransition(destination,state))));
 },[pathname,revision]);
 return null;
}
