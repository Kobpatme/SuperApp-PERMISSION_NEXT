import type { SignatureOffsets } from "./signature-layout";
export const SIGN_OFFSET_MIN = -180;
export const SIGN_OFFSET_MAX = 180;
export const SIGN_NUDGE_STEP = 6;
export const SIGN_SCALE_MIN = 0.45;
export const SIGN_SCALE_MAX = 1.6;
export type StampTarget = "all" | "signature" | "name" | "date";
export function moveSignature<T extends SignatureOffsets>(placement: T, target: StampTarget, dx: number, dy: number): T {
  const keys = { all: ["x", "y"], signature: ["signatureOffsetX", "signatureOffsetY"], name: ["nameOffsetX", "nameOffsetY"], date: ["dateOffsetX", "dateOffsetY"] } as const;
  const [x, y] = keys[target];
  const clamp = (value: number) => Math.max(SIGN_OFFSET_MIN, Math.min(SIGN_OFFSET_MAX, value));
  return { ...placement, [x]: clamp((placement[x] ?? 0) + dx), [y]: clamp((placement[y] ?? 0) + dy) };
}
