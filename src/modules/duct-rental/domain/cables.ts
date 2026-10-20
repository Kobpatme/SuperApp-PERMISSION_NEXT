// RULE-003, source schemas/ductRentalSchema.ts:26-60 @ f87220b. Units are millimetres.
export const fiberOptions = {
  "Drop OFC": [{ fiberType: "2 Core", diameter: 6.5 }],
  ADSS: [
    { fiberType: "12 Core", diameter: 8.7 }, { fiberType: "24 Core", diameter: 8.7 },
    { fiberType: "48 Core", diameter: 8.7 }, { fiberType: "60 Core", diameter: 8.7 },
    { fiberType: "72 Core", diameter: 10.5 }, { fiberType: "96 Core", diameter: 12 },
    { fiberType: "120 Core", diameter: 13.5 }, { fiberType: "144 Core", diameter: 15 },
    { fiberType: "312 Core", diameter: 18 },
  ],
  ARSS: [
    { fiberType: "12 Core", diameter: 11 }, { fiberType: "24 Core", diameter: 11 },
    { fiberType: "48 Core", diameter: 12 }, { fiberType: "60 Core", diameter: 12 },
    { fiberType: "120 Core", diameter: 15 }, { fiberType: "144 Core", diameter: 17 },
    { fiberType: "216 Core", diameter: 17 }, { fiberType: "312 Core", diameter: 18.7 },
  ],
} as const;
export function getFiberTypeOptions(cable?: string | null) {
  return cable && Object.hasOwn(fiberOptions, cable) ? fiberOptions[cable as keyof typeof fiberOptions] : [];
}
export function getDiameterForCable(cable?: string | null, fiber?: string | null) {
  return getFiberTypeOptions(cable).find(option => option.fiberType === fiber)?.diameter;
}
