export const guaranteeBucket = "guarantee-evidence";
export const evidenceKinds = ["pdf_payment", "pdf_layout", "pdf_additional", "pdf_tl_work", "pdf_tl_extra", "pdf_user_final", "pdf_demo_off"] as const;
export type EvidenceKind = (typeof evidenceKinds)[number];
export const isEvidenceKind = (value: string): value is EvidenceKind => evidenceKinds.includes(value as EvidenceKind);
export const isStoredEvidencePath = (value: string) => /^guarantees\/[0-9a-f-]{36}\/(pdf_payment|pdf_layout|pdf_additional|pdf_tl_work|pdf_tl_extra|pdf_user_final|pdf_demo_off)\/[0-9a-f-]{36}\.(pdf|jpg|png)$/i.test(value);

export function detectEvidenceType(bytes: Uint8Array) {
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return { mime: "application/pdf", extension: "pdf" };
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", extension: "jpg" };
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)) return { mime: "image/png", extension: "png" };
  return null;
}
