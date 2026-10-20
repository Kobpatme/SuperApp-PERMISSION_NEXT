import test from "node:test";
import assert from "node:assert/strict";
import { mapDepositRow, parseCsv } from "./import-guarantee-csv.mjs";

test("parses quoted legacy CSV cells", () => {
  const csv = `ID,สถานะ,อาคาร,ลูกค้า,เจ้าของงาน,พื้นที่,CID,PR No.,วันตั้งเบิก,ยอดรวม,ประกันติดตั้ง,ประกันรื้อถอน,ค่าธรรมเนียม,คืนประกันติดตั้ง,คืนประกันรื้อถอน\n` +
    `abc,done,"อาคาร, ทดสอบ",ลูกค้า,เจ้าของ,BKK 1,C-1,P-1,2026-01-02,"1,500",1000,,500,Yes,\n`;
  const rows = parseCsv(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]["อาคาร"], "อาคาร, ทดสอบ");
});

test("maps a total difference to a reviewable other amount", () => {
  const record = mapDepositRow({ ID: "abc", สถานะ: "done", อาคาร: "อาคาร A", ลูกค้า: "ลูกค้า", เจ้าของงาน: "เจ้าของ",
    พื้นที่: "BKK 1", CID: "C-1", "PR No.": "P-1", วันตั้งเบิก: "2026-01-02", ยอดรวม: "1,700",
    ประกันติดตั้ง: "1,000", ประกันรื้อถอน: "", ค่าธรรมเนียม: "500", คืนประกันติดตั้ง: "Yes", คืนประกันรื้อถอน: "" });
  assert.equal(record.data.other, 200);
  assert.equal(record.data.migration_review_required, true);
  assert.equal(record.data.source_total, 1700);
});
