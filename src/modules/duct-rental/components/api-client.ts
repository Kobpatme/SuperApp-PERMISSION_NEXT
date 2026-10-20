import type { listRequests, readRequest } from "../server/requests";
import type { readProcesses, readRenewal, readCancellation } from "../server/processes";
import type { readSigning } from "../server/signing";
type Json<T> = T extends Date ? string : T extends readonly unknown[] ? { [K in keyof T]: Json<T[K]> } : T extends object ? { [K in keyof T]: Json<T[K]> } : T;
export type RequestList = Json<Awaited<ReturnType<typeof listRequests>>>;
export type RequestDetail = Json<Awaited<ReturnType<typeof readRequest>>>;
export type Processes = Json<Awaited<ReturnType<typeof readProcesses>>>;
export type Renewal = Json<Awaited<ReturnType<typeof readRenewal>>>;
export type Cancellation = Json<Awaited<ReturnType<typeof readCancellation>>>;
export type Signing = Json<Awaited<ReturnType<typeof readSigning>>>;
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly fields: { path: string; message: string }[] = []) { super(message); }
}
const retryKeys = new Map<string, string>();
export async function apiRead<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/duct-rental/${path}`, { cache: "no-store", signal });
  const payload = await response.json();
  if (!response.ok) throw new ApiError(payload.message || "โหลดข้อมูลไม่สำเร็จ", response.status, payload.fields);
  return payload.data;
}
export async function apiPost<T = { id: string; version: number }>(path: string, body: unknown): Promise<T> {
  const multipart = body instanceof FormData;
  const descriptor = `${path}:${multipart ? Array.from(body.entries()).map(([key, value]) => `${key}=${value instanceof File ? `${value.name}/${value.size}/${value.lastModified}` : value}`).join("&") : JSON.stringify(body)}`;
  const key = retryKeys.get(descriptor) ?? crypto.randomUUID(); retryKeys.set(descriptor, key); if (retryKeys.size > 64) retryKeys.delete(retryKeys.keys().next().value!);
  const response = await fetch(`/api/duct-rental/${path}`, { method: "POST", headers: { "Idempotency-Key": key, ...(multipart ? {} : { "Content-Type": "application/json" }) }, body: multipart ? body : JSON.stringify(body) });
  const payload = await response.json();
  if (response.ok || response.status < 500) retryKeys.delete(descriptor);
  if (!response.ok) throw new ApiError(payload.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่", response.status, payload.fields);
  return payload.data;
}
export function errorText(error: unknown) { return error instanceof ApiError ? error.message : "เชื่อมต่อไม่สำเร็จ กรุณาตรวจเครือข่ายและลองใหม่"; }
export function documentUrl(id: string, download = false) { return `/api/duct-rental/documents/${id}${download ? "?download=1" : ""}`; }
