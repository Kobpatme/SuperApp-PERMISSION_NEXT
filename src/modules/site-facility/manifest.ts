import type { ModuleManifest,ModuleCapability } from "@/lib/module-contract";
const scopes=["OWN","TEAM","SELECTED_TEAMS","ALL"] as const;
export const siteFacilityCapabilities:ModuleCapability[]=[
  ["module.view","เข้าใช้งาน Site Facility","normal"],
  ["site.read","ดูข้อมูลไซต์","normal"],
  ["site.update","แก้ไขข้อมูลไซต์","sensitive"],
  ["comment.create","แสดงความคิดเห็นของไซต์","normal"],
  ["report.export","ส่งออกรายงานไซต์","sensitive"],
  ["opex.read","ดูค่าใช้จ่าย OPEX ของไซต์","sensitive"],
  ["dataset.manage","นำเข้าชุดข้อมูลไซต์","administrative"],
  ["dataset.publish","เผยแพร่และย้อนกลับชุดข้อมูลไซต์","administrative"],
].map(([key,labelTh,risk])=>({code:`site_facility.${key}`,labelTh,descriptionTh:labelTh,risk:risk as ModuleCapability["risk"],allowedScopes:key.startsWith("dataset.")||key==="opex.read"?["ALL"]:[...scopes]}));
export const siteFacilityManifest:ModuleManifest={
  id:"site-facility",version:"0.1.0",number:8,href:"/site-facility",name:"Site Facility & Design",shortLabel:"Site Facility",
  description:"MOD 2 — แผนที่โครงสร้างพื้นฐานไซต์ ค้นหา รายละเอียด และ OPEX",purpose:"ข้อมูลโครงสร้างพื้นฐานไซต์",repository:"katathepAof/Permission-out@55380a5",owner:"Operations",
  icon:"buildings",accent:"blue",group:"operations",order:80,lifecycle:"active",enabledByDefault:false,
  capabilities:siteFacilityCapabilities,entryPermissions:["site_facility.module.view"],searchProvider:"site-facility",dashboardProvider:"site-facility",
  searchTerms:["Site Facility","ไซต์","MOD 2","Design","OPEX"],navigationItems:[
    {href:"/site-facility",label:"แผนที่ไซต์",icon:"buildings",activeMatch:"exact"},
    {href:"/site-facility/reports",label:"รายงานไซต์",icon:"work",activeMatch:"prefix"},
    {href:"/site-facility/datasets",label:"ชุดข้อมูลไซต์",icon:"settings",activeMatch:"prefix"},
  ],
};
