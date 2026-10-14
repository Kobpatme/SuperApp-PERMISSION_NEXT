export type SignatureOffsets = { x: number; y: number; scale: number; signatureOffsetX?: number; signatureOffsetY?: number; nameOffsetX?: number; nameOffsetY?: number; dateOffsetX?: number; dateOffsetY?: number };
export function signatureLayout(pageWidth: number, pageHeight: number, placement: SignatureOffsets) {
  const centre = pageWidth * 0.5 + placement.x, top = pageHeight * 0.79 + placement.y;
  return {
    image: { x: centre - pageWidth * 0.102 * placement.scale / 2 + (placement.signatureOffsetX ?? 0), y: top - pageHeight * 0.01 - 15 + (placement.signatureOffsetY ?? 0), width: pageWidth * 0.102 * placement.scale, height: pageHeight * 0.042 * placement.scale },
    name: { x: centre - pageWidth * 0.22 * placement.scale / 2 + (placement.nameOffsetX ?? 0), y: top - pageHeight * 0.046 + (placement.nameOffsetY ?? 0), width: pageWidth * 0.22 * placement.scale, height: pageHeight * 0.019 },
    date: { x: pageWidth * 0.552 + placement.x + (placement.dateOffsetX ?? 0), y: top - pageHeight * 0.064 + (placement.dateOffsetY ?? 0), width: pageWidth * 0.14, height: pageHeight * 0.018 },
  };
}
