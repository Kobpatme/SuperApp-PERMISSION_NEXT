import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";
import { DashboardOverview } from "./dashboard-overview";
import { OverviewMessages } from "./overview-messages";
import type { DashboardSnapshot } from "@/lib/dashboard";

vi.mock("next/navigation", () => ({ usePathname:()=>"/", useSearchParams:()=>new URLSearchParams(), useRouter:()=>({refresh:vi.fn()}) }));
const snapshot:DashboardSnapshot={generatedAt:"2026-11-01T10:00:00+07:00",items:[],sources:[{moduleId:"work",status:"ready",itemCount:0,message:"TEST"}]};
const overview=(allowedModuleIds:string[],preview=false)=>renderToStaticMarkup(<DashboardOverview displayName="TEST ผู้ใช้" userId="TEST-USER" allowedModuleIds={allowedModuleIds} developmentMode={false} preview={preview} snapshot={snapshot}/>);
describe("Overview composition preservation",()=>{
  it("keeps one page heading and exposes the complete shared queue",()=>{
    const html=overview(["work"]);
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    for(const text of ["สรุปรายการติดตาม","เร่งด่วน","ครบกำหนดวันนี้","งานของฉัน","ค้นหาในรายการ","ตัวกรอง","มุมมองที่บันทึกไว้","ก่อนหน้า","ถัดไป","ไม่มีรายการที่ต้องติดตาม"]) expect(html).toContain(text);
    expect(html).toContain('aria-pressed="true"');
  });
  it("renders only server-allowed directory entries and preserves preview destinations",()=>{
    const html=overview(["work"],true);
    expect(html).toContain('href="/work?preview=1"');
    expect(html).not.toContain('href="/buildings');
    expect(html).not.toContain('href="/guarantees');
  });
  it("keeps no-access guidance without queue, counts or module destinations",()=>{
    const html=overview([]);
    expect(html).toContain("ยังไม่มีพื้นที่ทำงานที่เข้าถึงได้");
    expect(html).not.toContain("<table");
    expect(html).not.toContain("เปิดพื้นที่ทำงาน");
  });
  it("keeps active links, announcement escaping and non-clickable unavailable systems",()=>{
    const html=renderToStaticMarkup(<OverviewMessages announcements={[{id:"TEST",message:"TEST <script>"}]} links={[
      {id:"a",name:"TEST active",url:"/test-a",description:"TEST",status:"Active"},
      {id:"b",name:"TEST maintenance",url:"/test-b",description:"TEST",status:"Maintenance"},
      {id:"c",name:"TEST coming",url:"/test-c",description:"TEST",status:"Coming"}]}/>);
    expect(html).toContain("&lt;script&gt;");expect(html).toContain('href="/test-a"');
    expect(html).not.toContain('href="/test-b"');expect(html).not.toContain('href="/test-c"');
    expect(html).toContain("กำลังปรับปรุง");expect(html).toContain("เร็ว ๆ นี้");
  });
  it("does not invent empty announcements or system links",()=>{
    expect(renderToStaticMarkup(<OverviewMessages announcements={[]} links={[]}/>)).toBe("");
  });
});
