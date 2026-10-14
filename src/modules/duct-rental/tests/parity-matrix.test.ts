import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import golden from "../../../../tests/fixtures/metrix-golden/parity.json";
import * as constants from "../schemas/design";
import { fiberOptions as FIBER_TYPE_OPTIONS_BY_CABLE } from "../domain/cables";
import { nextPhase, phaseResource, renewalTransitions, cancellationTransitions } from "../domain/workflow";
import { ductRentalRolePresets } from "../domain/role-presets";
import { submissionDocumentsReady } from "../domain/submission-gates";
import { requestPhases, type RequestPhase } from "../domain/source-policy";
import { signaturePlacementInput, guaranteeInput } from "../schemas/operations";
import { moveSignature, SIGN_OFFSET_MIN, SIGN_OFFSET_MAX, SIGN_NUDGE_STEP, SIGN_SCALE_MIN, SIGN_SCALE_MAX, type StampTarget } from "../domain/signature-controls";

describe("complete frozen Source parity matrix", () => {
  it("keeps every reference constant, label, value and order unchanged", () => {
    const actual: Record<string, unknown> = { ...constants, FIBER_TYPE_OPTIONS_BY_CABLE };
    for (const [name, expected] of Object.entries(golden.constants)) expect(actual[name], name).toEqual(expected);
  });
  it("compares every legal and rejected request transition to Source page destinations", () => {
    expect(golden.transitions).toHaveLength(1500);
    for (const row of golden.transitions) {
      let actual = false;
      try { actual = nextPhase(row.from as RequestPhase, row.owner) === row.to; } catch { /* Terminal has no outgoing edge. */ }
      expect(actual, JSON.stringify(row)).toBe(row.allowed);
    }
  });
  it("seeds editable roles with exactly the Source phase ownership and readonly boundaries", () => {
    const codes = new Set(ductRentalRolePresets.map(p => p.code)); expect(codes.size).toBe(10);
    for (const source of golden.roles) {
      const preset = ductRentalRolePresets.find(p => p.legacyRole === source.role)!;
      const owned = requestPhases.filter(phase => phase !== "COMPLETE" && preset.permissions.includes(`duct_rental.${phaseResource[phase]}.submit`));
      expect(owned).toEqual(source.phases);
      if (source.readonly) expect(preset.permissions.filter(code => !["duct_rental.module.view", "duct_rental.document.read", "duct_rental.document.export", "duct_rental.rate.read", ...(source.role === "sr_manager" ? ["duct_rental.signoff.sign"] : [])].includes(code))).toEqual([]);
    }
    const sql = readFileSync("supabase/migrations/0053_duct_rental_role_presets.sql", "utf8");
    for (const preset of ductRentalRolePresets) expect(sql).toContain(JSON.stringify(preset).replaceAll("'", "''"));
    expect(sql).not.toContain("insert into public.user_role_assignments"); expect(sql).toContain("on conflict(code) do nothing");
  });
  it("matches every combination of Source permission-1 document and signoff guards", () => {
    for (const row of golden.gates.permission) {
      const files = Object.entries({permissionFile:"permission_letter", confirmFile:"confirmation_form", ntFormFile:"nt_form"}).filter(([name]) => row.input[name as keyof typeof row.input]).map(([,fileType]) => ({fileType}));
      expect(submissionDocumentsReady("PERMISSION_1",files,row.input.isSigned)).toBe(row.expected);
    }
    for (const row of golden.gates.install) expect(submissionDocumentsReady("INSTALL",row.input.confirmFile || row.input.hasSavedConfirmation ? [{fileType:"confirmation_form",phase:"INSTALL"}] : [])).toBe(row.expected);
    for (const row of golden.gates.asBuilt) expect(submissionDocumentsReady("DRAFTSMAN_2",row.input.pdfFile ? [{fileType:"drawing",phase:"DRAFTSMAN_2"}] : [])).toBe(row.expected);
    for (const row of golden.gates.contract) expect(row.input.contractFile && row.input.hasRequiredGuarantee && !row.input.hasIncompleteDocs).toBe(row.expected);
    expect(submissionDocumentsReady("INSTALL",[{fileType:"confirmation_form",phase:"PERMISSION_1"}])).toBe(false);
  });
  it("restores Source offset/scale limits and validates editable display date independently", () => {
    expect([SIGN_NUDGE_STEP,SIGN_OFFSET_MIN,SIGN_OFFSET_MAX,SIGN_SCALE_MIN,SIGN_SCALE_MAX]).toEqual([golden.signatureControls.NUDGE_STEP,golden.signatureControls.PLACEMENT_MIN,golden.signatureControls.PLACEMENT_MAX,golden.signatureControls.SCALE_MIN,golden.signatureControls.SCALE_MAX]);
    const base={version:1,assetId:"00000000-0000-4000-8000-000000000001",page:4,x:0,y:0,width:60.7,height:35.36,rotation:0,scale:1};
    for(const x of [-180,180]) expect(signaturePlacementInput.safeParse({...base,x,displayDate:"2030-12-31"}).success).toBe(true);
    for(const x of [-181,181]) expect(signaturePlacementInput.safeParse({...base,x}).success).toBe(false);
    for(const displayDate of ["2031-02-30","invalid"]) expect(signaturePlacementInput.safeParse({...base,displayDate}).success).toBe(false);
    expect(signaturePlacementInput.safeParse({...base,displayDate:""}).success).toBe(true);
    expect(signaturePlacementInput.safeParse({...base,signedAt:"2030-12-31",actorId:base.assetId}).success).toBe(false);
  });
  it("matches every required guarantee field/receipt combination from Source", () => {
    expect(golden.guaranteeCases).toHaveLength(64);
    for(const row of golden.guaranteeCases) expect(guaranteeInput.safeParse(row.guarantee).success && submissionDocumentsReady("3RD_PARTY_2",[{fileType:"contract"},...(row.receipt?[{fileType:"receipt"}]:[])])).toBe(row.expected);
  });
  it("matches Source movement for all four targets at both clamp boundaries", () => {
    expect(golden.movement).toHaveLength(80);
    const native=(value:typeof golden.movement[number]["input"])=>{const {offsetX,offsetY,...rest}=value;return {...rest,x:offsetX,y:offsetY,scale:1};};
    for(const row of golden.movement) expect(moveSignature(native(row.input),row.target as StampTarget,row.dx,row.dy)).toEqual(native(row.expected));
  });
  it("matches every reachable annual state pair from original UI/store expressions", () => {
    expect(golden.annualTransitions).toHaveLength(25);
    for(const row of golden.annualTransitions) expect(renewalTransitions[row.from as keyof typeof renewalTransitions]?.next===row.to).toBe(row.allowed);
  });
  it("matches every cancellation state pair including both terminal states from Source", () => {
    expect(golden.cancelTransitions).toHaveLength(25);
    for(const row of golden.cancelTransitions) expect(cancellationTransitions[row.from as keyof typeof cancellationTransitions]===row.to).toBe(row.allowed);
  });
});
