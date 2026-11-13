"use client";
import { Children, cloneElement, isValidElement, useCallback, type ComponentProps, type ReactNode } from "react";
import { FormField } from "@/components/ui/form";
export { Button } from "@/components/ui/button";
// Opt into the existing Core field skin, including fields beside a datalist.
// Native toggles and upload controls must retain their own interaction surface.
export function Field({ children, ...props }: ComponentProps<typeof FormField>) {
 const skin=(child:ReactNode):ReactNode=>{
  if(!isValidElement<{className?:string;type?:string}>(child)||typeof child.type!=="string"||!["input","select","textarea"].includes(child.type))return child;
  if(child.type==="input"&&["checkbox","radio","hidden","file","button","submit","reset","image","range","color"].includes(child.props.type??"text"))return child;
  return cloneElement(child,{className:[child.props.className,"ui-field-control","ui-building-field"].filter(Boolean).join(" ")});
 };
 return <FormField {...props}>{isValidElement(children)?skin(children):Children.map(children,skin)}</FormField>;
}
// Shared CSS owns every skin and layout; neither domain supplies a theme/reset.
export const styles={workspace:"ui-map-page ui-form-controls",tabs:"ui-tabs",actions:"ui-form-actions ui-form-actions-inline",panel:"ui-panel ui-map-stack ui-form-controls",columns:"ui-map-fields",table:"ui-table-scroll ui-map-table",list:"ui-map-list",dialog:"ui-dialog",linkButton:"ui-button ui-button-ghost",workbench:"ui-map-workbench",sidebar:"ui-panel ui-map-sidebar",canvas:"ui-map-canvas",detail:"ui-panel ui-map-detail"};
export function ErrorMessage({error}:{error:string}){return error?<p role="alert" className="ui-field-error">{error}</p>:null;}
export async function readWorkspaceApi<T>(base:string,path:string,init?:RequestInit):Promise<T>{const response=await fetch(base+path,{...init,cache:"no-store"});const value=await response.json();if(!response.ok)throw new Error(value.error||"โหลดข้อมูลไม่สำเร็จ");return value;}
export function useWorkspaceApi(moduleId:"permission-out"|"site-facility"){
 const api=`/api/${moduleId}/`;
 const readApi=useCallback(<T,>(path:string,init?:RequestInit)=>readWorkspaceApi<T>(api,path,init),[api]);
 const post=useCallback(<T,>(path:string,value:unknown)=>readApi<T>(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)}),[readApi]);
 return {api,readApi,post};
}
