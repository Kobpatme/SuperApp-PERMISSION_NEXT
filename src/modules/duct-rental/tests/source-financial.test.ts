import { describe, expect, it } from "vitest";
import { sourceFinancialPayload } from "../domain/source-financial";
import { planDuctImport } from "../domain/import-planner";
import source from "../../../../tests/fixtures/metrix-import/source.json";
import map from "../../../../tests/fixtures/metrix-import/crosswalk.json";
describe("Source JSON preserved with private decimal projections", () => {
  it("round-trips every Source financial field and extension, normalizing only DQ02 amounts", () => {
    const rate={monthlyFee:0.1,yearlyFee:0.2,contractStartDate:"2031-01-01",contractEndDate:"2031-12-31",rateNoticeFile:"private-document-id",serviceInvoiceFile:"invoice-id",signedFile:"signed-id",notes:"บันทึกจากต้นทาง",legacyExtension:{review:"retain"}};
    const guarantee={contractNumber:"C-1",fullAmount:"1.005",paymentType:"BG",venderCode:"1129267",receiptNumber:"R-1",notes:"บันทึกเงินประกัน"};
    const result=sourceFinancialPayload(rate,guarantee);
    expect(result).toEqual({rateNoticeData:{...rate,monthlyFee:"0.10",yearlyFee:"0.20"},guaranteeData:{...guarantee,fullAmount:"1.01"}});
    expect(rate.monthlyFee).toBe(0.1); expect(guarantee.fullAmount).toBe("1.005");
    expect(sourceFinancialPayload({},{})).toEqual({rateNoticeData:{},guaranteeData:{}});
  });
  it("keeps null and empty draft guarantees distinct from a zero amount", () => {
    for(const fullAmount of [null,""])expect(sourceFinancialPayload({}, {fullAmount}).guaranteeData.fullAmount).toBe(fullAmount);
    expect(sourceFinancialPayload({}, {fullAmount:"0"}).guaranteeData.fullAmount).toBe("0.00");
  });
  it("prepares lossless Source JSON and as-built metadata in dry-run only", () => {
    const input={...source,requests:source.requests.map((row,index)=>index?row:{...row,as_built_data:{notes:"ข้อมูลแบบจำลอง",legacyMetadata:{retain:true}},rate_notice_data:{...row.rate_notice_data,notes:"ค่าเช่า",legacyMetadata:{retain:true}},guarantee_data:{...row.guarantee_data,notes:"เงินประกัน"}})};
    const report=planDuctImport(input,map),rate=report.tables.rates[0];
    expect(rate.rateNoticeData).toMatchObject({monthlyFee:"99.50",notes:"ค่าเช่า",legacyMetadata:{retain:true}});
    expect(rate.guaranteeData).toMatchObject({fullAmount:"1.01",notes:"เงินประกัน"});
    expect(report.tables.requests[0].asBuilt).toEqual({notes:"ข้อมูลแบบจำลอง",legacyMetadata:{retain:true}});
    expect(report.writesPerformed).toBe(0);
  });
});
