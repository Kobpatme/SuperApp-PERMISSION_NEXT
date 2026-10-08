"use client";
import { useEffect, type RefObject } from "react";
export const workMutationEvent = "pn:work-mutation";
export function announceWorkMutation() {
  window.dispatchEvent(new Event(workMutationEvent));
  if (typeof BroadcastChannel !== "function") return;
  try { const channel = new BroadcastChannel("pn-work"); channel.postMessage("changed"); channel.close(); } catch { /* timer remains available */ }
}
export function useWorkMutationSignal(state: { ok: boolean }, form?: RefObject<HTMLFormElement | null>) {
  useEffect(() => { if (state.ok) { form?.current?.reset(); announceWorkMutation(); } }, [state, form]);
}
